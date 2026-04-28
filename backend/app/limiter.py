# Rate limiter — AI 라우터 비용 폭주 방어 미들웨어.
# @SPEC docs/planning/05-architecture.md#ai-폴백-전략
#
# 인증이 없는 데모 환경에서 /api/ai/* 가 외부에 노출되면
# OpenAI 비용 폭탄 위험이 있어 IP 기반 슬라이딩 윈도우로 제한한다.
#
# 한도 (path_pattern → 횟수/초):
#   /api/ai/checklist               → 5/60   (24개 일정 일괄 생성, 재시도 거의 없음)
#   /api/ai/caption                 → 30/60  (사진별 호출, 비교적 자주)
#   /api/couples/{id}/album/compose → 5/60   (60초 걸리는 무거운 호출)
#
# 의존성: 추가 라이브러리 없음 (collections.deque, time만 사용).
# 단일 프로세스 in-memory — 데모 / 채용 과제 범위에 적합.
# 다중 인스턴스 / 워커 환경에서는 Redis 기반 limits 라이브러리 도입 필요.
#
# 테스트 / 로컬 디버깅:
#   설정 RATE_LIMIT_ENABLED=False 또는 limiter.enabled=False 로 비활성.
from __future__ import annotations

import logging
import re
import time
from collections import defaultdict, deque
from threading import Lock
from typing import Iterable

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


# (정규식 패턴, 한도, 윈도우 초)
# 패턴은 path 전체와 fullmatch.
_DEFAULT_RULES: list[tuple[re.Pattern[str], int, int]] = [
    (re.compile(r"/api/ai/checklist"), 5, 60),
    (re.compile(r"/api/ai/caption"), 30, 60),
    (re.compile(r"/api/couples/[^/]+/album/compose"), 5, 60),
]


class _RateLimitState:
    """단일 프로세스 in-memory 슬라이딩 윈도우 카운터."""

    def __init__(self, rules: Iterable[tuple[re.Pattern[str], int, int]]) -> None:
        self._rules = list(rules)
        self._windows: dict[tuple[str, str], deque[float]] = defaultdict(deque)
        self._lock = Lock()
        self.enabled: bool = True

    def match(
        self, path: str
    ) -> tuple[re.Pattern[str], int, int] | None:
        for pattern, limit, window in self._rules:
            if pattern.fullmatch(path):
                return pattern, limit, window
        return None

    def check(self, path: str, ip: str) -> tuple[bool, int, int]:
        """
        Returns:
            (allowed, current_count, limit). allowed=False 면 거부 (429).
        """
        if not self.enabled:
            return True, 0, 0
        rule = self.match(path)
        if rule is None:
            return True, 0, 0
        pattern, limit, window = rule
        key = (pattern.pattern, ip)
        now = time.monotonic()
        with self._lock:
            dq = self._windows[key]
            # 윈도우 밖 timestamp 제거.
            cutoff = now - window
            while dq and dq[0] < cutoff:
                dq.popleft()
            if len(dq) >= limit:
                return False, len(dq), limit
            dq.append(now)
            return True, len(dq), limit


class RateLimitMiddleware(BaseHTTPMiddleware):
    """IP + path 단위 rate limit.

    초과 시 429 + Retry-After 헤더 반환.
    """

    def __init__(self, app: ASGIApp, state: _RateLimitState) -> None:
        super().__init__(app)
        self._state = state

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        client = request.client
        ip = client.host if client else "unknown"

        allowed, current, limit_value = self._state.check(path, ip)
        if not allowed:
            logger.warning(
                "Rate limit exceeded path=%s ip=%s count=%d limit=%d",
                path,
                ip,
                current,
                limit_value,
            )
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": (
                        f"Rate limit exceeded ({current}/{limit_value} per minute). "
                        f"Please try again shortly."
                    )
                },
                headers={"Retry-After": "60"},
            )

        return await call_next(request)


# 모듈 레벨 단일 인스턴스 — main.py 의 미들웨어 등록과 conftest 의 비활성화 토글이 공유.
limiter = _RateLimitState(_DEFAULT_RULES)


def configure_enabled(enabled: bool) -> None:
    """설정에 따라 활성/비활성 토글 (lifespan 또는 테스트에서 호출)."""
    limiter.enabled = enabled
