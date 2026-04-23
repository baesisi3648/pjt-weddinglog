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

import json
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

    # CORS — str 로 받고 cors_origins_list property 에서 파싱
    # (pydantic-settings 2.x 가 list[str] 에 대해 JSON 파싱을 강제하여,
    # 쉼표 분리 형식의 환경변수가 JSONDecodeError 로 실패하는 이슈 회피)
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        description="허용된 CORS 오리진 (쉼표 분리 문자열 또는 JSON 배열)",
    )

    # 로깅
    LOG_LEVEL: str = Field(default="INFO", description="로그 레벨")

    # 업로드 경로
    UPLOAD_DIR: Path = Field(
        default=Path("./data/uploads/photos"),
        description="사진 업로드 루트 디렉터리",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS_ORIGINS 문자열을 list[str] 로 파싱한다.

        지원 형식:
        - 쉼표 분리: "http://a.com,http://b.com"
        - JSON 배열: '["http://a.com", "http://b.com"]'
        """
        raw = self.CORS_ORIGINS.strip()
        if not raw:
            return []
        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [str(x).strip() for x in parsed if str(x).strip()]
            except json.JSONDecodeError:
                pass
        return [item.strip() for item in raw.split(",") if item.strip()]

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
