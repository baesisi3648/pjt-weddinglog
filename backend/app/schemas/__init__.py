# @TASK P0-T6, P1-R1-T1, P2-R1-T1, P3-R1-T1, P4-R1-T1, P4-R1-T3, P5-R1-T1 - Pydantic 스키마 패키지
"""Pydantic schemas (요청/응답 DTO)."""
from app.schemas.album import (
    AlbumChapterSchema,
    AlbumComposeRequest,
    AlbumComposeResponse,
    AlbumLayoutSchema,
    AlbumPageSchema,
)
from app.schemas.couple import CoupleBase, CoupleCreate, CoupleResponse, CoupleUpdate
from app.schemas.enums import Category, CoverType, OrderFormat, OrderStatus
from app.schemas.event import EventBase, EventCreate, EventResponse, EventUpdate
from app.schemas.home import AlbumOrderDeadline, HomeSummary, PhotoCounts
from app.schemas.layouts import LAYOUT_TEMPLATES
from app.schemas.order import (
    ChapterSelectionSchema,
    OrderBase,
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
    OrderUpdate,
)
from app.schemas.photo import PhotoBase, PhotoCaptionUpdate, PhotoResponse
from app.schemas.timeline import TimelineChapter, TimelinePhoto, TimelineResponse

__all__ = [
    "LAYOUT_TEMPLATES",
    "AlbumChapterSchema",
    "AlbumComposeRequest",
    "AlbumComposeResponse",
    "AlbumLayoutSchema",
    "AlbumOrderDeadline",
    "AlbumPageSchema",
    "Category",
    "ChapterSelectionSchema",
    "CoupleBase",
    "CoupleCreate",
    "CoupleResponse",
    "CoupleUpdate",
    "CoverType",
    "EventBase",
    "EventCreate",
    "EventResponse",
    "EventUpdate",
    "HomeSummary",
    "OrderBase",
    "OrderCreate",
    "OrderFormat",
    "OrderResponse",
    "OrderStatus",
    "OrderStatusUpdate",
    "OrderUpdate",
    "PhotoBase",
    "PhotoCaptionUpdate",
    "PhotoCounts",
    "PhotoResponse",
    "TimelineChapter",
    "TimelinePhoto",
    "TimelineResponse",
]
