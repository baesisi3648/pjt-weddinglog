# @TASK P2-R1-T4 - AI 체크리스트 서비스 (폴백 전략)
# @SPEC docs/planning/05-architecture.md#ai-폴백-전략
# @SPEC specs/domain/resources.yaml#ai_services
# @TEST tests/services/test_ai_service.py
"""
AIService — AI 체크리스트 생성.

- app.state.openai_available 플래그로 사용 가능 여부 판정 (lifespan 에서 1회 검증).
- 가용 시 OpenAI Chat Completions 호출 → 실패 시 자동 폴백.
- 미가용 시 즉시 15개 사전정의 템플릿 반환.

응답 포맷:
    {
        "source": "ai" | "template",
        "events": [
            {
                "title": str,
                "date": "YYYY-MM-DD",
                "category": str,          # Category enum value
                "memo": str | None,
                "is_ai_generated": True,
            },
            ...
        ],
    }
"""
from __future__ import annotations

import json
import logging
from datetime import date, timedelta
from typing import Any

from app.schemas.enums import Category

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# 15개 사전정의 템플릿 (D-180 ~ D+14)
# -----------------------------------------------------------------------------
# (offset_days, title, category)
_TEMPLATES: list[tuple[int, str, Category]] = [
    (-180, "예식장 투어 시작", Category.VENUE),
    (-150, "스드메 업체 미팅", Category.STUDIO_DRESS_MAKEUP),
    (-120, "스드메 계약 / 웨딩촬영 날짜 확정", Category.STUDIO_DRESS_MAKEUP),
    (-100, "예물·예단 쇼핑", Category.GIFT),
    (-90, "웨딩촬영", Category.WEDDING_PHOTO),
    (-60, "청첩장 시안 확인", Category.INVITATION),
    (-45, "청첩장 발송", Category.INVITATION),
    (-30, "예식장 최종 미팅", Category.VENUE),
    (-14, "혼수 최종 점검", Category.ETC),
    (-7, "리허설", Category.REHEARSAL),
    (0, "본식", Category.CEREMONY),
    (1, "아이폰 스냅 수령", Category.WEDDING_PHOTO),
    (3, "신혼여행 출발", Category.HONEYMOON),
    (10, "신혼여행 귀국", Category.HONEYMOON),
    (14, "앨범 주문 추천", Category.ETC),
]


_SYSTEM_PROMPT = (
    "당신은 한국의 결혼 준비 전문가입니다. "
    "사용자의 결혼 예정일(wedding_date)과 선택적 budget_level(low|mid|high)을 받아 "
    "15개의 결혼 준비 일정을 JSON 배열로 생성합니다. "
    "각 항목은 아래 스키마를 따라야 합니다:\n"
    '{"title": str, "offset_days": int, "category": str, "memo": str|null}\n'
    "category 는 다음 중 하나여야 합니다: "
    "WEDDING_PHOTO, STUDIO_DRESS_MAKEUP, VENUE, GIFT, INVITATION, "
    "REHEARSAL, CEREMONY, HONEYMOON, ETC.\n"
    "offset_days 는 결혼일 기준 정수(음수=준비기, 0=본식, 양수=사후).\n"
    '응답은 반드시 `{"events": [...]}` 형태의 JSON 객체여야 합니다.'
)


class AIService:
    """AI 서비스 (OpenAI + 템플릿 폴백)."""

    def __init__(self, app_state: Any) -> None:
        """
        Args:
            app_state: FastAPI app.state (openai_available 플래그를 읽는다).
        """
        self.available: bool = bool(
            getattr(app_state, "openai_available", False)
        )
        self._client: Any | None = None
        if self.available:
            try:
                # 지연 import: 오프라인/테스트 환경에서 openai 미설치 시 안전.
                from openai import OpenAI

                self._client = OpenAI()
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "AIService: OpenAI client init failed (%s) — fallback mode.",
                    exc,
                )
                self.available = False

    # -----------------------------------------------------------------------
    # Public API
    # -----------------------------------------------------------------------
    async def generate_checklist(
        self,
        wedding_date: date,
        budget_level: str | None = None,
    ) -> dict[str, Any]:
        """체크리스트를 생성한다.

        Returns:
            {"source": "ai"|"template", "events": [ {title, date, category, memo, is_ai_generated}, ... ]}
        """
        if self.available:
            try:
                events = await self._call_openai_checklist(
                    wedding_date, budget_level
                )
                return {"source": "ai", "events": events}
            except Exception as exc:  # noqa: BLE001 — 어떤 실패든 폴백
                logger.warning(
                    "OpenAI checklist failed (%s) — falling back to template.",
                    exc,
                )

        return {
            "source": "template",
            "events": self._fallback_checklist(wedding_date),
        }

    # -----------------------------------------------------------------------
    # Fallback
    # -----------------------------------------------------------------------
    def _fallback_checklist(self, wedding_date: date) -> list[dict[str, Any]]:
        """15개 사전정의 템플릿을 wedding_date 기준으로 전개."""
        return [
            {
                "title": title,
                "date": (wedding_date + timedelta(days=offset)).isoformat(),
                "category": cat.value,
                "memo": None,
                "is_ai_generated": True,
            }
            for offset, title, cat in _TEMPLATES
        ]

    # -----------------------------------------------------------------------
    # OpenAI call
    # -----------------------------------------------------------------------
    async def _call_openai_checklist(
        self,
        wedding_date: date,
        budget_level: str | None,
    ) -> list[dict[str, Any]]:
        """OpenAI Chat Completions 호출 (JSON 모드).

        실패 시 예외를 던진다(상위 generate_checklist 에서 fallback 처리).
        """
        if self._client is None:
            raise RuntimeError("OpenAI client not initialized")

        user_prompt = (
            f"wedding_date: {wedding_date.isoformat()}\n"
            f"budget_level: {budget_level or 'mid'}\n"
            "위 조건에 맞는 결혼 준비 일정 15개를 생성해주세요."
        )

        # openai>=1.x 의 동기 클라이언트 — 비동기 래핑 없이 호출 (IO 블록은 짧음).
        # 실제 프로덕션에서는 AsyncOpenAI 로 교체 가능.
        completion = self._client.chat.completions.create(  # type: ignore[union-attr]
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )

        raw = completion.choices[0].message.content or "{}"
        payload = json.loads(raw)
        items = payload.get("events", [])
        if not isinstance(items, list) or not items:
            raise ValueError(
                f"OpenAI returned malformed events: {payload!r}"
            )

        allowed = {c.value for c in Category}
        result: list[dict[str, Any]] = []
        for item in items:
            cat = item.get("category")
            if cat not in allowed:
                raise ValueError(f"OpenAI returned invalid category: {cat!r}")
            offset_days = int(item.get("offset_days", 0))
            result.append(
                {
                    "title": str(item["title"]),
                    "date": (
                        wedding_date + timedelta(days=offset_days)
                    ).isoformat(),
                    "category": cat,
                    "memo": item.get("memo"),
                    "is_ai_generated": True,
                }
            )
        return result
