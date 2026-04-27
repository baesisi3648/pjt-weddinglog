# @TASK P5-BACKEND - AI 앨범 자동 구성 서비스
# @SPEC docs/planning/05-architecture.md#ai-폴백-전략
# @TEST tests/services/test_album_composer.py, tests/routers/test_album.py
"""
AlbumComposerService — AI(OpenAI) 앨범 구성 또는 규칙 기반 폴백.

공개 API:
    compose(photos: list[Photo]) -> AlbumLayoutSchema

동작 전략:
    1) OpenAI 키 유효 시 GPT-4o-mini 호출 → AlbumLayoutSchema JSON 생성.
    2) 호출 실패/키 부재 시 규칙 기반 폴백:
        - timeline_service 와 동일한 5 챕터 그룹핑.
        - 각 챕터 첫 페이지 = T5 Cover.
        - 나머지 사진: 4장씩 묶어 T4 (Grid), 2장 남으면 T2, 1장만 남으면 T1.

스키마 생성 규칙:
    - 각 페이지의 `photo_ids` 길이는 해당 template 의 photo_count 와 일치해야 함.
    - total_pages = sum(len(chapter.pages))
    - total_photos = 사용된 photo_id 총합 (중복 제외 X — 같은 사진이 두 페이지에
      걸칠 수 없도록 구성 단계에서 보장).
"""
from __future__ import annotations

import asyncio
import json
import logging
import math
from dataclasses import dataclass
from typing import Any

# OpenAI 호출 자체 타임아웃 (초). 백엔드 30s + 프론트 60s 마진 확보.
_OPENAI_TIMEOUT_SEC = 30.0

from app.models.photo import Photo
from app.schemas.album import (
    AlbumChapterSchema,
    AlbumLayoutSchema,
    AlbumPageSchema,
)
from app.schemas.layouts import LAYOUT_TEMPLATES, get_photo_count
from app.services.timeline_service import CHAPTER_MAPPING

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# 챕터 그룹핑 (timeline_service 와 동일 규칙)
# -----------------------------------------------------------------------------
@dataclass
class _PhotoMeta:
    """AI 프롬프트·폴백에 공통으로 쓰는 사진 메타."""

    id: str
    category: str
    event_date: str  # ISO
    event_title: str
    caption: str | None


def _group_by_chapter(
    photos: list[_PhotoMeta],
) -> list[tuple[int, str, str, list[_PhotoMeta]]]:
    """사진을 CHAPTER_MAPPING 순서대로 그룹핑.

    Returns:
        [(chapter_number, title, color, photos), ...] — 사진 있는 챕터만.
    """
    # category → chapter index.
    cat_to_idx: dict[str, int] = {
        cat: idx
        for idx, ch in enumerate(CHAPTER_MAPPING)
        for cat in ch.categories
    }

    buckets: dict[int, list[_PhotoMeta]] = {
        i: [] for i in range(len(CHAPTER_MAPPING))
    }
    for p in photos:
        idx = cat_to_idx.get(p.category)
        if idx is None:
            # 알 수 없는 카테고리 → ETC 로 폴백.
            idx = cat_to_idx.get("ETC", len(CHAPTER_MAPPING) - 1)
        buckets[idx].append(p)

    result: list[tuple[int, str, str, list[_PhotoMeta]]] = []
    display_number = 0
    for idx, chapter in enumerate(CHAPTER_MAPPING):
        entries = buckets[idx]
        if not entries:
            continue
        display_number += 1
        result.append(
            (display_number, chapter.title, chapter.color, entries)
        )
    return result


# -----------------------------------------------------------------------------
# Service
# -----------------------------------------------------------------------------
_SYSTEM_PROMPT = (
    "당신은 한국의 결혼 앨범 아트디렉터입니다. "
    "사용자가 선택한 사진들의 메타데이터를 받아 정통 양장본 톤의 "
    "앨범 레이아웃을 설계합니다.\n"
    "\n"
    "레이아웃 템플릿 (photo_count 엄격 준수):\n"
    "- T1 Full Bleed (1장): ★ 모든 본문 페이지. 사진 1장을 한 페이지에.\n"
    "- T5 Cover (1장): 챕터 표지, 각 챕터 page_number=1 에만 사용.\n"
    "\n"
    "★★★ 절대 금지: T2/T3/T4 는 절대 사용하지 마세요. "
    "정통 양장본은 한 페이지에 한 장이 원칙입니다.\n"
    "\n"
    "규칙:\n"
    "1. 시간 흐름 챕터 그룹핑 (timeline_service 와 동일: 함께 쌓아온 날들 → "
    "둘이 함께 준비한 시간 → 카메라 앞에서, 우리 → 그 날 — 결혼식 → 첫 여행).\n"
    "2. 각 챕터의 첫 페이지(page_number=1)는 반드시 T5 Cover.\n"
    "3. ★ 모든 본문 페이지(page_number ≥ 2)는 반드시 T1. 사진 1장.\n"
    "4. 페이지의 photo_ids 길이 = 해당 템플릿의 photo_count (T1=1, T5=1).\n"
    "5. 하나의 사진은 최대 한 페이지에만 등장.\n"
    "6. 총 페이지 수 = 챕터별로 (사진 수). T5 가 1장 + 나머지 T1 으로 1장씩.\n"
    "7. color 는 'coral' 1개로 통일.\n"
    "\n"
    "응답은 반드시 JSON 객체로 다음 스키마를 따라야 합니다:\n"
    '{"total_photos": int, "total_pages": int, "generated_by": "ai", '
    '"chapters": [{"chapter_number": int, "title": str, "color": str, '
    '"pages": [{"page_number": int, "template": "T1|T5", '
    '"photo_ids": [str, ...], "caption": str|null}]}]}'
)


class AlbumComposerService:
    """AI/템플릿 기반 앨범 구성 서비스."""

    def __init__(self, app_state: Any) -> None:
        """
        Args:
            app_state: FastAPI app.state — openai_available 플래그 참조.
        """
        self.ai_available: bool = bool(
            getattr(app_state, "openai_available", False)
        )
        self._client: Any | None = None
        if self.ai_available:
            try:
                from openai import AsyncOpenAI  # 지연 import — async-native

                self._client = AsyncOpenAI()
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "AlbumComposer: OpenAI client init failed (%s) — fallback.",
                    exc,
                )
                self.ai_available = False

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------
    async def compose(self, photos: list[Photo]) -> AlbumLayoutSchema:
        """앨범 레이아웃 생성.

        Args:
            photos: Timeline 에서 선택된 사진 목록 (event 관계가 미리 로드되어
                있어야 category/date/title 을 읽을 수 있다).

        Returns:
            AlbumLayoutSchema (AI 성공 시 generated_by="ai",
            그 외 "template").
        """
        if not photos:
            # 빈 입력은 라우터에서 400 으로 막지만 방어.
            return AlbumLayoutSchema(
                total_photos=0,
                total_pages=0,
                chapters=[],
                generated_by="template",
            )

        metas = [
            _PhotoMeta(
                id=p.id,
                category=(p.event.category if p.event else "ETC"),
                event_date=(
                    p.event.date.isoformat() if p.event else ""
                ),
                event_title=(p.event.title if p.event else ""),
                caption=p.caption,
            )
            for p in photos
        ]

        if self.ai_available:
            try:
                layout = await self._compose_via_ai(metas)
                return layout
            except Exception as exc:  # noqa: BLE001 — 어떤 실패든 폴백
                logger.warning(
                    "AI album compose failed (%s) — fallback to template.",
                    exc,
                )

        return self._compose_fallback(metas)

    # -------------------------------------------------------------------------
    # AI
    # -------------------------------------------------------------------------
    async def _compose_via_ai(
        self, metas: list[_PhotoMeta]
    ) -> AlbumLayoutSchema:
        """OpenAI GPT-4o-mini 를 호출해 레이아웃 생성.

        실패(JSON 파싱/스키마 불일치) 시 예외 → 상위 compose 가 폴백 처리.
        """
        if self._client is None:
            raise RuntimeError("OpenAI client not initialized")

        user_payload = {
            "photos": [
                {
                    "id": m.id,
                    "category": m.category,
                    "date": m.event_date,
                    "event_title": m.event_title,
                    "caption": m.caption,
                }
                for m in metas
            ],
            "target_pages": math.ceil(len(metas) / 2.5),
        }

        # AsyncOpenAI 네이티브 await — 이벤트 루프 비차단 + 타임아웃은 SDK 가 강제.
        try:
            completion = await self._client.chat.completions.create(  # type: ignore[union-attr]
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": json.dumps(
                            user_payload, ensure_ascii=False
                        ),
                    },
                ],
                response_format={"type": "json_object"},
                temperature=0.6,
                timeout=_OPENAI_TIMEOUT_SEC,
            )
        except asyncio.TimeoutError as exc:
            raise TimeoutError(
                f"OpenAI compose timeout after {_OPENAI_TIMEOUT_SEC}s"
            ) from exc

        raw = completion.choices[0].message.content or "{}"
        payload = json.loads(raw)
        payload["generated_by"] = "ai"

        # 스키마 검증 — 실패 시 Pydantic 에러 → compose 에서 폴백.
        layout = AlbumLayoutSchema.model_validate(payload)
        # photo_count 계약 재검증.
        self._validate_page_photo_counts(layout)
        return layout

    @staticmethod
    def _validate_page_photo_counts(layout: AlbumLayoutSchema) -> None:
        """각 페이지의 photo_ids 길이 + 템플릿 정책(T1/T5만 허용) 검증."""
        ALLOWED = {"T1", "T5"}
        for chapter in layout.chapters:
            for page in chapter.pages:
                if page.template not in ALLOWED:
                    raise ValueError(
                        f"Template {page.template} not allowed; "
                        f"only T1/T5 (한 페이지 한 장 정책)"
                    )
                expected = get_photo_count(page.template)
                if len(page.photo_ids) != expected:
                    raise ValueError(
                        f"Template {page.template} expects {expected} "
                        f"photos, got {len(page.photo_ids)} on page "
                        f"{page.page_number} of chapter "
                        f"{chapter.chapter_number}"
                    )

    # -------------------------------------------------------------------------
    # Fallback (rule-based)
    # -------------------------------------------------------------------------
    def _compose_fallback(
        self, metas: list[_PhotoMeta]
    ) -> AlbumLayoutSchema:
        """규칙 기반 폴백.

        절차:
          1) 카테고리 → 5 챕터 그룹핑 (timeline_service 와 동일 규칙).
          2) 각 챕터:
             - 페이지 1 = T5 Cover (챕터의 첫 사진을 커버로).
             - 남은 사진: 4장씩 T4, 2장 남으면 T2, 3장 남으면 T3(또는 T1+T2),
               1장 남으면 T1.
        """
        groups = _group_by_chapter(metas)

        chapters_out: list[AlbumChapterSchema] = []
        total_photos_used = 0
        total_pages_count = 0

        for chapter_number, title, color, entries in groups:
            pages = self._pack_chapter(entries, chapter_title=title)
            if not pages:
                continue

            total_pages_count += len(pages)
            total_photos_used += sum(len(pg.photo_ids) for pg in pages)
            chapters_out.append(
                AlbumChapterSchema(
                    chapter_number=chapter_number,
                    title=title,
                    color=color,
                    pages=pages,
                )
            )

        return AlbumLayoutSchema(
            total_photos=total_photos_used,
            total_pages=total_pages_count,
            chapters=chapters_out,
            generated_by="template",
        )

    @classmethod
    def _select_cover(cls, entries: list[_PhotoMeta]) -> _PhotoMeta:
        """챕터 표지로 사용할 사진 1장 선택.

        정책: 항상 첫 번째 사진(sort_order=0).
        사용자가 편집 모드에서 직접 다른 사진으로 교체 가능.
        """
        return entries[0]

    @classmethod
    def _pack_chapter(
        cls,
        entries: list[_PhotoMeta], *, chapter_title: str
    ) -> list[AlbumPageSchema]:
        """한 챕터의 사진들을 페이지로 포장.

        정통 양장본 톤 — **모든 페이지에 사진 1장**.
        (사용자가 편집 모드에서 T2/T3/T4 로 수동 변경 가능.)

        규칙:
            - 1 페이지: T5 Cover (베스트컷 휴리스틱으로 선정).
            - 남은 사진은 각각 T1 (한 페이지 한 장).
        """
        if not entries:
            return []

        pages: list[AlbumPageSchema] = []

        # Cover — 베스트컷 휴리스틱으로 선정.
        cover = cls._select_cover(entries)
        pages.append(
            AlbumPageSchema(
                page_number=1,
                template="T5",
                photo_ids=[cover.id],
                caption=f"{chapter_title} · 하이라이트",
            )
        )

        # 나머지 사진을 모두 한 장씩 T1.
        remaining = [m for m in entries if m.id != cover.id]
        page_no = 2
        for m in remaining:
            pages.append(
                AlbumPageSchema(
                    page_number=page_no,
                    template="T1",
                    photo_ids=[m.id],
                    caption=m.caption,
                )
            )
            page_no += 1

        # 참조 (linter 만족용): LAYOUT_TEMPLATES 는 서비스 외부에서도
        # 참조되므로 import 유지. — 여기서는 별도 처리 없음.
        assert LAYOUT_TEMPLATES["T5"]["photo_count"] == 1

        return pages
