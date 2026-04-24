# @TASK P5-R1-T2 - Order 서비스 단위 테스트
# @SPEC specs/domain/resources.yaml#orders
"""
OrderService.create / list_by_couple / get_or_404 / update_status.
"""
from __future__ import annotations

from datetime import date

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.schemas.order import ChapterSelectionSchema, OrderCreate
from app.services import order_service


def _seed_couple(db: Session, cid: str = "cpl_service_test") -> Couple:
    c = Couple(
        id=cid,
        groom_name="철수",
        bride_name="영희",
        wedding_date=date(2026, 10, 25),
    )
    db.add(c)
    db.commit()
    return c


def _make_order_create(
    *,
    photo_ids: list[str] | None = None,
    quantity: int = 1,
    fmt: str = "SQUARE",
    cover: str = "HARD",
) -> OrderCreate:
    return OrderCreate.model_validate(
        {
            "format": fmt,
            "cover_type": cover,
            "quantity": quantity,
            "chapters_selected": [
                {
                    "chapter_number": 1,
                    "title": "웨딩",
                    "photo_ids": photo_ids or ["pho_a"],
                }
            ],
            "recipient_name": "김철수",
            "recipient_phone": "010-1234-5678",
            "recipient_address": "서울시 강남구",
        }
    )


# -----------------------------------------------------------------------------
# create
# -----------------------------------------------------------------------------
def test_create_order_persists_with_pending_status(db_session: Session) -> None:
    couple = _seed_couple(db_session)
    order_in = _make_order_create()

    order = order_service.create(db_session, couple.id, order_in)

    assert order.id.startswith("ord_")
    assert order.couple_id == couple.id
    assert order.status == "pending"
    assert order.quantity == 1
    assert order.format == "SQUARE"
    assert order.cover_type == "HARD"
    assert len(order.chapters_selected) == 1


def test_create_raises_on_empty_photos_direct_call(db_session: Session) -> None:
    """Pydantic 을 우회해서 서비스에 직접 빈 챕터를 넣으면 ValueError."""
    couple = _seed_couple(db_session)

    # 빈 photo_ids 는 OrderCreate 에서 막히므로 직접 OrderCreate 를 우회해야 한다.
    # model_construct 로 검증 없이 객체 만들기.
    bad = OrderCreate.model_construct(
        format="SQUARE",
        cover_type="HARD",
        quantity=1,
        chapters_selected=[
            ChapterSelectionSchema(
                chapter_number=1, title="웨딩", photo_ids=[]
            )
        ],
        album_layout=None,
        recipient_name="김철수",
        recipient_phone="010-1234-5678",
        recipient_address="서울시 강남구 테헤란로 1",
    )
    with pytest.raises(ValueError, match="at least 1 photo_id"):
        order_service.create(db_session, couple.id, bad)


# -----------------------------------------------------------------------------
# get_or_404
# -----------------------------------------------------------------------------
def test_get_or_404_raises_when_missing(db_session: Session) -> None:
    with pytest.raises(HTTPException) as excinfo:
        order_service.get_or_404(db_session, "ord_does_not_exist")
    assert excinfo.value.status_code == 404


def test_get_or_404_returns_existing(db_session: Session) -> None:
    couple = _seed_couple(db_session)
    created = order_service.create(db_session, couple.id, _make_order_create())

    fetched = order_service.get_or_404(db_session, created.id)
    assert fetched.id == created.id


# -----------------------------------------------------------------------------
# list_by_couple
# -----------------------------------------------------------------------------
def test_list_by_couple_returns_latest_first(db_session: Session) -> None:
    couple = _seed_couple(db_session)
    o1 = order_service.create(db_session, couple.id, _make_order_create())
    o2 = order_service.create(db_session, couple.id, _make_order_create(quantity=2))

    items = order_service.list_by_couple(db_session, couple.id)
    assert len(items) == 2
    # 최신 먼저 (created_at DESC) — o2 가 앞.
    assert items[0].id == o2.id
    assert items[1].id == o1.id


def test_list_by_couple_with_status_filter(db_session: Session) -> None:
    couple = _seed_couple(db_session)
    o1 = order_service.create(db_session, couple.id, _make_order_create())
    o2 = order_service.create(db_session, couple.id, _make_order_create(quantity=2))

    # o2 를 processing 으로 전이.
    order_service.update_status(db_session, o2.id, "processing")

    pending_only = order_service.list_by_couple(
        db_session, couple.id, status_filter="pending"
    )
    assert [o.id for o in pending_only] == [o1.id]

    processing_only = order_service.list_by_couple(
        db_session, couple.id, status_filter="processing"
    )
    assert [o.id for o in processing_only] == [o2.id]


# -----------------------------------------------------------------------------
# update_status
# -----------------------------------------------------------------------------
def test_update_status_pending_to_processing(db_session: Session) -> None:
    couple = _seed_couple(db_session)
    order = order_service.create(db_session, couple.id, _make_order_create())

    updated = order_service.update_status(db_session, order.id, "processing")
    assert updated.status == "processing"


def test_update_status_invalid_transition_raises_400(
    db_session: Session,
) -> None:
    couple = _seed_couple(db_session)
    order = order_service.create(db_session, couple.id, _make_order_create())

    # pending → completed 는 허용 안 됨.
    with pytest.raises(HTTPException) as excinfo:
        order_service.update_status(db_session, order.id, "completed")
    assert excinfo.value.status_code == 400


def test_update_status_order_not_found_raises_404(
    db_session: Session,
) -> None:
    with pytest.raises(HTTPException) as excinfo:
        order_service.update_status(
            db_session, "ord_nope_no_such_thing", "processing"
        )
    assert excinfo.value.status_code == 404
