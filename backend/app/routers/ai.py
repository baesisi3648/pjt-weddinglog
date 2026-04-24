# @TASK P2-R1-T5 - AI 체크리스트 REST API 라우터
# @SPEC docs/planning/05-architecture.md#ai-폴백-전략
# @TEST tests/routers/test_ai.py
"""
/api/ai/* 엔드포인트.

- POST /checklist
    body: { couple_id, wedding_date?, budget_level?, dry_run?: bool }
    - wedding_date 누락 시 couple DB 에서 가져온다.
    - dry_run=True: 생성만, DB 저장 안 함.
    - dry_run=False(기본): 생성된 이벤트를 DB 에 모두 저장 (is_ai_generated=True).
    response: { source: "ai"|"template", events: [EventResponse, ...] }
"""
from __future__ import annotations

import logging
from datetime import date as _date

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.event import Event
from app.schemas.event import EventResponse
from app.services import couple_service, photo_service
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["ai"])


class ChecklistRequest(BaseModel):
    couple_id: str = Field(..., description="커플 ID")
    wedding_date: _date | None = Field(
        default=None,
        description="결혼 예정일 (생략 시 couple DB 값 사용)",
    )
    budget_level: str | None = Field(
        default=None, description="low|mid|high (선택)"
    )
    dry_run: bool = Field(
        default=False,
        description="True 면 DB 저장 없이 미리보기만 반환",
    )


class ChecklistResponse(BaseModel):
    source: str = Field(
        ..., description='"ai" (OpenAI 성공) 또는 "template" (폴백)'
    )
    events: list[EventResponse]


@router.post(
    "/checklist",
    response_model=ChecklistResponse,
    summary="AI 체크리스트 생성",
    description=(
        "결혼 준비 일정 15개를 자동 생성한다. "
        "OpenAI 키가 있으면 실제 AI 호출, 없거나 실패 시 사전정의 템플릿으로 폴백."
    ),
)
async def generate_checklist(
    payload: ChecklistRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> ChecklistResponse:
    """AI 체크리스트 생성 → 선택적 DB 저장.

    중복 방지: dry_run=False 이고 이미 해당 커플에 is_ai_generated=True 이벤트가
    있으면 409 Conflict 로 차단한다. (dry_run 은 미리보기라 허용.)
    """
    couple = couple_service.get_or_404(db, payload.couple_id)
    wedding_date = payload.wedding_date or couple.wedding_date

    # 중복 방지 — 이미 AI 체크리스트가 있으면 저장 거부.
    if not payload.dry_run:
        existing = (
            db.query(Event)
            .filter(
                Event.couple_id == couple.id,
                Event.is_ai_generated.is_(True),
            )
            .count()
        )
        if existing > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"AI 체크리스트가 이미 생성되어 있습니다 ({existing}개). "
                    "기존 이벤트를 삭제한 뒤 다시 시도해주세요."
                ),
            )

    ai_service = AIService(request.app.state)
    result = await ai_service.generate_checklist(
        wedding_date, payload.budget_level
    )

    raw_events: list[dict] = result["events"]
    source: str = result["source"]

    if payload.dry_run:
        # DB 저장 없이 EventResponse 모양으로 바로 직렬화.
        # id/created_at/updated_at 은 의미 없는 placeholder (미저장 상태 표시).
        placeholder_events = [
            EventResponse.model_validate(
                {
                    "id": "",
                    "couple_id": couple.id,
                    "title": ev["title"],
                    "date": _date.fromisoformat(ev["date"]),
                    "category": ev["category"],
                    "memo": ev.get("memo"),
                    "is_completed": False,
                    "is_ai_generated": True,
                    "created_at": couple.created_at,
                    "updated_at": couple.created_at,
                }
            )
            for ev in raw_events
        ]
        return ChecklistResponse(source=source, events=placeholder_events)

    # DB 에 일괄 저장
    orm_events: list[Event] = []
    for ev in raw_events:
        orm = Event(
            couple_id=couple.id,
            title=ev["title"],
            date=_date.fromisoformat(ev["date"]),
            category=ev["category"],
            memo=ev.get("memo"),
            is_ai_generated=True,
        )
        db.add(orm)
        orm_events.append(orm)
    db.commit()
    for e in orm_events:
        db.refresh(e)

    logger.info(
        "AI checklist persisted count=%d source=%s couple=%s",
        len(orm_events),
        source,
        couple.id,
    )
    return ChecklistResponse(
        source=source,
        events=[EventResponse.model_validate(e) for e in orm_events],
    )


# -----------------------------------------------------------------------------
# POST /api/ai/caption (P3-R1-T6)
# -----------------------------------------------------------------------------
class CaptionRequest(BaseModel):
    event_id: str = Field(..., description="이벤트 ID (category/date 소스)")
    photo_id: str | None = Field(
        default=None,
        description="사진 ID (응답 에코백용, 선택)",
    )
    memo: str | None = Field(
        default=None,
        description="사용자 보조 메모 (이벤트 memo 를 덮어씀, 선택)",
    )


class CaptionResponse(BaseModel):
    source: str = Field(
        ..., description='"ai" 또는 "template"'
    )
    captions: list[str] = Field(..., description="캡션 3개")
    photo_id: str | None = Field(
        default=None,
        description="요청에서 전달된 photo_id 에코백",
    )


@router.post(
    "/caption",
    response_model=CaptionResponse,
    summary="AI 사진 캡션 3개 생성",
    description=(
        "이벤트 컨텍스트(category/date/memo) 기반으로 한국어 캡션 3개를 생성한다. "
        "OpenAI 키가 없거나 실패하면 카테고리별 사전 캡션으로 폴백."
    ),
)
async def generate_caption(
    payload: CaptionRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> CaptionResponse:
    event = db.get(Event, payload.event_id)
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event not found: {payload.event_id}",
        )

    # photo_id 가 주어졌다면 존재 검증 (에코백 이전에 유효성 확인).
    if payload.photo_id is not None:
        photo_service.get_or_404(db, payload.photo_id)

    memo = payload.memo if payload.memo is not None else event.memo

    ai_service = AIService(request.app.state)
    result = await ai_service.generate_captions(
        category=event.category,
        event_date=event.date,
        memo=memo,
    )

    return CaptionResponse(
        source=result["source"],
        captions=list(result["captions"]),
        photo_id=payload.photo_id,
    )
