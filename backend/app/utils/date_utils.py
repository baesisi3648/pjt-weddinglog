# @TASK P1-R1-T4 - D-day 계산 유틸
# @SPEC docs/planning/05-architecture.md
# @TEST tests/utils/test_date_calc.py
"""
D-day 계산 pure function.

규약:
    - wedding_date 미래 → 음수 (D-N)
    - wedding_date 과거 → 양수 (D+N)
    - 당일 → 0
"""
from __future__ import annotations

from datetime import date


def compute_d_day(wedding_date: date, today: date | None = None) -> int:
    """wedding_date 기준 D-day 를 계산한다.

    Args:
        wedding_date: 결혼 예정일.
        today: 기준일 (None 이면 `date.today()`).

    Returns:
        (today - wedding_date).days
        - 음수 = 미래 (D-N)
        - 양수 = 과거 (D+N)
        - 0 = 당일
    """
    reference = today if today is not None else date.today()
    return (reference - wedding_date).days
