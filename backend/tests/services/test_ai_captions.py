# @TASK P3-R1-T5 - AI 캡션 서비스 단위 테스트
# @SPEC specs/domain/resources.yaml#ai_services.generate_captions
"""
AIService.generate_captions 테스트 (OpenAI 없는 환경 폴백 포함).

핵심 시나리오:
- available=False → source="template", captions 길이 3
- 9개 카테고리 모두 폴백 정의됨 + 3개 반환
- 알려지지 않은 카테고리 → ETC 폴백
- OpenAI 호출 실패 시 폴백으로 빠지고 source="template"
"""
from __future__ import annotations

from datetime import date
from types import SimpleNamespace

import pytest

from app.schemas.enums import Category
from app.services.ai_service import AIService


class TestCaptionFallback:
    def _svc(self, available: bool = False) -> AIService:
        return AIService(SimpleNamespace(openai_available=available))

    @pytest.mark.asyncio
    async def test_returns_three_captions(self) -> None:
        svc = self._svc()
        result = await svc.generate_captions(
            category=Category.WEDDING_PHOTO.value,
            event_date=date(2026, 7, 25),
            memo=None,
        )
        assert result["source"] == "template"
        assert len(result["captions"]) == 3
        assert all(isinstance(c, str) and c for c in result["captions"])

    @pytest.mark.asyncio
    async def test_all_nine_categories_have_fallback(self) -> None:
        svc = self._svc()
        for cat in Category:
            result = await svc.generate_captions(
                category=cat.value,
                event_date=date(2026, 1, 1),
                memo=None,
            )
            assert "source" in result
            assert len(result["captions"]) == 3, (
                f"Category {cat.value} missing 3 captions"
            )

    @pytest.mark.asyncio
    async def test_unknown_category_uses_etc_fallback(self) -> None:
        svc = self._svc()
        result = await svc.generate_captions(
            category="TOTALLY_UNKNOWN",
            event_date=date(2026, 1, 1),
            memo=None,
        )
        # ETC fallback 과 동일해야 함
        etc = await svc.generate_captions(
            category=Category.ETC.value,
            event_date=date(2026, 1, 1),
            memo=None,
        )
        assert result["captions"] == etc["captions"]

    @pytest.mark.asyncio
    async def test_memo_accepted_but_ignored_in_fallback(self) -> None:
        svc = self._svc()
        # memo 를 넘겨도 폴백 결과에는 영향 없음(템플릿 고정).
        r1 = await svc.generate_captions(
            Category.HONEYMOON.value, date(2026, 11, 1), memo="발리"
        )
        r2 = await svc.generate_captions(
            Category.HONEYMOON.value, date(2026, 11, 1), memo=None
        )
        assert r1["captions"] == r2["captions"]


class TestCaptionOpenAIFailureFallback:
    @pytest.mark.asyncio
    async def test_openai_exception_falls_back(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        svc = AIService(SimpleNamespace(openai_available=True))

        async def _boom(*args: object, **kwargs: object) -> object:
            raise RuntimeError("simulated openai error")

        monkeypatch.setattr(svc, "_call_openai_captions", _boom)
        result = await svc.generate_captions(
            category=Category.CEREMONY.value,
            event_date=date(2026, 10, 25),
            memo=None,
        )
        assert result["source"] == "template"
        assert len(result["captions"]) == 3
