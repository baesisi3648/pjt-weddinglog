# @TASK P3-R1-T1 - Photo Pydantic 스키마
# @SPEC specs/domain/resources.yaml#photos
# @TEST tests/models/test_photo.py
"""
Photo 요청/응답 DTO (Pydantic v2).

- PhotoResponse: ORM → API 응답 (file_url derived field 포함)
- PhotoCaptionUpdate: PUT /caption body
- 업로드 입력은 multipart/form-data 로 라우터에서 직접 처리
  (Pydantic 입력 스키마는 불필요).
"""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field


class PhotoBase(BaseModel):
    """Photo 공통 필드."""

    file_path: str = Field(..., description="UPLOAD_DIR 기준 상대 경로")
    caption: str | None = Field(default=None, description="사진 캡션")
    caption_source: str | None = Field(
        default=None,
        description='"ai" | "template" | "manual" | null',
    )
    is_selected: bool = Field(default=True, description="앨범 포함 여부")
    sort_order: int = Field(default=0, description="정렬 순서")


class PhotoCaptionUpdate(BaseModel):
    """PUT /api/photos/{id}/caption body."""

    caption: str = Field(..., description="사진 캡션 (빈 문자열 허용)")
    caption_source: str | None = Field(
        default="manual",
        description='기본값 "manual" (프론트가 AI 선택 시 "ai"로 전달)',
    )


class PhotoResponse(PhotoBase):
    """Photo 응답 DTO — ORM 객체에서 from_attributes 로 생성.

    derived:
        file_url: 클라이언트에서 사용할 서빙 URL
                  (/api/photos/{id}/file 래퍼 엔드포인트).
    """

    model_config = ConfigDict(from_attributes=True)

    id: str
    event_id: str
    original_filename: str | None = None
    created_at: datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def file_url(self) -> str:
        """클라이언트 사용용 URL (래퍼 엔드포인트 경로)."""
        return f"/api/photos/{self.id}/file"
