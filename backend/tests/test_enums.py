# @TASK P0-T6 - 공통 Enum 검증
# @SPEC specs/domain/resources.yaml
"""
specs/domain/resources.yaml 에 정의된 enum 값과
app/schemas/enums.py 의 Python Enum 이 1:1 로 일치하는지 검증.
"""
from __future__ import annotations

from app.schemas.enums import Category, CoverType, OrderFormat, OrderStatus


# resources.yaml 에서 정의된 정적 리스트 (직접 참조 — 명세의 단일 진실원)
EXPECTED_CATEGORY_VALUES: list[str] = [
    "WEDDING_PHOTO",
    "STUDIO_DRESS_MAKEUP",
    "VENUE",
    "GIFT",
    "INVITATION",
    "REHEARSAL",
    "CEREMONY",
    "HONEYMOON",
    "ETC",
]

EXPECTED_ORDER_FORMAT_VALUES: list[str] = ["SQUARE", "A4"]
EXPECTED_COVER_TYPE_VALUES: list[str] = ["HARD", "SOFT"]
EXPECTED_ORDER_STATUS_VALUES: list[str] = ["pending", "processing", "completed"]


class TestCategoryEnum:
    def test_category_has_nine_values(self) -> None:
        assert len(list(Category)) == 9

    def test_category_values_match_spec(self) -> None:
        actual = [c.value for c in Category]
        assert actual == EXPECTED_CATEGORY_VALUES

    def test_category_is_string_enum(self) -> None:
        assert Category.WEDDING_PHOTO.value == "WEDDING_PHOTO"
        assert isinstance(Category.WEDDING_PHOTO.value, str)


class TestOrderFormatEnum:
    def test_order_format_has_two_values(self) -> None:
        assert len(list(OrderFormat)) == 2

    def test_order_format_values_match_spec(self) -> None:
        actual = [f.value for f in OrderFormat]
        assert actual == EXPECTED_ORDER_FORMAT_VALUES


class TestCoverTypeEnum:
    def test_cover_type_has_two_values(self) -> None:
        assert len(list(CoverType)) == 2

    def test_cover_type_values_match_spec(self) -> None:
        actual = [c.value for c in CoverType]
        assert actual == EXPECTED_COVER_TYPE_VALUES


class TestOrderStatusEnum:
    def test_order_status_has_three_values(self) -> None:
        assert len(list(OrderStatus)) == 3

    def test_order_status_values_match_spec(self) -> None:
        actual = [s.value for s in OrderStatus]
        assert actual == EXPECTED_ORDER_STATUS_VALUES

    def test_order_status_is_lowercase(self) -> None:
        """status 는 소문자 (resources.yaml constraint)."""
        for s in OrderStatus:
            assert s.value == s.value.lower()
