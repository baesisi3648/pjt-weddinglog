# @TASK P3-R1-T1 - Photo SQLAlchemy 모델
# @SPEC specs/domain/resources.yaml#photos
# @SPEC docs/planning/council-report.md#B7
# @TEST tests/models/test_photo.py
"""
Photo ORM 모델.

- id: 'pho_' 접두 + `secrets.token_urlsafe(16)` 기반 unguessable UUID
  (외부 노출 가능하지만 추측 불가 — Council B7 보안 권고).
- event_id: Event FK (ON DELETE CASCADE).
- file_path: UPLOAD_DIR 상대 경로 (e.g. "photos/{event_id}/{photo_id}.jpg").
- caption / caption_source: AI/템플릿/수동 구분.
- is_selected: 앨범 포함 여부 (기본 True).
- sort_order: Timeline/앨범 정렬용 (기본 0).
"""
from __future__ import annotations

import secrets
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.event import Event


def _generate_photo_id() -> str:
    """'pho_' + URL-safe 토큰 (16바이트 ≈ 22자, 추측 불가)."""
    return f"pho_{secrets.token_urlsafe(16)}"


class Photo(Base):
    """일정 첨부 사진 ORM.

    Attributes:
        id: 'pho_xxxxxxxxxxxxxxxxxxxxx' — unguessable, 외부 노출 가능.
        event_id: 소속 이벤트 (외래키, cascade delete).
        file_path: UPLOAD_DIR 기준 상대 경로.
        original_filename: 업로드 원본 파일명 (감사용, 선택).
        caption: 사진 캡션 (선택).
        caption_source: "ai" | "template" | "manual" | None.
        is_selected: 앨범 포함 여부 (기본 True).
        sort_order: 정렬 순서 (기본 0).
        created_at: 생성 시각 (UTC).
    """

    __tablename__ = "photos"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=_generate_photo_id
    )
    event_id: Mapped[str] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    original_filename: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)
    caption_source: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    is_selected: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # 관계: Event 와 양방향.
    event: Mapped["Event"] = relationship(back_populates="photos")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<Photo id={self.id!r} event_id={self.event_id!r} "
            f"file_path={self.file_path!r} is_selected={self.is_selected}>"
        )
