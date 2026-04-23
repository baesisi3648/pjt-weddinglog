# @TASK P4-R1-T4 - Home 라우터 통합 테스트
# @SPEC specs/screens/01_home.yaml
"""
GET /api/couples/{couple_id}/home 및
GET /api/couples/{couple_id}/photos/recent 통합 테스트.

시나리오:
- 404: 존재하지 않는 couple
- 200: couple + upcoming + recent + counts + album_order_deadline 구조
- /photos/recent?limit=N: 최근 N장 반환
"""
from __future__ import annotations

from datetime import date, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.models.event import Event
from app.models.photo import Photo
from app.schemas.enums import Category


def _seed_couple(
    db: Session,
    cid: str,
    *,
    wedding: date = date(2026, 10, 25),
) -> Couple:
    existing = db.get(Couple, cid)
    if existing is None:
        c = Couple(
            id=cid,
            groom_name="성우",
            bride_name="은비",
            wedding_date=wedding,
        )
        db.add(c)
        db.commit()
        return c
    return existing


def _seed_event(
    db: Session,
    couple_id: str,
    eid: str,
    *,
    d: date,
    category: str = Category.VENUE.value,
) -> Event:
    e = Event(
        id=eid, couple_id=couple_id, title=f"t-{eid}", date=d, category=category
    )
    db.add(e)
    db.commit()
    return e


def _seed_photo(
    db: Session,
    event_id: str,
    pid: str,
    *,
    is_selected: bool = True,
) -> Photo:
    p = Photo(
        id=pid,
        event_id=event_id,
        file_path=f"photos/{event_id}/{pid}.jpg",
        is_selected=is_selected,
    )
    db.add(p)
    db.commit()
    return p


# -----------------------------------------------------------------------------
# 404
# -----------------------------------------------------------------------------
def test_home_couple_not_found(client: TestClient) -> None:
    r = client.get("/api/couples/cpl_home_nope/home")
    assert r.status_code == 404


# -----------------------------------------------------------------------------
# Full payload shape
# -----------------------------------------------------------------------------
def test_home_returns_expected_structure(
    client: TestClient, db_session: Session
) -> None:
    # 결혼일이 미래 +100일이 되도록 wedding 을 세팅.
    future_wedding = date.today() + timedelta(days=100)
    c = _seed_couple(
        db_session, "cpl_home_struct", wedding=future_wedding
    )

    # upcoming 2 + past 1 + photos
    _seed_event(
        db_session,
        c.id,
        "evt_home_up1",
        d=date.today() + timedelta(days=5),
    )
    _seed_event(
        db_session,
        c.id,
        "evt_home_up2",
        d=date.today() + timedelta(days=10),
    )
    _seed_event(
        db_session,
        c.id,
        "evt_home_past",
        d=date.today() - timedelta(days=5),
    )

    e_for_photos = _seed_event(
        db_session,
        c.id,
        "evt_home_photos",
        d=date.today() + timedelta(days=2),
        category=Category.WEDDING_PHOTO.value,
    )
    _seed_photo(db_session, e_for_photos.id, "pho_home_1")
    _seed_photo(db_session, e_for_photos.id, "pho_home_2", is_selected=False)

    r = client.get(f"/api/couples/{c.id}/home")
    assert r.status_code == 200, r.text
    body = r.json()

    # 최상위 키 존재 확인.
    assert set(body.keys()) >= {
        "couple",
        "upcoming_events",
        "recent_photos",
        "photo_counts",
        "album_order_deadline",
    }

    # couple 필드
    assert body["couple"]["id"] == c.id
    assert "d_day" in body["couple"]

    # upcoming: 미래 이벤트만, 날짜 ASC 최대 3건.
    ids = [e["id"] for e in body["upcoming_events"]]
    # past 는 포함되지 않음.
    assert "evt_home_past" not in ids
    # photos 용 이벤트(+2일) 가 가장 빠르므로 첫 번째.
    assert ids[0] == "evt_home_photos"

    # recent_photos: 1개만 (사진 2장 중 2장 모두 포함, limit 6이내).
    assert len(body["recent_photos"]) == 2

    # photo_counts
    assert body["photo_counts"]["total"] == 2
    assert body["photo_counts"]["selected"] == 1

    # album_order_deadline: 100일 미래 → normal, days_remaining=79
    deadline = body["album_order_deadline"]
    assert deadline["urgency"] == "normal"
    assert deadline["days_remaining"] == 79


def test_home_expired_when_wedding_past(
    client: TestClient, db_session: Session
) -> None:
    past_wedding = date.today() - timedelta(days=10)
    c = _seed_couple(
        db_session, "cpl_home_exp", wedding=past_wedding
    )
    r = client.get(f"/api/couples/{c.id}/home")
    assert r.status_code == 200
    body = r.json()
    assert body["album_order_deadline"]["urgency"] == "expired"


# -----------------------------------------------------------------------------
# /photos/recent
# -----------------------------------------------------------------------------
def test_recent_photos_endpoint(
    client: TestClient, db_session: Session
) -> None:
    c = _seed_couple(db_session, "cpl_recent")
    e = _seed_event(
        db_session,
        c.id,
        "evt_recent_e",
        d=date.today() + timedelta(days=1),
        category=Category.WEDDING_PHOTO.value,
    )
    for i in range(4):
        _seed_photo(db_session, e.id, f"pho_recent_{i}")

    r = client.get(
        f"/api/couples/{c.id}/photos/recent",
        params={"limit": 3},
    )
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 3
    # PhotoResponse 스키마: file_url computed field 포함.
    assert body[0]["file_url"].startswith("/api/photos/")


def test_recent_photos_404_when_couple_missing(client: TestClient) -> None:
    r = client.get("/api/couples/cpl_recent_nope/photos/recent")
    assert r.status_code == 404


def test_recent_photos_limit_validation(
    client: TestClient, db_session: Session
) -> None:
    c = _seed_couple(db_session, "cpl_recent_lim")
    r = client.get(
        f"/api/couples/{c.id}/photos/recent",
        params={"limit": 0},
    )
    # limit >= 1 제약 → 422
    assert r.status_code == 422
