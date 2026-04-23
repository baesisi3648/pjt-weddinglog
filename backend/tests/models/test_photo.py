# @TASK P3-R1-T1 - Photo 모델 + 스키마 단위 테스트
# @SPEC specs/domain/resources.yaml#photos
# @SPEC docs/planning/council-report.md#B7
"""
Photo SQLAlchemy 모델 및 Pydantic 스키마 단위 테스트.

- id 'pho_' 접두 + unguessable (secrets.token_urlsafe(16))
- event_id FK (ON DELETE CASCADE)
- is_selected 기본 True, sort_order 기본 0
- Event → Photo cascade
- PhotoResponse.file_url computed field
"""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.models.event import Event
from app.models.photo import Photo
from app.schemas.enums import Category
from app.schemas.photo import PhotoCaptionUpdate, PhotoResponse


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def _make_event(db: Session, suffix: str = "photo") -> Event:
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
# Photo 모델
# -----------------------------------------------------------------------------
class TestPhotoModel:
    def test_id_auto_generates_with_pho_prefix(self, db_session: Session) -> None:
        event = _make_event(db_session, "pho_id")
        photo = Photo(
            event_id=event.id,
            file_path=f"photos/{event.id}/dummy.jpg",
        )
        db_session.add(photo)
        db_session.flush()
        assert photo.id.startswith("pho_")
        # secrets.token_urlsafe(16) → 22자 base64 + "pho_" = 26자 이상
        assert len(photo.id) >= 20

    def test_id_is_unguessable_length(self, db_session: Session) -> None:
        """Council B7: token_urlsafe(16) 기반이면 충분히 긴 ID."""
        event = _make_event(db_session, "pho_unguess")
        photos = [
            Photo(event_id=event.id, file_path=f"photos/{event.id}/{i}.jpg")
            for i in range(3)
        ]
        db_session.add_all(photos)
        db_session.flush()
        ids = {p.id for p in photos}
        assert len(ids) == 3  # 모두 고유
        for pid in ids:
            # "pho_" + 22글자 (base64 22 = 16바이트)
            assert len(pid) >= 20

    def test_defaults_is_selected_true(self, db_session: Session) -> None:
        event = _make_event(db_session, "pho_def")
        photo = Photo(
            event_id=event.id,
            file_path=f"photos/{event.id}/d.jpg",
        )
        db_session.add(photo)
        db_session.flush()
        assert photo.is_selected is True
        assert photo.sort_order == 0
        assert photo.caption is None
        assert photo.caption_source is None

    def test_created_at_set(self, db_session: Session) -> None:
        event = _make_event(db_session, "pho_ts")
        photo = Photo(event_id=event.id, file_path="x.jpg")
        db_session.add(photo)
        db_session.flush()
        assert isinstance(photo.created_at, datetime)

    def test_event_relationship_back_populates(
        self, db_session: Session
    ) -> None:
        """Event.photos, Photo.event 양방향."""
        event = _make_event(db_session, "pho_rel")
        photo = Photo(event_id=event.id, file_path="x.jpg")
        db_session.add(photo)
        db_session.flush()
        db_session.refresh(event)

        assert photo.event is not None
        assert photo.event.id == event.id
        assert photo in event.photos

    def test_cascade_delete_photos_when_event_deleted(
        self, db_session: Session
    ) -> None:
        """이벤트 삭제 시 속한 사진이 함께 삭제 (ORM cascade)."""
        event = _make_event(db_session, "pho_cascade")
        photo = Photo(event_id=event.id, file_path="x.jpg")
        db_session.add(photo)
        db_session.flush()
        photo_id = photo.id

        db_session.refresh(event)
        _ = event.photos  # 컬렉션 강제 로드

        db_session.delete(event)
        db_session.flush()

        assert db_session.get(Photo, photo_id) is None


# -----------------------------------------------------------------------------
# Pydantic — PhotoResponse
# -----------------------------------------------------------------------------
class TestPhotoResponseSchema:
    def test_response_from_attributes_and_file_url(
        self, db_session: Session
    ) -> None:
        event = _make_event(db_session, "pho_resp")
        photo = Photo(
            event_id=event.id,
            file_path=f"photos/{event.id}/x.png",
            caption="맑은 하늘",
            caption_source="manual",
            is_selected=True,
            sort_order=1,
            original_filename="uploaded.png",
        )
        db_session.add(photo)
        db_session.flush()

        resp = PhotoResponse.model_validate(photo)
        assert resp.id == photo.id
        assert resp.event_id == event.id
        assert resp.caption == "맑은 하늘"
        assert resp.caption_source == "manual"
        assert resp.is_selected is True
        assert resp.sort_order == 1
        assert resp.original_filename == "uploaded.png"
        # computed field: /api/photos/{id}/file
        assert resp.file_url == f"/api/photos/{photo.id}/file"


class TestPhotoCaptionUpdateSchema:
    def test_default_source_is_manual(self) -> None:
        upd = PhotoCaptionUpdate(caption="새 캡션")
        assert upd.caption == "새 캡션"
        assert upd.caption_source == "manual"

    def test_source_ai_override(self) -> None:
        upd = PhotoCaptionUpdate(caption="가을 햇살", caption_source="ai")
        assert upd.caption_source == "ai"
