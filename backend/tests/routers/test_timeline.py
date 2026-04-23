# @TASK P4-R1-T2 - Timeline 라우터 통합 테스트
# @SPEC specs/screens/04_timeline.yaml
"""
GET /api/couples/{couple_id}/timeline 엔드포인트 TestClient 통합 테스트.

시나리오:
- 존재하지 않는 couple → 404
- 빈 커플 → 200 with empty chapters
- 혼합 카테고리 → 챕터 다수 + 총계
- only_selected=true → photos 배열만 필터
- 응답 스키마 필드 존재 확인
"""
from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.models.event import Event
from app.models.photo import Photo
from app.schemas.enums import Category


def _seed_couple(db: Session, cid: str) -> Couple:
    if db.get(Couple, cid) is None:
        c = Couple(
            id=cid,
            groom_name="철수",
            bride_name="영희",
            wedding_date=date(2026, 10, 25),
        )
        db.add(c)
        db.commit()
    return db.get(Couple, cid)  # type: ignore[return-value]


def _seed_event(
    db: Session, couple_id: str, eid: str, category: str
) -> Event:
    e = Event(
        id=eid,
        couple_id=couple_id,
        title=f"evt-{category}",
        date=date(2026, 8, 1),
        category=category,
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
    sort_order: int = 0,
) -> Photo:
    p = Photo(
        id=pid,
        event_id=event_id,
        file_path=f"photos/{event_id}/{pid}.jpg",
        is_selected=is_selected,
        sort_order=sort_order,
    )
    db.add(p)
    db.commit()
    return p


# -----------------------------------------------------------------------------
# 404
# -----------------------------------------------------------------------------
def test_timeline_couple_not_found(client: TestClient) -> None:
    r = client.get("/api/couples/cpl_nope/timeline")
    assert r.status_code == 404


# -----------------------------------------------------------------------------
# Empty
# -----------------------------------------------------------------------------
def test_timeline_empty_couple_returns_empty_chapters(
    client: TestClient, db_session: Session
) -> None:
    c = _seed_couple(db_session, "cpl_tlr_empty")
    r = client.get(f"/api/couples/{c.id}/timeline")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["chapters"] == []
    assert body["total_photos"] == 0
    assert body["selected_photos"] == 0
    assert body["total_pages_estimated"] == 0


# -----------------------------------------------------------------------------
# Mixed categories
# -----------------------------------------------------------------------------
def test_timeline_mixed_categories(
    client: TestClient, db_session: Session
) -> None:
    c = _seed_couple(db_session, "cpl_tlr_mix")

    e_wp = _seed_event(
        db_session, c.id, "evt_tlr_wp", Category.WEDDING_PHOTO.value
    )
    e_ven = _seed_event(db_session, c.id, "evt_tlr_ven", Category.VENUE.value)
    e_hm = _seed_event(
        db_session, c.id, "evt_tlr_hm", Category.HONEYMOON.value
    )

    _seed_photo(db_session, e_wp.id, "pho_tlr_wp1")
    _seed_photo(db_session, e_wp.id, "pho_tlr_wp2")
    _seed_photo(db_session, e_ven.id, "pho_tlr_v1")
    _seed_photo(db_session, e_hm.id, "pho_tlr_h1")
    _seed_photo(db_session, e_hm.id, "pho_tlr_h2")
    _seed_photo(db_session, e_hm.id, "pho_tlr_h3")

    r = client.get(f"/api/couples/{c.id}/timeline")
    assert r.status_code == 200
    body = r.json()

    assert body["total_photos"] == 6
    assert body["selected_photos"] == 6
    # ceil(6 / 2.5) = 3
    assert body["total_pages_estimated"] == 3

    chapters = body["chapters"]
    assert len(chapters) == 3
    # 챕터 표시 순서: wedding_photo → preparation → honeymoon.
    assert [c["key"] for c in chapters] == [
        "wedding_photo",
        "preparation",
        "honeymoon",
    ]
    # chapter_number 는 1부터 재부여.
    assert [c["chapter_number"] for c in chapters] == [1, 2, 3]

    # 각 photo 객체에 필수 필드가 모두 포함되어야 한다.
    first_photo = chapters[0]["photos"][0]
    required_keys = {
        "id",
        "file_url",
        "caption",
        "caption_source",
        "is_selected",
        "event_date",
        "event_title",
        "category",
    }
    assert required_keys.issubset(first_photo.keys())
    assert first_photo["file_url"].startswith("/api/photos/")


# -----------------------------------------------------------------------------
# only_selected=true
# -----------------------------------------------------------------------------
def test_timeline_only_selected_filters_photos(
    client: TestClient, db_session: Session
) -> None:
    c = _seed_couple(db_session, "cpl_tlr_only")
    e = _seed_event(
        db_session, c.id, "evt_tlr_only", Category.WEDDING_PHOTO.value
    )
    _seed_photo(db_session, e.id, "pho_tlr_on1", is_selected=True)
    _seed_photo(db_session, e.id, "pho_tlr_on2", is_selected=False)
    _seed_photo(db_session, e.id, "pho_tlr_on3", is_selected=True)

    r = client.get(
        f"/api/couples/{c.id}/timeline",
        params={"only_selected": "true"},
    )
    assert r.status_code == 200
    body = r.json()
    # 집계는 전체 기준 유지.
    assert body["total_photos"] == 3
    assert body["selected_photos"] == 2
    # photos 만 필터.
    returned = body["chapters"][0]["photos"]
    assert {p["id"] for p in returned} == {"pho_tlr_on1", "pho_tlr_on3"}
    assert all(p["is_selected"] for p in returned)
