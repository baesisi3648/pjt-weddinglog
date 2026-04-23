# @TASK P2-R1-T2 - Event 비즈니스 로직 서비스
# @SPEC specs/domain/resources.yaml#events
# @SPEC docs/planning/05-architecture.md
# @TEST tests/services/test_event_service.py
"""
Event 리소스 CRUD + 필터 + toggle_complete.

- 순수 함수 스타일 (모듈 레벨 함수), 상태 없음.
- 월별 필터: "YYYY-MM" 형식 → 해당 월 1일~말일 (calendar.monthrange) 범위.
- get_or_404 / update / delete / toggle_complete 는 couple_id 소속 여부까지
  검증하여 다른 커플의 이벤트에 대한 접근을 404 로 차단한다.
"""
from __future__ import annotations

import calendar
import logging
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.event import Event
from app.schemas.event import EventCreate, EventUpdate

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Internal helpers
# -----------------------------------------------------------------------------
def _parse_month(month: str) -> tuple[date, date]:
    """'YYYY-MM' → (해당 월 1일, 말일) 튜플.

    Raises:
        HTTPException(400): 형식이 잘못된 경우.
    """
    try:
        year_str, month_str = month.split("-")
        year = int(year_str)
        m = int(month_str)
        if not (1 <= m <= 12):
            raise ValueError("month out of range")
    except (ValueError, AttributeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid month format (expected YYYY-MM): {month!r} ({exc})",
        ) from exc

    last_day = calendar.monthrange(year, m)[1]
    return date(year, m, 1), date(year, m, last_day)


# -----------------------------------------------------------------------------
# List
# -----------------------------------------------------------------------------
def list_by_couple(
    db: Session,
    couple_id: str,
    *,
    month: str | None = None,
    category: str | None = None,
    is_completed: bool | None = None,
) -> list[Event]:
    """couple_id 소속 이벤트 목록 (필터 선택적 적용).

    - month: "YYYY-MM" 형식 → 해당 월 date 범위.
    - category: Category enum 값 (str).
    - is_completed: True/False 완료 상태.

    정렬: date ASC, 동일 날짜는 created_at ASC.
    """
    stmt = select(Event).where(Event.couple_id == couple_id)

    if month is not None:
        start, end = _parse_month(month)
        stmt = stmt.where(Event.date >= start, Event.date <= end)

    if category is not None:
        stmt = stmt.where(Event.category == category)

    if is_completed is not None:
        stmt = stmt.where(Event.is_completed == is_completed)

    stmt = stmt.order_by(Event.date.asc(), Event.created_at.asc())

    return list(db.execute(stmt).scalars().all())


def list_upcoming_by_couple(
    db: Session,
    couple_id: str,
    *,
    today: date | None = None,
    limit: int = 3,
) -> list[Event]:
    """오늘 이후의 가장 가까운 이벤트 N개 (date ASC).

    Home 화면 upcoming_events 위젯용.

    Args:
        couple_id: 대상 커플 id.
        today: 기준일 (None 이면 date.today()) — 테스트 결정성 보장.
        limit: 반환 최대 개수 (기본 3).
    """
    if limit <= 0:
        return []

    reference = today if today is not None else date.today()
    stmt = (
        select(Event)
        .where(Event.couple_id == couple_id, Event.date >= reference)
        .order_by(Event.date.asc(), Event.created_at.asc())
        .limit(limit)
    )
    return list(db.execute(stmt).scalars().all())


# -----------------------------------------------------------------------------
# Read single
# -----------------------------------------------------------------------------
def get_or_404(db: Session, couple_id: str, event_id: str) -> Event:
    """event_id 로 조회하되, couple_id 소속 여부까지 검증.

    Raises:
        HTTPException(404): 존재하지 않거나 다른 커플 소속인 경우.
    """
    event = db.get(Event, event_id)
    if event is None or event.couple_id != couple_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event not found: couple={couple_id} event={event_id}",
        )
    return event


# -----------------------------------------------------------------------------
# Create
# -----------------------------------------------------------------------------
def create(
    db: Session,
    couple_id: str,
    event_in: EventCreate,
    *,
    is_ai_generated: bool = False,
) -> Event:
    """새 이벤트를 생성한다."""
    event = Event(
        couple_id=couple_id,
        title=event_in.title,
        date=event_in.date,
        category=event_in.category,
        memo=event_in.memo,
        is_ai_generated=is_ai_generated,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    logger.info("Created event id=%s couple=%s", event.id, couple_id)
    return event


# -----------------------------------------------------------------------------
# Update
# -----------------------------------------------------------------------------
def update(
    db: Session,
    couple_id: str,
    event_id: str,
    event_update: EventUpdate,
) -> Event:
    """부분 업데이트. 명시적으로 전달된 필드만 반영."""
    event = get_or_404(db, couple_id, event_id)
    changes = event_update.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    logger.info(
        "Updated event id=%s fields=%s", event.id, list(changes.keys())
    )
    return event


# -----------------------------------------------------------------------------
# Delete
# -----------------------------------------------------------------------------
def delete(db: Session, couple_id: str, event_id: str) -> None:
    """이벤트 삭제. Photo cascade 는 Phase 3 에서 추가됨."""
    event = get_or_404(db, couple_id, event_id)
    db.delete(event)
    db.commit()
    logger.info("Deleted event id=%s", event_id)


# -----------------------------------------------------------------------------
# toggle_complete
# -----------------------------------------------------------------------------
def toggle_complete(db: Session, couple_id: str, event_id: str) -> Event:
    """is_completed 값을 토글한다."""
    event = get_or_404(db, couple_id, event_id)
    event.is_completed = not event.is_completed
    db.commit()
    db.refresh(event)
    logger.info(
        "Toggled event id=%s is_completed=%s", event.id, event.is_completed
    )
    return event
