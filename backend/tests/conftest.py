# @TASK P0-T2 - 테스트 공통 fixture
# @SPEC docs/planning/05-architecture.md#백엔드-구조
"""
Pytest fixtures:
- in-memory SQLite engine
- 오버라이드된 get_db dependency
- FastAPI TestClient
"""
from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import create_app


@pytest.fixture(scope="session")
def test_engine() -> Generator[Engine, None, None]:
    """세션 스코프 in-memory SQLite 엔진 — 모든 테스트가 공유."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    try:
        yield engine
    finally:
        Base.metadata.drop_all(engine)
        engine.dispose()


@pytest.fixture()
def db_session(test_engine: Engine) -> Generator[Session, None, None]:
    """각 테스트마다 새 트랜잭션을 열고 종료 시 롤백."""
    connection = test_engine.connect()
    transaction = connection.begin()
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=connection
    )
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """TestClient — get_db 를 테스트용 세션으로 오버라이드."""
    app = create_app()

    def _override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
