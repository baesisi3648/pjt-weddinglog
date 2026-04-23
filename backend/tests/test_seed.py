# @TASK P1-R1-T5 - 더미 커플 시딩 테스트
# @SPEC docs/planning/05-architecture.md
"""
seed_initial_data 의 멱등성 및 기본 삽입 동작 검증.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.seed import seed_initial_data


def test_seed_creates_sample_couple_when_empty(db_session: Session) -> None:
    """빈 DB 상태에서 시드 호출 → 샘플 커플 1개 생성."""
    assert db_session.query(Couple).count() == 0

    seed_initial_data(db_session)

    couples = db_session.query(Couple).all()
    assert len(couples) == 1
    sample = couples[0]
    assert sample.id == "cpl_sample_001"
    assert sample.groom_name == "성우"
    assert sample.bride_name == "은비"


def test_seed_is_idempotent(db_session: Session) -> None:
    """이미 시드된 상태에서 재호출해도 중복 삽입되지 않는다."""
    seed_initial_data(db_session)
    first_count = db_session.query(Couple).count()

    seed_initial_data(db_session)
    second_count = db_session.query(Couple).count()

    assert first_count == 1
    assert second_count == 1
