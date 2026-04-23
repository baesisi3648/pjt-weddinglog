# @TASK P1-R1-T5 - 더미 커플 시딩
# @SPEC docs/planning/05-architecture.md
# @TEST tests/test_seed.py
"""
앱 시작 시 couples 테이블에 샘플 커플을 1회 삽입한다.

멱등성: 이미 1개 이상 존재하면 no-op.
"""
from __future__ import annotations

import logging
from datetime import date

from sqlalchemy.orm import Session

from app.models.couple import Couple

logger = logging.getLogger(__name__)

SAMPLE_COUPLE_ID = "cpl_sample_001"


def seed_initial_data(db: Session) -> None:
    """couples 테이블이 비어있으면 샘플 커플(cpl_sample_001)을 삽입한다.

    - 이미 1건 이상 존재 → no-op (로그만 남김).
    - 트랜잭션은 호출자 세션을 재사용하며, 삽입 후 commit 한다.
    """
    existing = db.query(Couple).count()
    if existing > 0:
        logger.debug("Seed skipped — couples table already has %d rows", existing)
        return

    sample = Couple(
        id=SAMPLE_COUPLE_ID,
        groom_name="철수",
        bride_name="영희",
        wedding_date=date(2026, 10, 25),
        tagline="철수 ♥ 영희, 2026.10.25",
        profile_photo_path=None,
    )
    db.add(sample)
    db.commit()
    logger.info("Seeded initial couple: %s", SAMPLE_COUPLE_ID)
