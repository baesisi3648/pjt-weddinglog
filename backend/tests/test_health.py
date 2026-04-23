# @TASK P0-T2 - Health endpoint 테스트
# @SPEC docs/planning/05-architecture.md#헬스체크-엔드포인트
"""
GET /health 엔드포인트 기본 동작 검증.
"""
from __future__ import annotations

from datetime import datetime

from fastapi.testclient import TestClient


def test_health_returns_ok(client: TestClient) -> None:
    """GET /health 는 200 과 status=ok 를 반환해야 한다."""
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"


def test_health_includes_openai_flag(client: TestClient) -> None:
    """응답에 openai_available 필드가 bool 로 존재해야 한다."""
    response = client.get("/health")

    body = response.json()
    assert "openai_available" in body
    assert isinstance(body["openai_available"], bool)


def test_health_includes_iso_timestamp(client: TestClient) -> None:
    """응답에 ISO8601 형식 timestamp 가 포함되어야 한다."""
    response = client.get("/health")

    body = response.json()
    assert "timestamp" in body
    # ISO8601 파싱이 가능해야 함
    datetime.fromisoformat(body["timestamp"].replace("Z", "+00:00"))
