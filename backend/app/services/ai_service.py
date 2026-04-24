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
# 사전정의 템플릿 (D-360 ~ D+14)
# 레퍼런스: 예식준비 START 타임라인 + 삼성 결혼준비 가이드북 통합
# -----------------------------------------------------------------------------
# (offset_days, title, category, memo)
_TEMPLATES: list[tuple[int, str, Category, str | None]] = [
    # ── 초기 기획 (D-360 ~ D-200) ───────────────────────────────
    (-360, "상견례 택일, 웨딩홀 섭외", Category.VENUE, "양가 일정 조율 시작"),
    (-340, "결혼 예산 세우기, 웨딩홀 확정 예약", Category.VENUE, "예산 기준 홀 확정"),
    (-320, "분가 여부 결정", Category.ETC, "신혼집 방향 합의"),
    (-300, "스드메 상담 (스튜디오 촬영일·드레스 투어·메이크업 업체)", Category.STUDIO_DRESS_MAKEUP, "3곳 이상 비교"),
    (-270, "예복·예물 상의 상담, 본식촬영·DVD업체 섭외", Category.GIFT, None),
    (-250, "예복·예물 계약, 신혼집 알아보기, 인테리어 업체", Category.ETC, "3-4곳 견적 비교"),
    (-200, "피부 관리 시작, 건강 검진", Category.ETC, "피부과·치과 점검"),
    # ── 중기 준비 (D-180 ~ D-100) ───────────────────────────────
    (-180, "촬영드레스 셀렉, 신랑 예복 가봉, 예물 사이즈 체크", Category.STUDIO_DRESS_MAKEUP, None),
    (-150, "리허설 촬영, 한복 가봉(본식용), 가전가구 구입, 허니문 결정", Category.REHEARSAL, "여행지 예약 성수기"),
    (-100, "예단 준비", Category.GIFT, "양가 상의 후 결정"),
    # ── 후기 준비 (D-80 ~ D-20) ─────────────────────────────────
    (-80, "하객 리스트 작성, 주례·사회자 부탁", Category.ETC, "200명 기준 점검"),
    (-50, "사전 셀렉, 부케·청첩장 제작, 혼주 예복·한복 맞춤", Category.INVITATION, "모바일+실물 병행"),
    (-40, "봉투 주소록 작성, 축의금 받는 분 선정", Category.ETC, "양가 각 2명"),
    (-30, "본식 드레스 가봉, 신혼집 이사, 답례품 업체 선정", Category.STUDIO_DRESS_MAKEUP, None),
    (-20, "주례 선생님 찾아뵙기, DP용 사진 찾기, 혼수 들이기, 여행일정 확인", Category.ETC, None),
    # ── 본식 직전 (D-10 ~ D-DAY) ────────────────────────────────
    (-10, "축가·축하 연주 확정, 웨딩카 섭외, 여행경비 환전, 여행가방 꾸리기", Category.HONEYMOON, None),
    (-8, "신혼집 정리, 휴가 신청, 혼인신고 서류 준비", Category.ETC, None),
    (-2, "차량·지갑·사진·비디오·부케·의상·폐백음식 최종 점검", Category.ETC, "체크리스트 마지막 확인"),
    (-1, "한복 챙기기, 함 들이기, 준비물 최종 점검", Category.REHEARSAL, "숙면 권장"),
    (0, "본식 (메이크업 샵 → 예식장 3시간 전 도착)", Category.CEREMONY, "오늘 우리 결혼합니다"),
    # ── 본식 이후 (D+1 ~ D+14) ──────────────────────────────────
    (1, "아이폰 스냅 수령", Category.WEDDING_PHOTO, "다음날 바로 확인 가능"),
    (3, "신혼여행 출발", Category.HONEYMOON, None),
    (10, "신혼여행 귀국", Category.HONEYMOON, None),
    (14, "앨범 주문 — 쌓인 기록을 한 권으로", Category.ETC, "양가 부모님 선물용 수량 고려"),
]


_SYSTEM_PROMPT = (
    "당신은 한국의 결혼 준비 전문가입니다. "
    "사용자의 결혼 예정일(wedding_date)과 선택적 budget_level(low|mid|high)을 받아 "
    "20~24개의 결혼 준비 일정을 JSON 배열로 생성합니다.\n"
    "\n"
    "타임라인 가이드 (한국 결혼 준비 표준, D-360 ~ D+14):\n"
    "- D-360~D-340: 상견례, 웨딩홀 섭외·예약, 예산 세우기\n"
    "- D-320~D-300: 분가 여부, 스드메 상담(스튜디오·드레스·메이크업)\n"
    "- D-270~D-250: 예복·예물 상담/계약, 본식촬영 업체, 신혼집 알아보기\n"
    "- D-200~D-180: 피부관리·건강검진, 촬영드레스·예복 가봉\n"
    "- D-150: 리허설 촬영, 한복 가봉, 가전·가구, 허니문 결정\n"
    "- D-100~D-80: 예단 준비, 하객 리스트, 주례·사회자 부탁\n"
    "- D-50~D-30: 사전 셀렉, 부케·청첩장 제작, 봉투 주소록, 본식 드레스 가봉, 답례품\n"
    "- D-20~D-10: 주례 찾아뵙기, 웨딩카·환전·가방, 축가 확정\n"
    "- D-8~D-1: 혼인신고 서류, 차량·지갑·사진·부케 최종 점검, 한복 챙기기\n"
    "- D-DAY: 본식\n"
    "- D+1~D+14: 아이폰 스냅 수령, 신혼여행, 앨범 주문\n"
    "\n"
    "각 항목은 아래 스키마를 따라야 합니다:\n"
    '{"title": str, "offset_days": int, "category": str, "memo": str|null}\n'
    "category 는 다음 중 하나여야 합니다: "
    "WEDDING_PHOTO, STUDIO_DRESS_MAKEUP, VENUE, GIFT, INVITATION, "
    "REHEARSAL, CEREMONY, HONEYMOON, ETC.\n"
    "offset_days 는 결혼일 기준 정수(음수=준비기, 0=본식, 양수=사후).\n"
    'title 은 한 문장, 여러 할 일이 묶이면 쉼표로 나열. '
    'memo 에는 실무 팁(예: "예산 기준 홀 확정", "성수기 예약 어려움") 간결히.\n'
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
        """사전정의 템플릿을 wedding_date 기준으로 전개 (D-360 ~ D+14)."""
        return [
            {
                "title": title,
                "date": (wedding_date + timedelta(days=offset)).isoformat(),
                "category": cat.value,
                "memo": memo,
                "is_ai_generated": True,
            }
            for offset, title, cat, memo in _TEMPLATES
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
