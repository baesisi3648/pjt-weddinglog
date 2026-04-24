# @TASK P5-R1-T3 - Order 라우터 통합 테스트
# @SPEC docs/planning/05-architecture.md#api-엔드포인트
"""
Order REST API (/api/couples/{id}/orders, /api/orders/{id}) TestClient 테스트.
"""
from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.couple import Couple


def _seed_couple(db: Session, cid: str = "cpl_router_order") -> None:
    if db.get(Couple, cid) is None:
        c = Couple(
            id=cid,
            groom_name="철수",
            bride_name="영희",
            wedding_date=date(2026, 10, 25),
        )
        db.add(c)
        db.commit()


def _create_payload(
    *, photo_ids: list[str] | None = None, quantity: int = 1
) -> dict:
    return {
        "format": "SQUARE",
        "cover_type": "HARD",
        "quantity": quantity,
        "chapters_selected": [
            {
                "chapter_number": 1,
                "title": "웨딩",
                "photo_ids": photo_ids or ["pho_x"],
            }
        ],
        "recipient_name": "김철수",
        "recipient_phone": "010-1234-5678",
        "recipient_address": "서울시 강남구 테헤란로 1",
    }


# -----------------------------------------------------------------------------
# POST /api/couples/{couple_id}/orders
# -----------------------------------------------------------------------------
def test_create_order_returns_201_with_computed_fields(
    client: TestClient, db_session: Session
) -> None:
    _seed_couple(db_session)

    r = client.post(
        "/api/couples/cpl_router_order/orders",
        json=_create_payload(),
    )
    assert r.status_code == 201
    body = r.json()
    assert body["id"].startswith("ord_")
    assert body["status"] == "pending"
    assert body["base_price"] == 150000
    assert body["cover_surcharge"] == 20000
    assert body["total_price"] == 170000
    assert "total_pages_estimated" in body


def test_create_order_couple_not_found(client: TestClient) -> None:
    r = client.post(
        "/api/couples/cpl_nope/orders",
        json=_create_payload(),
    )
    assert r.status_code == 404


def test_create_order_empty_photos_rejected(
    client: TestClient, db_session: Session
) -> None:
    _seed_couple(db_session)
    payload = _create_payload()
    payload["chapters_selected"] = [
        {"chapter_number": 1, "title": "웨딩", "photo_ids": []}
    ]
    r = client.post(
        "/api/couples/cpl_router_order/orders",
        json=payload,
    )
    assert r.status_code == 422


def test_create_order_invalid_phone_rejected(
    client: TestClient, db_session: Session
) -> None:
    _seed_couple(db_session)
    payload = _create_payload()
    payload["recipient_phone"] = "010-12-34"
    r = client.post(
        "/api/couples/cpl_router_order/orders",
        json=payload,
    )
    assert r.status_code == 422


# -----------------------------------------------------------------------------
# GET /api/couples/{couple_id}/orders
# -----------------------------------------------------------------------------
def test_list_orders_returns_latest_first(
    client: TestClient, db_session: Session
) -> None:
    _seed_couple(db_session)
    client.post(
        "/api/couples/cpl_router_order/orders", json=_create_payload()
    )
    client.post(
        "/api/couples/cpl_router_order/orders",
        json=_create_payload(quantity=2),
    )

    r = client.get("/api/couples/cpl_router_order/orders")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 2
    # 최신(qty=2)이 먼저.
    assert items[0]["quantity"] == 2


def test_list_orders_filter_by_status(
    client: TestClient, db_session: Session
) -> None:
    _seed_couple(db_session)
    r1 = client.post(
        "/api/couples/cpl_router_order/orders", json=_create_payload()
    )
    r2 = client.post(
        "/api/couples/cpl_router_order/orders",
        json=_create_payload(quantity=2),
    )
    oid2 = r2.json()["id"]

    # o2 → processing.
    client.patch(
        f"/api/orders/{oid2}/status", json={"target_status": "processing"}
    )

    pending = client.get(
        "/api/couples/cpl_router_order/orders?status=pending"
    ).json()
    processing = client.get(
        "/api/couples/cpl_router_order/orders?status=processing"
    ).json()

    assert all(o["status"] == "pending" for o in pending)
    assert all(o["status"] == "processing" for o in processing)
    assert {o["id"] for o in pending} == {r1.json()["id"]}
    assert {o["id"] for o in processing} == {oid2}


# -----------------------------------------------------------------------------
# GET /api/orders/{order_id}
# -----------------------------------------------------------------------------
def test_get_order_returns_404_when_missing(client: TestClient) -> None:
    r = client.get("/api/orders/ord_does_not_exist")
    assert r.status_code == 404


def test_get_order_returns_existing(
    client: TestClient, db_session: Session
) -> None:
    _seed_couple(db_session)
    created = client.post(
        "/api/couples/cpl_router_order/orders", json=_create_payload()
    ).json()

    r = client.get(f"/api/orders/{created['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == created["id"]


# -----------------------------------------------------------------------------
# PATCH /api/orders/{order_id}/status
# -----------------------------------------------------------------------------
def test_patch_status_forward_ok(
    client: TestClient, db_session: Session
) -> None:
    _seed_couple(db_session)
    created = client.post(
        "/api/couples/cpl_router_order/orders", json=_create_payload()
    ).json()
    oid = created["id"]

    r1 = client.patch(
        f"/api/orders/{oid}/status", json={"target_status": "processing"}
    )
    assert r1.status_code == 200
    assert r1.json()["status"] == "processing"

    r2 = client.patch(
        f"/api/orders/{oid}/status", json={"target_status": "completed"}
    )
    assert r2.status_code == 200
    assert r2.json()["status"] == "completed"


def test_patch_status_invalid_transition_returns_400(
    client: TestClient, db_session: Session
) -> None:
    _seed_couple(db_session)
    created = client.post(
        "/api/couples/cpl_router_order/orders", json=_create_payload()
    ).json()
    oid = created["id"]

    # pending → completed 단계 건너뛰기 → 400.
    r = client.patch(
        f"/api/orders/{oid}/status", json={"target_status": "completed"}
    )
    assert r.status_code == 400
