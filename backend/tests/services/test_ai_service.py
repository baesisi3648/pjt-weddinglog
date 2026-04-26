# @TASK P2-R1-T4 - AIService 단위 테스트
# @SPEC docs/planning/05-architecture.md#ai-폴백-전략
# @SPEC specs/domain/resources.yaml#ai_services
"""
AIService 테스트 (OpenAI 없는 환경에서의 폴백 포함).

핵심 시나리오:
- openai_available=False 이면 사전정의 템플릿(D-360 ~ D+14, 24개) 반환
- 각 항목에 is_ai_generated=True, category 는 Category enum 값 중 하나
- D-360, D-day, D+14 날짜 오프셋 정확성
- OpenAI 호출 실패 시(예외) 폴백으로 빠지고 source="template"
"""
from __future__ import annotations

from datetime import date, timedelta
from types import SimpleNamespace

import pytest

from app.schemas.enums import Category
from app.services.ai_service import AIService


# -----------------------------------------------------------------------------
# Fallback (OpenAI 미사용)
# -----------------------------------------------------------------------------
class TestFallback:
    def _svc_no_ai(self) -> AIService:
        return AIService(SimpleNamespace(openai_available=False))

    @pytest.mark.asyncio
    async def test_returns_template_events(self) -> None:
        """사전정의 템플릿 개수만큼 반환."""
        from app.services.ai_service import _TEMPLATES
        svc = self._svc_no_ai()
        wedding = date(2026, 10, 25)
        result = await svc.generate_checklist(wedding)
        assert result["source"] == "template"
        assert len(result["events"]) == len(_TEMPLATES)
        # 최소 보장: 15개 이상 (초기 스펙 호환)
        assert len(result["events"]) >= 15

    @pytest.mark.asyncio
    async def test_each_item_is_ai_generated_flag(self) -> None:
        svc = self._svc_no_ai()
        result = await svc.generate_checklist(date(2026, 10, 25))
        for item in result["events"]:
            assert item["is_ai_generated"] is True

    @pytest.mark.asyncio
    async def test_each_item_category_in_enum(self) -> None:
        svc = self._svc_no_ai()
        allowed = {c.value for c in Category}
        result = await svc.generate_checklist(date(2026, 10, 25))
        for item in result["events"]:
            assert item["category"] in allowed, (
                f"Unknown category {item['category']!r} "
                f"(not in Category enum)"
            )

    @pytest.mark.asyncio
    async def test_date_offsets_correct(self) -> None:
        """첫 항목 D-360(최초 템플릿 offset), D-day 는 본식, 마지막 D+14 기준 계산."""
        from app.services.ai_service import _TEMPLATES
        svc = self._svc_no_ai()
        wedding = date(2026, 10, 25)
        result = await svc.generate_checklist(wedding)

        events = result["events"]
        first_offset = _TEMPLATES[0][0]
        last_offset = _TEMPLATES[-1][0]

        # 첫 항목: 템플릿 첫 offset 과 매칭
        assert events[0]["date"] == (
            wedding + timedelta(days=first_offset)
        ).isoformat()
        # D-day (offset=0) 는 "본식"
        ceremony = next(
            e for e in events if e["date"] == wedding.isoformat()
        )
        assert "본식" in ceremony["title"]
        # 마지막 항목: 템플릿 마지막 offset 과 매칭
        assert events[-1]["date"] == (
            wedding + timedelta(days=last_offset)
        ).isoformat()

    @pytest.mark.asyncio
    async def test_dates_sorted_ascending(self) -> None:
        svc = self._svc_no_ai()
        result = await svc.generate_checklist(date(2026, 10, 25))
        dates = [e["date"] for e in result["events"]]
        assert dates == sorted(dates)

    @pytest.mark.asyncio
    async def test_titles_non_empty(self) -> None:
        svc = self._svc_no_ai()
        result = await svc.generate_checklist(date(2026, 10, 25))
        for item in result["events"]:
            assert item["title"] and isinstance(item["title"], str)


# -----------------------------------------------------------------------------
# OpenAI 경로 실패 시 폴백 (available=True 이지만 호출 실패)
# -----------------------------------------------------------------------------
class TestOpenAIFailureFallback:
    @pytest.mark.asyncio
    async def test_openai_error_falls_back_to_template(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """available=True 지만 _call_openai_checklist 가 예외를 내면 폴백으로."""
        svc = AIService(SimpleNamespace(openai_available=True))

        async def _boom(*args: object, **kwargs: object) -> object:
            raise RuntimeError("simulated openai error")

        monkeypatch.setattr(svc, "_call_openai_checklist", _boom)
        result = await svc.generate_checklist(date(2026, 10, 25))
        assert result["source"] == "template"
        from app.services.ai_service import _TEMPLATES
        assert len(result["events"]) == len(_TEMPLATES)
