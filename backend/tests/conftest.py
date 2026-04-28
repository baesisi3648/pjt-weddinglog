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
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import get_settings
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
def tmp_upload_dir(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> Generator[Path, None, None]:
    """UPLOAD_DIR 을 테스트 임시 디렉터리로 교체.

    seed.py / file_storage.py 등이 `get_settings().UPLOAD_DIR` 을 읽기 때문에
    해당 속성을 직접 교체하여 실제 프로젝트의 data/uploads/photos 를 오염시키지 않는다.
    (UPLOAD_DIR 은 pydantic-settings 의 일반 필드이므로 monkeypatch.setattr 로 변경 가능.)
    """
    settings = get_settings()
    tmp_upload = tmp_path / "data" / "uploads" / "photos"
    tmp_upload.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(settings, "UPLOAD_DIR", tmp_upload)
    try:
        yield tmp_upload
    finally:
        # lru_cache 기반 singleton 이므로 monkeypatch 가 finalize 에서 원복함.
        pass


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """TestClient — get_db 를 테스트용 세션으로 오버라이드.

    Rate limit 은 테스트마다 비활성화한다 (모듈 레벨 limiter 의 enabled 토글).
    같은 IP 에서 동일 엔드포인트를 빠르게 반복 호출하는 테스트가 많아
    프로덕션 한도 (5/min, 30/min) 에 걸리면 회귀 위험.

    create_app() 이 내부에서 configure_enabled(settings.RATE_LIMIT_ENABLED) 를
    호출하므로, 비활성화는 반드시 그 *이후* 에 해야 한다.
    """
    from app.limiter import configure_enabled, limiter

    app = create_app()
    _was_enabled = limiter.enabled
    configure_enabled(False)

    def _override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    try:
        with TestClient(app) as c:
            yield c
    finally:
        app.dependency_overrides.clear()
        configure_enabled(_was_enabled)
