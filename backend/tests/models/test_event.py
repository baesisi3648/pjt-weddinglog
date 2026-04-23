# @TASK P2-R1-T1 - Event 모델 + 스키마 단위 테스트
# @SPEC specs/domain/resources.yaml#events
# @SPEC docs/planning/05-architecture.md#데이터베이스-스키마
"""
Event SQLAlchemy 모델 및 Pydantic 스키마 단위 테스트.

- id 'evt_' 접두
- couple_id FK (ON DELETE CASCADE)
- category enum 9개 값 검증
- is_completed / is_ai_generated 기본값
- Pydantic EventCreate/Update/Response 동작
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

import pytest
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.models.event import Event
from app.schemas.enums import Category
from app.schemas.event import EventCreate, EventResponse, EventUpdate


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def _make_couple(db: Session, id_suffix: str = "evt_test") -> Couple:
    """테스트용 커플 1건 삽입 후 반환."""
    couple = Couple(
        id=f"cpl_{id_suffix}",
        groom_name="성우",
        bride_name="은비",
        wedding_date=date(2026, 10, 25),
    )
    db.add(couple)
    db.flush()
    return couple


# -----------------------------------------------------------------------------
# Event 모델
# -----------------------------------------------------------------------------
class TestEventModel:
    def test_id_auto_generates_with_evt_prefix(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "id_prefix")
        event = Event(
            couple_id=couple.id,
            title="예식장 투어",
            date=date(2026, 5, 1),
            category=Category.VENUE.value,
        )
        db_session.add(event)
        db_session.flush()

        assert event.id is not None
        assert event.id.startswith("evt_")
        assert len(event.id) > len("evt_")

    def test_ids_are_unique(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "unique")
        e1 = Event(
            couple_id=couple.id,
            title="일정1",
            date=date(2026, 5, 1),
            category=Category.VENUE.value,
        )
        e2 = Event(
            couple_id=couple.id,
            title="일정2",
            date=date(2026, 5, 2),
            category=Category.VENUE.value,
        )
        db_session.add_all([e1, e2])
        db_session.flush()
        assert e1.id != e2.id

    def test_defaults_is_completed_false(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "def_done")
        event = Event(
            couple_id=couple.id,
            title="일정",
            date=date(2026, 5, 1),
            category=Category.VENUE.value,
        )
        db_session.add(event)
        db_session.flush()
        assert event.is_completed is False
        assert event.is_ai_generated is False

    def test_created_and_updated_at(self, db_session: Session) -> None:
        before = datetime.utcnow() - timedelta(seconds=1)
        couple = _make_couple(db_session, "ts")
        event = Event(
            couple_id=couple.id,
            title="일정",
            date=date(2026, 5, 1),
            category=Category.VENUE.value,
        )
        db_session.add(event)
        db_session.flush()
        assert event.created_at is not None
        assert event.created_at >= before
        assert event.updated_at is not None

    def test_couple_relationship_back_populates(self, db_session: Session) -> None:
        """Couple.events, Event.couple 양방향 관계가 동작해야 한다."""
        couple = _make_couple(db_session, "rel")
        event = Event(
            couple_id=couple.id,
            title="일정",
            date=date(2026, 5, 1),
            category=Category.VENUE.value,
        )
        db_session.add(event)
        db_session.flush()
        db_session.refresh(couple)

        assert event.couple is not None
        assert event.couple.id == couple.id
        assert event in couple.events

    def test_cascade_delete_events_when_couple_deleted(
        self, db_session: Session
    ) -> None:
        """커플 삭제 시 속한 이벤트가 함께 삭제되어야 한다 (ORM cascade)."""
        couple = _make_couple(db_session, "cascade")
        event = Event(
            couple_id=couple.id,
            title="일정",
            date=date(2026, 5, 1),
            category=Category.VENUE.value,
        )
        db_session.add(event)
        db_session.flush()
        event_id = event.id

        # ORM cascade 를 트리거하려면 couple.events 컬렉션이 로드되어 있어야 한다.
        db_session.refresh(couple)
        _ = couple.events  # 컬렉션 로드 강제

        db_session.delete(couple)
        db_session.flush()

        assert db_session.get(Event, event_id) is None


# -----------------------------------------------------------------------------
# Pydantic — EventCreate
# -----------------------------------------------------------------------------
class TestEventCreateSchema:
    def test_valid_payload(self) -> None:
        payload = EventCreate(
            title="예식장 투어",
            date=date(2026, 5, 1),
            category=Category.VENUE.value,
            memo="3군데 비교",
        )
        assert payload.title == "예식장 투어"
        assert payload.category == Category.VENUE.value

    def test_invalid_category_rejected(self) -> None:
        """9개 enum 값 외 카테고리는 거부."""
        with pytest.raises(ValidationError):
            EventCreate(
                title="t",
                date=date(2026, 5, 1),
                category="INVALID_CATEGORY",
            )

    def test_title_required(self) -> None:
        with pytest.raises(ValidationError):
            EventCreate(  # type: ignore[call-arg]
                date=date(2026, 5, 1),
                category=Category.VENUE.value,
            )

    def test_memo_optional(self) -> None:
        payload = EventCreate(
            title="t",
            date=date(2026, 5, 1),
            category=Category.VENUE.value,
        )
        assert payload.memo is None

    def test_all_categories_accepted(self) -> None:
        """Category enum 9개 값 모두 허용."""
        for cat in Category:
            EventCreate(
                title="t",
                date=date(2026, 5, 1),
                category=cat.value,
            )


# -----------------------------------------------------------------------------
# Pydantic — EventUpdate
# -----------------------------------------------------------------------------
class TestEventUpdateSchema:
    def test_all_fields_optional(self) -> None:
        update = EventUpdate()
        assert update.title is None
        assert update.category is None

    def test_partial_update_title(self) -> None:
        update = EventUpdate(title="새 제목")
        assert update.title == "새 제목"
        assert update.date is None

    def test_update_rejects_invalid_category(self) -> None:
        with pytest.raises(ValidationError):
            EventUpdate(category="BAD")


# -----------------------------------------------------------------------------
# Pydantic — EventResponse
# -----------------------------------------------------------------------------
class TestEventResponseSchema:
    def test_response_from_attributes(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "resp")
        event = Event(
            couple_id=couple.id,
            title="예식장 투어",
            date=date(2026, 5, 1),
            category=Category.VENUE.value,
            memo="3군데",
        )
        db_session.add(event)
        db_session.flush()

        resp = EventResponse.model_validate(event)
        assert resp.id == event.id
        assert resp.couple_id == couple.id
        assert resp.title == "예식장 투어"
        assert resp.category == Category.VENUE.value
        assert resp.is_completed is False
        assert resp.is_ai_generated is False
        assert resp.created_at is not None
