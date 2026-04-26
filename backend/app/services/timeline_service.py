# @TASK P4-R1-T1 - Timeline 챕터 그룹핑 서비스
# @SPEC specs/screens/04_timeline.yaml
# @SPEC docs/planning/06-tasks.md#p4-r1-t1-timelineservice-챕터-그룹핑
# @TEST tests/services/test_timeline_service.py
"""
Timeline 챕터 그룹핑 서비스.

기능:
- 카테고리별 자동 챕터 그룹핑 (CHAPTER_MAPPING)
- 총 사진 수 / 선택 사진 수 카운트
- 예상 페이지 수 계산: ceil(selected_photos / 2.5)

쿼리 전략 (N+1 방지):
- `selectinload(Couple.events).selectinload(Event.photos)` 로 한 번에 eager load.
- Couple 단건 조회이므로 selectinload 가 가장 단순.

응답 형식: Pydantic 모델(TimelineResponse)에 매핑되는 dict.
"""
from __future__ import annotations

import logging
import math
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.couple import Couple
from app.models.event import Event
from app.models.photo import Photo

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Chapter mapping — specs/screens/04_timeline.yaml 와 동기화
# -----------------------------------------------------------------------------
@dataclass(frozen=True)
class _ChapterDef:
    """챕터 정적 정의."""

    key: str
    title: str
    categories: tuple[str, ...]
    color: str


# 표시 순서 = 시간 흐름 (일상 → 준비 → 촬영 → 본식 → 신혼여행).
# 사진이 0장인 챕터는 응답에서 제외되지만 chapter_number 는 표시되는 챕터 기준 1부터 재부여.
CHAPTER_MAPPING: tuple[_ChapterDef, ...] = (
    # Ch.1 — 일상 데이트 (D-330 ~ D-120, 만남부터 결혼 결심까지)
    _ChapterDef("dating", "함께 쌓아온 날들", ("ETC",), "coral"),
    # Ch.2 — 본격 준비 (D-200 ~ D-30, 예식장·스드메·예물·청첩장)
    _ChapterDef(
        "preparation",
        "둘이 함께 준비한 시간",
        ("VENUE", "STUDIO_DRESS_MAKEUP", "GIFT", "INVITATION"),
        "coral",
    ),
    # Ch.3 — 웨딩 촬영 (D-90, D-76, D-20)
    _ChapterDef("wedding_photo", "카메라 앞에서, 우리", ("WEDDING_PHOTO",), "coral"),
    # Ch.4 — 본식 (D-7, D-Day)
    _ChapterDef("ceremony", "그 날 — 결혼식", ("REHEARSAL", "CEREMONY"), "coral"),
    # Ch.5 — 신혼여행 (D+3 ~ D+11)
    _ChapterDef("honeymoon", "첫 여행 — 신혼여행", ("HONEYMOON",), "coral"),
)

# category → chapter index 역인덱스 (O(1) 매핑).
_CATEGORY_TO_CHAPTER_IDX: dict[str, int] = {
    category: idx
    for idx, chapter in enumerate(CHAPTER_MAPPING)
    for category in chapter.categories
}


# -----------------------------------------------------------------------------
# Public API
# -----------------------------------------------------------------------------
def get_timeline(
    db: Session,
    couple_id: str,
    *,
    only_selected: bool = False,
) -> dict:
    """커플의 타임라인 데이터를 챕터별로 그룹핑하여 반환한다.

    Args:
        db: SQLAlchemy Session.
        couple_id: 대상 커플 id.
        only_selected: True 면 is_selected=True 인 사진만 photos 리스트에 포함.
            (total_photos / selected_photos / pages 는 전체 기준으로 계산.)

    Returns:
        dict — Pydantic `TimelineResponse` 에 매핑되는 구조.
        {
          "total_photos": int,
          "selected_photos": int,
          "total_pages_estimated": int,   # ceil(selected / 2.5)
          "chapters": [
            {
              "chapter_number": int,      # 1-based, 비어있는 챕터 제외 후 재부여
              "key": str,
              "title": str,
              "color": str,
              "categories": list[str],
              "photo_count": int,
              "photos": [
                {
                  "id": str,
                  "file_url": "/api/photos/{id}/file",
                  "caption": str | None,
                  "caption_source": str | None,
                  "is_selected": bool,
                  "event_date": str,       # ISO YYYY-MM-DD
                  "event_title": str,
                  "category": str,
                },
                ...
              ]
            },
            ...
          ]
        }

    Notes:
        - Couple 이 존재하지 않는 경우에도 비어있는 구조를 반환한다 (404 는
          라우터 레이어에서 처리).
        - 사진이 없는 챕터는 응답에 포함되지 않는다.
        - 챕터 내 정렬: sort_order ASC → created_at ASC.
    """
    # 1) Couple + events + photos 한 번에 fetch (N+1 방지).
    stmt = (
        select(Couple)
        .where(Couple.id == couple_id)
        .options(selectinload(Couple.events).selectinload(Event.photos))
    )
    couple = db.execute(stmt).scalar_one_or_none()

    if couple is None:
        # 서비스 레이어에서는 None 반환 대신 빈 타임라인을 돌려준다.
        # (라우터에서 couple_service.get_or_404 로 먼저 검증하므로 이 경로는
        # 실제로 거의 타지 않지만, 방어적 동작.)
        return _empty_timeline()

    # 2) 카테고리별 사진 그룹핑.
    # bucket[chapter_idx] = [(event, photo), ...]
    buckets: dict[int, list[tuple[Event, Photo]]] = {
        i: [] for i in range(len(CHAPTER_MAPPING))
    }

    total_photos = 0
    selected_photos = 0

    for event in couple.events:
        chapter_idx = _CATEGORY_TO_CHAPTER_IDX.get(event.category)
        if chapter_idx is None:
            # 예기치 않은 카테고리 (enum 외 값)는 '기타' 로 fallback.
            chapter_idx = _CATEGORY_TO_CHAPTER_IDX.get("ETC")
            if chapter_idx is None:  # pragma: no cover — ETC 는 항상 존재
                continue

        for photo in event.photos:
            total_photos += 1
            if photo.is_selected:
                selected_photos += 1
            buckets[chapter_idx].append((event, photo))

    # 3) 사진 있는 챕터만 응답에 포함 + chapter_number 재부여.
    chapters_out: list[dict] = []
    display_number = 0
    for idx, chapter in enumerate(CHAPTER_MAPPING):
        entries = buckets[idx]
        if not entries:
            continue

        display_number += 1

        # 챕터 내 정렬: sort_order ASC, 같으면 created_at ASC.
        entries.sort(key=lambda ep: (ep[1].sort_order, ep[1].created_at))

        photos_payload: list[dict] = []
        for event, photo in entries:
            if only_selected and not photo.is_selected:
                continue
            photos_payload.append(
                {
                    "id": photo.id,
                    "file_url": f"/api/photos/{photo.id}/file",
                    "caption": photo.caption,
                    "caption_source": photo.caption_source,
                    "is_selected": photo.is_selected,
                    "event_date": event.date.isoformat(),
                    "event_title": event.title,
                    "category": event.category,
                }
            )

        chapters_out.append(
            {
                "chapter_number": display_number,
                "key": chapter.key,
                "title": chapter.title,
                "color": chapter.color,
                "categories": list(chapter.categories),
                # photo_count 는 전체 사진 수 (only_selected 여부 무관) —
                # Timeline UX 상 '이 챕터에 X장' 은 전체 기준이 자연스럽다.
                "photo_count": len(entries),
                "photos": photos_payload,
            }
        )

    total_pages_estimated = math.ceil(selected_photos / 2.5) if selected_photos else 0

    logger.debug(
        "Timeline built: couple=%s total=%d selected=%d chapters=%d pages=%d",
        couple_id,
        total_photos,
        selected_photos,
        len(chapters_out),
        total_pages_estimated,
    )

    return {
        "total_photos": total_photos,
        "selected_photos": selected_photos,
        "total_pages_estimated": total_pages_estimated,
        "chapters": chapters_out,
    }


# -----------------------------------------------------------------------------
# Internal helpers
# -----------------------------------------------------------------------------
def _empty_timeline() -> dict:
    return {
        "total_photos": 0,
        "selected_photos": 0,
        "total_pages_estimated": 0,
        "chapters": [],
    }
