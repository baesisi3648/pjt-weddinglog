# @TASK P5-BACKEND - AlbumLayout Pydantic 스키마 (Backend/Frontend 공통 계약)
# @SPEC docs/planning/05-architecture.md#zip-구조
# @TEST tests/routers/test_album.py
"""
AlbumLayout 스키마.

AI(OpenAI) 또는 규칙 기반 폴백이 생성한 앨범 구성을 표현한다.
Frontend 와 1:1 계약 — 필드 변경 시 양쪽 동시 업데이트 필수.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AlbumPageSchema(BaseModel):
    """앨범 페이지 1장."""

    model_config = ConfigDict(from_attributes=True)

    page_number: int = Field(..., ge=1, description="챕터 내 페이지 번호")
    template: Literal["T1", "T2", "T3", "T4", "T5"] = Field(
        ..., description="레이아웃 템플릿 코드"
    )
    photo_ids: list[str] = Field(
        ..., description="이 페이지에 배치될 photo_id (템플릿 photo_count 와 일치)"
    )
    caption: str | None = Field(default=None, description="페이지 캡션")


class AlbumChapterSchema(BaseModel):
    """앨범 챕터 (N개의 페이지로 구성)."""

    model_config = ConfigDict(from_attributes=True)

    chapter_number: int = Field(..., ge=1, description="챕터 번호 (1-based)")
    title: str = Field(..., description="챕터 제목")
    color: str = Field(
        ...,
        description="design-tokens 색상 키 (coral|lavender|mint|gold|gray)",
    )
    pages: list[AlbumPageSchema] = Field(..., description="페이지 목록")


class AlbumLayoutSchema(BaseModel):
    """최종 앨범 구성.

    Attributes:
        total_photos: 레이아웃에 포함된 총 사진 수.
        total_pages: 전체 페이지 수 (모든 챕터의 pages 합).
        chapters: 챕터 목록.
        generated_by: "ai" | "template" (생성 소스 구분).
    """

    model_config = ConfigDict(from_attributes=True)

    total_photos: int = Field(..., ge=0)
    total_pages: int = Field(..., ge=0)
    chapters: list[AlbumChapterSchema]
    generated_by: Literal["ai", "template"] = Field(
        ..., description="생성 소스"
    )


# -----------------------------------------------------------------------------
# Compose 요청/응답 DTO
# -----------------------------------------------------------------------------
class AlbumComposeRequest(BaseModel):
    """POST /api/couples/{id}/album/compose body."""

    selected_photo_ids: list[str] = Field(
        ..., min_length=1, description="앨범에 포함될 photo_id 목록 (최소 1장)"
    )


class AlbumComposeResponse(BaseModel):
    """앨범 구성 응답."""

    album_layout: AlbumLayoutSchema
    source: Literal["ai", "template"] = Field(
        ..., description='"ai" (OpenAI) 또는 "template" (폴백)'
    )
