# @TASK P6-LV3 - Export 라우터 통합 테스트
# @SPEC docs/planning/05-architecture.md#sequence-4-데이터-익스포트-lv3
"""
GET /api/orders/{order_id}/export — StreamingResponse(application/zip).
"""
from __future__ import annotations

import io
import json
import zipfile
from datetime import date
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.models.event import Event
from app.models.order import Order
from app.models.photo import Photo


_JPEG_MAGIC = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01" + b"\x00" * 32


def _write_fake_photo(
    tmp_upload_dir: Path, *, event_id: str, photo_id: str
) -> str:
    d = tmp_upload_dir / event_id
    d.mkdir(parents=True, exist_ok=True)
    (d / f"{photo_id}.jpg").write_bytes(_JPEG_MAGIC)
    return f"photos/{event_id}/{photo_id}.jpg"


def _seed(db: Session, tmp_upload_dir: Path) -> str:
    """커플 + 이벤트 + 사진 + 주문 1건 시딩. 생성된 order_id 반환."""
    couple = Couple(
        id="cpl_rx",
        groom_name="철수",
        bride_name="영희",
        wedding_date=date(2026, 5, 10),
    )
    db.add(couple)

    e1 = Event(
        id="evt_rx1",
        couple_id="cpl_rx",
        title="웨딩촬영",
        date=date(2026, 1, 1),
        category="WEDDING_PHOTO",
    )
    db.add(e1)

    p1 = Photo(
        id="pho_rx1",
        event_id="evt_rx1",
        file_path=_write_fake_photo(
            tmp_upload_dir, event_id="evt_rx1", photo_id="pho_rx1"
        ),
        caption="첫 컷",
        caption_source="manual",
        is_selected=True,
    )
    p2 = Photo(
        id="pho_rx2",
        event_id="evt_rx1",
        file_path=_write_fake_photo(
            tmp_upload_dir, event_id="evt_rx1", photo_id="pho_rx2"
        ),
        is_selected=True,
    )
    db.add_all([p1, p2])

    order = Order(
        id="ord_rx_happy",
        couple_id="cpl_rx",
        format="A4",
        cover_type="SOFT",
        quantity=1,
        chapters_selected=[
            {
                "chapter_number": 1,
                "key": "wedding_photo",
                "title": "웨딩촬영",
                "photo_ids": ["pho_rx1", "pho_rx2"],
            }
        ],
        album_layout=None,  # 폴백 경로 커버.
        recipient_name="김수령",
        recipient_phone="010-2222-3333",
        recipient_address="서울시 성동구 왕십리로 100",
        status="pending",
    )
    db.add(order)
    db.commit()
    return order.id


# -----------------------------------------------------------------------------
# 정상 경로
# -----------------------------------------------------------------------------
def test_export_returns_200_with_zip_content_type(
    client: TestClient, db_session: Session, tmp_upload_dir: Path
) -> None:
    order_id = _seed(db_session, tmp_upload_dir)

    r = client.get(f"/api/orders/{order_id}/export")

    assert r.status_code == 200
    assert r.headers["content-type"] == "application/zip"

    disp = r.headers.get("content-disposition", "")
    assert "attachment" in disp
    assert f'filename="{order_id}.zip"' in disp


def test_export_zip_body_is_parseable(
    client: TestClient, db_session: Session, tmp_upload_dir: Path
) -> None:
    """응답 body 가 올바른 ZIP 바이너리이며 내용 구조 검증."""
    order_id = _seed(db_session, tmp_upload_dir)

    r = client.get(f"/api/orders/{order_id}/export")
    assert r.status_code == 200

    with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
        names = zf.namelist()
        assert "order.json" in names
        assert "captions.json" in names

        order_payload = json.loads(zf.read("order.json").decode("utf-8"))
        captions = json.loads(zf.read("captions.json").decode("utf-8"))

    # order.json 의 기본 필드.
    assert order_payload["order_id"] == order_id
    assert order_payload["specs"]["format"] == "A4"
    assert order_payload["specs"]["base_price"] == 180000
    assert order_payload["specs"]["cover_surcharge"] == 0
    assert order_payload["specs"]["total_price"] == 180000

    # captions.json 키가 photo_id.
    assert set(captions.keys()) == {"pho_rx1", "pho_rx2"}


# -----------------------------------------------------------------------------
# 에러 경로
# -----------------------------------------------------------------------------
def test_export_order_not_found_returns_404(client: TestClient) -> None:
    r = client.get("/api/orders/ord_nope_no_such/export")
    assert r.status_code == 404


def test_export_order_with_no_photos_returns_400(
    client: TestClient, db_session: Session, tmp_upload_dir: Path
) -> None:
    # 커플 + 빈 chapters_selected 주문.
    db_session.add(
        Couple(
            id="cpl_empty_x",
            groom_name="A",
            bride_name="B",
            wedding_date=date(2026, 1, 1),
        )
    )
    db_session.add(
        Order(
            id="ord_empty_x",
            couple_id="cpl_empty_x",
            format="SQUARE",
            cover_type="SOFT",
            quantity=1,
            chapters_selected=[
                {"chapter_number": 1, "title": "웨딩", "photo_ids": []}
            ],
            album_layout=None,
            recipient_name="받을사람",
            recipient_phone="010-0000-0000",
            recipient_address="주소 어딘가",
            status="pending",
        )
    )
    db_session.commit()

    r = client.get("/api/orders/ord_empty_x/export")
    assert r.status_code == 400


def test_export_is_exposed_in_openapi(client: TestClient) -> None:
    """Swagger 스키마에 GET /api/orders/{order_id}/export 가 노출되는지 검증."""
    r = client.get("/openapi.json")
    assert r.status_code == 200

    spec = r.json()
    paths = spec.get("paths", {})
    assert "/api/orders/{order_id}/export" in paths
    # GET 메소드 + 200 응답 내에 application/zip content 가 선언되어야 함.
    op = paths["/api/orders/{order_id}/export"].get("get")
    assert op is not None
    responses_200 = op.get("responses", {}).get("200", {})
    assert "application/zip" in responses_200.get("content", {})
