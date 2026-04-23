# @TASK P4-R1-T3 - Home 집계 서비스
# @SPEC specs/screens/01_home.yaml
# @SPEC docs/planning/council-report.md#B3-타이밍-UX
# @SPEC docs/planning/06-tasks.md#p4-r1-t3-home용-집계-서비스
# @TEST tests/services/test_home_service.py
"""
Home 화면 데이터 집계 서비스.

집계 항목:
- couple: CoupleResponse (d_day 포함)
- upcoming_events: 오늘 이후 date ASC 로 최대 3건
- recent_photos: 커플의 모든 Event 를 통틀어 created_at DESC 로 최대 6건
- photo_counts: {total, selected}
- album_order_deadline: wedding_date - 21일 기준 카운트다운
    - normal:   D-N (N > 21)  — 아직 여유 있음 (표시는 숨김 권장)
    - warning:  D-21 ~ D-14   — 노란 경고
    - urgent:   D-14 이하     — 빨간 긴급
    - expired:  wedding_date 가 과거 (D+N)

N+1 방지:
- upcoming_events 는 LIMIT 쿼리 (단일 쿼리, 이벤트만).
- recent_photos 는 Event JOIN + LIMIT (단일 쿼리, 사진만).
- photo_counts 는 단일 집계 쿼리 (count + sum(case)).
- 총 4개의 가벼운 쿼리로 구성.
"""
from __future__ import annotations

import logging
from datetime import date

from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.services import couple_service, event_service, photo_service

logger = logging.getLogger(__name__)


# 앨범 주문 추천 기한: 결혼식 D-21.
ALBUM_ORDER_LEAD_DAYS: int = 21

# 경고 시작 (D-21 부터) / 긴급 전환 (D-14 이하).
ALBUM_WARNING_DAYS: int = 21
ALBUM_URGENT_DAYS: int = 14


# -----------------------------------------------------------------------------
# Public API
# -----------------------------------------------------------------------------
def get_home_summary(
    db: Session,
    couple_id: str,
    *,
    today: date | None = None,
) -> dict:
    """Home 화면에 필요한 모든 데이터를 집계하여 반환한다.

    Args:
        db: SQLAlchemy Session.
        couple_id: 대상 커플 id.
        today: 기준일 (테스트 결정성 보장용; None 이면 date.today()).

    Returns:
        dict — `HomeSummary` Pydantic 모델에 매핑되는 구조.

    Raises:
        HTTPException(404): couple_id 가 존재하지 않을 때 (couple_service 위임).
    """
    reference = today if today is not None else date.today()

    couple = couple_service.get_or_404(db, couple_id)

    # 1) upcoming events (≤ 3)
    upcoming = event_service.list_upcoming_by_couple(
        db, couple_id, today=reference, limit=3
    )

    # 2) recent photos (≤ 6)
    recent = photo_service.list_recent_by_couple(db, couple_id, limit=6)

    # 3) photo counts (total, selected)
    total_photos, selected_photos = photo_service.count_by_couple(db, couple_id)

    # 4) album_order_deadline
    deadline = _compute_album_deadline(couple, today=reference)

    logger.debug(
        "Home summary: couple=%s upcoming=%d recent=%d total=%d selected=%d "
        "deadline=%s",
        couple_id,
        len(upcoming),
        len(recent),
        total_photos,
        selected_photos,
        deadline,
    )

    return {
        "couple": couple,  # Pydantic 이 CoupleResponse 로 validate
        "upcoming_events": upcoming,
        "recent_photos": recent,
        "photo_counts": {
            "total": total_photos,
            "selected": selected_photos,
        },
        "album_order_deadline": deadline,
    }


# -----------------------------------------------------------------------------
# Internal helpers
# -----------------------------------------------------------------------------
def _compute_album_deadline(
    couple: Couple,
    *,
    today: date,
) -> dict:
    """앨범 주문 추천 기한 집계.

    Returns:
        {
          "recommended_date": "YYYY-MM-DD",   # wedding_date - 21일
          "days_remaining": int,              # recommended_date - today (음수면 경과)
          "urgency": "normal" | "warning" | "urgent" | "expired",
        }

    Urgency 규칙:
        - today > wedding_date       → "expired"
        - days_until_wedding > 21    → "normal"   (D-21 초과 여유)
        - 14 < days_until_wedding ≤ 21 → "warning"
        - 0 ≤ days_until_wedding ≤ 14  → "urgent"
    """
    recommended_date = date.fromordinal(
        couple.wedding_date.toordinal() - ALBUM_ORDER_LEAD_DAYS
    )
    days_remaining = (recommended_date - today).days
    days_until_wedding = (couple.wedding_date - today).days

    if days_until_wedding < 0:
        # 결혼일이 이미 지남 → 주문 기한 만료.
        urgency = "expired"
    elif days_until_wedding > ALBUM_WARNING_DAYS:
        # wedding 까지 22일 이상: 아직 여유 있음 (normal).
        urgency = "normal"
    elif days_until_wedding > ALBUM_URGENT_DAYS:
        # 14 < d ≤ 21 → 경고 (노랑).
        urgency = "warning"
    else:
        # 0 ≤ d ≤ 14 → 긴급 (빨강).
        urgency = "urgent"

    return {
        "recommended_date": recommended_date.isoformat(),
        "days_remaining": days_remaining,
        "urgency": urgency,
    }
