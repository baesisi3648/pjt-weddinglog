# @TASK P4-R1-T2 - Timeline 라우터
# @SPEC docs/planning/05-architecture.md#api-엔드포인트
# @SPEC specs/screens/04_timeline.yaml
# @TEST tests/routers/test_timeline.py
"""
GET /api/couples/{couple_id}/timeline 엔드포인트.

쿼리 파라미터:
- only_selected (bool, default=False): True 면 is_selected=True 인 사진만 반환.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.timeline import TimelineResponse
from app.services import couple_service, timeline_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/couples/{couple_id}/timeline", tags=["timeline"])


@router.get(
    "",
    response_model=TimelineResponse,
    summary="Timeline 조회 (챕터별 사진 그룹)",
    description=(
        "커플의 모든 사진을 카테고리 기반 5개 챕터(웨딩촬영 / 준비의 날들 / "
        "본식 / 신혼여행 / 기타)로 그룹핑하여 반환한다. "
        "사진이 없는 챕터는 응답에서 제외된다. "
        "`only_selected=true` 로 요청하면 is_selected=True 인 사진만 `photos` "
        "리스트에 포함된다 (집계 수치는 전체 기준)."
    ),
)
def get_timeline(
    couple_id: str,
    only_selected: bool = Query(
        default=False,
        description="선택된 사진만 photos 배열에 포함할지 여부",
    ),
    db: Session = Depends(get_db),
) -> TimelineResponse:
    """Timeline 데이터 조회."""
    # couple 존재 검증 → 404
    couple_service.get_or_404(db, couple_id)

    payload = timeline_service.get_timeline(
        db, couple_id, only_selected=only_selected
    )
    return TimelineResponse.model_validate(payload)
