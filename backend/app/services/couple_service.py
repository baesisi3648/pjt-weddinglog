# @TASK P1-R1-T2 - Couple 비즈니스 로직 서비스
# @SPEC docs/planning/05-architecture.md
# @TEST tests/services/test_couple_service.py
"""
Couple 리소스 CRUD 비즈니스 로직.

- 순수 함수 스타일 (모듈 레벨 함수) — 상태 없음, 테스트 용이.
- d_day 계산은 `app.utils.date_utils.compute_d_day` 재노출.
- HTTPException(404) 는 라우터 경계에서만 발생 (FastAPI 의존성).
"""
from __future__ import annotations

import logging
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.schemas.couple import CoupleCreate, CoupleUpdate
from app.utils.date_utils import compute_d_day as _compute_d_day

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Read
# -----------------------------------------------------------------------------
def get_by_id(db: Session, couple_id: str) -> Couple | None:
    """couple_id 로 조회. 없으면 None."""
    return db.get(Couple, couple_id)


def get_or_404(db: Session, couple_id: str) -> Couple:
    """couple_id 로 조회. 없으면 HTTPException(404)."""
    couple = get_by_id(db, couple_id)
    if couple is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Couple not found: {couple_id}",
        )
    return couple


# -----------------------------------------------------------------------------
# Create
# -----------------------------------------------------------------------------
def create(db: Session, couple_in: CoupleCreate) -> Couple:
    """새 커플을 생성한다. id 는 모델 default 로 자동 생성."""
    couple = Couple(
        groom_name=couple_in.groom_name,
        bride_name=couple_in.bride_name,
        wedding_date=couple_in.wedding_date,
        profile_photo_path=couple_in.profile_photo_path,
        tagline=couple_in.tagline,
    )
    db.add(couple)
    db.commit()
    db.refresh(couple)
    logger.info("Created couple id=%s", couple.id)
    return couple


# -----------------------------------------------------------------------------
# Update
# -----------------------------------------------------------------------------
def update(db: Session, couple_id: str, couple_update: CoupleUpdate) -> Couple:
    """부분 업데이트. None 필드는 건드리지 않는다.

    Raises:
        HTTPException(404): couple_id 가 존재하지 않을 때.
    """
    couple = get_or_404(db, couple_id)

    # Pydantic v2: exclude_unset=True 는 기본값도 제외 → None 이 의도된 값이면 포함되지 않음.
    # 여기서는 명시적으로 전달된 값만 반영하고자 exclude_unset 을 사용한다.
    changes = couple_update.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(couple, field, value)

    db.commit()
    db.refresh(couple)
    logger.info("Updated couple id=%s fields=%s", couple.id, list(changes.keys()))
    return couple


# -----------------------------------------------------------------------------
# Derived — d_day
# -----------------------------------------------------------------------------
def compute_d_day(wedding_date: date, today: date | None = None) -> int:
    """wedding_date 기준 D-day (pure function 재노출).

    단순 재노출이지만, 서비스 레이어 테스트에서 `couple_service.compute_d_day`
    경로로 접근하는 것을 허용하기 위해 둔다.
    """
    return _compute_d_day(wedding_date, today)
