# @TASK P3-R1-T6 - AI 캡션 라우터 통합 테스트
# @SPEC specs/domain/resources.yaml#ai_services.generate_captions
"""
/api/ai/caption 엔드포인트 통합 테스트.

핵심 시나리오:
- 기본 요청 → 3개 캡션 + source 필드
- event_id 없음 → 404
- photo_id 잘못 → 404
- photo_id 에코백
"""
from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.models.event import Event
from app.schemas.enums import Category


def _seed(db: Session, eid: str = "evt_cap_t") -> str:
    cid = f"cpl_{eid}"
    if db.get(Couple, cid) is None:
        db.add(
            Couple(
                id=cid,
                groom_name="성우",
                bride_name="은비",
                wedding_date=date(2026, 10, 25),
            )
        )
        db.flush()
    if db.get(Event, eid) is None:
        db.add(
            Event(
                id=eid,
                couple_id=cid,
                title="웨딩촬영",
                date=date(2026, 7, 25),
                category=Category.WEDDING_PHOTO.value,
                memo="테라스에서",
            )
        )
        db.commit()
    return eid


def test_caption_returns_three_captions(
    client: TestClient, db_session: Session
) -> None:
    eid = _seed(db_session, "evt_cap_basic")
    r = client.post(
        "/api/ai/caption",
        json={"event_id": eid},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["source"] in ("ai", "template")
    assert len(body["captions"]) == 3
    for c in body["captions"]:
        assert isinstance(c, str) and c


def test_caption_event_not_found_404(client: TestClient) -> None:
    r = client.post(
        "/api/ai/caption",
        json={"event_id": "evt_missing"},
    )
    assert r.status_code == 404


def test_caption_echoes_photo_id(
    client: TestClient, db_session: Session
) -> None:
    eid = _seed(db_session, "evt_cap_photo")

    # Photo 직접 삽입 (라우터 테스트 범위 축소 — 파일 IO 없이)
    from app.models.photo import Photo
    photo = Photo(
        event_id=eid,
        file_path="photos/x/y.png",
    )
    db_session.add(photo)
    db_session.commit()

    r = client.post(
        "/api/ai/caption",
        json={"event_id": eid, "photo_id": photo.id},
    )
    assert r.status_code == 200
    assert r.json()["photo_id"] == photo.id


def test_caption_photo_not_found_404(
    client: TestClient, db_session: Session
) -> None:
    eid = _seed(db_session, "evt_cap_pnf")
    r = client.post(
        "/api/ai/caption",
        json={"event_id": eid, "photo_id": "pho_missing"},
    )
    assert r.status_code == 404


def test_caption_override_memo_accepted(
    client: TestClient, db_session: Session
) -> None:
    """memo override 파라미터는 수용되고 에러 없이 통과."""
    eid = _seed(db_session, "evt_cap_memo")
    r = client.post(
        "/api/ai/caption",
        json={"event_id": eid, "memo": "바닷가에서의 첫 날"},
    )
    assert r.status_code == 200
    assert len(r.json()["captions"]) == 3
