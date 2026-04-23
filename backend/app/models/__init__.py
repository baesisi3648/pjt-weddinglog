# @TASK P0-T5, P1-R1-T1, P2-R1-T1, P3-R1-T1 - SQLAlchemy 모델 패키지
# @SPEC docs/planning/05-architecture.md#백엔드-구조
"""
SQLAlchemy ORM 모델 루트.

`Base.metadata.create_all()` 호출 전에 모든 모델이 import 되는 것을 보장한다.
"""
from __future__ import annotations

from app.models.couple import Couple  # noqa: F401
from app.models.event import Event  # noqa: F401
from app.models.photo import Photo  # noqa: F401

__all__: list[str] = ["Couple", "Event", "Photo"]
