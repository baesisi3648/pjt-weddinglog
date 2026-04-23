# @TASK P3-R1-T4 - Photo REST API 라우터 통합 테스트
# @SPEC docs/planning/05-architecture.md#api-엔드포인트
# @SPEC docs/planning/council-report.md#B6, B7
"""
/api/events/{event_id}/photos + /api/photos/{photo_id}/* 통합 테스트.

핵심 시나리오:
- POST multipart 업로드 → 201 + PhotoResponse + file_url
- 동일 event 10장 초과 시 400
- 비-이미지 바이트 업로드 (MIME spoof) → 400 (Council B6)
- DELETE → 204
- PUT /caption → caption + caption_source="manual"
- PATCH /selection → is_selected 토글
- GET /file → FileResponse (image/png content-type)
- GET /file 404
"""
from __future__ import annotations

from datetime import date
from io import BytesIO
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.couple import Couple
from app.models.event import Event
from app.schemas.enums import Category


# -----------------------------------------------------------------------------
# Fixtures & helpers
# -----------------------------------------------------------------------------
@pytest.fixture()
def tmp_upload_dir(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    upload_dir = tmp_path / "uploads" / "photos"
    upload_dir.mkdir(parents=True, exist_ok=True)
    settings = get_settings()
    monkeypatch.setattr(settings, "UPLOAD_DIR", upload_dir)
    return upload_dir


def _png_bytes() -> bytes:
    buf = BytesIO()
    Image.new("RGB", (4, 4), "white").save(buf, format="PNG")
    return buf.getvalue()


def _seed_event(db: Session, suffix: str) -> str:
    couple_id = f"cpl_{suffix}"
    event_id = f"evt_{suffix}"
    db.add(
        Couple(
            id=couple_id,
            groom_name="성우",
            bride_name="은비",
            wedding_date=date(2026, 10, 25),
        )
    )
    db.flush()
    db.add(
        Event(
            id=event_id,
            couple_id=couple_id,
            title="웨딩촬영",
            date=date(2026, 7, 25),
            category=Category.WEDDING_PHOTO.value,
        )
    )
    db.commit()
    return event_id


# -----------------------------------------------------------------------------
# Upload
# -----------------------------------------------------------------------------
class TestUploadEndpoint:
    def test_upload_png_returns_201(
        self,
        client: TestClient,
        db_session: Session,
        tmp_upload_dir: Path,
    ) -> None:
        eid = _seed_event(db_session, "rt_up")
        r = client.post(
            f"/api/events/{eid}/photos",
            files={"file": ("cute.png", _png_bytes(), "image/png")},
        )
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["id"].startswith("pho_")
        assert body["event_id"] == eid
        assert body["file_path"].endswith(".png")
        # computed file_url
        assert body["file_url"] == f"/api/photos/{body['id']}/file"
        assert body["is_selected"] is True

    def test_upload_event_not_found(
        self, client: TestClient, tmp_upload_dir: Path
    ) -> None:
        r = client.post(
            "/api/events/evt_nope/photos",
            files={"file": ("x.png", _png_bytes(), "image/png")},
        )
        assert r.status_code == 404

    def test_upload_eleven_photos_rejects(
        self,
        client: TestClient,
        db_session: Session,
        tmp_upload_dir: Path,
    ) -> None:
        eid = _seed_event(db_session, "rt_max")
        for i in range(10):
            r = client.post(
                f"/api/events/{eid}/photos",
                files={"file": (f"{i}.png", _png_bytes(), "image/png")},
            )
            assert r.status_code == 201, r.text
        r = client.post(
            f"/api/events/{eid}/photos",
            files={"file": ("11.png", _png_bytes(), "image/png")},
        )
        assert r.status_code == 400
        assert "Max" in r.json()["detail"]

    def test_upload_non_image_bytes_rejected(
        self,
        client: TestClient,
        db_session: Session,
        tmp_upload_dir: Path,
    ) -> None:
        """Council B6 — MIME spoofing 방어: 확장자/Content-Type 맞아도 매직넘버 불일치면 거부."""
        eid = _seed_event(db_session, "rt_fake")
        r = client.post(
            f"/api/events/{eid}/photos",
            files={"file": ("fake.png", b"not an image", "image/png")},
        )
        assert r.status_code == 400

    def test_upload_pdf_rejected(
        self,
        client: TestClient,
        db_session: Session,
        tmp_upload_dir: Path,
    ) -> None:
        eid = _seed_event(db_session, "rt_pdf")
        r = client.post(
            f"/api/events/{eid}/photos",
            files={"file": ("x.pdf", b"%PDF-1.4", "application/pdf")},
        )
        assert r.status_code == 400


# -----------------------------------------------------------------------------
# List
# -----------------------------------------------------------------------------
class TestListEndpoint:
    def test_list_empty(
        self,
        client: TestClient,
        db_session: Session,
        tmp_upload_dir: Path,
    ) -> None:
        eid = _seed_event(db_session, "rt_le")
        r = client.get(f"/api/events/{eid}/photos")
        assert r.status_code == 200
        assert r.json() == []

    def test_list_after_upload(
        self,
        client: TestClient,
        db_session: Session,
        tmp_upload_dir: Path,
    ) -> None:
        eid = _seed_event(db_session, "rt_ls")
        client.post(
            f"/api/events/{eid}/photos",
            files={"file": ("a.png", _png_bytes(), "image/png")},
        )
        client.post(
            f"/api/events/{eid}/photos",
            files={"file": ("b.png", _png_bytes(), "image/png")},
        )
        r = client.get(f"/api/events/{eid}/photos")
        assert r.status_code == 200
        assert len(r.json()) == 2


# -----------------------------------------------------------------------------
# Delete
# -----------------------------------------------------------------------------
class TestDeleteEndpoint:
    def test_delete_returns_204(
        self,
        client: TestClient,
        db_session: Session,
        tmp_upload_dir: Path,
    ) -> None:
        eid = _seed_event(db_session, "rt_del")
        up = client.post(
            f"/api/events/{eid}/photos",
            files={"file": ("x.png", _png_bytes(), "image/png")},
        )
        pid = up.json()["id"]
        r = client.delete(f"/api/photos/{pid}")
        assert r.status_code == 204
        # 이후 파일 GET 은 404
        r2 = client.get(f"/api/photos/{pid}/file")
        assert r2.status_code == 404

    def test_delete_not_found(
        self, client: TestClient, tmp_upload_dir: Path
    ) -> None:
        r = client.delete("/api/photos/pho_missing")
        assert r.status_code == 404


# -----------------------------------------------------------------------------
# Caption
# -----------------------------------------------------------------------------
class TestCaptionEndpoint:
    def test_put_caption_sets_manual_source(
        self,
        client: TestClient,
        db_session: Session,
        tmp_upload_dir: Path,
    ) -> None:
        eid = _seed_event(db_session, "rt_cap")
        up = client.post(
            f"/api/events/{eid}/photos",
            files={"file": ("x.png", _png_bytes(), "image/png")},
        )
        pid = up.json()["id"]
        r = client.put(
            f"/api/photos/{pid}/caption",
            json={"caption": "예쁜 순간", "caption_source": "manual"},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["caption"] == "예쁜 순간"
        assert body["caption_source"] == "manual"

    def test_put_caption_with_ai_source(
        self,
        client: TestClient,
        db_session: Session,
        tmp_upload_dir: Path,
    ) -> None:
        eid = _seed_event(db_session, "rt_cap_ai")
        up = client.post(
            f"/api/events/{eid}/photos",
            files={"file": ("x.png", _png_bytes(), "image/png")},
        )
        pid = up.json()["id"]
        r = client.put(
            f"/api/photos/{pid}/caption",
            json={"caption": "AI 추천 캡션", "caption_source": "ai"},
        )
        assert r.json()["caption_source"] == "ai"


# -----------------------------------------------------------------------------
# Selection toggle
# -----------------------------------------------------------------------------
class TestSelectionToggle:
    def test_patch_toggles_is_selected(
        self,
        client: TestClient,
        db_session: Session,
        tmp_upload_dir: Path,
    ) -> None:
        eid = _seed_event(db_session, "rt_sel")
        up = client.post(
            f"/api/events/{eid}/photos",
            files={"file": ("x.png", _png_bytes(), "image/png")},
        )
        pid = up.json()["id"]
        assert up.json()["is_selected"] is True

        r1 = client.patch(f"/api/photos/{pid}/selection")
        assert r1.status_code == 200
        assert r1.json()["is_selected"] is False

        r2 = client.patch(f"/api/photos/{pid}/selection")
        assert r2.json()["is_selected"] is True


# -----------------------------------------------------------------------------
# File serving (Council B7 — 래퍼 엔드포인트)
# -----------------------------------------------------------------------------
class TestServeFileEndpoint:
    def test_get_file_returns_image(
        self,
        client: TestClient,
        db_session: Session,
        tmp_upload_dir: Path,
    ) -> None:
        eid = _seed_event(db_session, "rt_serve")
        content = _png_bytes()
        up = client.post(
            f"/api/events/{eid}/photos",
            files={"file": ("x.png", content, "image/png")},
        )
        pid = up.json()["id"]
        r = client.get(f"/api/photos/{pid}/file")
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("image/png")
        assert r.content == content

    def test_get_file_missing_photo_404(
        self, client: TestClient, tmp_upload_dir: Path
    ) -> None:
        r = client.get("/api/photos/pho_missing/file")
        assert r.status_code == 404
