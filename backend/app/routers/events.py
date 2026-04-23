# @TASK P2-R1-T3 - Event REST API 라우터
# @SPEC docs/planning/05-architecture.md#api-엔드포인트
# @TEST tests/routers/test_events.py
"""
/api/couples/{couple_id}/events/* 엔드포인트.

- GET /              — 목록 (month, category, is_completed 쿼리)
- POST /             — 생성 (201)
- GET /{event_id}    — 단건 (404 if not in couple)
- PUT /{event_id}    — 부분 업데이트
- DELETE /{event_id} — 삭제 (204)
- PATCH /{event_id}/complete — 완료 상태 토글
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.event import EventCreate, EventResponse, EventUpdate
from app.services import couple_service, event_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/couples/{couple_id}/events",
    tags=["events"],
)


@router.get(
    "/",
    response_model=list[EventResponse],
    summary="이벤트 목록 조회",
)
def list_events(
    couple_id: str,
    month: str | None = Query(
        default=None,
        description="YYYY-MM 형식 월별 필터 (예: 2026-08)",
        examples=["2026-08"],
    ),
    category: str | None = Query(
        default=None,
        description="Category enum 9개 값 중 하나",
    ),
    is_completed: bool | None = Query(
        default=None,
        description="완료 여부 필터",
    ),
    db: Session = Depends(get_db),
) -> list[EventResponse]:
    """couple_id 소속 이벤트 목록을 조회한다.

    - 존재하지 않는 couple_id 여도 빈 리스트를 반환하지 않고 404 를 원한다면
      먼저 get_or_404 로 검증 — 화면 UX 상 404 를 주는 게 더 명확하므로 적용.
    """
    couple_service.get_or_404(db, couple_id)
    events = event_service.list_by_couple(
        db,
        couple_id,
        month=month,
        category=category,
        is_completed=is_completed,
    )
    return [EventResponse.model_validate(e) for e in events]


@router.post(
    "/",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="이벤트 생성",
)
def create_event(
    couple_id: str,
    payload: EventCreate,
    db: Session = Depends(get_db),
) -> EventResponse:
    """새 이벤트를 생성한다 (couple 이 존재해야 함)."""
    couple_service.get_or_404(db, couple_id)
    event = event_service.create(db, couple_id, payload)
    return EventResponse.model_validate(event)


@router.get(
    "/{event_id}",
    response_model=EventResponse,
    summary="이벤트 단건 조회",
)
def get_event(
    couple_id: str,
    event_id: str,
    db: Session = Depends(get_db),
) -> EventResponse:
    """단건 조회. couple 소속이 아니면 404."""
    event = event_service.get_or_404(db, couple_id, event_id)
    return EventResponse.model_validate(event)


@router.put(
    "/{event_id}",
    response_model=EventResponse,
    summary="이벤트 부분 업데이트",
)
def update_event(
    couple_id: str,
    event_id: str,
    payload: EventUpdate,
    db: Session = Depends(get_db),
) -> EventResponse:
    """전달된 필드만 수정한다."""
    event = event_service.update(db, couple_id, event_id, payload)
    return EventResponse.model_validate(event)


@router.delete(
    "/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="이벤트 삭제",
)
def delete_event(
    couple_id: str,
    event_id: str,
    db: Session = Depends(get_db),
) -> Response:
    """이벤트를 삭제한다. 204 No Content."""
    event_service.delete(db, couple_id, event_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch(
    "/{event_id}/complete",
    response_model=EventResponse,
    summary="이벤트 완료 상태 토글",
)
def toggle_complete(
    couple_id: str,
    event_id: str,
    db: Session = Depends(get_db),
) -> EventResponse:
    """is_completed 를 반전시킨다."""
    event = event_service.toggle_complete(db, couple_id, event_id)
    return EventResponse.model_validate(event)
