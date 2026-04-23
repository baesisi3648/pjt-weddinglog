# @TASK P0-T6 - 공통 Enum 정의
# @SPEC specs/domain/resources.yaml
# @TEST tests/test_enums.py
"""
WeddingLog 전역 enum.

specs/domain/resources.yaml 의 값과 1:1 로 일치해야 한다.
값이 변경될 경우 tests/test_enums.py 가 실패하며,
프런트엔드의 enum 타입도 함께 업데이트해야 한다.
"""
from __future__ import annotations

from enum import Enum


class Category(str, Enum):
    """일정/체크리스트 카테고리 (9개).

    resources.yaml > events.fields.category 참조.
    """

    WEDDING_PHOTO = "WEDDING_PHOTO"
    STUDIO_DRESS_MAKEUP = "STUDIO_DRESS_MAKEUP"
    VENUE = "VENUE"
    GIFT = "GIFT"
    INVITATION = "INVITATION"
    REHEARSAL = "REHEARSAL"
    CEREMONY = "CEREMONY"
    HONEYMOON = "HONEYMOON"
    ETC = "ETC"


class OrderFormat(str, Enum):
    """앨범 판형.

    resources.yaml > orders.fields.format 참조.
    """

    SQUARE = "SQUARE"
    A4 = "A4"


class CoverType(str, Enum):
    """앨범 표지 타입.

    resources.yaml > orders.fields.cover_type 참조.
    """

    HARD = "HARD"
    SOFT = "SOFT"


class OrderStatus(str, Enum):
    """주문 상태 (소문자, 일방향 전이).

    resources.yaml > orders.constraints.status_transition 참조.
    pending → processing → completed (역방향 불가).
    """

    pending = "pending"
    processing = "processing"
    completed = "completed"
