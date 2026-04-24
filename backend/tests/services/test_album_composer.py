# @TASK P5-BACKEND - AlbumComposerService 단위 테스트
"""
AlbumComposerService.compose 의 폴백 로직 검증.

- AI 비가용 시 template 폴백.
- 각 챕터 첫 페이지는 T5 Cover.
- 4장씩 T4, 잔여 3=T3, 2=T2, 1=T1 규칙.
- total_photos / total_pages 일관성.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

import pytest

from app.schemas.album import AlbumLayoutSchema
from app.schemas.layouts import get_photo_count
from app.services.album_composer_service import AlbumComposerService


# -----------------------------------------------------------------------------
# Fake Photo (ORM 대체) — app.state 없이도 compose 폴백을 호출 가능.
# -----------------------------------------------------------------------------
@dataclass
class _FakeEvent:
    category: str
    title: str
    date: date


@dataclass
class _FakePhoto:
    id: str
    caption: str | None
    event: _FakeEvent
    event_id: str = "evt_fake"


class _NoAIState:
    """openai_available=False."""

    openai_available = False


def _mk_photos(pairs: list[tuple[str, str]]) -> list[_FakePhoto]:
    """(id, category) 튜플들로 FakePhoto 목록 생성."""
    return [
        _FakePhoto(
            id=pid,
            caption=None,
            event=_FakeEvent(
                category=cat,
                title=f"evt-{cat}",
                date=date(2026, 8, 1),
            ),
        )
        for pid, cat in pairs
    ]


# -----------------------------------------------------------------------------
# 폴백 기본 케이스
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_compose_fallback_when_ai_unavailable() -> None:
    svc = AlbumComposerService(_NoAIState())
    assert svc.ai_available is False

    photos = _mk_photos(
        [
            ("pho_1", "WEDDING_PHOTO"),
            ("pho_2", "WEDDING_PHOTO"),
            ("pho_3", "WEDDING_PHOTO"),
            ("pho_4", "WEDDING_PHOTO"),
            ("pho_5", "WEDDING_PHOTO"),
        ]
    )
    layout = await svc.compose(photos)  # type: ignore[arg-type]

    assert isinstance(layout, AlbumLayoutSchema)
    assert layout.generated_by == "template"
    assert len(layout.chapters) == 1
    chapter = layout.chapters[0]
    assert chapter.title == "웨딩촬영"
    assert chapter.color == "coral"

    # 첫 페이지 T5 Cover, 나머지 4장 → T4 Grid.
    assert chapter.pages[0].template == "T5"
    assert len(chapter.pages[0].photo_ids) == 1
    assert chapter.pages[1].template == "T4"
    assert len(chapter.pages[1].photo_ids) == 4


@pytest.mark.asyncio
async def test_compose_groups_into_multiple_chapters() -> None:
    svc = AlbumComposerService(_NoAIState())
    photos = _mk_photos(
        [
            ("pho_w1", "WEDDING_PHOTO"),
            ("pho_w2", "WEDDING_PHOTO"),
            ("pho_c1", "CEREMONY"),
            ("pho_h1", "HONEYMOON"),
            ("pho_h2", "HONEYMOON"),
        ]
    )
    layout = await svc.compose(photos)  # type: ignore[arg-type]

    # 3 챕터 생성 (웨딩촬영, 본식, 신혼여행).
    assert len(layout.chapters) == 3
    chapter_titles = [c.title for c in layout.chapters]
    assert chapter_titles == ["웨딩촬영", "그 날 — 본식", "첫 여행 — 신혼여행"]

    # 각 챕터 첫 페이지 = T5 Cover.
    for chapter in layout.chapters:
        assert chapter.pages[0].template == "T5"


@pytest.mark.asyncio
async def test_compose_leftover_three_photos_uses_t3() -> None:
    """커버 1장 + 남은 3장 → T3 (3장)."""
    svc = AlbumComposerService(_NoAIState())
    photos = _mk_photos(
        [
            ("p1", "HONEYMOON"),
            ("p2", "HONEYMOON"),
            ("p3", "HONEYMOON"),
            ("p4", "HONEYMOON"),
        ]
    )
    layout = await svc.compose(photos)  # type: ignore[arg-type]

    chapter = layout.chapters[0]
    # 페이지 1 (T5) + 페이지 2 (T3 with 3 photos)
    assert len(chapter.pages) == 2
    assert chapter.pages[1].template == "T3"
    assert len(chapter.pages[1].photo_ids) == 3


@pytest.mark.asyncio
async def test_compose_leftover_two_photos_uses_t2() -> None:
    svc = AlbumComposerService(_NoAIState())
    photos = _mk_photos(
        [("p1", "CEREMONY"), ("p2", "CEREMONY"), ("p3", "CEREMONY")]
    )
    layout = await svc.compose(photos)  # type: ignore[arg-type]
    chapter = layout.chapters[0]
    # T5 + T2(2장)
    assert chapter.pages[1].template == "T2"
    assert len(chapter.pages[1].photo_ids) == 2


@pytest.mark.asyncio
async def test_compose_leftover_one_photo_uses_t1() -> None:
    svc = AlbumComposerService(_NoAIState())
    photos = _mk_photos([("p1", "CEREMONY"), ("p2", "CEREMONY")])
    layout = await svc.compose(photos)  # type: ignore[arg-type]
    chapter = layout.chapters[0]
    # T5 + T1(1장)
    assert chapter.pages[1].template == "T1"
    assert len(chapter.pages[1].photo_ids) == 1


@pytest.mark.asyncio
async def test_compose_empty_photos_returns_empty_layout() -> None:
    svc = AlbumComposerService(_NoAIState())
    layout = await svc.compose([])
    assert layout.total_photos == 0
    assert layout.total_pages == 0
    assert layout.chapters == []


@pytest.mark.asyncio
async def test_compose_photo_count_per_template_strict() -> None:
    """모든 페이지의 photo_ids 수가 템플릿 photo_count 와 정확히 일치."""
    svc = AlbumComposerService(_NoAIState())
    photos = _mk_photos(
        [
            (f"pho_{i}", "HONEYMOON" if i % 2 else "WEDDING_PHOTO")
            for i in range(20)
        ]
    )
    layout = await svc.compose(photos)  # type: ignore[arg-type]

    for ch in layout.chapters:
        for pg in ch.pages:
            expected = get_photo_count(pg.template)
            assert len(pg.photo_ids) == expected, (
                f"page {pg.page_number} template {pg.template} "
                f"expected {expected} got {len(pg.photo_ids)}"
            )


@pytest.mark.asyncio
async def test_compose_total_counts_match_sum_of_pages() -> None:
    svc = AlbumComposerService(_NoAIState())
    photos = _mk_photos(
        [
            ("p1", "WEDDING_PHOTO"),
            ("p2", "WEDDING_PHOTO"),
            ("p3", "CEREMONY"),
            ("p4", "HONEYMOON"),
        ]
    )
    layout = await svc.compose(photos)  # type: ignore[arg-type]

    pages_sum = sum(len(ch.pages) for ch in layout.chapters)
    photos_sum = sum(
        len(pg.photo_ids) for ch in layout.chapters for pg in ch.pages
    )

    assert layout.total_pages == pages_sum
    assert layout.total_photos == photos_sum
