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
    # ── 일상 데이트 (결혼 준비 시작 전 ~ 중) ──────────────────────
    (
        -330,
        "한강 피크닉 (벚꽃 시즌)",
        "ETC",
        "벚꽃 보며 돗자리 깔고",
        ["24_date_picnic_1.jpg", "25_date_picnic_2.jpg", "35_date_han_river.jpg"],
        [
            "벚꽃 아래 우리 둘의 봄",
            "돗자리 하나, 바람 하나, 너와 나",
            "한강의 노을에 물들던 날",
        ],
    ),
    (
        -310,
        "단골 카페에서",
        "ETC",
        "자주 가는 성수동 카페",
        ["19_date_cafe_1.jpg", "20_date_cafe_2.jpg", "21_date_restaurant.jpg"],
        [
            "창가 자리 — 우리의 사이드 프로젝트는 결혼",
            "커피 한 잔, 긴 대화",
            "맛집 리스트에 또 한 곳 추가",
        ],
    ),
    (
        -280,
        "영화 관람",
        "ETC",
        "오랜만에 본 로맨스 영화",
        ["22_date_movie.jpg"],
        ["엔딩 크레딧까지 손 꼭 잡고"],
    ),
    # D-165로 이동 (2025-09-30, 가을 단풍 시즌에 맞춤)
    # offset 재배치는 이 파일 뒷부분에서 다시 순서 정렬
    (
        -230,
        "서점 데이트",
        "ETC",
        "결혼 에세이 한 권씩",
        ["26_date_bookstore.jpg"],
        ["서로에게 읽어주고 싶은 문장을 골랐다"],
    ),
    # ── 초기 기획 (웨딩홀·예산) ─────────────────────────────────
    (
        -200,
        "예식장 투어 (강남구)",
        "VENUE",
        "3곳 중 강남구 한 곳이 가장 마음에 들었다",
        [
            "01_venue_tour.jpg",
            "14_table_setting.jpg",
            "55_wed_hall_chapel.jpg",
            "56_wed_reception.jpg",
            "59_wed_table_setup.jpg",
        ],
        [
            "처음 본 예식장, 어쩐지 설레는 기분",
            "테이블 세팅을 보며 그날의 장면을 상상했다",
            "채플 천장의 빛이 기억에 남는다",
            "리셉션 홀은 따뜻했다",
            "이 테이블에 가족들이 앉겠지",
        ],
    ),
    (
        -180,
        "꽃시장 나들이",
        "ETC",
        "부케 컬러 감 잡으러",
        ["27_date_flower_market.jpg", "58_wed_bouquet_2.jpg", "76_gift_rose_bouquet.jpg"],
        [
            "부케를 고를 때도 서로의 취향이 보인다",
            "파스텔 톤으로 마음이 기운다",
            "장미의 붉은색이 마음에 들었다",
        ],
    ),
    # ── 스드메 (스튜디오·드레스·메이크업) ────────────────────────
    (
        -170,
        "스드메 업체 미팅",
        "STUDIO_DRESS_MAKEUP",
        "드레스 3벌 가봉, 메이크업 테스트",
        [
            "02_dress_meeting.jpg",
            "13_bridal_makeup.jpg",
            "54_wed_dress_fitting.jpg",
            "60_wed_shoes.jpg",
            "66_wed_bride_makeup_2.jpg",
        ],
        [
            "드레스 투어 — 어느 게 제일 우리다울까",
            "메이크업은 자연스러운 쪽이 좋았다",
            "피팅룸 거울 앞, 두근거리는 순간",
            "웨딩 슈즈도 결정",
            "리허설 메이크업 테스트",
        ],
    ),
    # ── 데이트 계속 ──────────────────────────────────────────
    (
        -150,
        "수족관 데이트",
        "ETC",
        "남극 펭귄관이 제일 좋았다",
        ["28_date_aquarium.jpg", "89_couple_hands.jpg"],
        [
            "푸른 빛 속에서 잠깐 멈춘 시간",
            "손을 잡고 있으면 시간은 빠르다",
        ],
    ),
    (
        -130,
        "미술관 관람",
        "ETC",
        "국립현대미술관",
        ["29_date_museum.jpg", "91_couple_laughing.jpg"],
        [
            "예술 앞에서의 너는 새롭게 보인다",
            "웃음이 끊이지 않았던 오후",
        ],
    ),
    (
        -120,
        "남산 야경",
        "ETC",
        "자물쇠 달기",
        ["36_date_night_city.jpg", "90_couple_silhouette.jpg", "95_couple_kiss.jpg"],
        [
            "도시의 불빛만큼 많은 약속",
            "실루엣만으로도 우리라는 걸 안다",
            "야경 앞, 우리만의 순간",
        ],
    ),
    # ── 예물·예단 ────────────────────────────────────────────
    (
        -100,
        "예물 · 예단 쇼핑",
        "GIFT",
        "결혼 반지 맞춤 주문",
        [
            "05_rings.jpg",
            "63_wed_engagement.jpg",
            "64_wed_diamond.jpg",
            "69_gift_jewelry.jpg",
            "70_gift_perfume.jpg",
            "78_gift_ring_macro.jpg",
        ],
        [
            "평생의 약속, 반지에 담다",
            "약혼 반지를 받던 날",
            "작은 다이아몬드, 깊은 약속",
            "예단 보석함도 하나둘 채워진다",
            "향수는 둘이서 함께 고르기",
            "빛이 닿을 때마다 반짝이는 마음",
        ],
    ),
    # 놀이공원 D-95 → D-145로 이동 (2025-10-20, 가을 — 뒤에서 재정렬)
    # ── 웨딩촬영 ─────────────────────────────────────────────
    (
        -90,
        "웨딩촬영 · 스튜디오",
        "WEDDING_PHOTO",
        "실내 스튜디오, 따뜻한 조명",
        [
            "03_wedding_photo_1.jpg",
            "04_wedding_photo_2.jpg",
            "18_bride_portrait.jpg",
            "67_wed_groom_suit.jpg",
            "68_wed_photo_studio.jpg",
        ],
        [
            "처음 웨딩드레스를 입던 날",
            "카메라 앞에선 어색했지만 네 손을 잡으니 웃음이 났다",
            "오늘의 나를 기억할게",
            "그의 슈트도 처음 맞춰 본다",
            "스튜디오 조명 아래의 우리",
        ],
    ),
    # ── 이동된 이벤트들 (계절 맞춤) ─────────────────────────────
    (
        -165,
        "산책하러 공원",
        "ETC",
        "가을 단풍 · 2025년 9월말",
        ["23_date_park.jpg", "32_date_hiking.jpg"],
        [
            "걷기만 해도 충분했던 가을 오후",
            "등산은 느리게, 대화는 길게",
        ],
    ),
    (
        -145,
        "놀이공원",
        "ETC",
        "청명한 가을, 야경 불꽃놀이",
        ["37_date_amusement.jpg", "96_couple_running.jpg"],
        [
            "유치해도 좋은 하루",
            "뛰어다니며 웃었던 가을 오후",
        ],
    ),
    (
        -80,
        "크리스마스 마켓",
        "ETC",
        "둘이 보낸 마지막 미혼 크리스마스 — 2025년 12월",
        ["38_date_christmas.jpg", "94_couple_anniversary.jpg"],
        [
            "불빛 아래 우리",
            "기념일처럼 기억될 겨울밤",
        ],
    ),
    (
        -75,
        "프리웨딩 제주 여행",
        "WEDDING_PHOTO",
        "2박 3일 스냅 여행",
        ["40_travel_jeju.jpg", "41_travel_busan.jpg", "92_couple_hug.jpg"],
        [
            "제주의 바다, 우리의 시작",
            "해운대 새벽 산책",
            "서로 꼭 안고 있던 긴 순간",
        ],
    ),
    # ── 청첩장 ───────────────────────────────────────────────
    (
        -60,
        "청첩장 시안 확인",
        "INVITATION",
        "파스텔 톤으로 결정",
        ["06_invitation.jpg", "65_wed_stationery.jpg", "75_gift_calligraphy.jpg"],
        [
            "당신을 초대합니다",
            "종이의 질감도 공들여 골랐다",
            "손글씨 — 정성을 더하다",
        ],
    ),
    (
        -50,
        "쇼핑 데이트 (예복·가구)",
        "ETC",
        "예복 피팅 후 가전 몰 투어",
        ["33_date_shopping.jpg", "51_travel_hotel.jpg"],
        [
            "우리 집을 채워가는 리스트",
            "신혼집 가구는 이 톤으로",
        ],
    ),
    (
        -45,
        "청첩장 발송",
        "INVITATION",
        "가족·지인 200명",
        [],
        [],
    ),
    # ── 본식 직전 ────────────────────────────────────────────
    # 크리스마스 마켓 D-40 → D-80 로 이동 (2025-12-24, 실제 크리스마스 시즌 — 뒤에서 재정렬)
    (
        -30,
        "식전영상 · 식순 · 한복",
        "VENUE",
        "부케는 프리지아, 한복은 연한 옥색",
        [
            "17_bouquet.jpg",
            "57_wed_flower_arrange.jpg",
            "72_gift_hanbok_1.jpg",
            "73_gift_hanbok_2.jpg",
            "74_gift_paebaek.jpg",
        ],
        [
            "부케를 정하며 그날을 또 한 번 그려본다",
            "꽃장식 — 봄의 분위기로",
            "신부의 한복은 연한 옥색",
            "신랑의 한복은 진한 감색",
            "폐백상 — 전통의 한 페이지",
        ],
    ),
    (
        -20,
        "프리웨딩 촬영 후반",
        "WEDDING_PHOTO",
        "스냅 셀렉",
        ["93_couple_selfie.jpg", "97_couple_cuddle.jpg", "98_couple_love_heart.jpg"],
        [
            "셀피도 이제 두 사람의 기록",
            "따뜻했던 오후의 거실",
            "손으로 만든 작은 하트",
        ],
    ),
    (
        -10,
        "축가·웨딩카·환전",
        "HONEYMOON",
        "여행 가방 꾸리기",
        ["50_travel_luggage.jpg", "52_travel_map.jpg", "53_travel_roadtrip.jpg"],
        [
            "여행 가방 앞에서 설레는 마음",
            "지도 위에 표시한 우리의 경로",
            "여행 준비 — 드라이브하며 상상",
        ],
    ),
    (
        -7,
        "리허설",
        "REHEARSAL",
        "마지막 점검, 내일이면 본식",
        ["07_rehearsal.jpg", "77_gift_lace.jpg"],
        [
            "긴장과 설렘 사이, 내일의 우리를 위한 준비",
            "드레스의 레이스까지 완벽하게",
        ],
    ),
    # ── 본식 당일 ────────────────────────────────────────────
    (
        0,
        "본식",
        "CEREMONY",
        "오늘 우리 결혼합니다",
        [
            "08_ceremony_altar.jpg",
            "09_ceremony_walking.jpg",
            "15_wedding_cake.jpg",
            "61_wed_gift_box.jpg",
            "62_wed_cake_topper.jpg",
            "71_gift_watch.jpg",
        ],
        [
            "맹세를 나누던 그 순간",
            "버진로드 끝에서 기다리던 너",
            "두 사람의 첫 번째 축하 케이크",
            "양가 선물 교환",
            "케이크 토퍼 — 둘의 작은 모형",
            "기념 시계 — 시간을 기억하다",
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
    # ── 신혼여행 ─────────────────────────────────────────────
    (
        3,
        "신혼여행 출발 (발리)",
        "HONEYMOON",
        "10일간의 휴식",
        ["10_honeymoon_airport.jpg", "39_travel_airplane.jpg", "49_travel_airport_2.jpg"],
        [
            "공항에서, 이제 정말 신혼이구나 실감",
            "창밖의 구름 위를 함께 난다",
            "함께 내리는 첫 공항",
        ],
    ),
    (
        4,
        "호텔 체크인 & 조식",
        "HONEYMOON",
        "오션뷰 룸",
        ["80_honey_bali_2.jpg", "81_honey_hawaii.jpg"],
        [
            "발코니에서 커피 한 잔",
            "아침 햇살, 팜트리",
        ],
    ),
    (
        5,
        "발리 해변",
        "HONEYMOON",
        "파도 소리에 늦잠",
        [
            "11_honeymoon_beach.jpg",
            "16_couple_sunset.jpg",
            "79_honey_maldives.jpg",
            "83_honey_phuket.jpg",
            "87_honey_snorkel.jpg",
        ],
        [
            "발리의 파도 소리에 눈을 떴다",
            "하루가 저무는 순간, 너와 함께",
            "깊은 바다색에 빠진 하루",
            "모래사장에 발자국 두 쌍",
            "바닷속 세상도 둘이서 나누는 법",
        ],
    ),
    (
        6,
        "인피니티 풀",
        "HONEYMOON",
        "일몰 수영",
        ["85_honey_infinity_pool.jpg", "86_honey_tropical.jpg", "88_honey_cocktail.jpg"],
        [
            "물과 하늘의 경계가 사라진다",
            "열대의 꽃 — 이국적인 오후",
            "칵테일 한 잔, 우리만의 바",
        ],
    ),
    (
        7,
        "발리 로컬 레스토랑",
        "HONEYMOON",
        "추천받은 곳, 정말 맛있었다",
        ["12_honeymoon_dinner.jpg", "34_date_street_food.jpg"],
        [
            "낯선 도시, 익숙한 네 얼굴",
            "로컬 시장의 활기",
        ],
    ),
    (
        8,
        "근교 섬 하루 여행",
        "HONEYMOON",
        "크루즈 반나절",
        ["84_honey_cruise.jpg", "30_date_beach_walk.jpg", "31_date_sunset.jpg"],
        [
            "배 위에서 본 바다는 끝이 없었다",
            "해변을 따라 맨발로 걷는 오후",
            "일몰 앞에서 말이 줄어든다",
        ],
    ),
    (
        10,
        "신혼여행 귀국",
        "HONEYMOON",
        "짧지만 완벽했던 여행",
        ["48_travel_train.jpg", "43_travel_paris.jpg", "44_travel_europe.jpg"],
        [
            "공항 기차 — 집으로 돌아가는 길",
            "언젠가 다시 올 유럽",
            "우리의 다음 여행 리스트에",
        ],
    ),
    # ── 앨범 주문 ────────────────────────────────────────────
    (
        14,
        "앨범 주문 — 쌓인 기록을 한 권으로",
        "ETC",
        "양가 부모님 포함 3권",
        ["42_travel_tokyo.jpg", "45_travel_mountain.jpg", "46_travel_lake.jpg", "47_travel_forest.jpg", "82_honey_santorini.jpg"],
        [
            "도쿄의 밤도 한 장으로",
            "산과 강을 건너온 기록",
            "조용한 호숫가에서의 우리",
            "숲속 산책 — 기억 깊은 날",
            "산토리니 — 언젠가 꼭 다시",
        ],
    ),
    # ── 결혼 후: 양가 인사 · 앨범 수령 · 기념일 ───────────────────
    (
        20,
        "양가 부모님 첫 방문",
        "ETC",
        "신혼여행 다녀왔다고 인사드리기",
        ["94_couple_anniversary.jpg", "89_couple_hands.jpg"],
        [
            "부모님께 직접 인사드리는 첫날",
            "우리 둘, 이제 한 가족으로",
        ],
    ),
    (
        35,
        "앨범 초안 확인",
        "ETC",
        "레이아웃 검토 — 챕터 순서 재확인",
        ["65_wed_stationery.jpg"],
        ["한 장 한 장 넘기며 다시 떠오르는 순간들"],
    ),
    (
        45,
        "앨범 실물 수령",
        "ETC",
        "하드커버 3권 — 본인 + 양가 부모님",
        ["61_wed_gift_box.jpg"],
        ["마침내 손에 쥔 한 권의 기록"],
    ),
    (
        50,
        "양가 부모님께 앨범 선물",
        "ETC",
        "앨범 들고 양가 방문 — 가장 기뻐하셨다",
        ["69_gift_jewelry.jpg"],
        ["부모님의 눈빛이 말한다: 고맙다, 행복해라"],
    ),
    (
        60,
        "한 달 기념 외식",
        "ETC",
        "첫 결혼기념일의 프리뷰",
        ["21_date_restaurant.jpg", "88_honey_cocktail.jpg", "94_couple_anniversary.jpg"],
        [
            "한 달 전과 달라진 건 없는데 모든 게 다르다",
            "건배 — 우리의 다음 한 달에",
            "함께하는 시간이 곧 기념일",
        ],
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

    today = date.today()
    for offset_days, title, category, memo, photo_files, captions in SEED_EVENTS:
        event_date = couple.wedding_date + timedelta(days=offset_days)
        event = Event(
            couple_id=couple.id,
            title=title,
            date=event_date,
            category=category,
            memo=memo,
            # 실제 오늘 기준 과거면 완료, 미래면 미완료.
            # (wedding_date 변경에 자동으로 따라가는 논리)
            is_completed=(event_date <= today),
            # 시드 데이터는 AI 생성이 아닌 샘플 — False 로 두어 AI 체크리스트
            # 중복 방지 가드(is_ai_generated=True 필터)에 걸리지 않게 한다.
            is_ai_generated=False,
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
            wedding_date=date(2026, 3, 14),
            tagline="철수 ♥ 영희, 2026.03.14",
            profile_photo_path=None,
        )
        db.add(couple)
        db.commit()
        logger.info("Seeded initial couple: %s", SAMPLE_COUPLE_ID)

    # 2) 이벤트 + 사진 시딩 (내부적으로 멱등).
    seed_events_and_photos(db, couple)
