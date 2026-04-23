# @TASK P0-T5 - SQLAlchemy 모델 패키지 (Phase 1+ 에서 실제 모델 추가)
# @SPEC docs/planning/05-architecture.md#백엔드-구조
"""
SQLAlchemy ORM 모델 루트.

모델 파일 (couple.py, event.py, photo.py, order.py) 은
Phase 1 이상에서 추가된다. 이 모듈은 `Base.metadata.create_all()`
호출 전에 모든 모델이 import 되는 것을 보장한다.
"""
from __future__ import annotations

# Phase 1+ 에서 아래처럼 추가:
# from app.models.couple import Couple  # noqa: F401
# from app.models.event import Event    # noqa: F401
# from app.models.photo import Photo    # noqa: F401
# from app.models.order import Order    # noqa: F401

__all__: list[str] = []
