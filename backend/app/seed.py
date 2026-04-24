# @TASK P1-R1-T5 - 더미 커플 시딩 + 15개 이벤트 + 18장 사진 시딩
# @SPEC docs/planning/05-architecture.md
# @TEST tests/test_seed.py
"""
앱 시작 시 couples / events / photos 테이블에 데모 데이터를 1회 삽입한다.

멱등성:
- couples: 이미 1개 이상 존재 → 샘플 커플 삽입 생략.
- events: 샘플 커플 소유 이벤트가 이미 1개 이상 → 이벤트/사진 시딩 생략.
- 사진 파일: 디스크에 이미 존재 → 덮어쓰지 않음.

심사자 시연용:
- `docker-compose up` 직후 Home/Calendar/Timeline/Orders 전반을 한눈에 볼 수 있도록
  결혼 준비의 실제 스토리(예식장 투어 → 웨딩촬영 → 본식 → 신혼여행)가 담긴
  15개 이벤트와 18장 사진 + 사전 캡션을 시딩한다.
"""
from __future__ import annotations

import logging
import shutil
from datetime import date, timedelta
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.couple import Couple
from app.models.event import Event
from app.models.photo import Photo

logger = logging.getLogger(__name__)

SAMPLE_COUPLE_ID = "cpl_sample_001"


# -----------------------------------------------------------------------------
# 시드 이벤트 정의 (wedding_date 기준 상대 offset)
# -----------------------------------------------------------------------------
# 형식: (offset_days, title, category, memo, photo_files[], captions[])
# - offset_days: wedding_date + timedelta(days=offset) 로 실제 날짜 계산.
# - category: Category enum 의 값(문자열)과 1:1 일치해야 함.
# - photo_files: seed_assets/photos/ 하위 파일명 리스트.
# - captions: photo_files 와 동일 길이의 사전 캡션 (zip 으로 매칭).
# -----------------------------------------------------------------------------
SEED_EVENTS: list[tuple[int, str, str, str, list[str], list[str]]] = [
    (
        -180,
        "예식장 투어 (강남구)",
        "VENUE",
        "3곳 중 강남구 한 곳이 가장 마음에 들었다",
        ["01_venue_tour.jpg", "14_table_setting.jpg"],
        [
            "처음 본 예식장, 어쩐지 설레는 기분",
            "테이블 세팅을 보며 그날의 장면을 상상했다",
        ],
    ),
    (
        -150,
        "스드메 업체 미팅",
        "STUDIO_DRESS_MAKEUP",
        "드레스 3벌 가봉, 메이크업 테스트",
        ["02_dress_meeting.jpg", "13_bridal_makeup.jpg"],
        [
            "드레스 투어 — 어느 게 제일 우리다울까",
            "메이크업은 자연스러운 쪽이 좋았다",
        ],
    ),
    (
        -100,
        "예물 · 예단 쇼핑",
        "GIFT",
        "결혼 반지 맞춤 주문",
        ["05_rings.jpg"],
        ["평생의 약속, 반지에 담다"],
    ),
    (
        -90,
        "웨딩촬영 (여름)",
        "WEDDING_PHOTO",
        "여름 햇살이 예쁜 스튜디오",
        [
            "03_wedding_photo_1.jpg",
            "04_wedding_photo_2.jpg",
            "18_bride_portrait.jpg",
        ],
        [
            "여름 햇살 아래, 처음으로 웨딩드레스를 입은 날",
            "카메라 앞에선 어색했지만 네 손을 잡으니 웃음이 났다",
            "오늘의 나를 기억할게",
        ],
    ),
    (
        -60,
        "청첩장 시안 확인",
        "INVITATION",
        "파스텔 톤으로 결정",
        ["06_invitation.jpg"],
        ["당신을 초대합니다"],
    ),
    (
        -45,
        "청첩장 발송",
        "INVITATION",
        "가족·지인 200명",
        [],
        [],
    ),
    (
        -30,
        "식전영상 · 식순 확정",
        "VENUE",
        "부케는 프리지아로 결정",
        ["17_bouquet.jpg"],
        ["부케를 정하며 그날을 또 한 번 그려본다"],
    ),
    (
        -7,
        "리허설",
        "REHEARSAL",
        "마지막 점검, 내일이면 본식",
        ["07_rehearsal.jpg"],
        ["긴장과 설렘 사이, 내일의 우리를 위한 준비"],
    ),
    (
        0,
        "본식",
        "CEREMONY",
        "오늘 우리 결혼합니다",
        [
            "08_ceremony_altar.jpg",
            "09_ceremony_walking.jpg",
            "15_wedding_cake.jpg",
        ],
        [
            "맹세를 나누던 그 순간",
            "버진로드 끝에서 기다리던 너",
            "두 사람의 첫 번째 축하 케이크",
        ],
    ),
    (
        1,
        "아이폰 스냅 수령",
        "WEDDING_PHOTO",
        "다음 날 바로 받았다",
        [],
        [],
    ),
    (
        3,
        "신혼여행 출발 (발리)",
        "HONEYMOON",
        "10일간의 휴식",
        ["10_honeymoon_airport.jpg"],
        ["공항에서, 이제 정말 신혼이구나 실감"],
    ),
    (
        5,
        "발리 해변",
        "HONEYMOON",
        "파도 소리에 늦잠",
        ["11_honeymoon_beach.jpg", "16_couple_sunset.jpg"],
        [
            "발리의 파도 소리에 눈을 떴다",
            "하루가 저무는 순간, 너와 함께",
        ],
    ),
    (
        7,
        "발리 로컬 레스토랑",
        "HONEYMOON",
        "추천받은 곳, 정말 맛있었다",
        ["12_honeymoon_dinner.jpg"],
        ["낯선 도시, 익숙한 네 얼굴"],
    ),
    (
        10,
        "신혼여행 귀국",
        "HONEYMOON",
        "짧지만 완벽했던 여행",
        [],
        [],
    ),
    (
        14,
        "앨범 주문 추천",
        "ETC",
        "쌓인 기록을 한 권으로",
        [],
        [],
    ),
]


def _seed_assets_root() -> Path:
    """seed_assets/photos 디렉터리의 절대 경로.

    파이썬 모듈 기준 (..../backend/app/seed.py) 상대로 찾기 때문에
    컨테이너(WORKDIR=/app) / 로컬 개발 환경 모두에서 동일하게 동작한다.
    """
    return Path(__file__).resolve().parent.parent / "seed_assets" / "photos"


def seed_events_and_photos(db: Session, couple: Couple) -> None:
    """샘플 커플에 대한 15개 이벤트 + 18장 사진 시딩.

    멱등성:
    - 해당 커플의 events 가 이미 1개 이상 존재 → no-op.
    - 디스크의 사진 파일이 이미 존재 → 덮어쓰지 않음 (shutil.copy2 스킵).

    파일 저장 규칙 (photo_service 와 100% 일치):
    - 물리 경로: `<UPLOAD_DIR>/<event_id>/<photo_id>.<ext>`
      (UPLOAD_DIR = ./data/uploads/photos 이므로
       실제는 data/uploads/photos/<event_id>/<photo_id>.<ext>)
    - DB file_path: `photos/<event_id>/<photo_id>.<ext>`
      (UPLOAD_DIR 의 부모 "uploads" 기준 상대경로 — file_storage.safe_save_photo 규칙과 동일)

    Args:
        db: 활성 SQLAlchemy 세션 (호출자가 커밋 관리).
        couple: 이벤트를 생성할 대상 커플 (id / wedding_date 사용).
    """
    existing = (
        db.query(Event).filter(Event.couple_id == couple.id).count()
    )
    if existing > 0:
        logger.debug(
            "Events already seeded for couple=%s (count=%d) — skip",
            couple.id,
            existing,
        )
        return

    settings = get_settings()
    seed_assets = _seed_assets_root()
    upload_root = settings.UPLOAD_DIR.resolve()
    # safe_save_photo 와 동일하게 UPLOAD_DIR 의 부모("uploads") 기준 상대 경로 사용.
    # UPLOAD_DIR = ".../data/uploads/photos" → rel_base = ".../data/uploads"
    rel_base = upload_root.parent

    events_created = 0
    photos_created = 0
    photos_missing = 0

    for offset_days, title, category, memo, photo_files, captions in SEED_EVENTS:
        event_date = couple.wedding_date + timedelta(days=offset_days)
        event = Event(
            couple_id=couple.id,
            title=title,
            date=event_date,
            category=category,
            memo=memo,
            # D-day 이전(~ 당일)은 완료 처리, 이후는 미완료.
            is_completed=(offset_days <= 0),
            # 시드 데이터임을 표시 (AI 가이드/통계에서 필터링 가능).
            is_ai_generated=True,
        )
        db.add(event)
        db.flush()  # event.id 확보
        events_created += 1

        for p_idx, (filename, caption) in enumerate(zip(photo_files, captions)):
            src = seed_assets / filename
            if not src.exists():
                logger.warning("Seed photo missing on disk: %s", src)
                photos_missing += 1
                continue

            # Photo row 선삽입 → id 로 최종 저장 경로 확정.
            ext = src.suffix.lstrip(".").lower() or "jpg"
            photo = Photo(
                event_id=event.id,
                file_path="pending",
                original_filename=filename,
                caption=caption,
                caption_source="template",
                is_selected=True,
                sort_order=p_idx,
            )
            db.add(photo)
            db.flush()  # photo.id 확보

            # 물리 파일 복사 (멱등 — 이미 있으면 덮어쓰지 않음).
            dst_abs = upload_root / event.id / f"{photo.id}.{ext}"
            dst_abs.parent.mkdir(parents=True, exist_ok=True)
            if not dst_abs.exists():
                shutil.copy2(src, dst_abs)

            # DB file_path 를 file_storage.safe_save_photo 와 동일 형식으로 업데이트.
            # rel_base("data/uploads") 기준 상대경로 → "photos/<event_id>/<photo_id>.<ext>"
            try:
                rel_path = dst_abs.resolve().relative_to(rel_base)
            except ValueError:
                # 예외 방어: 어떤 이유로든 rel 변환이 실패하면 수동 구성
                rel_path = Path("photos") / event.id / f"{photo.id}.{ext}"
            photo.file_path = str(rel_path).replace("\\", "/")
            photos_created += 1

        db.flush()

    db.commit()
    logger.info(
        "Seeded events/photos for couple=%s: events=%d photos=%d missing=%d",
        couple.id,
        events_created,
        photos_created,
        photos_missing,
    )


def seed_initial_data(db: Session) -> None:
    """couples / events / photos 전체 초기 데이터 시딩 (멱등).

    1. 샘플 커플(cpl_sample_001, 철수 ♥ 영희, 2026-10-25) 삽입 or 조회.
    2. 해당 커플에 15개 이벤트 + 18장 사진 시딩.
    """
    # 1) 샘플 커플 준비
    couple = db.query(Couple).filter(Couple.id == SAMPLE_COUPLE_ID).first()
    if couple is None:
        # 다른 커플이 먼저 들어간 경우(테스트 등)에는 새로 넣지 않는다 —
        # 기존 동작 유지(빈 DB 일 때만 샘플 커플 삽입).
        existing_couples = db.query(Couple).count()
        if existing_couples > 0:
            logger.debug(
                "Seed skipped — couples table already has %d rows (no sample couple)",
                existing_couples,
            )
            return

        couple = Couple(
            id=SAMPLE_COUPLE_ID,
            groom_name="철수",
            bride_name="영희",
            wedding_date=date(2026, 10, 25),
            tagline="철수 ♥ 영희, 2026.10.25",
            profile_photo_path=None,
        )
        db.add(couple)
        db.commit()
        logger.info("Seeded initial couple: %s", SAMPLE_COUPLE_ID)

    # 2) 이벤트 + 사진 시딩 (내부적으로 멱등).
    seed_events_and_photos(db, couple)
