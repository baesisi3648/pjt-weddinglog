# @TASK P5-BACKEND - AI 앨범 구성 라우터
# @SPEC docs/planning/05-architecture.md#ai-폴백-전략
# @TEST tests/routers/test_album.py
"""
POST /api/couples/{couple_id}/album/compose.

body:   { selected_photo_ids: list[str] }
기능:   선택된 사진들에 대해 AI (OpenAI) 또는 규칙 기반 폴백으로
        앨범 레이아웃을 생성한다.

검증:
    - selected_photo_ids 비었으면 400 (Pydantic min_length=1 이 먼저 막음).
    - photo_id 가 DB 에 존재하는지 검증.
    - 선택된 사진이 해당 couple 소속인지 검증 (다른 커플의 사진이 섞이면 400).
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.event import Event
from app.models.photo import Photo
from app.schemas.album import AlbumComposeRequest, AlbumComposeResponse
from app.services import couple_service
from app.services.album_composer_service import AlbumComposerService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/couples/{couple_id}/album", tags=["album"])


@router.post(
    "/compose",
    response_model=AlbumComposeResponse,
    summary="AI 앨범 자동 구성",
    description=(
        "선택된 사진들로 앨범 레이아웃을 생성한다. "
        "OpenAI 키가 있으면 AI 호출, 없거나 실패 시 카테고리 기반 규칙 폴백. "
        "Rate limit: 5회/분 (IP 기준 — RateLimitMiddleware, 60초 걸리는 무거운 호출)."
    ),
)
async def compose_album(
    couple_id: str,
    payload: AlbumComposeRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> AlbumComposeResponse:
    """앨범 레이아웃 생성."""
    couple_service.get_or_404(db, couple_id)

    # photo_id 유효성 검증 + couple 소속 확인.
    stmt = (
        select(Photo)
        .where(Photo.id.in_(payload.selected_photo_ids))
        .options(selectinload(Photo.event))
    )
    photos = list(db.execute(stmt).scalars().all())

    # 1) 존재 검증
    found_ids = {p.id for p in photos}
    missing = [pid for pid in payload.selected_photo_ids if pid not in found_ids]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown photo_ids: {missing}",
        )

    # 2) 소속 검증 — 다른 커플의 사진이 섞이면 거부.
    # event → couple_id 매핑을 위해 event 쿼리.
    event_ids = {p.event_id for p in photos}
    ev_stmt = select(Event.id, Event.couple_id).where(Event.id.in_(event_ids))
    couple_map = {eid: cid for eid, cid in db.execute(ev_stmt).all()}
    foreign = [
        p.id
        for p in photos
        if couple_map.get(p.event_id) != couple_id
    ]
    if foreign:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Photos do not belong to couple {couple_id}: {foreign}"
            ),
        )

    # 3) 요청 순서 유지 — selected_photo_ids 순서대로 레이아웃 생성.
    photo_by_id = {p.id: p for p in photos}
    ordered = [
        photo_by_id[pid]
        for pid in payload.selected_photo_ids
        if pid in photo_by_id
    ]

    composer = AlbumComposerService(request.app.state)
    layout = await composer.compose(ordered)

    logger.info(
        "Album composed for couple=%s photos=%d source=%s pages=%d",
        couple_id,
        layout.total_photos,
        layout.generated_by,
        layout.total_pages,
    )

    return AlbumComposeResponse(
        album_layout=layout,
        source=layout.generated_by,
    )
