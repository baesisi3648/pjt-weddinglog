# @TASK P1-R1-T1 - Couple SQLAlchemy 모델
# @SPEC docs/planning/05-architecture.md#데이터베이스-스키마
# @SPEC specs/domain/resources.yaml#couples
# @TEST tests/models/test_couple.py
"""
Couple ORM 모델.

- id: 'cpl_' 접두 + URL-safe 토큰 (secrets.token_urlsafe(8)) 자동 생성
- groom_name / bride_name: 2자 이상 (검증은 Pydantic 스키마 레이어)
- wedding_date: D-day 기준점 (과거/미래 모두 허용)
- derived: d_day (모델 레벨에서는 저장 안 함, 서비스에서 계산)
"""
from __future__ import annotations

import secrets
from datetime import date, datetime

from sqlalchemy import Date, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _generate_couple_id() -> str:
    """'cpl_' + URL-safe 토큰 (8바이트 ≈ 11자)."""
    return f"cpl_{secrets.token_urlsafe(8)}"


class Couple(Base):
    """커플 프로필 ORM.

    Attributes:
        id: 'cpl_xxxxxxxxxxx' 형태 (외부 노출 가능하지만 추측 불가).
        groom_name: 신랑 이름 (2자 이상, Pydantic에서 검증).
        bride_name: 신부 이름 (2자 이상, Pydantic에서 검증).
        wedding_date: 결혼 예정일 (D-day 기준점).
        profile_photo_path: 프로필 사진 경로 (선택).
        tagline: 한 줄 소개 (선택).
        created_at: 생성 시각 (UTC).
    """

    __tablename__ = "couples"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=_generate_couple_id
    )
    groom_name: Mapped[str] = mapped_column(String(100), nullable=False)
    bride_name: Mapped[str] = mapped_column(String(100), nullable=False)
    wedding_date: Mapped[date] = mapped_column(Date, nullable=False)
    profile_photo_path: Mapped[str | None] = mapped_column(String, nullable=True)
    tagline: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<Couple id={self.id!r} groom={self.groom_name!r} "
            f"bride={self.bride_name!r} wedding_date={self.wedding_date}>"
        )
