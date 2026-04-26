# @TASK P6-LV3 - 주문 ZIP 익스포트 서비스 (파트너 인계용)
# @SPEC docs/planning/05-architecture.md#sequence-4-데이터-익스포트-lv3
# @SPEC docs/planning/03-features.md#lv3
# @SPEC docs/planning/07-business-model.md#가상-파트너-api
# @SPEC specs/domain/resources.yaml#orders.mutations.export_zip
# @SPEC docs/partner-contract.md
# @TEST tests/services/test_export_service.py, tests/routers/test_export.py
"""
ExportService — 주문 1건의 콘텐츠+메타데이터를 ZIP 바이너리로 빌드.

Lv3 평가 포인트 (데이터 모델링/직렬화):
    파트너(가상의 스위트북)가 ZIP 하나만 받으면 즉시 인쇄 큐에 투입할 수 있도록
    "셀프 완결(self-contained)" 구조로 설계.

ZIP 구조 (파일시스템만으로도 순서/구조가 드러남):
    ord_xxxxx.zip
    ├── order.json           (주문 메타 + 커플 + album_layout, schema_version 포함)
    ├── captions.json        (photo_id 키 → caption/date/category 룩업)
    └── chapters/
        ├── 01_wedding_photo/
        │   ├── pho_xxx.jpg
        │   └── ...
        ├── 02_preparation/
        ├── 03_ceremony/
        ├── 04_honeymoon/
        └── 05_etc/

핵심 결정:
    - album_layout 이 없으면 timeline_service + album_composer 기반 폴백으로
      즉석에서 생성 (UI 에서 compose 를 거치지 않은 주문도 인계 가능).
    - photo 파일은 디스크에서 읽어 ZIP 에 포함 (Council B6 Path Traversal 재검증).
    - 100MB 이하 주문은 BytesIO + ZIP_DEFLATED 메모리 방식 (과제 규모에 충분).
    - schema_version 필드로 API 진화 대비.
"""
from __future__ import annotations

import io
import json
import logging
import zipfile
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.couple import Couple
from app.models.order import Order
from app.models.photo import Photo
from app.services import order_service
from app.services.timeline_service import CHAPTER_MAPPING
from app.utils.file_storage import PathTraversalError, resolve_photo_abs_path

logger = logging.getLogger(__name__)

# 파트너 계약 스키마 버전 (docs/partner-contract.md 참조).
EXPORT_SCHEMA_VERSION = "1.0"

# format 별 base_price / cover_surcharge 는 schemas/order.py 와 동일 규칙.
_BASE_PRICES: dict[str, int] = {"SQUARE": 150000, "A4": 180000}
_COVER_SURCHARGES: dict[str, int] = {"HARD": 20000, "SOFT": 0}

# key → (index, title) (chapter 디렉토리 번호 결정용).
_CHAPTER_INDEX_BY_KEY: dict[str, tuple[int, str]] = {
    ch.key: (idx + 1, ch.title) for idx, ch in enumerate(CHAPTER_MAPPING)
}
# category → (chapter_index, chapter_key) 폴백용.
_CATEGORY_TO_CHAPTER: dict[str, tuple[int, str]] = {
    cat: (idx + 1, ch.key)
    for idx, ch in enumerate(CHAPTER_MAPPING)
    for cat in ch.categories
}


class ExportService:
    """주문 → ZIP 직렬화.

    정적 메서드 컬렉션 — 상태 없음. 테스트성 높이고자 static.
    """

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------
    @staticmethod
    def build_order_zip(db: Session, order_id: str) -> tuple[bytes, str]:
        """주문 1건의 콘텐츠+메타데이터를 ZIP 바이너리로 빌드한다.

        Args:
            db: SQLAlchemy Session.
            order_id: 대상 주문 ID.

        Returns:
            (zip_bytes, suggested_filename) — HTTP 응답의 Body/Filename 에 사용.

        Raises:
            HTTPException(404): 주문 또는 커플 없음.
            HTTPException(400): 주문에 사진이 0장 (exportable 아님).
        """
        # 1) 주문 로드 (404 → HTTPException).
        order = order_service.get_or_404(db, order_id)

        # 2) 커플 로드 (cascade 로 항상 존재해야 하지만 방어).
        couple = db.get(Couple, order.couple_id)
        if couple is None:  # pragma: no cover — DB 무결성상 도달 불가.
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Couple not found for order: {order_id}",
            )

        # 3) chapters_selected 에서 모든 photo_id 수집.
        all_photo_ids: list[str] = []
        for ch in order.chapters_selected or []:
            pids = ch.get("photo_ids", []) if isinstance(ch, dict) else []
            all_photo_ids.extend(pids)

        if not all_photo_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Order {order_id} has no photos selected — "
                    f"nothing to export."
                ),
            )

        # 4) Photo + Event eager load (N+1 방지).
        photos_map = ExportService._load_photos_with_events(
            db, all_photo_ids
        )

        # 5) album_layout 결정 — 저장된 값 우선, 없으면 폴백 레이아웃 구성.
        layout = ExportService._resolve_layout(order, photos_map)

        # 6) photo_id → (chapter_idx, chapter_key) 역매핑 (layout 기반).
        photo_to_chapter = ExportService._build_photo_chapter_map(
            layout, photos_map
        )

        # 7) order.json 페이로드 생성 (파트너 계약 스키마).
        order_json = ExportService._build_order_json(
            order=order,
            couple=couple,
            layout=layout,
            photo_to_chapter=photo_to_chapter,
        )

        # 8) captions.json 페이로드 생성 (photo_id 키, O(1) 룩업).
        captions_json = ExportService._build_captions_json(
            photo_to_chapter, photos_map
        )

        # 9) ZIP 빌드 (BytesIO + ZIP_DEFLATED).
        zip_bytes = ExportService._write_zip(
            order_json=order_json,
            captions_json=captions_json,
            photo_to_chapter=photo_to_chapter,
            photos_map=photos_map,
        )
        filename = f"{order.id}.zip"

        logger.info(
            "Export built: order=%s photos=%d size=%d bytes",
            order.id,
            len(photo_to_chapter),
            len(zip_bytes),
        )
        return zip_bytes, filename

    # -------------------------------------------------------------------------
    # Internals — DB 로딩
    # -------------------------------------------------------------------------
    @staticmethod
    def _load_photos_with_events(
        db: Session, photo_ids: list[str]
    ) -> dict[str, Photo]:
        """photo_ids 를 한 번의 쿼리로 조회하고 id → Photo 매핑 반환.

        event 관계를 eager load 하여 카테고리/날짜를 N+1 없이 얻는다.
        존재하지 않는 photo_id 는 매핑에서 제외된다 (호출자가 필요 시 검증).
        """
        if not photo_ids:
            return {}
        stmt = (
            select(Photo)
            .where(Photo.id.in_(photo_ids))
            .options(selectinload(Photo.event))
        )
        photos = list(db.execute(stmt).scalars().all())
        return {p.id: p for p in photos}

    # -------------------------------------------------------------------------
    # Internals — album_layout 결정
    # -------------------------------------------------------------------------
    @staticmethod
    def _resolve_layout(
        order: Order, photos_map: dict[str, Photo]
    ) -> dict[str, Any]:
        """앨범 레이아웃 결정.

        우선순위:
            1) order.album_layout 이 존재 + chapters 가 비어있지 않으면 그대로 사용.
            2) 아니면 chapters_selected + photo category 기반으로 즉석 폴백.

        폴백은 수동 주문(compose 미실행)도 인계 가능하도록 보장.
        """
        stored = order.album_layout
        if (
            isinstance(stored, dict)
            and isinstance(stored.get("chapters"), list)
            and stored["chapters"]
        ):
            return stored  # type: ignore[return-value]

        # ── Fallback: chapters_selected → chapter/ 디렉토리 매핑용 단순 레이아웃.
        chapters_out: list[dict[str, Any]] = []
        used_photos = 0

        for ch in order.chapters_selected or []:
            if not isinstance(ch, dict):
                continue
            pids: list[str] = list(ch.get("photo_ids", []) or [])
            if not pids:
                continue

            # 챕터 key 결정:
            #   1) chapters_selected 에 chapter_key/key 필드가 있으면 우선.
            #   2) 아니면 첫 photo 의 event.category 로 매핑.
            #   3) 아니면 'etc'.
            key: str | None = ch.get("chapter_key") or ch.get("key")
            if not key and pids:
                first_photo = photos_map.get(pids[0])
                if first_photo and first_photo.event is not None:
                    cat = first_photo.event.category
                    _, resolved_key = _CATEGORY_TO_CHAPTER.get(
                        cat, (0, "etc")
                    )
                    key = resolved_key
            if not key:
                key = "etc"

            chapter_number = ch.get("chapter_number") or (
                len(chapters_out) + 1
            )
            title = ch.get("title") or _CHAPTER_INDEX_BY_KEY.get(
                key, (0, key)
            )[1]

            # 레이아웃 폴백은 '한 페이지에 1장' 단순 구조 — 파트너는 chapters/
            # 디렉토리로 순서를 읽으므로 페이지 템플릿 해석은 strict 하지 않다.
            pages_payload: list[dict[str, Any]] = []
            for i, pid in enumerate(pids, start=1):
                pages_payload.append(
                    {
                        "page_number": i,
                        "template": "T1",
                        "photo_ids": [pid],
                        "caption": None,
                    }
                )
                used_photos += 1

            chapters_out.append(
                {
                    "chapter_number": chapter_number,
                    "key": key,
                    "title": title,
                    "pages": pages_payload,
                }
            )

        return {
            "total_photos": used_photos,
            "total_pages": used_photos,
            "generated_by": "export_fallback",
            "chapters": chapters_out,
        }

    # -------------------------------------------------------------------------
    # Internals — photo → chapter 매핑
    # -------------------------------------------------------------------------
    @staticmethod
    def _build_photo_chapter_map(
        layout: dict[str, Any], photos_map: dict[str, Photo]
    ) -> dict[str, dict[str, Any]]:
        """layout 으로부터 photo_id → {chapter_number, chapter_key, dir, ext} 매핑.

        dir 는 ZIP 내부 경로 `chapters/NN_key/` 형식이며, 각 photo 의 ZIP 경로는
        `{dir}/{photo_id}.{ext}`.

        key 가 CHAPTER_MAPPING 에 없으면 'etc' 로 폴백하되 번호는 layout 의
        chapter_number 를 우선 사용.
        """
        result: dict[str, dict[str, Any]] = {}

        chapters = layout.get("chapters") or []
        for ch_idx, ch in enumerate(chapters, start=1):
            if not isinstance(ch, dict):
                continue
            ch_number = int(ch.get("chapter_number", ch_idx))
            key_raw: str | None = ch.get("key")
            # layout 에 key 가 없으면 title 로 추론.
            if not key_raw:
                title_lower = str(ch.get("title", "")).lower()
                key_raw = next(
                    (
                        k
                        for k, (_, t) in _CHAPTER_INDEX_BY_KEY.items()
                        if t.lower() == title_lower
                    ),
                    "etc",
                )

            # CHAPTER_MAPPING 에 없는 key 도 허용 (파트너 계약상 자유문자열).
            safe_key = "".join(
                c if c.isalnum() or c in {"_", "-"} else "_"
                for c in key_raw
            ) or "etc"
            dir_name = f"chapters/{ch_number:02d}_{safe_key}"

            for page in ch.get("pages") or []:
                if not isinstance(page, dict):
                    continue
                for pid in page.get("photo_ids") or []:
                    if pid in result:
                        continue  # 중복 페이지 참조 방어.
                    photo = photos_map.get(pid)
                    ext = _infer_ext(photo) if photo else "jpg"
                    result[pid] = {
                        "chapter_number": ch_number,
                        "chapter_key": safe_key,
                        "dir": dir_name,
                        "file": f"{dir_name}/{pid}.{ext}",
                        "ext": ext,
                    }

        return result

    # -------------------------------------------------------------------------
    # Internals — order.json / captions.json 페이로드
    # -------------------------------------------------------------------------
    @staticmethod
    def _build_order_json(
        *,
        order: Order,
        couple: Couple,
        layout: dict[str, Any],
        photo_to_chapter: dict[str, dict[str, Any]],
    ) -> dict[str, Any]:
        """파트너 계약(docs/partner-contract.md)과 1:1 매핑되는 order.json."""
        fmt = order.format
        cov = order.cover_type
        base_price = _BASE_PRICES.get(fmt, 0)
        cover_surcharge = _COVER_SURCHARGES.get(cov, 0)
        total_price = (base_price + cover_surcharge) * order.quantity

        # album_layout 재직렬화 — chapters[*].pages[*].photo_refs 포함.
        chapters_out: list[dict[str, Any]] = []
        for ch in layout.get("chapters") or []:
            if not isinstance(ch, dict):
                continue
            pages_out: list[dict[str, Any]] = []
            for page in ch.get("pages") or []:
                if not isinstance(page, dict):
                    continue
                refs: list[dict[str, str]] = []
                for pid in page.get("photo_ids") or []:
                    mapping = photo_to_chapter.get(pid)
                    if mapping is None:
                        # 해당 사진이 DB 에 없으면 파일 참조만 빈 경로로.
                        refs.append({"photo_id": pid, "file": ""})
                    else:
                        refs.append(
                            {"photo_id": pid, "file": mapping["file"]}
                        )
                pages_out.append(
                    {
                        "page_number": int(page.get("page_number", 1)),
                        "template": page.get("template", "T1"),
                        "caption": page.get("caption"),
                        "photo_refs": refs,
                    }
                )
            chapters_out.append(
                {
                    "chapter_number": int(ch.get("chapter_number", 1)),
                    "key": ch.get("key") or "etc",
                    "title": ch.get("title") or "",
                    "pages": pages_out,
                }
            )

        total_photos = len(photo_to_chapter)
        total_pages = int(layout.get("total_pages", 0)) or sum(
            len(c["pages"]) for c in chapters_out
        )

        # tagline 폴백: "{groom} ♥ {bride}, {YYYY.MM.DD}".
        tagline_default = (
            f"{couple.groom_name} ♥ {couple.bride_name}, "
            f"{couple.wedding_date:%Y.%m.%d}"
        )

        return {
            "order_id": order.id,
            "schema_version": EXPORT_SCHEMA_VERSION,
            "couple": {
                "id": couple.id,
                "groom_name": couple.groom_name,
                "bride_name": couple.bride_name,
                "wedding_date": couple.wedding_date.isoformat(),
                "tagline": couple.tagline or tagline_default,
            },
            "specs": {
                "format": fmt,
                "cover_type": cov,
                "quantity": order.quantity,
                "total_pages": total_pages,
                "base_price": base_price,
                "cover_surcharge": cover_surcharge,
                "total_price": total_price,
            },
            "recipient": {
                "name": order.recipient_name,
                "phone": order.recipient_phone,
                "address": order.recipient_address,
            },
            "album_layout": {
                "total_photos": total_photos,
                "total_pages": total_pages,
                "generated_by": layout.get("generated_by", "template"),
                "chapters": chapters_out,
            },
            "status": order.status,
            "created_at": _iso_utc(order.created_at),
            "export_at": _iso_utc(datetime.now(timezone.utc)),
        }

    @staticmethod
    def _build_captions_json(
        photo_to_chapter: dict[str, dict[str, Any]],
        photos_map: dict[str, Photo],
    ) -> dict[str, dict[str, Any]]:
        """captions.json — photo_id 가 top-level 키 (O(1) 룩업).

        Council m7 반영: 파트너가 캡션을 페이지에 주입할 때 페이지 순회 대신
        photo_id 직접 조회로 즉시 찾을 수 있도록 키를 photo_id 로 설정.
        """
        out: dict[str, dict[str, Any]] = {}
        for pid, mapping in photo_to_chapter.items():
            photo = photos_map.get(pid)
            if photo is None:
                # 매핑은 있으나 실제 photo 레코드 없는 이상 케이스 — 최소 정보만.
                out[pid] = {
                    "file": mapping["file"],
                    "caption": None,
                    "caption_source": None,
                    "date": None,
                    "end_date": None,
                    "category": None,
                }
                continue

            event_date = (
                photo.event.date.isoformat()
                if photo.event is not None
                else None
            )
            event_end_date = (
                photo.event.end_date.isoformat()
                if photo.event is not None and photo.event.end_date is not None
                else None
            )
            category = (
                photo.event.category
                if photo.event is not None
                else None
            )
            out[pid] = {
                "file": mapping["file"],
                "caption": photo.caption,
                "caption_source": photo.caption_source,
                "date": event_date,
                "end_date": event_end_date,
                "category": category,
            }
        return out

    # -------------------------------------------------------------------------
    # Internals — ZIP 쓰기
    # -------------------------------------------------------------------------
    @staticmethod
    def _write_zip(
        *,
        order_json: dict[str, Any],
        captions_json: dict[str, dict[str, Any]],
        photo_to_chapter: dict[str, dict[str, Any]],
        photos_map: dict[str, Photo],
    ) -> bytes:
        """BytesIO 에 ZIP 을 쓰고 바이트 반환."""
        buf = io.BytesIO()
        with zipfile.ZipFile(
            buf, mode="w", compression=zipfile.ZIP_DEFLATED
        ) as zf:
            # 1) order.json.
            zf.writestr(
                "order.json",
                json.dumps(order_json, ensure_ascii=False, indent=2),
            )
            # 2) captions.json.
            zf.writestr(
                "captions.json",
                json.dumps(captions_json, ensure_ascii=False, indent=2),
            )
            # 3) chapters/NN_key/{photo_id}.{ext}.
            for pid, mapping in photo_to_chapter.items():
                photo = photos_map.get(pid)
                if photo is None:
                    logger.warning(
                        "export: photo %s referenced in layout but not in DB",
                        pid,
                    )
                    continue
                try:
                    abs_path = resolve_photo_abs_path(photo.file_path)
                except PathTraversalError:
                    logger.warning(
                        "export: path traversal blocked for photo %s path=%s",
                        pid,
                        photo.file_path,
                    )
                    continue
                if not abs_path.exists():
                    logger.warning(
                        "export: file missing for photo %s at %s — skipping",
                        pid,
                        abs_path,
                    )
                    continue
                zf.write(abs_path, arcname=mapping["file"])

        return buf.getvalue()


# -----------------------------------------------------------------------------
# Helpers (module-level)
# -----------------------------------------------------------------------------
def _iso_utc(dt: datetime) -> str:
    """datetime → ISO 8601 UTC 문자열 (naive/aware 모두 안전하게 처리)."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    # 밀리초까지 초 단위로 표현 (파트너 파서 호환성 ↑).
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _infer_ext(photo: Photo) -> str:
    """photo.file_path 확장자 추론 (기본 'jpg')."""
    path = photo.file_path or ""
    if "." in path:
        ext = path.rsplit(".", 1)[-1].lower()
        if ext in {"jpg", "jpeg", "png"}:
            return ext
    return "jpg"
