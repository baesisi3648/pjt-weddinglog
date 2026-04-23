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

# -----------------------------------------------------------------------------
# 카테고리별 폴백 캡션 (P3-R1-T5)
# -----------------------------------------------------------------------------
# features.md 톤: 1인칭/우리 시점, 감성적·긍정적, 결혼 의미, 20-40자 내외.
_FALLBACK_CAPTIONS: dict[str, list[str]] = {
    Category.WEDDING_PHOTO.value: [
        "여름 햇살 아래, 처음으로 웨딩드레스를 입은 날",
        "카메라 앞에선 어색했지만, 네 손을 잡으니 웃음이 났다",
        "이 사진 속 우리가, 진짜 결혼하는구나",
    ],
    Category.HONEYMOON.value: [
        "발리의 첫 아침, 파도 소리에 눈을 떴다",
        "낯선 도시, 익숙한 네 얼굴",
        "이 순간을 영원히 기억할게",
    ],
    Category.CEREMONY.value: [
        "맹세를 나누던 그 순간, 우리는 하나가 되었다",
        "모두의 축복 속에서 시작하는 우리의 이야기",
        "우리 둘, 그리고 모든 사랑하는 사람들과 함께",
    ],
    Category.STUDIO_DRESS_MAKEUP.value: [
        "드레스 피팅의 설렘, 말로 다 못 할 행복",
        "메이크업 거울 앞의 웃음이 내일을 밝힌다",
        "우리만의 스타일을 찾아가는 소중한 시간",
    ],
    Category.VENUE.value: [
        "예식장을 처음 본 날, 가슴이 두근거렸다",
        "여기서 식을 올리기로 한 우리의 결정",
        "공간이 주는 설렘, 미래가 그려지는 순간",
    ],
    Category.GIFT.value: [
        "예물·예단 준비의 날, 마음이 따뜻해진다",
        "서로를 위한 선물에 사랑을 담았다",
        "빛나는 약속, 평생 간직할 추억",
    ],
    Category.INVITATION.value: [
        "청첩장을 받아든 날, 현실감이 밀려왔다",
        "소식을 전하는 마음에 떨림을 담아",
        "소중한 분들을 우리 결혼식에 초대합니다",
    ],
    Category.REHEARSAL.value: [
        "내일의 본식을 위한 리허설, 긴장과 설렘",
        "마지막 점검 - 우리 둘 완벽하게 준비됐어",
        "본식 전날, 떨리는 마음으로 리허설",
    ],
    Category.ETC.value: [
        "기억하고 싶은 순간, 소중한 하루",
        "결혼 준비의 한 조각, 그 모든 게 의미 있다",
        "소소하지만 중요한 우리의 기록",
    ],
}

_DEFAULT_CAPTIONS = _FALLBACK_CAPTIONS[Category.ETC.value]


_CAPTION_SYSTEM_PROMPT = (
    "당신은 한국의 결혼앨범 에디터입니다. "
    "사용자가 제공한 카테고리(category), 일자(date), 메모(memo)를 바탕으로 "
    "감성적이고 긍정적인 톤의 한국어 캡션 3개를 생성합니다. "
    "제약: 1인칭(나) 또는 1복수(우리) 시점, 결혼의 의미가 드러나야 하며, "
    "각 캡션은 20-40자 사이여야 합니다. "
    '응답은 반드시 `{"captions": [str, str, str]}` 형태의 JSON 객체여야 합니다.'
)

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
    # Captions (P3-R1-T5)
    # -----------------------------------------------------------------------
    async def generate_captions(
        self,
        category: str,
        event_date: date,
        memo: str | None = None,
    ) -> dict[str, Any]:
        """사진 캡션 3개를 생성한다.

        Returns:
            {"source": "ai"|"template", "captions": [str, str, str]}
        """
        if self.available:
            try:
                captions = await self._call_openai_captions(
                    category, event_date, memo
                )
                return {"source": "ai", "captions": captions}
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "OpenAI caption failed (%s) — falling back.", exc
                )
        return {
            "source": "template",
            "captions": self._fallback_captions(category),
        }

    def _fallback_captions(self, category: str) -> list[str]:
        """카테고리별 사전 캡션 3개 반환."""
        return list(_FALLBACK_CAPTIONS.get(category, _DEFAULT_CAPTIONS))

    async def _call_openai_captions(
        self,
        category: str,
        event_date: date,
        memo: str | None,
    ) -> list[str]:
        """OpenAI Chat Completions (JSON 모드) — 3개 캡션 강제."""
        if self._client is None:
            raise RuntimeError("OpenAI client not initialized")

        user_prompt = (
            f"category: {category}\n"
            f"date: {event_date.isoformat()}\n"
            f"memo: {memo or '(없음)'}\n"
            "위 맥락에 맞는 캡션 3개를 생성해주세요. "
            "각 캡션은 서로 다른 감정과 시점을 담아야 합니다."
        )

        completion = self._client.chat.completions.create(  # type: ignore[union-attr]
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": _CAPTION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.8,
        )
        raw = completion.choices[0].message.content or "{}"
        payload = json.loads(raw)
        items = payload.get("captions", [])
        if not isinstance(items, list) or len(items) < 3:
            raise ValueError(
                f"OpenAI returned malformed captions: {payload!r}"
            )
        # 3개 강제 (초과 시 slice, 부족 시 위에서 이미 예외)
        return [str(c) for c in items[:3]]

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
