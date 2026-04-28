# @TASK P0-T2 - FastAPI 애플리케이션 팩토리
# @SPEC docs/planning/05-architecture.md#ai-폴백-전략
# @TEST tests/test_health.py
"""
FastAPI 앱 팩토리.

- lifespan 훅에서 DB 초기화 + OpenAI 키 1회 검증.
- CORSMiddleware 등록 (환경변수 기반).
- GET /health: 기본 헬스체크 + OpenAI 가용성 노출.
"""
from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import SessionLocal
from app.init_db import init_db
from app.limiter import RateLimitMiddleware, configure_enabled, limiter
from app.routers import (
    ai_router,
    album_router,
    couples_orders_router,
    couples_router,
    events_router,
    home_router,
    orders_router,
    photo_events_router,
    photo_router,
    timeline_router,
)
from app.seed import seed_initial_data

logger = logging.getLogger(__name__)


async def _check_openai_available(api_key: str | None) -> bool:
    """OpenAI API 키 유효성을 1회 확인한다 (async, lifespan 에서만 호출).

    - 키가 비어있으면 False
    - 키가 있으면 `models.list()` 로 검증 (가벼운 호출, 크레딧 소모 無)
    - 네트워크/인증 실패 시 False (앱은 폴백으로 동작)
    """
    if not api_key or not api_key.strip():
        logger.warning(
            "OPENAI_API_KEY not set — AI features will use template fallback."
        )
        return False

    try:
        from openai import AsyncOpenAI  # async-native (서비스 클라이언트와 일치)

        client = AsyncOpenAI(api_key=api_key.strip(), timeout=5.0)
        # models.list 는 인증 및 네트워크만 검증하며 실제 추론 비용이 없다.
        await client.models.list()
        logger.info("OpenAI API is available")
        return True
    except Exception as exc:  # noqa: BLE001 — 어떤 실패든 폴백으로
        logger.warning(
            "OpenAI validation failed (%s) — AI features will use fallback.", exc
        )
        return False


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """앱 시작/종료 lifecycle."""
    settings = get_settings()

    # 로깅 레벨 적용 (중복 핸들러 부착 방지: force=True)
    logging.basicConfig(
        level=settings.LOG_LEVEL,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        force=True,
    )

    # DB 테이블 생성
    init_db()

    # 초기 샘플 데이터 시딩 (멱등성 보장)
    _seed_session = SessionLocal()
    try:
        seed_initial_data(_seed_session)
    finally:
        _seed_session.close()

    # OpenAI 가용성 1회 체크 → app.state 에 캐시
    app.state.openai_available = await _check_openai_available(settings.OPENAI_API_KEY)

    logger.info(
        "WeddingLog backend started (openai_available=%s)",
        app.state.openai_available,
    )

    yield

    logger.info("WeddingLog backend shutting down")


def create_app() -> FastAPI:
    """FastAPI 앱 인스턴스를 생성한다.

    app 팩토리 패턴: 테스트와 프로덕션이 동일한 경로로 앱을 구성한다.
    """
    settings = get_settings()
    app = FastAPI(
        title="WeddingLog API",
        description="결혼 준비 기록 + 앨범 주문 서비스 API",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Rate limit 미들웨어 — AI 라우터 비용 폭주 방어 (IP 기반 슬라이딩 윈도우).
    # 한도는 app/limiter.py 의 _DEFAULT_RULES 참고.
    configure_enabled(settings.RATE_LIMIT_ENABLED)
    app.add_middleware(RateLimitMiddleware, state=limiter)

    # API 라우터 등록
    app.include_router(couples_router)
    app.include_router(events_router)
    app.include_router(ai_router)
    app.include_router(photo_events_router)
    app.include_router(photo_router)
    app.include_router(timeline_router)
    app.include_router(home_router)
    app.include_router(couples_orders_router)
    app.include_router(orders_router)
    app.include_router(album_router)

    @app.get("/health", tags=["meta"])
    async def health_check(request: Request) -> dict[str, object]:
        """Health probe — Docker HEALTHCHECK 및 프론트 부팅 검사용.

        Returns:
            status: 고정 "ok"
            openai_available: 앱 시작 시 검증된 OpenAI 가용성
            timestamp: ISO8601 UTC 시각
        """
        openai_available = bool(getattr(request.app.state, "openai_available", False))
        return {
            "status": "ok",
            "openai_available": openai_available,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    return app


# uvicorn 이 직접 import 할 때 사용하는 모듈 레벨 앱.
app = create_app()
