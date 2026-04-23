# @TASK P4-R1-T4 - Home 집계 라우터
# @SPEC specs/screens/01_home.yaml
# @SPEC docs/planning/06-tasks.md#p4-r1-t4-home-라우터-확인
# @TEST tests/routers/test_home.py
"""
GET /api/couples/{couple_id}/home 엔드포인트.

보조 엔드포인트:
- GET /api/couples/{couple_id}/photos/recent?limit=N  — 최근 사진 리스트
  (Home 이외의 컨텍스트에서도 재사용 가능하도록 별도 노출.)
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.home import HomeSummary
from app.schemas.photo import PhotoResponse
from app.services import couple_service, home_service, photo_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/couples/{couple_id}", tags=["home"])


@router.get(
    "/home",
    response_model=HomeSummary,
    summary="Home 화면 집계 데이터",
    description=(
        "Home 화면 렌더링에 필요한 모든 데이터를 한 번의 요청으로 반환한다. "
        "upcoming_events(≤3) · recent_photos(≤6) · photo_counts · "
        "album_order_deadline(Council B3 타이밍 UX) 포함."
    ),
)
def get_home(
    couple_id: str,
    db: Session = Depends(get_db),
) -> HomeSummary:
    couple_service.get_or_404(db, couple_id)
    payload = home_service.get_home_summary(db, couple_id)
    return HomeSummary.model_validate(payload)


@router.get(
    "/photos/recent",
    response_model=list[PhotoResponse],
    summary="커플의 최근 사진 목록",
    description=(
        "커플의 모든 이벤트를 아우르는 최근 사진을 created_at DESC 로 반환한다. "
        "Home 뿐 아니라 타 위젯에서도 재사용 가능."
    ),
)
def list_recent_photos(
    couple_id: str,
    limit: int = Query(default=6, ge=1, le=50, description="최대 반환 개수"),
    db: Session = Depends(get_db),
) -> list[PhotoResponse]:
    couple_service.get_or_404(db, couple_id)
    photos = photo_service.list_recent_by_couple(db, couple_id, limit=limit)
    return [PhotoResponse.model_validate(p) for p in photos]
