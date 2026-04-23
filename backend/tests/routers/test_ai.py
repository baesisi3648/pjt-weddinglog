# @TASK P2-R1-T5 - AI 체크리스트 라우터 통합 테스트
# @SPEC docs/planning/05-architecture.md#ai-폴백-전략
"""
/api/ai/checklist 엔드포인트 통합 테스트.

핵심 시나리오:
- 키 없을 때 (폴백): 15개 이벤트 반환, source="template", DB 저장됨
- dry_run=True: DB 저장 안 됨
- wedding_date 생략 시 couple DB 에서 가져옴
- 존재하지 않는 couple → 404
"""
from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.models.event import Event


def _seed(db: Session, cid: str, wd: date = date(2026, 10, 25)) -> str:
    if db.get(Couple, cid) is None:
        db.add(
            Couple(
                id=cid,
                groom_name="철수",
                bride_name="영희",
                wedding_date=wd,
            )
        )
        db.commit()
    return cid


def test_ai_checklist_fallback_persists_15_events(
    client: TestClient, db_session: Session
) -> None:
    """키 없을 때 폴백 — 15개 이벤트 생성 + DB 저장."""
    cid = _seed(db_session, "cpl_ai_fb", wd=date(2026, 10, 25))

    r = client.post(
        "/api/ai/checklist",
        json={"couple_id": cid, "wedding_date": "2026-10-25"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["source"] == "template"
    assert len(body["events"]) == 15

    for ev in body["events"]:
        assert ev["couple_id"] == cid
        assert ev["is_ai_generated"] is True
        assert ev["id"].startswith("evt_")

    # DB 에 실제로 저장되었는지 확인
    stored = (
        db_session.query(Event)
        .filter(Event.couple_id == cid)
        .all()
    )
    assert len(stored) == 15


def test_ai_checklist_uses_couple_wedding_date_when_omitted(
    client: TestClient, db_session: Session
) -> None:
    """wedding_date 생략 → couple DB 에서 가져와 날짜 계산."""
    cid = _seed(db_session, "cpl_ai_dt", wd=date(2027, 3, 14))
    r = client.post("/api/ai/checklist", json={"couple_id": cid})
    assert r.status_code == 200
    body = r.json()
    # 본식(offset=0) 항목 하나는 2027-03-14 여야 함
    assert any(e["date"] == "2027-03-14" for e in body["events"])


def test_ai_checklist_dry_run_does_not_persist(
    client: TestClient, db_session: Session
) -> None:
    """dry_run=True 면 DB 저장 없이 결과만 반환."""
    cid = _seed(db_session, "cpl_ai_dry")
    r = client.post(
        "/api/ai/checklist",
        json={
            "couple_id": cid,
            "wedding_date": "2026-10-25",
            "dry_run": True,
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "template"
    assert len(body["events"]) == 15

    # id 가 None/빈 문자열이거나 DB 미저장 상태일 수 있다.
    stored = (
        db_session.query(Event).filter(Event.couple_id == cid).all()
    )
    assert len(stored) == 0


def test_ai_checklist_unknown_couple_returns_404(
    client: TestClient, db_session: Session
) -> None:
    r = client.post(
        "/api/ai/checklist",
        json={"couple_id": "cpl_nope", "wedding_date": "2026-10-25"},
    )
    assert r.status_code == 404
