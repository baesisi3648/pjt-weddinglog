# @TASK P3-R1-T2 - Photo 비즈니스 로직 서비스
# @SPEC specs/domain/resources.yaml#photos
# @TEST tests/services/test_photo_service.py
"""
Photo 리소스 CRUD + 파일 저장 / 삭제 / 캡션 / 선택 토글.

- 순수 함수 스타일 (모듈 레벨).
- 파일 저장은 file_validator + file_storage 유틸에 위임.
- 일정당 최대 10장 제약 (MAX_PHOTOS_PER_EVENT).
"""
from __future__ import annotations

import logging

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.event import Event
from app.models.photo import Photo
from app.utils.file_storage import (
    delete_photo_file,
    safe_save_photo,
)
from app.utils.file_validator import validate_photo

logger = logging.getLogger(__name__)


MAX_PHOTOS_PER_EVENT: int = 10


# -----------------------------------------------------------------------------
# Read helpers
# -----------------------------------------------------------------------------
def get_by_id(db: Session, photo_id: str) -> Photo | None:
    return db.get(Photo, photo_id)


def get_or_404(db: Session, photo_id: str) -> Photo:
    photo = get_by_id(db, photo_id)
    if photo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Photo not found: {photo_id}",
        )
    return photo


def list_by_event(db: Session, event_id: str) -> list[Photo]:
    """특정 이벤트의 사진 목록 (sort_order ASC, created_at ASC)."""
    stmt = (
        select(Photo)
        .where(Photo.event_id == event_id)
        .order_by(Photo.sort_order.asc(), Photo.created_at.asc())
    )
    return list(db.execute(stmt).scalars().all())


def count_by_event(db: Session, event_id: str) -> int:
    return len(list_by_event(db, event_id))


# -----------------------------------------------------------------------------
# Upload
# -----------------------------------------------------------------------------
async def upload(
    db: Session,
    event_id: str,
    file: UploadFile,
) -> Photo:
    """사진을 업로드한다.

    1. 이벤트 존재 확인.
    2. 일정당 최대 10장 초과 차단.
    3. 파일 매직넘버/크기/타입 검증 (file_validator).
    4. Photo row 선삽입 → id 로 저장 경로 확정 (Path Traversal 방어).
    5. 실제 파일 저장 후 file_path 업데이트.

    Raises:
        HTTPException(404): 이벤트 없음.
        HTTPException(400): 검증 실패 또는 10장 초과.
    """
    # 1) Event 존재
    event = db.get(Event, event_id)
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event not found: {event_id}",
        )

    # 2) 10장 초과 차단
    current_count = count_by_event(db, event_id)
    if current_count >= MAX_PHOTOS_PER_EVENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Max {MAX_PHOTOS_PER_EVENT} photos per event "
                f"(current={current_count})"
            ),
        )

    # 3) 파일 검증
    try:
        content, ext = await validate_photo(file)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    # 4) Photo 선삽입 (id 생성 목적, file_path 는 임시 placeholder)
    photo = Photo(
        event_id=event_id,
        file_path="pending",
        original_filename=(file.filename or None),
    )
    db.add(photo)
    db.flush()  # photo.id 채움

    # 5) 파일 저장
    try:
        rel_path = safe_save_photo(
            content=content,
            event_id=event_id,
            photo_id=photo.id,
            ext=ext,
        )
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    photo.file_path = rel_path
    db.commit()
    db.refresh(photo)
    logger.info(
        "Uploaded photo id=%s event=%s path=%s",
        photo.id,
        event_id,
        rel_path,
    )
    return photo


# -----------------------------------------------------------------------------
# Delete
# -----------------------------------------------------------------------------
def delete(db: Session, photo_id: str) -> None:
    """사진을 삭제한다 (DB + 파일).

    파일이 이미 없어도 DB 는 삭제 — 경고 로그만 남김 (idempotent).
    """
    photo = get_or_404(db, photo_id)
    stored_path = photo.file_path
    db.delete(photo)
    db.commit()

    if not delete_photo_file(stored_path):
        logger.warning(
            "delete: file missing for deleted photo id=%s path=%s",
            photo_id,
            stored_path,
        )
    logger.info("Deleted photo id=%s", photo_id)


# -----------------------------------------------------------------------------
# Caption
# -----------------------------------------------------------------------------
def update_caption(
    db: Session,
    photo_id: str,
    caption: str,
    source: str = "manual",
) -> Photo:
    """캡션을 업데이트한다.

    Args:
        caption: 새 캡션 (빈 문자열 허용).
        source: "ai" | "template" | "manual".
    """
    photo = get_or_404(db, photo_id)
    photo.caption = caption
    photo.caption_source = source
    db.commit()
    db.refresh(photo)
    logger.info(
        "Updated caption photo=%s source=%s len=%d",
        photo_id,
        source,
        len(caption or ""),
    )
    return photo


# -----------------------------------------------------------------------------
# Selection toggle (Timeline 용 — Phase 4 에서 본격 사용)
# -----------------------------------------------------------------------------
def toggle_selection(db: Session, photo_id: str) -> Photo:
    """is_selected 를 토글한다."""
    photo = get_or_404(db, photo_id)
    photo.is_selected = not photo.is_selected
    db.commit()
    db.refresh(photo)
    logger.info(
        "Toggled selection photo=%s is_selected=%s",
        photo_id,
        photo.is_selected,
    )
    return photo
