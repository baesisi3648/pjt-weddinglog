# @TASK P1-R1-T1 - Couple 모델 + 스키마 단위 테스트
# @SPEC docs/planning/05-architecture.md#데이터베이스-스키마
# @SPEC specs/domain/resources.yaml#couples
"""
Couple SQLAlchemy 모델 및 Pydantic 스키마 단위 테스트.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

import pytest
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.schemas.couple import CoupleCreate, CoupleResponse, CoupleUpdate


class TestCoupleModel:
    def test_id_auto_generates_with_cpl_prefix(self, db_session: Session) -> None:
        """id 는 'cpl_' 접두 + 랜덤 토큰으로 자동 생성된다."""
        couple = Couple(
            groom_name="철수",
            bride_name="영희",
            wedding_date=date(2026, 10, 25),
        )
        db_session.add(couple)
        db_session.flush()

        assert couple.id is not None
        assert couple.id.startswith("cpl_")
        assert len(couple.id) > len("cpl_")

    def test_ids_are_unique(self, db_session: Session) -> None:
        """자동 생성되는 id 는 인스턴스마다 달라야 한다."""
        c1 = Couple(
            groom_name="철수", bride_name="영희", wedding_date=date(2026, 10, 25)
        )
        c2 = Couple(
            groom_name="철수", bride_name="영희", wedding_date=date(2026, 11, 11)
        )
        db_session.add_all([c1, c2])
        db_session.flush()

        assert c1.id != c2.id

    def test_created_at_default(self, db_session: Session) -> None:
        """created_at 은 기본값으로 현재 시각이 들어간다."""
        before = datetime.utcnow() - timedelta(seconds=1)
        couple = Couple(
            groom_name="철수",
            bride_name="영희",
            wedding_date=date(2026, 10, 25),
        )
        db_session.add(couple)
        db_session.flush()

        assert couple.created_at is not None
        assert couple.created_at >= before

    def test_optional_fields_default_none(self, db_session: Session) -> None:
        """profile_photo_path, tagline 은 기본 None."""
        couple = Couple(
            groom_name="철수",
            bride_name="영희",
            wedding_date=date(2026, 10, 25),
        )
        db_session.add(couple)
        db_session.flush()

        assert couple.profile_photo_path is None
        assert couple.tagline is None


class TestCoupleCreateSchema:
    def test_valid_payload(self) -> None:
        payload = CoupleCreate(
            groom_name="철수",
            bride_name="영희",
            wedding_date=date(2026, 10, 25),
            tagline="사랑해",
        )
        assert payload.groom_name == "철수"
        assert payload.bride_name == "영희"
        assert payload.tagline == "사랑해"

    def test_groom_name_min_length_rejected(self) -> None:
        """groom_name 1자 이하는 거부되어야 한다."""
        with pytest.raises(ValidationError):
            CoupleCreate(
                groom_name="성",
                bride_name="영희",
                wedding_date=date(2026, 10, 25),
            )

    def test_bride_name_min_length_rejected(self) -> None:
        """bride_name 1자 이하는 거부되어야 한다."""
        with pytest.raises(ValidationError):
            CoupleCreate(
                groom_name="철수",
                bride_name="은",
                wedding_date=date(2026, 10, 25),
            )

    def test_empty_names_rejected(self) -> None:
        with pytest.raises(ValidationError):
            CoupleCreate(
                groom_name="",
                bride_name="영희",
                wedding_date=date(2026, 10, 25),
            )


class TestCoupleUpdateSchema:
    def test_all_fields_optional(self) -> None:
        """CoupleUpdate 는 모든 필드가 optional."""
        update = CoupleUpdate()
        assert update.groom_name is None
        assert update.tagline is None

    def test_partial_update_allowed(self) -> None:
        update = CoupleUpdate(tagline="새 태그라인")
        assert update.tagline == "새 태그라인"
        assert update.groom_name is None

    def test_update_respects_min_length(self) -> None:
        """업데이트 입력도 min_length=2 를 준수해야 한다."""
        with pytest.raises(ValidationError):
            CoupleUpdate(groom_name="성")


class TestCoupleResponseSchema:
    def test_response_from_attributes(self, db_session: Session) -> None:
        """ORM 객체에서 from_attributes 로 생성 가능해야 한다."""
        couple = Couple(
            groom_name="철수",
            bride_name="영희",
            wedding_date=date(2026, 10, 25),
            tagline="철수 ♥ 영희",
        )
        db_session.add(couple)
        db_session.flush()

        response = CoupleResponse.model_validate(couple)
        assert response.id == couple.id
        assert response.groom_name == "철수"
        assert response.wedding_date == date(2026, 10, 25)
        assert response.created_at is not None

    def test_response_contains_d_day_field(self, db_session: Session) -> None:
        """응답 스키마에 d_day 필드가 있어야 한다 (derived)."""
        couple = Couple(
            groom_name="철수",
            bride_name="영희",
            wedding_date=date(2026, 10, 25),
        )
        db_session.add(couple)
        db_session.flush()

        response = CoupleResponse.model_validate(couple)
        # 필드 자체가 응답에 존재해야 함 (값은 computed)
        assert "d_day" in response.model_dump()
        assert isinstance(response.d_day, int)
