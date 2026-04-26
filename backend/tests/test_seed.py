# @TASK P1-R1-T5 - 더미 커플 + 이벤트/사진 시딩 테스트
# @SPEC docs/planning/05-architecture.md
"""
seed_initial_data / seed_events_and_photos 의 멱등성 및
데이터 일관성 검증.
"""
from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path

import pytest
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.couple import Couple
from app.models.event import Event
from app.models.photo import Photo
from app.seed import (
    SAMPLE_COUPLE_ID,
    SEED_EVENTS,
    seed_events_and_photos,
    seed_initial_data,
)


# -----------------------------------------------------------------------------
# 커플 시딩
# -----------------------------------------------------------------------------
def test_seed_creates_sample_couple_when_empty(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """빈 DB 상태에서 시드 호출 → 샘플 커플 1개 생성 (철수 ♥ 영희, 2026-03-14)."""
    assert db_session.query(Couple).count() == 0

    seed_initial_data(db_session)

    couples = db_session.query(Couple).all()
    assert len(couples) == 1
    sample = couples[0]
    assert sample.id == SAMPLE_COUPLE_ID
    assert sample.groom_name == "철수"
    assert sample.bride_name == "영희"
    assert sample.wedding_date == date(2026, 3, 14)


def test_seed_is_idempotent(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """시드를 두 번 호출해도 커플/이벤트/사진이 중복 생성되지 않는다."""
    seed_initial_data(db_session)
    first_couples = db_session.query(Couple).count()
    first_events = db_session.query(Event).count()
    first_photos = db_session.query(Photo).count()

    seed_initial_data(db_session)
    second_couples = db_session.query(Couple).count()
    second_events = db_session.query(Event).count()
    second_photos = db_session.query(Photo).count()

    assert first_couples == 1 and second_couples == 1
    assert first_events == second_events
    assert first_photos == second_photos


# -----------------------------------------------------------------------------
# 이벤트 + 사진 시딩
# -----------------------------------------------------------------------------
def test_seed_creates_all_events(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """seed_events_and_photos 가 SEED_EVENTS 의 전체 개수만큼 이벤트 생성."""
    seed_initial_data(db_session)

    events = (
        db_session.query(Event)
        .filter(Event.couple_id == SAMPLE_COUPLE_ID)
        .all()
    )
    assert len(events) == len(SEED_EVENTS)
    # 현재 스펙: 24개 이벤트 (단일 22 + multi-day 2)
    assert len(events) >= 20


def test_seed_includes_multi_day_events(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """제주 프리웨딩(2박 3일), 신혼여행(8박 9일) 이 multi-day 로 시딩되어야 한다."""
    seed_initial_data(db_session)

    multi = (
        db_session.query(Event)
        .filter(Event.couple_id == SAMPLE_COUPLE_ID)
        .filter(Event.end_date.isnot(None))
        .order_by(Event.date.asc())
        .all()
    )
    assert len(multi) == 2

    jeju = multi[0]
    assert "제주" in jeju.title
    assert (jeju.end_date - jeju.date).days == 2  # 2박 3일

    honeymoon = multi[1]
    assert "신혼여행" in honeymoon.title
    assert (honeymoon.end_date - honeymoon.date).days == 8  # 8박 9일


def test_seed_photo_counts_match_spec(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """각 이벤트의 Photo 개수가 SEED_EVENTS 정의와 일치."""
    seed_initial_data(db_session)

    events = {
        e.title: e
        for e in db_session.query(Event)
        .filter(Event.couple_id == SAMPLE_COUPLE_ID)
        .all()
    }

    for entry in SEED_EVENTS:
        # 새 형식: (offset, end_offset|None, title, cat, memo, photo_files, captions)
        _offset, _end_offset, title, _cat, _memo, photo_files, _captions = entry
        assert title in events, f"missing event: {title}"
        event = events[title]
        photos = (
            db_session.query(Photo).filter(Photo.event_id == event.id).all()
        )
        assert len(photos) == len(photo_files), (
            f"{title}: expected {len(photo_files)} photos, got {len(photos)}"
        )


def test_seed_copies_physical_photo_files(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """모든 Photo.file_path 가 디스크에 실제 존재하고,
    file_path 형식이 "photos/<event_id>/<photo_id>.<ext>" 인지 확인."""
    seed_initial_data(db_session)

    photos = (
        db_session.query(Photo)
        .join(Event, Photo.event_id == Event.id)
        .filter(Event.couple_id == SAMPLE_COUPLE_ID)
        .all()
    )
    assert len(photos) >= 1

    upload_root = get_settings().UPLOAD_DIR.resolve()
    for photo in photos:
        assert photo.file_path.startswith("photos/"), (
            f"unexpected file_path: {photo.file_path!r}"
        )
        parts = photo.file_path.split("/")
        assert parts[0] == "photos"
        assert parts[1] == photo.event_id
        assert parts[2].startswith(photo.id + ".")

        abs_path = upload_root.parent / photo.file_path
        assert abs_path.exists(), f"missing on disk: {abs_path}"
        assert abs_path.stat().st_size > 0


def test_seed_first_event_is_hangang_picnic(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """가장 이른 이벤트는 한강 피크닉 (D-330), ETC 카테고리."""
    seed_initial_data(db_session)

    couple = db_session.query(Couple).filter(
        Couple.id == SAMPLE_COUPLE_ID
    ).one()

    events = (
        db_session.query(Event)
        .filter(Event.couple_id == SAMPLE_COUPLE_ID)
        .order_by(Event.date.asc())
        .all()
    )
    first = events[0]
    assert "한강" in first.title
    assert first.category == "ETC"
    assert first.date == couple.wedding_date + timedelta(days=-330)


def test_seed_events_captions_match(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """SEED_EVENTS 의 captions 가 photo_files 와 길이 일치해야 한다."""
    for entry in SEED_EVENTS:
        _offset, _end_offset, title, _cat, _memo, photo_files, captions = entry
        assert len(photo_files) == len(captions), (
            f"{title}: photo_files({len(photo_files)}) vs "
            f"captions({len(captions)}) mismatch"
        )


def test_seed_photos_have_template_captions(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """시드된 사진들은 caption 이 채워져 있고 caption_source == 'template'."""
    seed_initial_data(db_session)

    photos = (
        db_session.query(Photo)
        .join(Event, Photo.event_id == Event.id)
        .filter(Event.couple_id == SAMPLE_COUPLE_ID)
        .all()
    )
    assert len(photos) > 0
    for p in photos:
        assert p.caption and p.caption.strip()
        assert p.caption_source == "template"
        assert p.is_selected is True


def test_seed_events_completion_flag(
    db_session: Session, tmp_upload_dir: Path
) -> None:
    """이벤트 종료일(또는 단일 이벤트의 시작일)이 오늘 이전/당일이면 완료, 이후면 미완료."""
    seed_initial_data(db_session)

    today = date.today()
    events = (
        db_session.query(Event)
        .filter(Event.couple_id == SAMPLE_COUPLE_ID)
        .all()
    )

    for e in events:
        basis = e.end_date or e.date
        if basis <= today:
            assert e.is_completed is True, (
                f"{e.title} (basis={basis}) should be completed"
            )
        else:
            assert e.is_completed is False, (
                f"{e.title} (basis={basis}) should not be completed"
            )
