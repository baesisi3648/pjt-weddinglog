# @TASK P1-R1-T3 - Couple REST API 라우터
# @SPEC docs/planning/05-architecture.md#api-엔드포인트
# @TEST tests/routers/test_couples.py
"""
/api/couples/* 엔드포인트.

- GET /{couple_id} — 조회 (d_day 포함)
- PUT /{couple_id} — 부분 업데이트
- POST /         — 생성 (시딩/테스트용)
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.couple import CoupleCreate, CoupleResponse, CoupleUpdate
from app.services import couple_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/couples", tags=["couples"])


@router.post(
    "/",
    response_model=CoupleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="커플 생성",
)
def create_couple(
    payload: CoupleCreate,
    db: Session = Depends(get_db),
) -> CoupleResponse:
    """새 커플 프로필을 생성한다."""
    couple = couple_service.create(db, payload)
    return CoupleResponse.model_validate(couple)


@router.get(
    "/{couple_id}",
    response_model=CoupleResponse,
    summary="커플 조회",
)
def get_couple(
    couple_id: str,
    db: Session = Depends(get_db),
) -> CoupleResponse:
    """couple_id 로 커플 프로필을 조회한다.

    404: 존재하지 않는 id.
    """
    couple = couple_service.get_or_404(db, couple_id)
    return CoupleResponse.model_validate(couple)


@router.put(
    "/{couple_id}",
    response_model=CoupleResponse,
    summary="커플 부분 업데이트",
)
def update_couple(
    couple_id: str,
    payload: CoupleUpdate,
    db: Session = Depends(get_db),
) -> CoupleResponse:
    """전달된 필드만 수정한다 (None 값은 '변경 안 함')."""
    couple = couple_service.update(db, couple_id, payload)
    return CoupleResponse.model_validate(couple)
