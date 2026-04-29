# 가격표 단일 소스.
# @SPEC specs/domain/resources.yaml#orders.derived (가격 계산 규칙)
#
# 이 모듈은 주문 가격 계산에 사용되는 모든 상수의 *단일 진실의 원천* 이다.
# - schemas/order.py 의 OrderResponse.@computed_field (실시간 응답)
# - services/export_service.py 의 ZIP order.json 직렬화
# 두 곳에서 동일하게 import 한다. 한쪽만 수정하면 익스포트 가격이 어긋나는 위험을
# 회피하기 위해 분리.
#
# 공식: total_price = (base_price + cover_surcharge) * quantity
from __future__ import annotations

from app.schemas.enums import CoverType, OrderFormat

# format → 기본 가격 (KRW). 정사각형이 가로 양장본보다 저렴.
BASE_PRICES: dict[str, int] = {
    OrderFormat.SQUARE.value: 150_000,
    OrderFormat.A4.value: 180_000,
}

# cover_type → 추가 비용 (KRW). 하드커버는 +20,000, 소프트커버는 추가 비용 없음.
COVER_SURCHARGES: dict[str, int] = {
    CoverType.HARD.value: 20_000,
    CoverType.SOFT.value: 0,
}


def base_price_for(fmt: str) -> int:
    """판형의 기본 가격. 미정의 값은 0."""
    return BASE_PRICES.get(fmt, 0)


def cover_surcharge_for(cover: str) -> int:
    """표지 타입의 추가 비용. 미정의 값은 0."""
    return COVER_SURCHARGES.get(cover, 0)


def calc_total_price(fmt: str, cover: str, quantity: int) -> int:
    """주문 총액 계산.

    Args:
        fmt: OrderFormat.value (예: "SQUARE", "A4")
        cover: CoverType.value (예: "HARD", "SOFT")
        quantity: 1 이상의 정수

    Returns:
        (base + surcharge) × quantity. 미정의 format / cover 는 0 으로 처리.
    """
    return (base_price_for(fmt) + cover_surcharge_for(cover)) * quantity
