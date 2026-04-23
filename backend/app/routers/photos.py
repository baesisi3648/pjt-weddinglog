# @TASK P3-R1-T4 - Photo REST API 라우터 (multipart + 서빙)
# @SPEC docs/planning/05-architecture.md#api-엔드포인트
# @SPEC docs/planning/council-report.md#B7
# @TEST tests/routers/test_photos.py
"""
/api/events/{event_id}/photos + /api/photos/{photo_id}/* 엔드포인트.

라우트 구성 (2개 prefix):
- POST /api/events/{event_id}/photos (multipart/form-data)
- GET  /api/events/{event_id}/photos (목록)
- DELETE /api/photos/{photo_id}
- PUT /api/photos/{photo_id}/caption
- PATCH /api/photos/{photo_id}/selection
- GET /api/photos/{photo_id}/file  (FileResponse 래퍼 — Council B7)

StaticFiles mount 는 의도적으로 사용하지 않는다:
- 래퍼 엔드포인트는 향후 인가/rate-limit 확장 지점을 제공한다.
- 파일 서빙 경로도 photo_id(unguessable UUID) 기반이라 단독 노출 시 추측 불가.
"""
from __future__ import annotations

import logging

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.photo import PhotoCaptionUpdate, PhotoResponse
from app.services import photo_service
from app.utils.file_storage import (
    PathTraversalError,
    resolve_photo_abs_path,
)

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# /api/events/{event_id}/photos — 업로드 + 목록
# -----------------------------------------------------------------------------
events_router = APIRouter(
    prefix="/api/events/{event_id}/photos",
    tags=["photos"],
)


@events_router.post(
    "",
    response_model=PhotoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="사진 업로드 (multipart)",
    description=(
        "multipart/form-data 로 사진 1장을 업로드한다. "
        "MIME spoofing 방어를 위해 실제 바이트 헤더까지 검증한다. "
        "일정당 최대 10장."
    ),
)
async def upload_photo(
    event_id: str,
    file: UploadFile = File(..., description="image/jpeg 또는 image/png, 5MB 이하"),
    db: Session = Depends(get_db),
) -> PhotoResponse:
    photo = await photo_service.upload(db, event_id, file)
    return PhotoResponse.model_validate(photo)


@events_router.get(
    "",
    response_model=list[PhotoResponse],
    summary="이벤트별 사진 목록",
)
def list_photos(
    event_id: str,
    db: Session = Depends(get_db),
) -> list[PhotoResponse]:
    photos = photo_service.list_by_event(db, event_id)
    return [PhotoResponse.model_validate(p) for p in photos]


# -----------------------------------------------------------------------------
# /api/photos/{photo_id}/* — 단건 작업 + 파일 서빙
# -----------------------------------------------------------------------------
photo_router = APIRouter(prefix="/api/photos", tags=["photos"])


@photo_router.delete(
    "/{photo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="사진 삭제",
)
def delete_photo(
    photo_id: str,
    db: Session = Depends(get_db),
) -> Response:
    photo_service.delete(db, photo_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@photo_router.put(
    "/{photo_id}/caption",
    response_model=PhotoResponse,
    summary="사진 캡션 업데이트",
)
def update_photo_caption(
    photo_id: str,
    payload: PhotoCaptionUpdate,
    db: Session = Depends(get_db),
) -> PhotoResponse:
    photo = photo_service.update_caption(
        db,
        photo_id,
        caption=payload.caption,
        source=payload.caption_source or "manual",
    )
    return PhotoResponse.model_validate(photo)


@photo_router.patch(
    "/{photo_id}/selection",
    response_model=PhotoResponse,
    summary="사진 is_selected 토글 (Timeline 용)",
)
def toggle_photo_selection(
    photo_id: str,
    db: Session = Depends(get_db),
) -> PhotoResponse:
    photo = photo_service.toggle_selection(db, photo_id)
    return PhotoResponse.model_validate(photo)


@photo_router.get(
    "/{photo_id}/file",
    summary="사진 파일 서빙 (FileResponse 래퍼)",
    description=(
        "DB 에 저장된 file_path 를 기준으로 디스크에서 파일을 스트리밍한다. "
        "StaticFiles mount 대신 이 엔드포인트를 경유하여 향후 인가/로깅 확장 여지를 둔다."
    ),
)
def serve_photo_file(
    photo_id: str,
    db: Session = Depends(get_db),
) -> FileResponse:
    photo = photo_service.get_or_404(db, photo_id)

    try:
        abs_path = resolve_photo_abs_path(photo.file_path)
    except PathTraversalError as exc:
        logger.error(
            "serve_photo_file: traversal detected id=%s path=%s",
            photo_id,
            photo.file_path,
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo file not available",
        ) from exc

    if not abs_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Photo file missing on disk: {photo_id}",
        )

    # media_type 결정 — 확장자 기반 (저장 시 실제 포맷으로 검증된 ext 만 들어옴)
    ext = abs_path.suffix.lower().lstrip(".")
    media_type = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
    }.get(ext, "application/octet-stream")

    return FileResponse(
        path=abs_path,
        media_type=media_type,
        filename=f"{photo_id}.{ext}",
    )
