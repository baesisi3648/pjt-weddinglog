# @TASK P4-R1-T3, P4-R1-T4 - Home 응답 Pydantic 스키마
# @SPEC specs/screens/01_home.yaml
# @SPEC docs/planning/06-tasks.md#p4-r1-t3-home용-집계-서비스
# @TEST tests/services/test_home_service.py, tests/routers/test_home.py
"""
Home 응답 DTO.

HomeService.get_home_summary() 가 반환하는 dict 를 Pydantic 으로 검증·직렬화.
Swagger 스키마도 이 모델을 기준으로 생성된다.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.couple import CoupleResponse
from app.schemas.event import EventResponse
from app.schemas.photo import PhotoResponse


class PhotoCounts(BaseModel):
    """사진 총계·선택 수 집계."""

    total: int = Field(..., ge=0, description="해당 커플의 총 사진 수")
    selected: int = Field(..., ge=0, description="is_selected=True 사진 수")


UrgencyLiteral = Literal["normal", "warning", "urgent", "expired"]


class AlbumOrderDeadline(BaseModel):
    """앨범 주문 추천 기한 정보 (Council B3 타이밍 UX)."""

    recommended_date: str = Field(
        ..., description="권장 주문일 (ISO YYYY-MM-DD, wedding_date - 21일)"
    )
    days_remaining: int = Field(
        ...,
        description="recommended_date - today (일). 음수면 권장일 경과.",
    )
    urgency: UrgencyLiteral = Field(
        ...,
        description=(
            "normal: D-21 초과 · warning: D-21~D-14 · urgent: D-14 이하 · "
            "expired: wedding_date 가 과거"
        ),
    )


class HomeSummary(BaseModel):
    """GET /api/couples/{couple_id}/home 응답."""

    model_config = ConfigDict(from_attributes=True)

    couple: CoupleResponse
    upcoming_events: list[EventResponse] = Field(
        default_factory=list,
        description="오늘 이후의 이벤트 date ASC 최대 3건",
    )
    recent_photos: list[PhotoResponse] = Field(
        default_factory=list,
        description="커플 전체 사진 중 created_at DESC 최대 6건",
    )
    photo_counts: PhotoCounts
    album_order_deadline: AlbumOrderDeadline
