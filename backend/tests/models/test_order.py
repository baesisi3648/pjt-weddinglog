# @TASK P5-R1-T1 - Order 모델 + 스키마 단위 테스트
# @SPEC specs/domain/resources.yaml#orders
"""
Order 모델과 Pydantic 스키마의 기본 계약 테스트.

- id 자동 생성 ('ord_' 접두, unguessable)
- chapters_selected JSON, album_layout nullable
- Pydantic: quantity 범위, phone regex, empty chapters 차단
- OrderResponse computed fields (base_price, cover_surcharge, total_price, total_pages_estimated)
"""
from __future__ import annotations

from datetime import date

import pytest
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.models.order import Order
from app.schemas.order import (
    ChapterSelectionSchema,
    OrderCreate,
    OrderResponse,
)


# -----------------------------------------------------------------------------
# 모델 레이어
# -----------------------------------------------------------------------------
def _seed_couple(db: Session) -> Couple:
    c = Couple(
        id="cpl_testorder",
        groom_name="철수",
        bride_name="영희",
        wedding_date=date(2026, 10, 25),
    )
    db.add(c)
    db.commit()
    return c


def test_order_id_auto_generated_with_prefix(db_session: Session) -> None:
    couple = _seed_couple(db_session)
    order = Order(
        couple_id=couple.id,
        format="SQUARE",
        cover_type="HARD",
        quantity=1,
        chapters_selected=[{"chapter_number": 1, "title": "웨딩", "photo_ids": ["pho_x"]}],
        recipient_name="김철수",
        recipient_phone="010-1234-5678",
        recipient_address="서울시 강남구 테헤란로 1",
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    assert order.id.startswith("ord_")
    assert len(order.id) > 10  # unguessable 토큰 길이 확보
    assert order.status == "pending"  # default
    assert order.album_layout is None


def test_order_chapters_selected_is_json(db_session: Session) -> None:
    couple = _seed_couple(db_session)
    chapters = [
        {"chapter_number": 1, "title": "웨딩", "photo_ids": ["pho_a", "pho_b"]},
        {"chapter_number": 2, "title": "본식", "photo_ids": ["pho_c"]},
    ]
    order = Order(
        couple_id=couple.id,
        format="A4",
        cover_type="SOFT",
        quantity=2,
        chapters_selected=chapters,
        recipient_name="김철수",
        recipient_phone="010-1234-5678",
        recipient_address="서울 어딘가",
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    assert order.chapters_selected == chapters
    assert len(order.chapters_selected) == 2


# -----------------------------------------------------------------------------
# 스키마 검증
# -----------------------------------------------------------------------------
def _valid_payload() -> dict:
    return {
        "format": "SQUARE",
        "cover_type": "HARD",
        "quantity": 1,
        "chapters_selected": [
            {
                "chapter_number": 1,
                "title": "웨딩",
                "photo_ids": ["pho_a"],
            }
        ],
        "recipient_name": "김철수",
        "recipient_phone": "010-1234-5678",
        "recipient_address": "서울시 강남구 테헤란로 1",
    }


def test_order_create_accepts_valid_payload() -> None:
    OrderCreate.model_validate(_valid_payload())


def test_order_create_rejects_empty_photos() -> None:
    """chapters 는 있지만 photo_ids 가 모두 빈 경우 → ValidationError."""
    payload = _valid_payload()
    payload["chapters_selected"] = [
        {"chapter_number": 1, "title": "웨딩", "photo_ids": []}
    ]
    with pytest.raises(ValidationError, match="at least 1 photo_id"):
        OrderCreate.model_validate(payload)


def test_order_create_rejects_invalid_phone() -> None:
    payload = _valid_payload()
    payload["recipient_phone"] = "02-123-4567"
    with pytest.raises(ValidationError):
        OrderCreate.model_validate(payload)


def test_order_create_rejects_quantity_out_of_range() -> None:
    payload = _valid_payload()
    payload["quantity"] = 11
    with pytest.raises(ValidationError):
        OrderCreate.model_validate(payload)

    payload["quantity"] = 0
    with pytest.raises(ValidationError):
        OrderCreate.model_validate(payload)


def test_order_create_rejects_invalid_format_enum() -> None:
    payload = _valid_payload()
    payload["format"] = "LARGE"
    with pytest.raises(ValidationError):
        OrderCreate.model_validate(payload)


# -----------------------------------------------------------------------------
# OrderResponse computed fields (B2)
# -----------------------------------------------------------------------------
def test_order_response_computed_fields_square_hard_qty_1(
    db_session: Session,
) -> None:
    couple = _seed_couple(db_session)
    order = Order(
        couple_id=couple.id,
        format="SQUARE",
        cover_type="HARD",
        quantity=1,
        chapters_selected=[
            {"chapter_number": 1, "title": "웨딩", "photo_ids": ["pho_a"]}
        ],
        recipient_name="김철수",
        recipient_phone="010-1234-5678",
        recipient_address="서울시 강남구 테헤란로 1",
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    resp = OrderResponse.model_validate(order)
    assert resp.base_price == 150000  # SQUARE
    assert resp.cover_surcharge == 20000  # HARD
    assert resp.total_price == (150000 + 20000) * 1
    # 사진 1장 → ceil(1/2.5) = 1
    assert resp.total_pages_estimated == 1


def test_order_response_computed_fields_a4_soft_qty_3(
    db_session: Session,
) -> None:
    couple = _seed_couple(db_session)
    order = Order(
        couple_id=couple.id,
        format="A4",
        cover_type="SOFT",
        quantity=3,
        chapters_selected=[
            {
                "chapter_number": 1,
                "title": "웨딩",
                "photo_ids": ["p1", "p2", "p3", "p4", "p5"],
            }
        ],
        recipient_name="김철수",
        recipient_phone="010-1234-5678",
        recipient_address="서울시 강남구 테헤란로 1",
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    resp = OrderResponse.model_validate(order)
    assert resp.base_price == 180000  # A4
    assert resp.cover_surcharge == 0  # SOFT
    assert resp.total_price == (180000 + 0) * 3
    # 5 / 2.5 = 2
    assert resp.total_pages_estimated == 2


def test_order_response_prefers_album_layout_total_pages(
    db_session: Session,
) -> None:
    couple = _seed_couple(db_session)
    order = Order(
        couple_id=couple.id,
        format="SQUARE",
        cover_type="HARD",
        quantity=1,
        chapters_selected=[
            {
                "chapter_number": 1,
                "title": "웨딩",
                "photo_ids": ["p1", "p2"],
            }
        ],
        album_layout={"total_pages": 99, "total_photos": 2, "chapters": []},
        recipient_name="김철수",
        recipient_phone="010-1234-5678",
        recipient_address="서울시 강남구 테헤란로 1",
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)

    resp = OrderResponse.model_validate(order)
    # album_layout.total_pages 가 있으면 우선.
    assert resp.total_pages_estimated == 99
