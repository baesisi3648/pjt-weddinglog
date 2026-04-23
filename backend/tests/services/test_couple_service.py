# @TASK P1-R1-T2 - CoupleService 단위 테스트
# @TASK P1-R1-T4 - d_day 계산 유닛 통합
"""
CoupleService CRUD 및 d_day 계산 단위 테스트.
"""
from __future__ import annotations

from datetime import date

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.schemas.couple import CoupleCreate, CoupleUpdate
from app.services import couple_service


class TestCoupleServiceCreate:
    def test_create_couple(self, db_session: Session) -> None:
        payload = CoupleCreate(
            groom_name="철수",
            bride_name="영희",
            wedding_date=date(2026, 10, 25),
            tagline="철수 ♥ 영희",
        )
        couple = couple_service.create(db_session, payload)

        assert couple.id.startswith("cpl_")
        assert couple.groom_name == "철수"
        assert couple.bride_name == "영희"
        assert couple.wedding_date == date(2026, 10, 25)
        assert couple.tagline == "철수 ♥ 영희"


class TestCoupleServiceGet:
    def test_get_by_id_found(self, db_session: Session) -> None:
        payload = CoupleCreate(
            groom_name="철수", bride_name="영희", wedding_date=date(2026, 10, 25)
        )
        created = couple_service.create(db_session, payload)

        fetched = couple_service.get_by_id(db_session, created.id)
        assert fetched is not None
        assert fetched.id == created.id

    def test_get_by_id_not_found(self, db_session: Session) -> None:
        assert couple_service.get_by_id(db_session, "cpl_nonexistent") is None

    def test_get_or_404_raises(self, db_session: Session) -> None:
        with pytest.raises(HTTPException) as exc_info:
            couple_service.get_or_404(db_session, "cpl_nonexistent")
        assert exc_info.value.status_code == 404


class TestCoupleServiceUpdate:
    def test_update_partial(self, db_session: Session) -> None:
        payload = CoupleCreate(
            groom_name="철수", bride_name="영희", wedding_date=date(2026, 10, 25)
        )
        created = couple_service.create(db_session, payload)

        update = CoupleUpdate(tagline="새 태그라인")
        updated = couple_service.update(db_session, created.id, update)

        assert updated.tagline == "새 태그라인"
        assert updated.groom_name == "철수"  # 변경 없음

    def test_update_not_found_raises_404(self, db_session: Session) -> None:
        with pytest.raises(HTTPException) as exc_info:
            couple_service.update(
                db_session, "cpl_nonexistent", CoupleUpdate(tagline="x")
            )
        assert exc_info.value.status_code == 404


class TestCoupleServiceDDay:
    """d_day 파생 계산 (P1-R1-T4 요구사항)."""

    def test_d_day_future_wedding(self) -> None:
        today = date(2026, 1, 1)
        wedding = date(2026, 1, 31)
        assert couple_service.compute_d_day(wedding, today) == -30

    def test_d_day_past_wedding(self) -> None:
        today = date(2026, 1, 15)
        wedding = date(2026, 1, 1)
        assert couple_service.compute_d_day(wedding, today) == 14

    def test_d_day_today(self) -> None:
        today = date(2026, 10, 25)
        wedding = date(2026, 10, 25)
        assert couple_service.compute_d_day(wedding, today) == 0
