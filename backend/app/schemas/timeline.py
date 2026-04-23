# @TASK P4-R1-T1 - Timeline 응답 Pydantic 스키마
# @SPEC specs/screens/04_timeline.yaml
# @SPEC docs/planning/06-tasks.md#p4-r1-t2-timeline-라우터
# @TEST tests/services/test_timeline_service.py, tests/routers/test_timeline.py
"""
Timeline 응답 DTO.

TimelineService.get_timeline() 가 반환하는 dict 를 검증/직렬화하기 위한
Pydantic v2 모델. Swagger 에도 그대로 노출된다.
"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class TimelinePhoto(BaseModel):
    """Timeline 내부에 들어가는 사진 DTO (요약형).

    PhotoResponse 보다 이벤트 정보(event_date, event_title, category)가 붙어있고,
    업로드 관련 필드(file_path, original_filename)는 제외되어 있다.
    """

    model_config = ConfigDict(from_attributes=True)

    id: str
    file_url: str
    caption: str | None = None
    caption_source: str | None = None
    is_selected: bool
    event_date: str = Field(..., description="ISO YYYY-MM-DD")
    event_title: str
    category: str


class TimelineChapter(BaseModel):
    """Timeline 챕터 DTO."""

    model_config = ConfigDict(from_attributes=True)

    chapter_number: int = Field(..., description="표시 순서 (1-based)")
    key: str = Field(..., description="챕터 식별 키 (wedding_photo 등)")
    title: str = Field(..., description="사용자에게 표시할 제목")
    color: str = Field(..., description="design-tokens 색상 키 (coral 등)")
    categories: list[str] = Field(
        ..., description="이 챕터에 속하는 Category enum 값 목록"
    )
    photo_count: int = Field(..., ge=0)
    photos: list[TimelinePhoto]


class TimelineResponse(BaseModel):
    """GET /api/couples/{couple_id}/timeline 응답."""

    model_config = ConfigDict(from_attributes=True)

    total_photos: int = Field(..., ge=0)
    selected_photos: int = Field(..., ge=0)
    total_pages_estimated: int = Field(
        ...,
        ge=0,
        description="ceil(selected_photos / 2.5) — 앨범 페이지 수 추정",
    )
    chapters: list[TimelineChapter]
