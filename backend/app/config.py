# @TASK P0-T2 - 환경변수 설정 (Pydantic Settings)
# @SPEC docs/planning/05-architecture.md#환경변수
"""
Pydantic Settings 로 12-factor 환경변수 로드.

- DATABASE_URL: 기본 sqlite:///./data/weddinglog.db
- OPENAI_API_KEY: 선택 (없으면 폴백)
- CORS_ORIGINS: 쉼표 분리 문자열 → list[str] 로 파싱
- LOG_LEVEL: 기본 INFO
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """애플리케이션 설정."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # 데이터베이스
    DATABASE_URL: str = Field(
        default="sqlite:///./data/weddinglog.db",
        description="SQLAlchemy database URL",
    )

    # OpenAI
    OPENAI_API_KEY: str | None = Field(
        default=None,
        description="OpenAI API key (optional — falls back to templates)",
    )

    # CORS — 환경변수에서는 쉼표 분리 문자열, 내부에서는 list[str]
    CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:5173",
        ],
        description="허용된 CORS 오리진 목록",
    )

    # 로깅
    LOG_LEVEL: str = Field(default="INFO", description="로그 레벨")

    # 업로드 경로
    UPLOAD_DIR: Path = Field(
        default=Path("./data/uploads/photos"),
        description="사진 업로드 루트 디렉터리",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors_origins(cls, v: object) -> object:
        """쉼표 분리 문자열을 list 로 분해 (환경변수에서 리스트 입력 지원)."""
        if isinstance(v, str):
            # JSON 배열 문자열 지원은 pydantic-settings 가 자동 처리하므로
            # 쉼표 분리 케이스만 명시적으로 처리
            stripped = v.strip()
            if stripped.startswith("["):
                return stripped
            return [item.strip() for item in v.split(",") if item.strip()]
        return v

    @field_validator("LOG_LEVEL")
    @classmethod
    def _normalize_log_level(cls, v: str) -> str:
        normalized = v.upper()
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        if normalized not in allowed:
            raise ValueError(f"LOG_LEVEL must be one of {allowed}, got {v!r}")
        return normalized


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """프로세스 생애주기 동안 한 번만 로드되는 싱글턴 설정."""
    return Settings()
