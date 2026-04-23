# @TASK P3-R1-T2 - PhotoService 단위 테스트
# @SPEC specs/domain/resources.yaml#photos
"""
PhotoService 테스트 — upload, list, delete, caption, toggle_selection.

핵심 시나리오:
- upload: 이벤트 존재 확인, 파일 저장, DB 삽입
- upload: 10장 초과 시 400 (HTTPException)
- upload: 이벤트 없음 시 404
- upload: 검증 실패 시 400
- delete: DB + 파일 삭제
- update_caption: caption_source 반영
- toggle_selection: is_selected 반전
- list_by_event: sort_order 순 정렬
"""
from __future__ import annotations

from datetime import date
from io import BytesIO
from pathlib import Path

import pytest
from fastapi import HTTPException, UploadFile
from PIL import Image
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.couple import Couple
from app.models.event import Event
from app.models.photo import Photo
from app.schemas.enums import Category
from app.services import photo_service


# -----------------------------------------------------------------------------
# Fixtures
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


def _upload_file(content: bytes, content_type: str, name: str) -> UploadFile:
    return UploadFile(
        filename=name,
        file=BytesIO(content),
        headers={"content-type": content_type},  # type: ignore[arg-type]
    )


def _make_event(db: Session, suffix: str) -> Event:
    couple = Couple(
        id=f"cpl_{suffix}",
        groom_name="철수",
        bride_name="영희",
        wedding_date=date(2026, 10, 25),
    )
    db.add(couple)
    db.flush()
    event = Event(
        id=f"evt_{suffix}",
        couple_id=couple.id,
        title="웨딩촬영",
        date=date(2026, 7, 25),
        category=Category.WEDDING_PHOTO.value,
    )
    db.add(event)
    db.flush()
    return event


# -----------------------------------------------------------------------------
# Upload
# -----------------------------------------------------------------------------
class TestUpload:
    @pytest.mark.asyncio
    async def test_upload_creates_db_and_file(
        self, db_session: Session, tmp_upload_dir: Path
    ) -> None:
        event = _make_event(db_session, "up_ok")
        content = _png_bytes()
        file = _upload_file(content, "image/png", "cute.png")

        photo = await photo_service.upload(db_session, event.id, file)

        assert photo.id.startswith("pho_")
        assert photo.event_id == event.id
        assert photo.file_path.endswith(".png")
        assert photo.original_filename == "cute.png"
        # 파일이 실제로 디스크에 저장됨
        abs_path = tmp_upload_dir.parent / photo.file_path
        assert abs_path.exists()

    @pytest.mark.asyncio
    async def test_upload_event_not_found(
        self, db_session: Session, tmp_upload_dir: Path
    ) -> None:
        file = _upload_file(_png_bytes(), "image/png", "x.png")
        with pytest.raises(HTTPException) as exc:
            await photo_service.upload(db_session, "evt_nope", file)
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_upload_max_10_per_event(
        self, db_session: Session, tmp_upload_dir: Path
    ) -> None:
        event = _make_event(db_session, "up_max")
        # 10장 우선 저장
        for i in range(10):
            file = _upload_file(_png_bytes(), "image/png", f"{i}.png")
            await photo_service.upload(db_session, event.id, file)

        # 11번째는 400
        file11 = _upload_file(_png_bytes(), "image/png", "11.png")
        with pytest.raises(HTTPException) as exc:
            await photo_service.upload(db_session, event.id, file11)
        assert exc.value.status_code == 400
        assert "Max" in exc.value.detail

    @pytest.mark.asyncio
    async def test_upload_rejects_invalid_content_type(
        self, db_session: Session, tmp_upload_dir: Path
    ) -> None:
        event = _make_event(db_session, "up_invtype")
        file = _upload_file(b"%PDF-1.4 fake", "application/pdf", "x.pdf")
        with pytest.raises(HTTPException) as exc:
            await photo_service.upload(db_session, event.id, file)
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_upload_rejects_non_image_bytes(
        self, db_session: Session, tmp_upload_dir: Path
    ) -> None:
        """Content-Type 만 맞고 실제 바이트는 이미지가 아님 → 400."""
        event = _make_event(db_session, "up_fake")
        file = _upload_file(b"definitely not an image", "image/png", "fake.png")
        with pytest.raises(HTTPException) as exc:
            await photo_service.upload(db_session, event.id, file)
        assert exc.value.status_code == 400


# -----------------------------------------------------------------------------
# List
# -----------------------------------------------------------------------------
class TestListByEvent:
    @pytest.mark.asyncio
    async def test_list_returns_sort_order_ascending(
        self, db_session: Session, tmp_upload_dir: Path
    ) -> None:
        event = _make_event(db_session, "list_sort")
        p1 = await photo_service.upload(
            db_session,
            event.id,
            _upload_file(_png_bytes(), "image/png", "1.png"),
        )
        p2 = await photo_service.upload(
            db_session,
            event.id,
            _upload_file(_png_bytes(), "image/png", "2.png"),
        )

        # sort_order 역전
        p1.sort_order = 5
        p2.sort_order = 1
        db_session.commit()

        results = photo_service.list_by_event(db_session, event.id)
        assert [p.id for p in results] == [p2.id, p1.id]

    def test_list_empty_event(
        self, db_session: Session, tmp_upload_dir: Path
    ) -> None:
        event = _make_event(db_session, "list_empty")
        assert photo_service.list_by_event(db_session, event.id) == []


# -----------------------------------------------------------------------------
# Delete
# -----------------------------------------------------------------------------
class TestDelete:
    @pytest.mark.asyncio
    async def test_delete_removes_file_and_row(
        self, db_session: Session, tmp_upload_dir: Path
    ) -> None:
        event = _make_event(db_session, "del_ok")
        photo = await photo_service.upload(
            db_session,
            event.id,
            _upload_file(_png_bytes(), "image/png", "x.png"),
        )
        abs_path = tmp_upload_dir.parent / photo.file_path
        assert abs_path.exists()

        photo_service.delete(db_session, photo.id)

        assert db_session.get(Photo, photo.id) is None
        assert not abs_path.exists()

    def test_delete_not_found(
        self, db_session: Session, tmp_upload_dir: Path
    ) -> None:
        with pytest.raises(HTTPException) as exc:
            photo_service.delete(db_session, "pho_missing")
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_missing_file_still_removes_db(
        self, db_session: Session, tmp_upload_dir: Path
    ) -> None:
        """파일이 먼저 사라져도 DB 삭제는 성공해야 한다 (경고만 로그)."""
        event = _make_event(db_session, "del_nofile")
        photo = await photo_service.upload(
            db_session,
            event.id,
            _upload_file(_png_bytes(), "image/png", "x.png"),
        )
        abs_path = tmp_upload_dir.parent / photo.file_path
        abs_path.unlink()
        assert not abs_path.exists()

        photo_service.delete(db_session, photo.id)
        assert db_session.get(Photo, photo.id) is None


# -----------------------------------------------------------------------------
# Caption
# -----------------------------------------------------------------------------
class TestUpdateCaption:
    @pytest.mark.asyncio
    async def test_update_caption_default_source_manual(
        self, db_session: Session, tmp_upload_dir: Path
    ) -> None:
        event = _make_event(db_session, "cap_m")
        photo = await photo_service.upload(
            db_session,
            event.id,
            _upload_file(_png_bytes(), "image/png", "x.png"),
        )
        updated = photo_service.update_caption(
            db_session, photo.id, "봄날의 오후"
        )
        assert updated.caption == "봄날의 오후"
        assert updated.caption_source == "manual"

    @pytest.mark.asyncio
    async def test_update_caption_with_ai_source(
        self, db_session: Session, tmp_upload_dir: Path
    ) -> None:
        event = _make_event(db_session, "cap_ai")
        photo = await photo_service.upload(
            db_session,
            event.id,
            _upload_file(_png_bytes(), "image/png", "x.png"),
        )
        updated = photo_service.update_caption(
            db_session, photo.id, "AI가 고른 문장", source="ai"
        )
        assert updated.caption_source == "ai"


# -----------------------------------------------------------------------------
# Toggle selection
# -----------------------------------------------------------------------------
class TestToggleSelection:
    @pytest.mark.asyncio
    async def test_toggle_flips_is_selected(
        self, db_session: Session, tmp_upload_dir: Path
    ) -> None:
        event = _make_event(db_session, "tog")
        photo = await photo_service.upload(
            db_session,
            event.id,
            _upload_file(_png_bytes(), "image/png", "x.png"),
        )
        assert photo.is_selected is True

        t1 = photo_service.toggle_selection(db_session, photo.id)
        assert t1.is_selected is False

        t2 = photo_service.toggle_selection(db_session, photo.id)
        assert t2.is_selected is True
