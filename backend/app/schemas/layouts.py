# @TASK P5-BACKEND - 레이아웃 템플릿 카탈로그 (상수)
# @SPEC docs/planning/05-architecture.md#zip-구조
"""
앨범 페이지 레이아웃 템플릿 5종.

Frontend 에서도 동일한 키/photo_count 를 참조해야 한다.
값 변경 시 양쪽 동시 업데이트 필수.
"""
from __future__ import annotations

from typing import TypedDict


class LayoutTemplate(TypedDict):
    name: str
    photo_count: int
    description: str


LAYOUT_TEMPLATES: dict[str, LayoutTemplate] = {
    "T1": {
        "name": "Full Bleed",
        "photo_count": 1,
        "description": "한 장 꽉 차게 — 임팩트 컷",
    },
    "T2": {
        "name": "Half Split",
        "photo_count": 2,
        "description": "좌우 반반 — 비교·대비",
    },
    "T3": {
        "name": "Hero + Two",
        "photo_count": 3,
        "description": "큰 1장 + 작은 2장 — 스토리 페이지",
    },
    "T4": {
        "name": "Grid 2×2",
        "photo_count": 4,
        "description": "4장 그리드 — 일상 기록",
    },
    "T5": {
        "name": "Cover",
        "photo_count": 1,
        "description": "챕터 표지 — 제목 + 하이라이트 1장",
    },
}


def get_photo_count(template_code: str) -> int:
    """템플릿 코드 → 해당 템플릿이 담는 사진 수 (없으면 0)."""
    tpl = LAYOUT_TEMPLATES.get(template_code)
    return tpl["photo_count"] if tpl else 0
