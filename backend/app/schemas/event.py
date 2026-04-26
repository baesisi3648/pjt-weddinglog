# @TASK P2-R1-T1 - Event Pydantic 스키마
# @SPEC specs/domain/resources.yaml#events
# @TEST tests/models/test_event.py
"""
Event 요청/응답 DTO (Pydantic v2).

- EventBase: 공통 필드 (title, date, category, memo)
- EventCreate(EventBase): 생성 입력
- EventUpdate: 부분 업데이트 (모든 필드 optional)
- EventResponse(EventBase): API 응답 (id, couple_id, 플래그, 타임스탬프)

category 는 Category enum 9개 값만 허용한다 (validator 로 강제).
"""
from __future__ import annotations

from datetime import date as _date
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator, model_validator

from app.schemas.enums import Category

_ALLOWED_CATEGORIES: set[str] = {c.value for c in Category}


def _validate_category(value: str) -> str:
    if value not in _ALLOWED_CATEGORIES:
        raise ValueError(
            f"category must be one of {sorted(_ALLOWED_CATEGORIES)}, got {value!r}"
        )
    return value


class EventBase(BaseModel):
    """이벤트 공통 필드."""

    title: str = Field(..., min_length=1, max_length=200, description="일정 제목")
    date: _date = Field(..., description="일정 시작 날짜")
    end_date: _date | None = Field(
        default=None,
        description="일정 종료 날짜 (선택). date 와 다르면 multi-day 이벤트.",
    )
    category: str = Field(
        ...,
        description="카테고리 (Category enum 9개 값 중 하나)",
    )
    memo: str | None = Field(default=None, description="메모")

    @field_validator("category")
    @classmethod
    def _check_category(cls, v: str) -> str:
        return _validate_category(v)

    @model_validator(mode="after")
    def _check_date_range(self) -> "EventBase":
        if self.end_date is not None and self.end_date < self.date:
            raise ValueError("end_date must be on or after date")
        return self


class EventCreate(EventBase):
    """이벤트 생성 입력."""


class EventUpdate(BaseModel):
    """이벤트 업데이트 입력 (모든 필드 optional)."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    date: _date | None = Field(default=None)
    end_date: _date | None = Field(default=None)
    category: str | None = Field(default=None)
    memo: str | None = Field(default=None)
    is_completed: bool | None = Field(default=None)

    @field_validator("category")
    @classmethod
    def _check_category(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return _validate_category(v)


class EventResponse(EventBase):
    """이벤트 응답 DTO — ORM 객체에서 from_attributes 로 생성."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    couple_id: str
    is_completed: bool
    is_ai_generated: bool
    created_at: datetime
    updated_at: datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def is_multi_day(self) -> bool:
        """end_date 가 date 보다 이후면 True."""
        return self.end_date is not None and self.end_date > self.date

    @computed_field  # type: ignore[prop-decorator]
    @property
    def duration_days(self) -> int:
        """이벤트 총 기간 (일). 단일 이벤트는 1."""
        if self.end_date is None:
            return 1
        return (self.end_date - self.date).days + 1
