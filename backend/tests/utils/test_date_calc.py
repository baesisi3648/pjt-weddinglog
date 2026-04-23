# @TASK P1-R1-T4 - d_day 계산 유틸 단위 테스트
# @SPEC docs/planning/05-architecture.md
"""
compute_d_day pure function 테스트.

규약: 음수 = D-N (미래), 양수 = D+N (과거), 0 = 당일.
"""
from __future__ import annotations

from datetime import date

from app.utils.date_utils import compute_d_day


class TestComputeDDay:
    def test_future_wedding_returns_negative(self) -> None:
        today = date(2026, 1, 1)
        wedding = date(2026, 1, 31)  # 30일 뒤
        assert compute_d_day(wedding, today=today) == -30

    def test_past_wedding_returns_positive(self) -> None:
        today = date(2026, 1, 15)
        wedding = date(2026, 1, 1)  # 14일 전
        assert compute_d_day(wedding, today=today) == 14

    def test_today_is_zero(self) -> None:
        today = date(2026, 10, 25)
        wedding = date(2026, 10, 25)
        assert compute_d_day(wedding, today=today) == 0

    def test_uses_real_today_when_omitted(self) -> None:
        """today 인자 없으면 현재 날짜를 사용한다."""
        result = compute_d_day(date.today())
        assert result == 0
