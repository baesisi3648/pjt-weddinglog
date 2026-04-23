# @TASK P2-R1-T2 - EventService 단위 테스트
# @SPEC specs/domain/resources.yaml#events
"""
EventService CRUD + 월별 필터 + toggle_complete 테스트.

핵심 시나리오:
- 월별 필터링: 2026-08 필터 시 2026-08-01~31 이벤트만 (2026-07/09 제외)
- 카테고리 필터링
- is_completed 필터링
- toggle_complete 동작
- 다른 커플의 이벤트는 조회되지 않음
- get_or_404 는 couple_id 소속 여부까지 검증
"""
from __future__ import annotations

from datetime import date

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.schemas.enums import Category
from app.schemas.event import EventCreate, EventUpdate
from app.services import event_service


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def _make_couple(db: Session, cid: str) -> Couple:
    couple = Couple(
        id=cid,
        groom_name="성우",
        bride_name="은비",
        wedding_date=date(2026, 10, 25),
    )
    db.add(couple)
    db.flush()
    return couple


def _create(
    db: Session,
    couple_id: str,
    *,
    title: str = "t",
    d: date = date(2026, 8, 15),
    category: str = Category.VENUE.value,
    memo: str | None = None,
) -> object:
    payload = EventCreate(title=title, date=d, category=category, memo=memo)
    return event_service.create(db, couple_id, payload)


# -----------------------------------------------------------------------------
# Create
# -----------------------------------------------------------------------------
class TestCreate:
    def test_create_event(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_s_create")
        event = _create(db_session, couple.id, title="예식장 투어")
        assert event.id.startswith("evt_")
        assert event.couple_id == couple.id
        assert event.title == "예식장 투어"
        assert event.is_completed is False
        assert event.is_ai_generated is False


# -----------------------------------------------------------------------------
# List + filters
# -----------------------------------------------------------------------------
class TestListByCouple:
    def test_filter_by_month(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_s_month")
        _create(db_session, couple.id, d=date(2026, 7, 31), title="7월말")
        _create(db_session, couple.id, d=date(2026, 8, 1), title="8월1일")
        _create(db_session, couple.id, d=date(2026, 8, 15), title="8월중간")
        _create(db_session, couple.id, d=date(2026, 8, 31), title="8월말")
        _create(db_session, couple.id, d=date(2026, 9, 1), title="9월1일")

        results = event_service.list_by_couple(
            db_session, couple.id, month="2026-08"
        )
        titles = {e.title for e in results}
        assert titles == {"8월1일", "8월중간", "8월말"}

    def test_filter_february_leap_year(self, db_session: Session) -> None:
        """윤년 2월 (2028) 29일까지 포함."""
        couple = _make_couple(db_session, "cpl_s_leap")
        _create(db_session, couple.id, d=date(2028, 2, 29), title="윤일")
        _create(db_session, couple.id, d=date(2028, 3, 1), title="3월")

        results = event_service.list_by_couple(
            db_session, couple.id, month="2028-02"
        )
        assert {e.title for e in results} == {"윤일"}

    def test_filter_by_category(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_s_cat")
        _create(db_session, couple.id, category=Category.VENUE.value, title="V")
        _create(db_session, couple.id, category=Category.GIFT.value, title="G")
        _create(db_session, couple.id, category=Category.VENUE.value, title="V2")

        venue_events = event_service.list_by_couple(
            db_session, couple.id, category=Category.VENUE.value
        )
        assert {e.title for e in venue_events} == {"V", "V2"}

    def test_filter_by_completion(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_s_done")
        e1 = _create(db_session, couple.id, title="t1")
        e2 = _create(db_session, couple.id, title="t2")
        event_service.toggle_complete(db_session, couple.id, e1.id)

        done = event_service.list_by_couple(
            db_session, couple.id, is_completed=True
        )
        assert [e.id for e in done] == [e1.id]

        not_done = event_service.list_by_couple(
            db_session, couple.id, is_completed=False
        )
        assert [e.id for e in not_done] == [e2.id]

    def test_combined_filters(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_s_comb")
        _create(
            db_session,
            couple.id,
            d=date(2026, 8, 1),
            category=Category.VENUE.value,
            title="V-aug",
        )
        _create(
            db_session,
            couple.id,
            d=date(2026, 8, 10),
            category=Category.GIFT.value,
            title="G-aug",
        )
        _create(
            db_session,
            couple.id,
            d=date(2026, 7, 15),
            category=Category.VENUE.value,
            title="V-jul",
        )

        results = event_service.list_by_couple(
            db_session,
            couple.id,
            month="2026-08",
            category=Category.VENUE.value,
        )
        assert [e.title for e in results] == ["V-aug"]

    def test_other_couple_events_excluded(self, db_session: Session) -> None:
        """다른 커플의 이벤트는 조회되지 않아야 한다."""
        c1 = _make_couple(db_session, "cpl_s_iso1")
        c2 = _make_couple(db_session, "cpl_s_iso2")
        _create(db_session, c1.id, title="c1-ev")
        _create(db_session, c2.id, title="c2-ev")

        c1_events = event_service.list_by_couple(db_session, c1.id)
        assert [e.title for e in c1_events] == ["c1-ev"]


# -----------------------------------------------------------------------------
# get_or_404
# -----------------------------------------------------------------------------
class TestGet:
    def test_get_or_404_found(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_s_g")
        e = _create(db_session, couple.id)
        fetched = event_service.get_or_404(db_session, couple.id, e.id)
        assert fetched.id == e.id

    def test_get_or_404_not_found(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_s_404")
        with pytest.raises(HTTPException) as exc:
            event_service.get_or_404(db_session, couple.id, "evt_missing")
        assert exc.value.status_code == 404

    def test_get_or_404_wrong_couple(self, db_session: Session) -> None:
        """다른 커플 소속 이벤트는 404."""
        c1 = _make_couple(db_session, "cpl_s_wc1")
        c2 = _make_couple(db_session, "cpl_s_wc2")
        e = _create(db_session, c1.id)
        with pytest.raises(HTTPException) as exc:
            event_service.get_or_404(db_session, c2.id, e.id)
        assert exc.value.status_code == 404


# -----------------------------------------------------------------------------
# Update
# -----------------------------------------------------------------------------
class TestUpdate:
    def test_update_partial(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_s_u")
        e = _create(db_session, couple.id, title="원본")
        updated = event_service.update(
            db_session, couple.id, e.id, EventUpdate(title="수정됨")
        )
        assert updated.title == "수정됨"

    def test_update_not_found(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_s_u404")
        with pytest.raises(HTTPException) as exc:
            event_service.update(
                db_session, couple.id, "evt_nope", EventUpdate(title="x")
            )
        assert exc.value.status_code == 404


# -----------------------------------------------------------------------------
# Delete
# -----------------------------------------------------------------------------
class TestDelete:
    def test_delete(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_s_d")
        e = _create(db_session, couple.id)
        event_service.delete(db_session, couple.id, e.id)
        with pytest.raises(HTTPException):
            event_service.get_or_404(db_session, couple.id, e.id)

    def test_delete_not_found(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_s_d404")
        with pytest.raises(HTTPException) as exc:
            event_service.delete(db_session, couple.id, "evt_nope")
        assert exc.value.status_code == 404


# -----------------------------------------------------------------------------
# toggle_complete
# -----------------------------------------------------------------------------
class TestToggleComplete:
    def test_toggle_flips_state(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_s_t")
        e = _create(db_session, couple.id)
        assert e.is_completed is False

        first = event_service.toggle_complete(db_session, couple.id, e.id)
        assert first.is_completed is True

        second = event_service.toggle_complete(db_session, couple.id, e.id)
        assert second.is_completed is False

    def test_toggle_not_found(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_s_t404")
        with pytest.raises(HTTPException) as exc:
            event_service.toggle_complete(db_session, couple.id, "evt_x")
        assert exc.value.status_code == 404
