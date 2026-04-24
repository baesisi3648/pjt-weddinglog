# @TASK P5-R1-T1 - Order SQLAlchemy 모델
# @SPEC specs/domain/resources.yaml#orders
# @SPEC docs/planning/05-architecture.md#데이터베이스-스키마
# @SPEC docs/planning/council-report.md#B2
# @TEST tests/models/test_order.py
"""
Order ORM 모델.

- id: 'ord_' 접두 + URL-safe 토큰 (secrets.token_urlsafe(12), unguessable)
  * Council B7 보안 권고: 순차 ID(ord_YYYYMMDD_001) 대신 unguessable 토큰.
- couple_id: Couple FK (ON DELETE CASCADE)
- format / cover_type: Pydantic 레이어에서 enum 검증 (SQUARE|A4, HARD|SOFT)
- quantity: 1-10 (Pydantic 검증)
- chapters_selected: JSON — 사용자가 Timeline Step 1에서 선택한 사진 목록.
    구조: [{ chapter_number, title, photo_ids: [] }, ...]
- album_layout: JSON | None — AI 또는 템플릿으로 생성된 최종 앨범 구성.
    (별도 POST /api/couples/{id}/album/compose 호출 결과)
- recipient_*: 수령인 정보
- status: pending|processing|completed (일방향 전이, OrderStateMachine 에서 enforce)
"""
from __future__ import annotations

import secrets
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    JSON,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.couple import Couple


def _generate_order_id() -> str:
    """'ord_' + URL-safe 토큰 (12바이트 ≈ 16자, unguessable).

    Council B7 보안 권고: 순차 ID(ord_YYYYMMDD_001)는 추측 가능하므로
    외부 노출되는 모든 리소스 ID 는 secrets.token_urlsafe 기반으로 생성.
    """
    return f"ord_{secrets.token_urlsafe(12)}"


class Order(Base):
    """앨범 주문 ORM.

    Attributes:
        id: 'ord_xxxxxxxxxxxxxxxx' — unguessable 토큰.
        couple_id: 소속 커플 (외래키, cascade delete).
        format: 앨범 판형 ('SQUARE' | 'A4').
        cover_type: 표지 타입 ('HARD' | 'SOFT').
        quantity: 주문 수량 (1-10, Pydantic 에서 검증).
        chapters_selected: JSON — [{chapter_number, title, photo_ids:[]}].
        album_layout: JSON | None — AI/템플릿 기반 앨범 구성 결과.
        recipient_name: 수령인 이름.
        recipient_phone: 수령인 연락처 (010-xxxx-xxxx 형식).
        recipient_address: 배송 주소.
        status: 주문 상태 (pending/processing/completed, default pending).
        created_at / updated_at: 타임스탬프 (UTC).
    """

    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=_generate_order_id
    )
    couple_id: Mapped[str] = mapped_column(
        ForeignKey("couples.id", ondelete="CASCADE"), nullable=False, index=True
    )
    format: Mapped[str] = mapped_column(String(20), nullable=False)
    cover_type: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    chapters_selected: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, nullable=False
    )
    album_layout: Mapped[dict[str, Any] | None] = mapped_column(
        JSON, nullable=True
    )
    recipient_name: Mapped[str] = mapped_column(String(100), nullable=False)
    recipient_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    recipient_address: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False, index=True
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

    # 관계: Couple 과 양방향 (many-to-one).
    couple: Mapped["Couple"] = relationship(back_populates="orders")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<Order id={self.id!r} couple_id={self.couple_id!r} "
            f"format={self.format!r} cover_type={self.cover_type!r} "
            f"quantity={self.quantity} status={self.status!r}>"
        )
