# @TASK P2-R1-T1 - Event SQLAlchemy 모델
# @SPEC specs/domain/resources.yaml#events
# @SPEC docs/planning/05-architecture.md#데이터베이스-스키마
# @TEST tests/models/test_event.py
"""
Event ORM 모델.

- id: 'evt_' 접두 + URL-safe 토큰 자동 생성
- couple_id: Couple FK (ON DELETE CASCADE — 커플 삭제 시 이벤트도 삭제)
- category: Category enum 의 값(str) 중 하나
- 관계: Event.couple (many-to-one), Couple.events (one-to-many)
- 복합 인덱스: idx_events_couple_date (couple_id, date) — 월별 조회 최적화
"""
from __future__ import annotations

import secrets
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.couple import Couple


def _generate_event_id() -> str:
    """'evt_' + URL-safe 토큰 (8바이트 ≈ 11자)."""
    return f"evt_{secrets.token_urlsafe(8)}"


class Event(Base):
    """결혼 준비 일정 ORM.

    Attributes:
        id: 'evt_xxxxxxxxxxx' 형태.
        couple_id: 소속 커플 (외래키, cascade delete).
        title: 일정 제목 (최대 200자).
        date: 일정 날짜.
        category: Category enum 값(str). Pydantic 레이어에서 검증.
        memo: 메모 (선택, Text).
        is_completed: 완료 여부.
        is_ai_generated: AI 가 생성한 일정인지 여부.
        created_at / updated_at: 감사용 타임스탬프 (UTC).
    """

    __tablename__ = "events"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=_generate_event_id
    )
    couple_id: Mapped[str] = mapped_column(
        ForeignKey("couples.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    memo: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_completed: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    is_ai_generated: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # 관계: Couple 과 양방향 연결.
    couple: Mapped["Couple"] = relationship(back_populates="events")

    __table_args__ = (
        Index("idx_events_couple_date", "couple_id", "date"),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<Event id={self.id!r} couple_id={self.couple_id!r} "
            f"title={self.title!r} date={self.date} category={self.category!r}>"
        )
