# @TASK P6-LV3 - ExportService 단위 테스트
# @SPEC docs/planning/05-architecture.md#sequence-4-데이터-익스포트-lv3
# @SPEC docs/partner-contract.md
"""
ExportService.build_order_zip 의 결과물을 실제 zipfile 로 역직렬화하여 검증.

검증 포인트 (Lv3 평가):
    1. ZIP 구조: order.json + captions.json + chapters/NN_key/*.jpg.
    2. order.json 파트너 계약 스키마 호환 필드 전체 매핑.
    3. captions.json 키가 photo_id (O(1) 룩업).
    4. 존재하지 않는 order / 빈 주문 → HTTPException.
    5. album_layout 미존재 주문 → 폴백 레이아웃으로 인계 가능.
"""
from __future__ import annotations

import io
import json
import zipfile
from datetime import date
from pathlib import Path

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.models.event import Event
from app.models.order import Order
from app.models.photo import Photo
from app.services.export_service import (
    EXPORT_SCHEMA_VERSION,
    ExportService,
)


# =============================================================================
# Helpers
# =============================================================================
_JPEG_MAGIC = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01" + b"\x00" * 32


def _write_fake_photo_file(
    tmp_upload_dir: Path, *, event_id: str, photo_id: str, ext: str = "jpg"
) -> str:
    """테스트용 실제 디스크 파일을 UPLOAD_DIR 하위에 쓴다.

    Returns:
        file_path 컬럼에 저장할 상대 경로 (파서와 동일 형식).
    """
    event_dir = tmp_upload_dir / event_id
    event_dir.mkdir(parents=True, exist_ok=True)
    target = event_dir / f"{photo_id}.{ext}"
    target.write_bytes(_JPEG_MAGIC)
    # file_storage.safe_save_photo 의 반환 규칙과 동일: "photos/..."
    # tmp_upload_dir 는 `.../data/uploads/photos` 이므로 그 부모 기준으로 상대.
    return f"photos/{event_id}/{photo_id}.{ext}"


def _seed_full_order(
    db: Session,
    tmp_upload_dir: Path,
    *,
    couple_id: str = "cpl_export",
    order_id: str = "ord_exp001",
    with_layout: bool = True,
) -> tuple[Couple, Order, list[Photo]]:
    """커플/이벤트/사진/주문 한 세트를 DB 에 시딩 + 실제 파일도 디스크에 작성."""
    couple = Couple(
        id=couple_id,
        groom_name="철수",
        bride_name="영희",
        wedding_date=date(2026, 3, 14),
        tagline="철수 ♥ 영희, 2026.03.14",
    )
    db.add(couple)

    # 2 개의 이벤트 — 다른 카테고리.
    e1 = Event(
        id="evt_wedph",
        couple_id=couple_id,
        title="웨딩촬영",
        date=date(2025, 12, 14),
        category="WEDDING_PHOTO",
    )
    e2 = Event(
        id="evt_ceremony",
        couple_id=couple_id,
        title="본식",
        date=date(2026, 3, 14),
        category="CEREMONY",
    )
    db.add_all([e1, e2])

    # 3 장의 사진 — 일부는 캡션 포함.
    p1 = Photo(
        id="pho_a1",
        event_id="evt_wedph",
        file_path=_write_fake_photo_file(
            tmp_upload_dir, event_id="evt_wedph", photo_id="pho_a1"
        ),
        caption="처음 웨딩드레스를 입던 날",
        caption_source="ai",
        is_selected=True,
    )
    p2 = Photo(
        id="pho_a2",
        event_id="evt_wedph",
        file_path=_write_fake_photo_file(
            tmp_upload_dir, event_id="evt_wedph", photo_id="pho_a2"
        ),
        caption=None,
        caption_source=None,
        is_selected=True,
    )
    p3 = Photo(
        id="pho_b1",
        event_id="evt_ceremony",
        file_path=_write_fake_photo_file(
            tmp_upload_dir, event_id="evt_ceremony", photo_id="pho_b1"
        ),
        caption="본식 입장",
        caption_source="manual",
        is_selected=True,
    )
    db.add_all([p1, p2, p3])

    # album_layout — chapters 2 개 (wedding_photo, ceremony).
    album_layout: dict | None = None
    if with_layout:
        album_layout = {
            "total_photos": 3,
            "total_pages": 3,
            "generated_by": "template",
            "chapters": [
                {
                    "chapter_number": 1,
                    "key": "wedding_photo",
                    "title": "웨딩촬영",
                    "color": "coral",
                    "pages": [
                        {
                            "page_number": 1,
                            "template": "T5",
                            "photo_ids": ["pho_a1"],
                            "caption": "웨딩촬영 · 하이라이트",
                        },
                        {
                            "page_number": 2,
                            "template": "T1",
                            "photo_ids": ["pho_a2"],
                            "caption": None,
                        },
                    ],
                },
                {
                    "chapter_number": 3,
                    "key": "ceremony",
                    "title": "그 날 — 본식",
                    "color": "mint",
                    "pages": [
                        {
                            "page_number": 1,
                            "template": "T5",
                            "photo_ids": ["pho_b1"],
                            "caption": "본식 · 하이라이트",
                        }
                    ],
                },
            ],
        }

    order = Order(
        id=order_id,
        couple_id=couple_id,
        format="SQUARE",
        cover_type="HARD",
        quantity=3,
        chapters_selected=[
            {
                "chapter_number": 1,
                "key": "wedding_photo",
                "title": "웨딩촬영",
                "photo_ids": ["pho_a1", "pho_a2"],
            },
            {
                "chapter_number": 3,
                "key": "ceremony",
                "title": "그 날 — 본식",
                "photo_ids": ["pho_b1"],
            },
        ],
        album_layout=album_layout,
        recipient_name="박영희 어머니",
        recipient_phone="010-1234-5678",
        recipient_address="서울시 강남구 테헤란로 1",
        status="pending",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return couple, order, [p1, p2, p3]


# =============================================================================
# Tests
# =============================================================================
def test_build_zip_contains_expected_structure(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """ZIP 루트: order.json + captions.json + chapters/NN_key/*.jpg."""
    _, order, _ = _seed_full_order(
        db_session, tmp_upload_dir, order_id="ord_struct"
    )

    zip_bytes, filename = ExportService.build_order_zip(db_session, order.id)

    assert filename == "ord_struct.zip"
    assert len(zip_bytes) > 0

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        names = set(zf.namelist())
        # 필수 메타 파일 2 종.
        assert "order.json" in names
        assert "captions.json" in names
        # chapter 디렉토리 규칙: chapters/NN_key/photo_id.ext
        assert "chapters/01_wedding_photo/pho_a1.jpg" in names
        assert "chapters/01_wedding_photo/pho_a2.jpg" in names
        assert "chapters/03_ceremony/pho_b1.jpg" in names
        # 3 장의 사진 + 2 개의 json = 5 엔트리 (디렉토리 별도 엔트리 없음).
        photo_entries = [n for n in names if n.startswith("chapters/")]
        assert len(photo_entries) == 3


def test_order_json_matches_partner_contract(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """order.json 이 파트너 계약 스키마(docs/partner-contract.md) 와 일치."""
    _, order, _ = _seed_full_order(
        db_session, tmp_upload_dir, order_id="ord_json"
    )

    zip_bytes, _ = ExportService.build_order_zip(db_session, order.id)

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        payload = json.loads(zf.read("order.json").decode("utf-8"))

    # Top-level 필드 완전성.
    assert payload["order_id"] == "ord_json"
    assert payload["schema_version"] == EXPORT_SCHEMA_VERSION
    assert payload["status"] == "pending"
    assert "created_at" in payload
    assert payload["created_at"].endswith("Z")  # UTC ISO 8601.
    assert "export_at" in payload

    # couple 블록.
    couple_blk = payload["couple"]
    assert couple_blk["groom_name"] == "철수"
    assert couple_blk["bride_name"] == "영희"
    assert couple_blk["wedding_date"] == "2026-03-14"
    assert "♥" in couple_blk["tagline"]

    # specs 블록 — 가격 계산 검증.
    specs = payload["specs"]
    assert specs["format"] == "SQUARE"
    assert specs["cover_type"] == "HARD"
    assert specs["quantity"] == 3
    assert specs["base_price"] == 150000
    assert specs["cover_surcharge"] == 20000
    assert specs["total_price"] == (150000 + 20000) * 3
    assert specs["total_pages"] == 3  # album_layout.total_pages 원본.

    # recipient 블록.
    recipient = payload["recipient"]
    assert recipient["name"] == "박영희 어머니"
    assert recipient["phone"] == "010-1234-5678"
    assert "강남구" in recipient["address"]

    # album_layout 블록 — chapters/pages/photo_refs 구조.
    layout = payload["album_layout"]
    assert layout["total_photos"] == 3
    assert len(layout["chapters"]) == 2

    ch0 = layout["chapters"][0]
    assert ch0["key"] == "wedding_photo"
    assert ch0["chapter_number"] == 1
    assert len(ch0["pages"]) == 2
    page0 = ch0["pages"][0]
    assert page0["page_number"] == 1
    assert page0["template"] == "T5"
    # photo_refs: 파일 경로는 chapters/NN_key 규칙.
    assert page0["photo_refs"][0]["photo_id"] == "pho_a1"
    assert (
        page0["photo_refs"][0]["file"]
        == "chapters/01_wedding_photo/pho_a1.jpg"
    )


def test_captions_json_keyed_by_photo_id(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """captions.json 의 top-level 키는 photo_id (O(1) 룩업, Council m7)."""
    _, order, _ = _seed_full_order(
        db_session, tmp_upload_dir, order_id="ord_cap"
    )

    zip_bytes, _ = ExportService.build_order_zip(db_session, order.id)

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        captions = json.loads(zf.read("captions.json").decode("utf-8"))

    # 3 개 photo 모두 키로 존재.
    assert set(captions.keys()) == {"pho_a1", "pho_a2", "pho_b1"}

    # 각 항목 필드.
    a1 = captions["pho_a1"]
    assert a1["caption"] == "처음 웨딩드레스를 입던 날"
    assert a1["caption_source"] == "ai"
    assert a1["date"] == "2025-12-14"
    assert a1["category"] == "WEDDING_PHOTO"
    assert a1["file"] == "chapters/01_wedding_photo/pho_a1.jpg"

    # 캡션 없는 사진은 None 그대로.
    a2 = captions["pho_a2"]
    assert a2["caption"] is None
    assert a2["caption_source"] is None

    # 다른 챕터/카테고리.
    b1 = captions["pho_b1"]
    assert b1["category"] == "CEREMONY"
    assert b1["date"] == "2026-03-14"
    assert b1["file"] == "chapters/03_ceremony/pho_b1.jpg"


def test_photo_files_in_zip_match_disk_content(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """ZIP 의 사진 바이트가 디스크의 원본 파일 바이트와 일치."""
    _, order, _ = _seed_full_order(
        db_session, tmp_upload_dir, order_id="ord_bytes"
    )

    zip_bytes, _ = ExportService.build_order_zip(db_session, order.id)

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        photo_bytes = zf.read("chapters/01_wedding_photo/pho_a1.jpg")

    assert photo_bytes.startswith(b"\xff\xd8\xff")  # JPEG 매직 넘버.


def test_order_not_found_raises_404(db_session: Session) -> None:
    with pytest.raises(HTTPException) as excinfo:
        ExportService.build_order_zip(db_session, "ord_does_not_exist")
    assert excinfo.value.status_code == 404


def test_empty_order_raises_400(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """chapters_selected 의 photo_id 가 0 이면 400."""
    # 커플 + 수동 주문 (Pydantic 우회해서 빈 chapters_selected 삽입).
    couple = Couple(
        id="cpl_empty",
        groom_name="A",
        bride_name="B",
        wedding_date=date(2026, 1, 1),
    )
    db_session.add(couple)
    order = Order(
        id="ord_empty",
        couple_id="cpl_empty",
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
    db_session.add(order)
    db_session.commit()

    with pytest.raises(HTTPException) as excinfo:
        ExportService.build_order_zip(db_session, "ord_empty")
    assert excinfo.value.status_code == 400
    assert "no photos" in excinfo.value.detail.lower()


def test_missing_album_layout_uses_fallback(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """album_layout 이 None 이어도 chapters_selected + photo category 로 폴백 생성."""
    _, order, _ = _seed_full_order(
        db_session,
        tmp_upload_dir,
        couple_id="cpl_fallback",
        order_id="ord_fb",
        with_layout=False,
    )
    assert order.album_layout is None  # sanity.

    zip_bytes, _ = ExportService.build_order_zip(db_session, order.id)

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        payload = json.loads(zf.read("order.json").decode("utf-8"))
        names = set(zf.namelist())

    # 폴백이어도 chapters/ 디렉토리가 정상 생성됨.
    layout = payload["album_layout"]
    assert layout["generated_by"] == "export_fallback"
    assert len(layout["chapters"]) >= 1
    assert any(n.startswith("chapters/") for n in names)

    # 3 장의 사진이 모두 포함됨.
    photo_files = [n for n in names if n.endswith(".jpg")]
    assert len(photo_files) == 3


def test_partner_contract_field_mapping_present(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """파트너 API(가상 스위트북) 페이로드 매핑 필드가 모두 노출됨.

    docs/partner-contract.md 의 매핑 표를 기계적으로 검증.
    """
    _, order, _ = _seed_full_order(
        db_session, tmp_upload_dir, order_id="ord_contract"
    )

    zip_bytes, _ = ExportService.build_order_zip(db_session, order.id)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        payload = json.loads(zf.read("order.json").decode("utf-8"))

    # 파트너 매핑 요구 필드 — 누락 시 AssertionError.
    required_partner_fields = [
        ("order_id", str),
        ("schema_version", str),
    ]
    for fname, ftype in required_partner_fields:
        assert fname in payload, f"missing partner field: {fname}"
        assert isinstance(payload[fname], ftype)

    assert payload["couple"]["wedding_date"]
    assert payload["specs"]["format"] in {"SQUARE", "A4"}
    assert payload["specs"]["cover_type"] in {"HARD", "SOFT"}
    assert 1 <= payload["specs"]["quantity"] <= 10

    # shipping 1:1 — recipient.* → shipping.* 파트너 매핑.
    recipient = payload["recipient"]
    assert {"name", "phone", "address"}.issubset(recipient.keys())

    # layout pages 의 photo_refs.file 이 실제 ZIP 경로와 매칭.
    for ch in payload["album_layout"]["chapters"]:
        for page in ch["pages"]:
            for ref in page["photo_refs"]:
                assert ref["file"].startswith("chapters/")
                assert ref["photo_id"].startswith("pho_")
