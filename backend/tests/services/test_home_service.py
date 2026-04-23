# @TASK P4-R1-T3 - HomeService 단위 테스트
# @SPEC specs/screens/01_home.yaml
# @SPEC docs/planning/council-report.md#B3-타이밍-UX
"""
HomeService.get_home_summary() 테스트.

핵심 시나리오:
- upcoming_events: 오늘 이후만, 최대 3건, 날짜 ASC
- recent_photos: created_at DESC, 최대 6건
- photo_counts: total, selected 정확
- album_order_deadline urgency (specs/screens/01_home.yaml 기준):
    normal   : days_until_wedding > 21
    warning  : 14 < days_until_wedding <= 21 (노란 경고)
    urgent   : 0 <= days_until_wedding <= 14 (빨간 긴급)
    expired  : days_until_wedding < 0 (결혼일 경과)

  주의: D-20 의 경우 recommended_date = wedding - 21 < today 이므로
  days_remaining = -1 이지만, urgency 는 여전히 warning 구간이다.
  (days_remaining 음수 여부는 urgency 판정에 사용하지 않는다.)

    결과적으로 days_remaining <= 0 이면 urgent (아직 wedding 전), days_until_wedding < 0 이면 expired.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.models.event import Event
from app.models.photo import Photo
from app.schemas.enums import Category
from app.services import home_service


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def _make_couple(
    db: Session,
    cid: str,
    *,
    wedding: date = date(2026, 10, 25),
) -> Couple:
    couple = Couple(
        id=cid,
        groom_name="성우",
        bride_name="은비",
        wedding_date=wedding,
    )
    db.add(couple)
    db.flush()
    return couple


def _make_event(
    db: Session,
    couple_id: str,
    eid: str,
    *,
    d: date,
    category: str = Category.VENUE.value,
    title: str = "t",
) -> Event:
    e = Event(
        id=eid,
        couple_id=couple_id,
        title=title,
        date=d,
        category=category,
    )
    db.add(e)
    db.flush()
    return e


def _make_photo(
    db: Session,
    event_id: str,
    pid: str,
    *,
    is_selected: bool = True,
    created_at: datetime | None = None,
) -> Photo:
    p = Photo(
        id=pid,
        event_id=event_id,
        file_path=f"photos/{event_id}/{pid}.jpg",
        is_selected=is_selected,
    )
    if created_at is not None:
        p.created_at = created_at
    db.add(p)
    db.flush()
    return p


TODAY = date(2026, 6, 1)


# -----------------------------------------------------------------------------
# Couple + 404
# -----------------------------------------------------------------------------
class TestCoupleLookup:
    def test_missing_couple_raises_404(self, db_session: Session) -> None:
        with pytest.raises(HTTPException) as exc:
            home_service.get_home_summary(
                db_session, "cpl_nope", today=TODAY
            )
        assert exc.value.status_code == 404


# -----------------------------------------------------------------------------
# Upcoming events
# -----------------------------------------------------------------------------
class TestUpcomingEvents:
    def test_excludes_past_events(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_home_past")
        _make_event(
            db_session, couple.id, "evt_past1", d=TODAY - timedelta(days=5)
        )
        _make_event(
            db_session, couple.id, "evt_past2", d=TODAY - timedelta(days=1)
        )
        fut = _make_event(
            db_session, couple.id, "evt_fut", d=TODAY + timedelta(days=3)
        )

        result = home_service.get_home_summary(
            db_session, couple.id, today=TODAY
        )
        ids = [e.id for e in result["upcoming_events"]]
        assert ids == [fut.id]

    def test_includes_today_events(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_home_today")
        today_ev = _make_event(db_session, couple.id, "evt_today", d=TODAY)

        result = home_service.get_home_summary(
            db_session, couple.id, today=TODAY
        )
        assert [e.id for e in result["upcoming_events"]] == [today_ev.id]

    def test_returns_at_most_three_events_sorted_asc(
        self, db_session: Session
    ) -> None:
        couple = _make_couple(db_session, "cpl_home_limit")
        # 5개 미래 이벤트: 10, 5, 20, 1, 15 (생성 순서 섞기)
        _make_event(
            db_session, couple.id, "evt_a", d=TODAY + timedelta(days=10)
        )
        _make_event(
            db_session, couple.id, "evt_b", d=TODAY + timedelta(days=5)
        )
        _make_event(
            db_session, couple.id, "evt_c", d=TODAY + timedelta(days=20)
        )
        _make_event(
            db_session, couple.id, "evt_d", d=TODAY + timedelta(days=1)
        )
        _make_event(
            db_session, couple.id, "evt_e", d=TODAY + timedelta(days=15)
        )

        result = home_service.get_home_summary(
            db_session, couple.id, today=TODAY
        )
        events = result["upcoming_events"]
        assert len(events) == 3
        # 날짜 ASC 순서: +1, +5, +10
        assert [e.id for e in events] == ["evt_d", "evt_b", "evt_a"]


# -----------------------------------------------------------------------------
# Recent photos
# -----------------------------------------------------------------------------
class TestRecentPhotos:
    def test_returns_latest_six_across_events(
        self, db_session: Session
    ) -> None:
        couple = _make_couple(db_session, "cpl_home_photos")
        e1 = _make_event(
            db_session, couple.id, "evt_rp1", d=TODAY + timedelta(days=1)
        )
        e2 = _make_event(
            db_session, couple.id, "evt_rp2", d=TODAY + timedelta(days=2)
        )

        base = datetime(2026, 5, 1, 12, 0, 0)
        # 8장 생성 — created_at 오름차순 ID.
        for i in range(8):
            ev_id = e1.id if i % 2 == 0 else e2.id
            _make_photo(
                db_session,
                ev_id,
                f"pho_rp_{i:02d}",
                created_at=base + timedelta(hours=i),
            )

        result = home_service.get_home_summary(
            db_session, couple.id, today=TODAY
        )
        recent = result["recent_photos"]
        assert len(recent) == 6
        # 최신순: pho_rp_07, 06, 05, 04, 03, 02
        assert [p.id for p in recent] == [
            "pho_rp_07",
            "pho_rp_06",
            "pho_rp_05",
            "pho_rp_04",
            "pho_rp_03",
            "pho_rp_02",
        ]

    def test_empty_when_no_photos(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_home_nophoto")
        _make_event(
            db_session, couple.id, "evt_np", d=TODAY + timedelta(days=1)
        )
        result = home_service.get_home_summary(
            db_session, couple.id, today=TODAY
        )
        assert result["recent_photos"] == []

    def test_other_couples_photos_excluded(
        self, db_session: Session
    ) -> None:
        """couple_id 필터로 다른 커플의 사진은 제외되어야 한다."""
        c1 = _make_couple(db_session, "cpl_iso_1")
        c2 = _make_couple(db_session, "cpl_iso_2")

        e1 = _make_event(
            db_session, c1.id, "evt_iso1", d=TODAY + timedelta(days=1)
        )
        e2 = _make_event(
            db_session, c2.id, "evt_iso2", d=TODAY + timedelta(days=1)
        )
        _make_photo(db_session, e1.id, "pho_c1_1")
        _make_photo(db_session, e2.id, "pho_c2_1")

        result = home_service.get_home_summary(
            db_session, c1.id, today=TODAY
        )
        assert [p.id for p in result["recent_photos"]] == ["pho_c1_1"]


# -----------------------------------------------------------------------------
# Photo counts
# -----------------------------------------------------------------------------
class TestPhotoCounts:
    def test_counts_total_and_selected(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_home_counts")
        e = _make_event(
            db_session, couple.id, "evt_cnt", d=TODAY + timedelta(days=2)
        )
        _make_photo(db_session, e.id, "pho_c_1", is_selected=True)
        _make_photo(db_session, e.id, "pho_c_2", is_selected=True)
        _make_photo(db_session, e.id, "pho_c_3", is_selected=False)
        _make_photo(db_session, e.id, "pho_c_4", is_selected=False)

        result = home_service.get_home_summary(
            db_session, couple.id, today=TODAY
        )
        assert result["photo_counts"]["total"] == 4
        assert result["photo_counts"]["selected"] == 2

    def test_counts_empty_couple(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_home_empty")
        result = home_service.get_home_summary(
            db_session, couple.id, today=TODAY
        )
        assert result["photo_counts"]["total"] == 0
        assert result["photo_counts"]["selected"] == 0


# -----------------------------------------------------------------------------
# Album order deadline
# -----------------------------------------------------------------------------
class TestAlbumOrderDeadline:
    def test_normal_when_100_days_out(self, db_session: Session) -> None:
        """결혼일이 오늘 +100일 → days_remaining=79, urgency=normal."""
        wedding = TODAY + timedelta(days=100)
        couple = _make_couple(
            db_session, "cpl_home_normal", wedding=wedding
        )
        result = home_service.get_home_summary(
            db_session, couple.id, today=TODAY
        )
        deadline = result["album_order_deadline"]
        assert deadline["days_remaining"] == 79  # 100 - 21
        assert deadline["urgency"] == "normal"
        expected_date = (wedding - timedelta(days=21)).isoformat()
        assert deadline["recommended_date"] == expected_date

    def test_warning_at_exactly_21_days(self, db_session: Session) -> None:
        """D-21: 경계. spec 에 '14 < d <= 21' → warning."""
        wedding = TODAY + timedelta(days=21)
        couple = _make_couple(
            db_session, "cpl_home_warn21", wedding=wedding
        )
        result = home_service.get_home_summary(
            db_session, couple.id, today=TODAY
        )
        assert result["album_order_deadline"]["urgency"] == "warning"

    def test_warning_between_14_and_21(self, db_session: Session) -> None:
        wedding = TODAY + timedelta(days=17)
        couple = _make_couple(db_session, "cpl_home_warn17", wedding=wedding)
        result = home_service.get_home_summary(
            db_session, couple.id, today=TODAY
        )
        assert result["album_order_deadline"]["urgency"] == "warning"

    def test_urgent_at_exactly_14_days(self, db_session: Session) -> None:
        wedding = TODAY + timedelta(days=14)
        couple = _make_couple(db_session, "cpl_home_urg14", wedding=wedding)
        result = home_service.get_home_summary(
            db_session, couple.id, today=TODAY
        )
        assert result["album_order_deadline"]["urgency"] == "urgent"

    def test_warning_when_20_days_out(self, db_session: Session) -> None:
        """결혼일까지 +20일 → days_remaining=-1 (권장일 경과), urgency='warning'.

        명세(specs/screens/01_home.yaml): D-21~D-14 구간은 warning(노랑).
        D-20 은 해당 구간 내이므로 warning 으로 분류한다.
        """
        wedding = TODAY + timedelta(days=20)
        couple = _make_couple(db_session, "cpl_home_warn20", wedding=wedding)
        result = home_service.get_home_summary(
            db_session, couple.id, today=TODAY
        )
        deadline = result["album_order_deadline"]
        assert deadline["days_remaining"] == -1
        assert deadline["urgency"] == "warning"

    def test_expired_when_wedding_is_past(self, db_session: Session) -> None:
        """결혼일이 오늘 -10일 → urgency='expired'."""
        wedding = TODAY - timedelta(days=10)
        couple = _make_couple(db_session, "cpl_home_exp", wedding=wedding)
        result = home_service.get_home_summary(
            db_session, couple.id, today=TODAY
        )
        deadline = result["album_order_deadline"]
        assert deadline["urgency"] == "expired"
        # days_remaining = recommended - today = -10 -21 = -31
        assert deadline["days_remaining"] == -31


# -----------------------------------------------------------------------------
# Integration: full payload shape
# -----------------------------------------------------------------------------
class TestPayloadShape:
    def test_all_keys_present(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_home_shape")
        result = home_service.get_home_summary(
            db_session, couple.id, today=TODAY
        )
        assert set(result.keys()) == {
            "couple",
            "upcoming_events",
            "recent_photos",
            "photo_counts",
            "album_order_deadline",
        }
        # couple 은 ORM 객체여야 한다 (라우터에서 Pydantic 으로 변환).
        assert result["couple"].id == couple.id
