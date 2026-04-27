# @TASK P5-R1-T1 - Order 상태 전이 단위 테스트 (Council M6)
# @SPEC docs/planning/council-report.md#M6
"""
OrderStateMachine 5개 시나리오 (M6 요구사항).

1. pending → processing   OK
2. processing → completed OK
3. completed → processing 실패 (역방향)
4. pending → completed    실패 (단계 건너뛰기)
5. pending → pending      실패 (동일 상태)
"""
from __future__ import annotations

import pytest

from app.services.order_state_machine import OrderStateMachine


class TestOrderStateMachineTransition:
    """5개 시나리오 필수."""

    # ── 정방향 ──────────────────────────────────────────────────
    def test_pending_to_processing_ok(self) -> None:
        # 예외가 나지 않아야 한다.
        OrderStateMachine.transition("pending", "processing")
        assert OrderStateMachine.can_transition("pending", "processing") is True

    def test_processing_to_completed_ok(self) -> None:
        OrderStateMachine.transition("processing", "completed")
        assert (
            OrderStateMachine.can_transition("processing", "completed") is True
        )

    # ── 역방향 ──────────────────────────────────────────────────
    def test_completed_to_processing_fails(self) -> None:
        with pytest.raises(ValueError, match="Invalid transition"):
            OrderStateMachine.transition("completed", "processing")
        assert (
            OrderStateMachine.can_transition("completed", "processing")
            is False
        )

    # ── 단계 건너뛰기 ───────────────────────────────────────────
    def test_pending_to_completed_fails(self) -> None:
        with pytest.raises(ValueError, match="Invalid transition"):
            OrderStateMachine.transition("pending", "completed")
        assert (
            OrderStateMachine.can_transition("pending", "completed") is False
        )

    # ── 동일 상태 ──────────────────────────────────────────────
    def test_same_state_fails(self) -> None:
        with pytest.raises(ValueError, match="Invalid transition"):
            OrderStateMachine.transition("pending", "pending")
        assert (
            OrderStateMachine.can_transition("pending", "pending") is False
        )


class TestOrderStateMachineEdgeCases:
    """방어 케이스 — 알 수 없는 상태."""

    def test_unknown_current_raises(self) -> None:
        with pytest.raises(ValueError, match="Unknown current status"):
            OrderStateMachine.transition("draft", "completed")

    def test_completed_is_terminal(self) -> None:
        # completed 에서 어느 상태로도 전이 불가.
        assert OrderStateMachine.ALLOWED_TRANSITIONS["completed"] == set()

    def test_cancelled_is_terminal(self) -> None:
        # cancelled 에서 어느 상태로도 전이 불가 (재개 불가).
        assert OrderStateMachine.ALLOWED_TRANSITIONS["cancelled"] == set()

    def test_pending_to_cancelled_ok(self) -> None:
        """사용자 취소 — pending 에서만 허용."""
        assert OrderStateMachine.can_transition("pending", "cancelled") is True
        OrderStateMachine.transition("pending", "cancelled")  # 예외 없음

    def test_processing_to_cancelled_fails(self) -> None:
        """제작 시작 후엔 취소 불가 (인쇄 비용 발생 가정)."""
        assert (
            OrderStateMachine.can_transition("processing", "cancelled") is False
        )
        with pytest.raises(ValueError, match="Invalid transition"):
            OrderStateMachine.transition("processing", "cancelled")

    def test_completed_to_cancelled_fails(self) -> None:
        """완료된 주문은 취소 불가."""
        with pytest.raises(ValueError, match="Invalid transition"):
            OrderStateMachine.transition("completed", "cancelled")

    def test_processing_to_pending_fails(self) -> None:
        # 추가 역방향 — can_transition=False 확인.
        assert (
            OrderStateMachine.can_transition("processing", "pending") is False
        )
