# @TASK P5-R1-T3 - Order REST API 라우터
# @SPEC docs/planning/05-architecture.md#api-엔드포인트
# @TEST tests/routers/test_orders.py
"""
Order 엔드포인트.

- POST  /api/couples/{couple_id}/orders           → 201 Created (OrderResponse)
- GET   /api/couples/{couple_id}/orders?status=?  → list[OrderResponse]
- GET   /api/orders/{order_id}                    → OrderResponse (404)
- PATCH /api/orders/{order_id}/status             → OrderResponse (400 invalid)

라우터는 얇게 — 실제 비즈니스 로직은 OrderService, 상태 전이는 OrderStateMachine.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
)
from app.services import couple_service, order_service

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# /api/couples/{couple_id}/orders — 생성 + 목록
# -----------------------------------------------------------------------------
couples_orders_router = APIRouter(
    prefix="/api/couples/{couple_id}/orders", tags=["orders"]
)


@couples_orders_router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="주문 생성",
    description=(
        "앨범 주문을 생성한다. chapters_selected 는 최소 1장의 photo_id 를 포함해야 "
        "하며, 가격/페이지 수는 응답의 computed_field 로 계산된다."
    ),
)
def create_order(
    couple_id: str,
    payload: OrderCreate,
    db: Session = Depends(get_db),
) -> OrderResponse:
    """주문 생성 → 201 Created."""
    # couple 존재 검증 → 404
    couple_service.get_or_404(db, couple_id)

    try:
        order = order_service.create(db, couple_id, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc

    return OrderResponse.model_validate(order)


@couples_orders_router.get(
    "",
    response_model=list[OrderResponse],
    summary="커플 주문 목록",
    description=(
        "해당 커플의 모든 주문을 반환한다 (최신순). `status` 쿼리로 필터링 가능."
    ),
)
def list_orders(
    couple_id: str,
    status_filter: str | None = Query(
        default=None,
        alias="status",
        description="pending|processing|completed (선택)",
    ),
    db: Session = Depends(get_db),
) -> list[OrderResponse]:
    """커플 주문 목록."""
    couple_service.get_or_404(db, couple_id)
    orders = order_service.list_by_couple(
        db, couple_id, status_filter=status_filter
    )
    return [OrderResponse.model_validate(o) for o in orders]


# -----------------------------------------------------------------------------
# /api/orders/{order_id} — 단건 조회 + 상태 전이
# -----------------------------------------------------------------------------
orders_router = APIRouter(prefix="/api/orders", tags=["orders"])


@orders_router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="주문 단건 조회",
)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
) -> OrderResponse:
    """order_id 로 주문 조회 (404 시 HTTPException)."""
    order = order_service.get_or_404(db, order_id)
    return OrderResponse.model_validate(order)


@orders_router.patch(
    "/{order_id}/status",
    response_model=OrderResponse,
    summary="주문 상태 전이",
    description=(
        "pending → processing → completed 순서로만 전이 가능. "
        "역방향/단계건너뛰기/동일상태는 400 Bad Request."
    ),
)
def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
) -> OrderResponse:
    """주문 상태 전이."""
    target = (
        payload.target_status.value
        if hasattr(payload.target_status, "value")
        else str(payload.target_status)
    )
    order = order_service.update_status(db, order_id, target)
    return OrderResponse.model_validate(order)
