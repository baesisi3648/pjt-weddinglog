# @TASK P0-T5 - SQLAlchemy 엔진/세션 초기화
# @SPEC docs/planning/05-architecture.md#데이터베이스-스키마
"""
SQLAlchemy 2.0 동기 엔진 초기화.

P0 단계에서는 SQLite 단일 파일 DB 를 사용한다.
(요구사항 04-tech-stack.md 기준). async 드라이버는 Phase 1+ 에서 필요 시 전환.
"""
from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    """SQLAlchemy 2.0 Declarative Base."""


def _build_engine() -> Engine:
    """설정에서 URL 을 읽어 엔진을 생성한다."""
    settings = get_settings()
    url = settings.DATABASE_URL

    connect_args: dict[str, object] = {}
    if url.startswith("sqlite"):
        # SQLite 는 기본적으로 동일 스레드에서만 커넥션 사용 가능.
        # FastAPI 의존성 주입에서 여러 스레드가 세션을 공유하므로 해제.
        connect_args["check_same_thread"] = False

    return create_engine(
        url,
        connect_args=connect_args,
        future=True,
        echo=False,
    )


engine: Engine = _build_engine()

SessionLocal = sessionmaker(
    bind=engine, autoflush=False, autocommit=False, expire_on_commit=False
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI Dependency — 요청당 세션 1개, 종료 시 close."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
