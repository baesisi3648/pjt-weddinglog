# @TASK P1-R1-T1 - Couple Pydantic 스키마
# @SPEC specs/domain/resources.yaml#couples
# @TEST tests/models/test_couple.py
"""
Couple 요청/응답 DTO (Pydantic v2).

- CoupleBase: 공통 필드
- CoupleCreate: 생성 입력 (필수 필드 포함)
- CoupleUpdate: 부분 업데이트 (모든 필드 optional)
- CoupleResponse: API 응답 (id, created_at, d_day derived)
"""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field


class CoupleBase(BaseModel):
    """공통 커플 필드."""

    groom_name: str = Field(..., min_length=2, max_length=100, description="신랑 이름")
    bride_name: str = Field(..., min_length=2, max_length=100, description="신부 이름")
    wedding_date: date = Field(..., description="결혼 예정일 (D-day 기준점)")
    profile_photo_path: str | None = Field(
        default=None, description="프로필 사진 경로"
    )
    tagline: str | None = Field(default=None, max_length=200, description="한 줄 소개")


class CoupleCreate(CoupleBase):
    """커플 생성 입력."""


class CoupleUpdate(BaseModel):
    """커플 업데이트 입력 (모든 필드 optional — 부분 업데이트 지원)."""

    groom_name: str | None = Field(default=None, min_length=2, max_length=100)
    bride_name: str | None = Field(default=None, min_length=2, max_length=100)
    wedding_date: date | None = Field(default=None)
    profile_photo_path: str | None = Field(default=None)
    tagline: str | None = Field(default=None, max_length=200)


class CoupleResponse(CoupleBase):
    """커플 응답 DTO — ORM 객체에서 `from_attributes` 로 생성.

    d_day 는 computed_field 로 wedding_date 기준 계산된다.
    (음수=미래, 양수=과거, 0=당일)
    """

    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def d_day(self) -> int:
        """wedding_date 기준 D-day (음수=D-N 미래, 양수=D+N 과거, 0=당일)."""
        return (date.today() - self.wedding_date).days
