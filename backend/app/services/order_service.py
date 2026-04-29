# @TASK P5-R1-T2 - Order 비즈니스 로직 서비스
# @SPEC specs/domain/resources.yaml#orders
# @TEST tests/services/test_order_service.py
"""
Order CRUD + 상태 전이.

- 순수 함수 스타일 (모듈 레벨 함수), 상태 없음.
- 생성 시 chapters_selected 검증: 총 photo_id 1개 이상 (빈 앨범 차단).
    * Pydantic 에서 1차 검증되지만 서비스 레이어에서도 방어 (직접 호출 경로 대비).
- update_status 는 OrderStateMachine 에 위임.
"""
from __future__ import annotations

import logging

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import Order
from app.schemas.enums import OrderStatus
from app.schemas.order import OrderCreate
from app.services.order_state_machine import OrderStateMachine

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Read
# -----------------------------------------------------------------------------
def get_or_404(db: Session, order_id: str) -> Order:
    """order_id 로 조회, 없으면 HTTPException(404)."""
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order not found: {order_id}",
        )
    return order


def list_by_couple(
    db: Session,
    couple_id: str,
    *,
    status_filter: str | None = None,
) -> list[Order]:
    """커플 소속 주문 목록 (status 필터 선택).

    정렬: created_at DESC (최신순).
    """
    stmt = select(Order).where(Order.couple_id == couple_id)
    if status_filter is not None:
        stmt = stmt.where(Order.status == status_filter)
    stmt = stmt.order_by(Order.created_at.desc())
    return list(db.execute(stmt).scalars().all())


# -----------------------------------------------------------------------------
# Create
# -----------------------------------------------------------------------------
def create(db: Session, couple_id: str, order_in: OrderCreate) -> Order:
    """새 주문 생성.

    Raises:
        ValueError: chapters_selected 가 빈 앨범일 때 (Pydantic 이 이미 막지만
            서비스 직접 호출 경로를 위한 방어).
    """
    total_photos = sum(
        len(ch.photo_ids) for ch in order_in.chapters_selected
    )
    if total_photos == 0:
        raise ValueError(
            "chapters_selected must contain at least 1 photo_id"
        )

    order = Order(
        couple_id=couple_id,
        format=order_in.format.value
        if hasattr(order_in.format, "value")
        else str(order_in.format),
        cover_type=order_in.cover_type.value
        if hasattr(order_in.cover_type, "value")
        else str(order_in.cover_type),
        quantity=order_in.quantity,
        chapters_selected=[
            ch.model_dump() for ch in order_in.chapters_selected
        ],
        album_layout=order_in.album_layout,
        recipient_name=order_in.recipient_name,
        recipient_phone=order_in.recipient_phone,
        recipient_address=order_in.recipient_address,
        status=OrderStatus.pending.value,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    logger.info(
        "Created order id=%s couple=%s photos=%d",
        order.id,
        couple_id,
        total_photos,
    )
    return order


# -----------------------------------------------------------------------------
# Status transition (M6)
# -----------------------------------------------------------------------------
def update_status(
    db: Session, order_id: str, target_status: str
) -> Order:
    """상태 전이 — OrderStateMachine 에 검증 위임.

    Raises:
        HTTPException(404): 주문 없음.
        HTTPException(400): 허용되지 않는 전이.
    """
    order = get_or_404(db, order_id)
    try:
        OrderStateMachine.transition(order.status, target_status)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    order.status = target_status
    db.commit()
    db.refresh(order)
    logger.info(
        "Order %s status transition → %s", order.id, target_status
    )
    return order
