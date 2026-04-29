# @TASK P5-R1-T1 - Order 상태 전이 규칙 (M6)
# @SPEC specs/domain/resources.yaml#orders.status_transition
# @SPEC docs/planning/council-report.md#M6
# @TEST tests/services/test_order_state_machine.py
"""
OrderStateMachine.

Council M6:
    주문 상태는 일방향 전이 (pending → processing → completed).
    역방향/단계건너뛰기/동일상태 전이는 전부 차단한다.

설계 선택:
    - 라우터가 얇아지도록 별도 클래스로 분리.
    - 클래스 메서드만 사용 (상태 없음) — 테스트 용이.
    - 상태 키는 OrderStatus enum value 와 동기 (오타 / 신규 상태 누락 방지).
"""
from __future__ import annotations

from app.schemas.enums import OrderStatus


class OrderStateMachine:
    """주문 상태 전이 규칙."""

    # 허용된 전이: 현재 상태 → 목표 상태 집합.
    # · pending → processing → completed (정방향)
    # · pending → cancelled (사용자 취소 — 제작 시작 전에만 가능)
    # · processing/completed → cancelled (불가)
    ALLOWED_TRANSITIONS: dict[str, set[str]] = {
        OrderStatus.pending.value: {OrderStatus.processing.value, OrderStatus.cancelled.value},
        OrderStatus.processing.value: {OrderStatus.completed.value},
        OrderStatus.completed.value: set(),
        OrderStatus.cancelled.value: set(),
    }

    @classmethod
    def can_transition(cls, current: str, target: str) -> bool:
        """전이 가능 여부 확인 (예외 없이 bool)."""
        allowed = cls.ALLOWED_TRANSITIONS.get(current, set())
        return target in allowed

    @classmethod
    def transition(cls, current: str, target: str) -> None:
        """전이 검증 — 실패 시 ValueError.

        Args:
            current: 현재 상태.
            target: 전이 목표 상태.

        Raises:
            ValueError:
                - current 가 알 수 없는 상태일 때.
                - target 이 허용되지 않는 전이일 때 (역방향, 건너뛰기, 동일).
        """
        if current not in cls.ALLOWED_TRANSITIONS:
            raise ValueError(f"Unknown current status: {current!r}")

        if target not in cls.ALLOWED_TRANSITIONS[current]:
            raise ValueError(
                f"Invalid transition: {current!r} → {target!r} "
                f"(allowed: {sorted(cls.ALLOWED_TRANSITIONS[current]) or 'none'})"
            )
