# @TASK P2-R1-T3 - Event 라우터 통합 테스트
# @SPEC docs/planning/05-architecture.md#api-엔드포인트
"""
/api/couples/{couple_id}/events/* 엔드포인트 TestClient 통합 테스트.

커버 케이스 (10+개):
- POST 생성 후 GET 단건
- GET list 기본 + 월 필터 + 카테고리 필터
- 잘못된 카테고리 → 422
- 다른 커플 ID 로 접근 → 404
- PUT 부분 업데이트
- DELETE → 204, 이후 GET → 404
- PATCH /complete 토글
- 존재하지 않는 event GET → 404
- 월 포맷 잘못됨 → 400
"""
from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.couple import Couple


def _seed_couple(db: Session, cid: str = "cpl_r_test") -> str:
    """테스트용 커플을 직접 세션에 삽입 후 커밋."""
    if db.get(Couple, cid) is None:
        db.add(
            Couple(
                id=cid,
                groom_name="철수",
                bride_name="영희",
                wedding_date=date(2026, 10, 25),
            )
        )
        db.commit()
    return cid


def _create_event(
    client: TestClient,
    couple_id: str,
    *,
    title: str = "t",
    d: str = "2026-08-15",
    category: str = "VENUE",
    memo: str | None = None,
) -> dict:
    body: dict[str, object] = {"title": title, "date": d, "category": category}
    if memo is not None:
        body["memo"] = memo
    r = client.post(f"/api/couples/{couple_id}/events/", json=body)
    assert r.status_code == 201, r.text
    return r.json()


# -----------------------------------------------------------------------------
# POST + GET
# -----------------------------------------------------------------------------
def test_create_then_get_event(client: TestClient, db_session: Session) -> None:
    cid = _seed_couple(db_session, "cpl_r_t1")
    created = _create_event(client, cid, title="예식장 투어")
    assert created["id"].startswith("evt_")
    assert created["couple_id"] == cid
    assert created["title"] == "예식장 투어"
    assert created["is_completed"] is False
    assert created["is_ai_generated"] is False

    r = client.get(f"/api/couples/{cid}/events/{created['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == created["id"]


def test_list_events_empty_returns_empty_list(
    client: TestClient, db_session: Session
) -> None:
    cid = _seed_couple(db_session, "cpl_r_empty")
    r = client.get(f"/api/couples/{cid}/events/")
    assert r.status_code == 200
    assert r.json() == []


def test_list_events_month_filter(
    client: TestClient, db_session: Session
) -> None:
    cid = _seed_couple(db_session, "cpl_r_month")
    _create_event(client, cid, title="7월말", d="2026-07-31")
    _create_event(client, cid, title="8월1일", d="2026-08-01")
    _create_event(client, cid, title="8월말", d="2026-08-31")
    _create_event(client, cid, title="9월1일", d="2026-09-01")

    r = client.get(f"/api/couples/{cid}/events/?month=2026-08")
    assert r.status_code == 200
    titles = [e["title"] for e in r.json()]
    assert titles == ["8월1일", "8월말"]


def test_list_events_category_filter(
    client: TestClient, db_session: Session
) -> None:
    cid = _seed_couple(db_session, "cpl_r_cat")
    _create_event(client, cid, title="V1", category="VENUE")
    _create_event(client, cid, title="G1", category="GIFT")
    _create_event(client, cid, title="V2", category="VENUE")

    r = client.get(f"/api/couples/{cid}/events/?category=VENUE")
    assert r.status_code == 200
    assert {e["title"] for e in r.json()} == {"V1", "V2"}


def test_list_events_is_completed_filter(
    client: TestClient, db_session: Session
) -> None:
    cid = _seed_couple(db_session, "cpl_r_done")
    e1 = _create_event(client, cid, title="t1")
    _create_event(client, cid, title="t2")
    client.patch(f"/api/couples/{cid}/events/{e1['id']}/complete")

    r = client.get(f"/api/couples/{cid}/events/?is_completed=true")
    assert r.status_code == 200
    assert [e["title"] for e in r.json()] == ["t1"]


# -----------------------------------------------------------------------------
# Validation
# -----------------------------------------------------------------------------
def test_create_invalid_category_returns_422(
    client: TestClient, db_session: Session
) -> None:
    cid = _seed_couple(db_session, "cpl_r_bad")
    r = client.post(
        f"/api/couples/{cid}/events/",
        json={"title": "t", "date": "2026-08-01", "category": "BAD_CAT"},
    )
    assert r.status_code == 422


def test_list_invalid_month_returns_400(
    client: TestClient, db_session: Session
) -> None:
    cid = _seed_couple(db_session, "cpl_r_bm")
    r = client.get(f"/api/couples/{cid}/events/?month=2026-13")
    assert r.status_code == 400


# -----------------------------------------------------------------------------
# Not found / isolation
# -----------------------------------------------------------------------------
def test_get_event_not_found(client: TestClient, db_session: Session) -> None:
    cid = _seed_couple(db_session, "cpl_r_nf")
    r = client.get(f"/api/couples/{cid}/events/evt_does_not_exist")
    assert r.status_code == 404


def test_get_event_wrong_couple_returns_404(
    client: TestClient, db_session: Session
) -> None:
    c1 = _seed_couple(db_session, "cpl_r_iso1")
    c2 = _seed_couple(db_session, "cpl_r_iso2")
    created = _create_event(client, c1, title="c1 event")

    r = client.get(f"/api/couples/{c2}/events/{created['id']}")
    assert r.status_code == 404


# -----------------------------------------------------------------------------
# Update / Delete / Toggle
# -----------------------------------------------------------------------------
def test_update_event(client: TestClient, db_session: Session) -> None:
    cid = _seed_couple(db_session, "cpl_r_u")
    created = _create_event(client, cid, title="원본")
    r = client.put(
        f"/api/couples/{cid}/events/{created['id']}",
        json={"title": "수정됨", "memo": "메모 추가"},
    )
    assert r.status_code == 200
    assert r.json()["title"] == "수정됨"
    assert r.json()["memo"] == "메모 추가"


def test_delete_event_returns_204_then_404(
    client: TestClient, db_session: Session
) -> None:
    cid = _seed_couple(db_session, "cpl_r_del")
    created = _create_event(client, cid, title="will delete")

    r = client.delete(f"/api/couples/{cid}/events/{created['id']}")
    assert r.status_code == 204
    assert r.content in (b"", b"null")

    r2 = client.get(f"/api/couples/{cid}/events/{created['id']}")
    assert r2.status_code == 404


def test_patch_complete_toggles(
    client: TestClient, db_session: Session
) -> None:
    cid = _seed_couple(db_session, "cpl_r_tog")
    created = _create_event(client, cid, title="toggle me")
    assert created["is_completed"] is False

    r1 = client.patch(f"/api/couples/{cid}/events/{created['id']}/complete")
    assert r1.status_code == 200
    assert r1.json()["is_completed"] is True

    r2 = client.patch(f"/api/couples/{cid}/events/{created['id']}/complete")
    assert r2.status_code == 200
    assert r2.json()["is_completed"] is False
