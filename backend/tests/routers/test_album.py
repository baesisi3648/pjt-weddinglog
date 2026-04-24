# @TASK P5-BACKEND - AI 앨범 구성 라우터 통합 테스트
"""
POST /api/couples/{couple_id}/album/compose 엔드포인트.

- AI 비가용 환경(기본 TestClient) → template 폴백.
- 빈 photo_ids → 422 (Pydantic min_length=1).
- 존재하지 않는 photo_id → 400.
- 다른 커플의 사진 섞이면 400.
- 응답 구조 = AlbumLayoutSchema.
"""
from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.models.event import Event
from app.models.photo import Photo


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


def _seed_event_with_photos(
    db: Session,
    *,
    couple_id: str,
    event_id: str,
    category: str,
    photo_ids: list[str],
) -> None:
    e = Event(
        id=event_id,
        couple_id=couple_id,
        title=f"evt-{category}",
        date=date(2026, 8, 1),
        category=category,
    )
    db.add(e)
    for pid in photo_ids:
        db.add(
            Photo(
                id=pid,
                event_id=event_id,
                file_path=f"photos/{event_id}/{pid}.jpg",
                is_selected=True,
            )
        )
    db.commit()


# -----------------------------------------------------------------------------
# 정상 — template 폴백 (기본 테스트 환경은 AI 비가용)
# -----------------------------------------------------------------------------
def test_compose_fallback_returns_template_layout(
    client: TestClient, db_session: Session
) -> None:
    _seed_couple(db_session, "cpl_album_ok")
    _seed_event_with_photos(
        db_session,
        couple_id="cpl_album_ok",
        event_id="evt_a1",
        category="WEDDING_PHOTO",
        photo_ids=["pho_w1", "pho_w2", "pho_w3"],
    )
    _seed_event_with_photos(
        db_session,
        couple_id="cpl_album_ok",
        event_id="evt_a2",
        category="HONEYMOON",
        photo_ids=["pho_h1", "pho_h2"],
    )

    r = client.post(
        "/api/couples/cpl_album_ok/album/compose",
        json={"selected_photo_ids": ["pho_w1", "pho_w2", "pho_w3", "pho_h1", "pho_h2"]},
    )
    assert r.status_code == 200
    body = r.json()

    assert body["source"] == "template"
    layout = body["album_layout"]
    assert layout["generated_by"] == "template"
    assert layout["total_photos"] >= 1
    assert layout["total_pages"] >= 1
    # 2 카테고리 → 2 챕터.
    assert len(layout["chapters"]) == 2
    # 각 챕터 첫 페이지는 T5.
    for ch in layout["chapters"]:
        assert ch["pages"][0]["template"] == "T5"


# -----------------------------------------------------------------------------
# 입력 검증
# -----------------------------------------------------------------------------
def test_compose_rejects_empty_selected_photo_ids(
    client: TestClient, db_session: Session
) -> None:
    _seed_couple(db_session, "cpl_album_empty")
    r = client.post(
        "/api/couples/cpl_album_empty/album/compose",
        json={"selected_photo_ids": []},
    )
    assert r.status_code == 422


def test_compose_rejects_unknown_photo_id(
    client: TestClient, db_session: Session
) -> None:
    _seed_couple(db_session, "cpl_album_unknown")
    r = client.post(
        "/api/couples/cpl_album_unknown/album/compose",
        json={"selected_photo_ids": ["pho_does_not_exist"]},
    )
    assert r.status_code == 400


def test_compose_rejects_foreign_couple_photos(
    client: TestClient, db_session: Session
) -> None:
    """다른 커플의 사진이 섞이면 400."""
    _seed_couple(db_session, "cpl_album_mine")
    _seed_couple(db_session, "cpl_album_other")

    _seed_event_with_photos(
        db_session,
        couple_id="cpl_album_other",
        event_id="evt_other",
        category="WEDDING_PHOTO",
        photo_ids=["pho_stranger"],
    )

    r = client.post(
        "/api/couples/cpl_album_mine/album/compose",
        json={"selected_photo_ids": ["pho_stranger"]},
    )
    assert r.status_code == 400


def test_compose_returns_404_when_couple_missing(
    client: TestClient,
) -> None:
    r = client.post(
        "/api/couples/cpl_nope/album/compose",
        json={"selected_photo_ids": ["pho_1"]},
    )
    assert r.status_code == 404


# -----------------------------------------------------------------------------
# 응답 스키마 안전성
# -----------------------------------------------------------------------------
def test_compose_response_matches_schema_structure(
    client: TestClient, db_session: Session
) -> None:
    _seed_couple(db_session, "cpl_album_schema")
    _seed_event_with_photos(
        db_session,
        couple_id="cpl_album_schema",
        event_id="evt_schema",
        category="CEREMONY",
        photo_ids=["pho_c1", "pho_c2"],
    )

    r = client.post(
        "/api/couples/cpl_album_schema/album/compose",
        json={"selected_photo_ids": ["pho_c1", "pho_c2"]},
    )
    assert r.status_code == 200
    body = r.json()

    # 최상위 필드.
    assert set(body.keys()) == {"album_layout", "source"}

    layout = body["album_layout"]
    assert set(layout.keys()) >= {
        "total_photos",
        "total_pages",
        "chapters",
        "generated_by",
    }

    # 챕터 / 페이지 필드 확인.
    ch = layout["chapters"][0]
    assert set(ch.keys()) >= {
        "chapter_number",
        "title",
        "color",
        "pages",
    }
    pg = ch["pages"][0]
    assert set(pg.keys()) >= {"page_number", "template", "photo_ids"}
