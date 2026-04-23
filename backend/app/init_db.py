# @TASK P0-T5 - DB 초기화 헬퍼
# @SPEC docs/planning/05-architecture.md#백엔드-구조
"""
Base.metadata.create_all 을 호출하는 단일 진입점.

- 앱 lifespan 에서 호출되어 부팅 시 테이블을 보장한다.
- Phase 1+ 에서 Alembic 도입 시 이 함수는 no-op 로 대체 가능하다.
"""
from __future__ import annotations

import logging
from pathlib import Path

from sqlalchemy.engine import Engine

from app.database import Base, engine as default_engine

# 모델 등록을 위한 import (현재는 비어 있음, Phase 1+ 에서 실제 모델 로드)
import app.models  # noqa: F401

logger = logging.getLogger(__name__)


def init_db(engine: Engine | None = None) -> None:
    """모든 테이블을 생성한다 (존재하면 no-op).

    Args:
        engine: 사용할 엔진. None 이면 기본 engine 사용.
    """
    target_engine = engine or default_engine

    # SQLite 파일 경로라면 부모 디렉터리 보장
    url = str(target_engine.url)
    if url.startswith("sqlite:///") and ":memory:" not in url:
        db_path = Path(url.replace("sqlite:///", "", 1))
        db_path.parent.mkdir(parents=True, exist_ok=True)

    Base.metadata.create_all(bind=target_engine)
    logger.info("Database initialized (tables created if missing)")
