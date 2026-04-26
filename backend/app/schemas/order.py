# @TASK P5-R1-T1 - Order Pydantic 스키마
# @SPEC specs/domain/resources.yaml#orders
# @SPEC docs/planning/council-report.md#B2
# @TEST tests/models/test_order.py, tests/routers/test_orders.py
"""
Order 요청/응답 DTO (Pydantic v2).

Council B2 반영:
    OrderResponse 는 `@computed_field` 로 파생 가격 필드 4개를 제공한다:
        - total_price         = quantity * base_price + cover_surcharge * quantity
        - total_pages_estimated = album_layout.total_pages (없으면 ceil(photos/2.5))
        - base_price          = SQUARE(150000) | A4(180000)
        - cover_surcharge     = HARD(20000) | SOFT(0)

Council 엣지케이스:
    chapters_selected 는 최소 1개 이상의 photo_id 가 있어야 한다 (빈 앨범 차단).
"""
from __future__ import annotations

import math
import re
from datetime import datetime
from typing import Any

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    computed_field,
    field_validator,
)

from app.schemas.enums import CoverType, OrderFormat, OrderStatus

# -----------------------------------------------------------------------------
# 가격표 (B2 — resources.yaml.derived 계약과 1:1 동기)
# -----------------------------------------------------------------------------
_BASE_PRICES: dict[str, int] = {
    OrderFormat.SQUARE.value: 150000,
    OrderFormat.A4.value: 180000,
}

_COVER_SURCHARGES: dict[str, int] = {
    CoverType.HARD.value: 20000,
    CoverType.SOFT.value: 0,
}

# 전화번호 검증 정규식 — 하이픈 없거나 있어도 OK. 저장 시 자동 정규화.
# 허용: "01012345678", "010-1234-5678", "010 1234 5678"
_PHONE_REGEX = re.compile(r"^010[-\s]?\d{3,4}[-\s]?\d{4}$")


class ChapterSelectionSchema(BaseModel):
    """선택 챕터 1개.

    Timeline Step 1 에서 사용자가 챕터별로 포함할 사진 ID 를 선택한 결과.
    """

    chapter_number: int = Field(..., ge=1, description="챕터 표시 순서")
    title: str = Field(..., min_length=1, description="챕터 제목")
    photo_ids: list[str] = Field(
        default_factory=list, description="이 챕터에서 선택된 사진 ID 목록"
    )


# -----------------------------------------------------------------------------
# Base / Create / Update
# -----------------------------------------------------------------------------
class OrderBase(BaseModel):
    """주문 공통 필드."""

    format: OrderFormat = Field(..., description="앨범 판형")
    cover_type: CoverType = Field(..., description="표지 타입")
    quantity: int = Field(..., ge=1, le=10, description="주문 수량 (1-10)")
    chapters_selected: list[ChapterSelectionSchema] = Field(
        ..., description="선택된 챕터 목록 (최소 1장 이상 사진 필수)"
    )
    album_layout: dict[str, Any] | None = Field(
        default=None,
        description="AI/템플릿으로 생성된 앨범 구성 (AlbumLayoutSchema)",
    )
    recipient_name: str = Field(
        ..., min_length=2, max_length=100, description="수령인 이름"
    )
    recipient_phone: str = Field(
        ..., description="수령인 연락처 (010-xxxx-xxxx)"
    )
    recipient_address: str = Field(
        ..., min_length=5, max_length=500, description="수령인 주소"
    )

    @field_validator("recipient_phone")
    @classmethod
    def _validate_phone(cls, v: str) -> str:
        # 하이픈/공백 제거하고 검증 후 표준 형식("010-xxxx-xxxx")으로 정규화.
        digits = re.sub(r"[\s-]", "", v)
        if not re.fullmatch(r"010\d{7,8}", digits):
            raise ValueError(
                "recipient_phone must contain 11 digits starting with 010"
            )
        # 정규화: 010-xxxx-xxxx (8자리) 또는 010-xxx-xxxx (7자리, 구형).
        if len(digits) == 11:
            return f"{digits[:3]}-{digits[3:7]}-{digits[7:]}"
        return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"

    @field_validator("chapters_selected")
    @classmethod
    def _validate_chapters_nonempty(
        cls, v: list[ChapterSelectionSchema]
    ) -> list[ChapterSelectionSchema]:
        """Council 엣지케이스: 빈 앨범 차단 — 총 photo_id 가 최소 1개 이상."""
        total_photos = sum(len(ch.photo_ids) for ch in v)
        if total_photos == 0:
            raise ValueError(
                "chapters_selected must contain at least 1 photo_id "
                "(empty album is not allowed)"
            )
        return v


class OrderCreate(OrderBase):
    """주문 생성 입력."""


class OrderUpdate(BaseModel):
    """주문 부분 업데이트 (현 Phase 에서는 album_layout 만 의미 있음)."""

    album_layout: dict[str, Any] | None = Field(default=None)


class OrderStatusUpdate(BaseModel):
    """PATCH /api/orders/{id}/status body."""

    target_status: OrderStatus = Field(..., description="전이 목표 상태")


# -----------------------------------------------------------------------------
# Response (B2 — computed_field 4개)
# -----------------------------------------------------------------------------
class OrderResponse(OrderBase):
    """주문 응답 DTO — ORM → from_attributes.

    Computed fields (B2):
        - base_price: format 별 기본가
        - cover_surcharge: cover_type 별 추가금
        - total_price: (base + surcharge) * quantity
        - total_pages_estimated: album_layout.total_pages (없으면 ceil(사진수/2.5))
    """

    model_config = ConfigDict(from_attributes=True)

    id: str
    couple_id: str
    status: OrderStatus
    created_at: datetime
    updated_at: datetime

    # ---- Computed fields ----------------------------------------------------
    @computed_field  # type: ignore[prop-decorator]
    @property
    def base_price(self) -> int:
        """format 에 따른 기본가 (SQUARE=150000, A4=180000)."""
        fmt = self.format.value if hasattr(self.format, "value") else self.format
        return _BASE_PRICES.get(str(fmt), 0)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cover_surcharge(self) -> int:
        """cover_type 추가금 (HARD=20000, SOFT=0)."""
        cov = (
            self.cover_type.value
            if hasattr(self.cover_type, "value")
            else self.cover_type
        )
        return _COVER_SURCHARGES.get(str(cov), 0)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def total_price(self) -> int:
        """총액 = (기본가 + 표지추가금) * 수량."""
        return (self.base_price + self.cover_surcharge) * self.quantity

    @computed_field  # type: ignore[prop-decorator]
    @property
    def total_pages_estimated(self) -> int:
        """예상 페이지 수.

        - album_layout.total_pages 값이 존재하면 우선.
        - 없으면 chapters_selected 의 총 photo_id 수 / 2.5 를 ceil.
        """
        if isinstance(self.album_layout, dict):
            tp = self.album_layout.get("total_pages")
            if isinstance(tp, int) and tp >= 0:
                return tp

        total_photos = sum(
            len(ch.photo_ids) for ch in self.chapters_selected
        )
        return math.ceil(total_photos / 2.5) if total_photos else 0
