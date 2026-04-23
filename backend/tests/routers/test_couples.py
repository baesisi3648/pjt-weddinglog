# @TASK P1-R1-T3 - Couple 라우터 통합 테스트
# @SPEC docs/planning/05-architecture.md#api-엔드포인트
"""
/api/couples/* 라우터 TestClient 통합 테스트.
"""
from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient


def test_get_couple_not_found_returns_404(client: TestClient) -> None:
    response = client.get("/api/couples/cpl_does_not_exist")
    assert response.status_code == 404
    body = response.json()
    assert "detail" in body


def test_create_couple_then_get(client: TestClient) -> None:
    payload = {
        "groom_name": "성우",
        "bride_name": "은비",
        "wedding_date": "2026-10-25",
        "tagline": "성우 ♥ 은비",
    }
    create_resp = client.post("/api/couples/", json=payload)
    assert create_resp.status_code in (200, 201)
    created = create_resp.json()
    assert created["id"].startswith("cpl_")
    assert created["groom_name"] == "성우"
    assert "d_day" in created
    assert isinstance(created["d_day"], int)

    # 조회
    get_resp = client.get(f"/api/couples/{created['id']}")
    assert get_resp.status_code == 200
    fetched = get_resp.json()
    assert fetched["id"] == created["id"]
    assert fetched["groom_name"] == "성우"
    assert fetched["tagline"] == "성우 ♥ 은비"
    assert "d_day" in fetched


def test_update_couple_tagline(client: TestClient) -> None:
    # 먼저 생성
    create_resp = client.post(
        "/api/couples/",
        json={
            "groom_name": "성우",
            "bride_name": "은비",
            "wedding_date": "2026-10-25",
        },
    )
    assert create_resp.status_code in (200, 201)
    couple_id = create_resp.json()["id"]

    # 태그라인 업데이트
    update_resp = client.put(
        f"/api/couples/{couple_id}",
        json={"tagline": "새로운 태그라인"},
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["tagline"] == "새로운 태그라인"
    assert updated["groom_name"] == "성우"


def test_update_not_found_returns_404(client: TestClient) -> None:
    response = client.put(
        "/api/couples/cpl_does_not_exist",
        json={"tagline": "x"},
    )
    assert response.status_code == 404


def test_create_rejects_short_groom_name(client: TestClient) -> None:
    """groom_name 1자는 422 validation error."""
    response = client.post(
        "/api/couples/",
        json={
            "groom_name": "성",
            "bride_name": "은비",
            "wedding_date": "2026-10-25",
        },
    )
    assert response.status_code == 422


def test_create_rejects_short_bride_name(client: TestClient) -> None:
    response = client.post(
        "/api/couples/",
        json={
            "groom_name": "성우",
            "bride_name": "은",
            "wedding_date": "2026-10-25",
        },
    )
    assert response.status_code == 422
