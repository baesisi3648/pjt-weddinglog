# @TASK P1-R1-T5 - 더미 커플 시딩 (철수 ♥ 영희, 2026-03-14)
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
  실제 결혼 스토리(예식장 투어 → 웨딩촬영 → 본식 → 신혼여행)가 담긴
  24개 이벤트와 ~120장 사진 + 감성 캡션을 시딩한다.
- Multi-day 이벤트: 제주 프리웨딩 (2박 3일), 신혼여행 발리 (8박 9일) — end_date 활용.
"""
from __future__ import annotations

import logging
import shutil
from datetime import date, timedelta
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.couple import Couple
from app.models.event import Event
from app.models.order import Order
from app.models.photo import Photo

logger = logging.getLogger(__name__)

SAMPLE_COUPLE_ID = "cpl_sample_001"


# -----------------------------------------------------------------------------
# 시드 이벤트 정의 (wedding_date 기준 상대 offset)
# -----------------------------------------------------------------------------
# 형식: (offset_days, end_offset_days|None, title, category, memo, photo_files, captions)
#   - offset_days: wedding_date + timedelta(days=offset) 로 date 계산.
#   - end_offset_days: None 이면 단일 이벤트, 정수면 multi-day 종료일.
#   - photo_files: seed_assets/photos/ 하위 파일명 리스트.
#   - captions: 파일과 동일 길이, 2030 감성 톤 ("한강 피크닉!" 느낌).
# -----------------------------------------------------------------------------
SEED_EVENTS: list[
    tuple[int, int | None, str, str, str, list[str], list[str]]
] = [
    # ── 2025 봄 — 데이트 ────────────────────────────────────────
    (
        -330, None,
        "한강 피크닉",
        "ETC",
        "여의도 · 벚꽃 시즌",
        [
            "01_picnic_hangang1.png",
            "01_picnic_hangang2.png",
            "01_picnic_hangang3.png",
        ],
        [
            "벚꽃 한 장 주웠어 🌸",
            "벚꽃 아래 피크닉 세팅 완료",
            "벚꽃길 산책, 우리 둘 🤍",
        ],
    ),
    (
        -310, None,
        "성수 단골 카페",
        "ETC",
        "매주 가는 그곳",
        [
            "02_cafe_seongsu1.png",
            "02_cafe_seongsu2.png",
            "02_cafe_seongsu3.png",
        ],
        [
            "단골카페 창가자리 득템 ☕",
            "라떼랑 케이크 조합 최고",
            "오빠랑 수다 타임 시작",
        ],
    ),
    (
        -280, None,
        "영화 관람",
        "ETC",
        "로맨스 영화 예매",
        ["03_movie_night.png"],
        ["영화관 왔다, 팝콘 겟 🍿"],
    ),
    (
        -230, None,
        "서점 데이트",
        "ETC",
        "결혼 에세이 한 권씩",
        [
            "04_bookstore1.png",
            "04_bookstore2.png",
        ],
        [
            "서점에서 각자 책 탐색중 📚",
            "이 책 진짜 좋다",
        ],
    ),
    # ── 2025 여름 — 예식장 & 꽃시장 ───────────────────────────────
    (
        -200, None,
        "예식장 투어 (강남구)",
        "VENUE",
        "3곳 투어 후 마음에 든 한 곳",
        [
            "05_venue_tour_1.png",
            "05_venue_tour_2.png",
            "05_venue_tour_3.png",
            "05_venue_tour_4.png",
            "05_venue_tour_5.png",
        ],
        [
            "채플 천장 너무 예쁘잖아 🤍",
            "연회장 테이블 세팅 취향저격",
            "계단샷은 국룰이지",
            "여기서 식 올릴까? 💍",
            "샹들리에 진짜 미쳤다",
        ],
    ),
    (
        -180, None,
        "꽃시장 나들이",
        "VENUE",
        "부케 컬러 감 잡으러",
        [
            "06_flower_market_1.png",
            "06_flower_market_2.png",
            "06_flower_market_3.png",
        ],
        [
            "꽃다발 든 우리 오빠 💐",
            "부케 느낌으로 들어봤어",
            "꽃시장 데이트, 여기 꽃 천국",
        ],
    ),
    # ── 2025 가을 — 스드메 & 데이트 ─────────────────────────────
    (
        -170, None,
        "스드메 업체 미팅",
        "STUDIO_DRESS_MAKEUP",
        "드레스 3벌 · 메이크업 테스트",
        [
            "07_sdm_meeting_1.png",
            "07_sdm_meeting_2.png",
            "07_sdm_meeting_3.png",
            "07_sdm_meeting_4.png",
            "07_sdm_meeting_5.png",
        ],
        [
            "드레스 피팅 시작 🤍",
            "이 드레스 핏 너무 예뻐",
            "레이스 디테일 실화냐",
            "메이크업 받는 중 💄",
            "구두도 골라야지 👠",
        ],
    ),
    (
        -165, None,
        "공원 단풍 산책",
        "ETC",
        "서울숲 · 주말 오후",
        [
            "08_autumn_park_1.png",
            "08_autumn_park_2.png",
        ],
        [
            "단풍길 손잡고 🍁",
            "단풍잎 주워다 줬어",
        ],
    ),
    (
        -150, None,
        "수족관 데이트",
        "ETC",
        "코엑스 아쿠아리움",
        [
            "09_aquarium_1.png",
            "09_aquarium_2.png",
        ],
        [
            "펭귄 보다가 빵 터진 순간 🐧",
            "가오리야 안녕",
        ],
    ),
    (
        -145, None,
        "놀이공원",
        "ETC",
        "롯데월드 · 야간 개장",
        [
            "10_theme_park_1.png",
            "10_theme_park_2.png",
        ],
        [
            "회전목마 앞에서 손 꼭 잡고",
            "대관람차 단둘이 🎡",
        ],
    ),
    (
        -130, None,
        "미술관 관람",
        "ETC",
        "국립현대미술관 서울관",
        [
            "11_museum_1.png",
            "11_museum_2.png",
        ],
        [
            "이 작품 우리집에 걸고 싶다",
            "미술관 데이트 필수 코스",
        ],
    ),
    (
        -120, None,
        "남산 야경",
        "ETC",
        "자물쇠 달러 가는 길",
        [
            "12_namsan_night_1.png",
            "12_namsan_night_2.png",
            "12_namsan_night_3.png",
        ],
        [
            "서울 야경 통째로 우리 거",
            "남산타워 아래 이마 맞대고",
            "우리 자물쇠 철컥 🔒",
        ],
    ),
    # ── 2025 겨울 — 예물 · 웨딩촬영 · 크리스마스 · 제주 ──────────
    (
        -100, None,
        "예물·예단 쇼핑",
        "GIFT",
        "반지 맞춤 + 예단 선물",
        [
            "13_rings_gift_1.png",
            "13_rings_gift_2.png",
            "13_rings_gift_3.png",
            "13_rings_gift_4.png",
            "13_rings_gift_5.png",
            "13_rings_gift_6.png",
        ],
        [
            "향수 쇼핑도 같이하는 사이",
            "이 반지로 결정",
            "사이즈 맞춰보는 중 💍",
            "커플링 낀 손 자꾸 봄",
            "다이아 영롱 ✨",
            "예단 함 오픈 💚",
        ],
    ),
    (
        -90, None,
        "웨딩촬영 스튜디오",
        "WEDDING_PHOTO",
        "실내 스튜디오 · 하루 종일",
        [
            "14_wedding_studio_1.png",
            "14_wedding_studio_2.png",
            "14_wedding_studio_3.png",
            "14_wedding_studio_4.png",
            "14_wedding_studio_5.png",
            "14_wedding_studio_6.png",
            "14_wedding_studio_7.png",
            "14_wedding_studio_8.png",
            "14_wedding_studio_9.png",
        ],
        [
            "턱시도 단독컷 찍는 신랑",
            "드레스 피팅 + 메이크업",
            "정면 스탠딩 이 컷 확정",
            "베일 쓴 브라이덜 솔로",
            "자연광 들어오는 인도어컷",
            "가든 조명 아래 이마 맞대고",
            "꽃밭 뒷모습 손잡고 🌹",
            "풀밭에 앉아 깔깔 웃음",
            "노을 실루엣 이 컷 앨범行",
        ],
    ),
    (
        -80, None,
        "크리스마스 마켓",
        "ETC",
        "2025 12/24 · 광화문",
        [
            "15_christmas_market_1.png",
            "15_christmas_market_2.png",
        ],
        [
            "뱅쇼 들고 마켓 한바퀴 🎄",
            "눈송이 오너먼트 득템 ❄️",
        ],
    ),
    # ⭐ Multi-day #1: 제주 프리웨딩 2박 3일 (D-76 ~ D-74 = 2025-12-28 ~ 12-30)
    (
        -76, -74,
        "제주 프리웨딩 여행",
        "WEDDING_PHOTO",
        "2박 3일 · 스냅 촬영 + 관광",
        [
            "16_jeju_prewedding_1.png",
            "16_jeju_prewedding_2.png",
            "16_jeju_prewedding_3.png",
            "16_jeju_prewedding_4.png",
            "16_jeju_prewedding_5.png",
            "16_jeju_prewedding_6.png",
            "16_jeju_prewedding_7.png",
            "16_jeju_prewedding_8.png",
            "16_jeju_prewedding_9.png",
            "16_jeju_prewedding_10.png",
            "16_jeju_prewedding_11.png",
        ],
        [
            "감귤밭 데이트 🍊",
            "바다 보이는 카페에서",
            "맨발로 제주 바다",
            "제주 흑돼지는 못 참지",
            "렌터카 타고 해안도로",
            "억새밭 해안 산책",
            "전망대에서 바다 한 컷",
            "라떼 두 잔의 여유",
            "제주 바다 일몰 실루엣",
            "오름 정상, 바다가 다 보여",
            "제주 돌담길 따라 걷기",
        ],
    ),
    # ── 2026 초봄 — 청첩장 · 쇼핑 · 한복 · 프리웨딩 후반 ──────────
    (
        -60, None,
        "청첩장 시안 확인",
        "INVITATION",
        "파스텔 톤으로 결정",
        ["17_invitation_1.png"],
        ["청첩장 봉투에 이름 쓰는 중 ✍️"],
    ),
    (
        -50, None,
        "쇼핑 데이트 (예복·가구)",
        "ETC",
        "예복 피팅 + 가전 몰 투어",
        [
            "18_shopping_date_1.png",
            "18_shopping_date_2.png",
        ],
        [
            "가전 보러 온 예비부부",
            "우리집 소파는 이걸로 🛋️",
        ],
    ),
    (
        -30, None,
        "식전영상·식순·한복",
        "VENUE",
        "한복 연한 옥색 · 식전영상 촬영",
        [
            "19_hanbok_prep_1.png",
            "19_hanbok_prep_2.png",
            "19_hanbok_prep_3.png",
            "19_hanbok_prep_4.png",
        ],
        [
            "한복 피팅 완료 🌿",
            "민트 저고리 입은 나",
            "남색 한복 입은 예비 신랑",
            "내 부케 이 느낌 💐",
        ],
    ),
    (
        -20, None,
        "신혼집 셋업 & 셀피",
        "ETC",
        "이삿짐 풀고 거실·주방 둘러보기",
        [
            "20_prewed_late_1.png",
            "20_prewed_late_2.png",
            "20_prewed_late_3.png",
        ],
        [
            "신혼집 주방 셀피 📸",
            "우리 커플링 하트 💍",
            "신혼집 소파 적응기",
        ],
    ),
    (
        -10, None,
        "신혼여행 짐 꾸리기",
        "HONEYMOON",
        "발리 코스 정리 + 환전 + 캐리어",
        [
            "21_final_packing_1.png",
            "21_final_packing_2.png",
            "21_final_packing_3.png",
        ],
        [
            "신혼여행 캐리어 싸는 날 🧳",
            "발리 코스 짜는 중",
            "예비신랑이랑 드라이브 🚗",
        ],
    ),
    (
        -7, None,
        "리허설",
        "REHEARSAL",
        "식장 리허설 · 동선 점검",
        [
            "22_rehearsal_1.png",
            "22_rehearsal_2.png",
        ],
        [
            "드레스 소매 레이스 디테일",
            "리허설 손잡고 입장 연습",
        ],
    ),
    # ── 본식 당일 ────────────────────────────────────────────
    (
        0, None,
        "본식",
        "CEREMONY",
        "오늘 우리 결혼합니다!",
        [
            "23_wedding_day_1.png",
            "23_wedding_day_2.png",
            "23_wedding_day_3.png",
            "23_wedding_day_4.png",
            "23_wedding_day_5.png",
            "23_wedding_day_6.png",
        ],
        [
            "오늘 우리 결혼함 💍",
            "서로만 보이던 순간",
            "케이크 컷 🍰",
            "꽃잎 축하 받으며 퇴장 🌸",
            "반지 끼워주는 순간 💍",
            "신부 편지 읽는 중 🥹",
        ],
    ),
    # ⭐ Multi-day #2: 신혼여행 발리 8박 9일 (D+3 ~ D+11 = 2026-03-17 ~ 2026-03-25)
    (
        3, 11,
        "신혼여행 (발리)",
        "HONEYMOON",
        "8박 9일 · 해변 + 풀 + 우붓 데이트립",
        # 24~34 이미지 전체 (36장) — 각 날/장소별 감성 캡션
        [
            # 24 출국 (3장)
            "24_airport_departure_1.png",
            "24_airport_departure_2.png",
            "24_airport_departure_3.png",
            # 25 호텔 체크인 (2장)
            "25_hotel_checkin_1.png",
            "25_hotel_checkin_2.png",
            # 26 발리 해변 (5장)
            "26_bali_beach_1.png",
            "26_bali_beach_2.png",
            "26_bali_beach_3.png",
            "26_bali_beach_4.png",
            "26_bali_beach_5.png",
            # 27 인피니티 풀 (5장)
            "27_infinity_pool_1.png",
            "27_infinity_pool_2.png",
            "27_infinity_pool_3.png",
            "27_infinity_pool_4.png",
            "27_infinity_pool_5.png",
            # 28번(발리 식사)는 27_4/27_5 와 동일 파일이라 중복 — 제거됨.
            # 29 근교 섬 (3장)
            "29_island_daytrip_1.png",
            "29_island_daytrip_2.png",
            "29_island_daytrip_3.png",
            # 30 데이트립 — 우붓 전통시장 (5장)
            "30_bali_daytrip_1.png",
            "30_bali_daytrip_2.png",
            "30_bali_daytrip_3.png",
            "30_bali_daytrip_4.png",
            "30_bali_daytrip_5.png",
            # 31 데이트립 — 라이스 테라스 (5장)
            "31_bali_daytrip_1.png",
            "31_bali_daytrip_2.png",
            "31_bali_daytrip_3.png",
            "31_bali_daytrip_4.jpg",
            "31_bali_daytrip_5.png",
            # 32 데이트립 — 워터폴 (5장)
            "32_bali_daytrip_1.png",
            "32_bali_daytrip_2.png",
            "32_bali_daytrip_3.png",
            "32_bali_daytrip_4.png",
            "32_bali_daytrip_5.png",
            # 33 데이트립 — 사원 · 해안 (5장)
            "33_bali_daytrip_1.jpg",
            "33_bali_daytrip_2.jpg",
            "33_bali_daytrip_3.jpg",
            "33_bali_daytrip_4.jpg",
            "33_bali_daytrip_5.jpg",
            # 34 여행 엔딩 (3장)
            "34_the_end_1.png",
            "34_the_end_2.png",
            "34_the_end_3.png",
        ],
        [
            # 24 출국 (서브에이전트 판독: 1=공항 출국, 2=발리 도착 야자수, 3=기내 창가)
            "인천공항 출국 직전 ✈️",
            "발리 도착! 야자수 반겨줌 🌴",
            "구름 위 노을 창가석 당첨",
            # 25 체크인
            "풀빌라 오션뷰 실화냐",
            "조식이 벌써 예술 🥐",
            # 26 해변
            "발리 첫 바다 손잡고 🌊",
            "선셋 실루엣 최고야",
            "비치타월 위 낮잠 타임",
            "스노클링 물 속까지 투명 🐠",
            "우리 둘 발자국만 남기고",
            # 27 풀
            "코코넛 칵테일 입수 🥥",
            "풀에 떠다니는 플루메리아 🌸",
            "선셋 인피니티 풀 미쳤다",
            "발리 로컬 다이닝 입장 🪔",
            "수영하다 말고 한 컷",
            # 28번 캡션은 사진 중복으로 제거.
            # 29 섬
            "보트 타고 근교 섬 투어 ⛵",
            "켈링킹 절벽 뷰 실화",
            "노을 해변 산책 마무리 🌅",
            # 30 울루와뚜 선셋 & 께짝댄스
            "울루와뚜 선셋 실루엣 🌅",
            "께짝댄스 직관했다 🔥",
            "절벽 계단 따라 내려가기 🌺",
            "짜낭사리 꽃 공양 🌸",
            "노을 앞에 잠시 멈춤 🧡",
            # 31 라이스 테라스
            "라이스테라스 초록초록 🌾",
            "벼 이삭 스치는 손 🍃",
            "발리 그네 타봤다 🌴",
            "논밭 뷰 앞에 서서 🌿",
            "나시짬뿌르 점심 🥥",
            # 32 몽키 포레스트
            "몽키 포레스트 거대 뿌리 🌳",
            "가방 털린 그 순간 🐒",
            "동상 위 친구 등장 🙈",
            "신성한 숲 속 산책 🌿",
            "발리니스 문 앞 한컷 🏛",
            # 33 전통 공연 (바롱/레공 댄스)
            "전통 공연 보러 가는 밤 🏮",
            "바롱 마스크 클로즈업 👹",
            "레공댄스 홀린 듯이 💃",
            "우붓 밤공연 직관 ✨",
            "등불 사이 마지막 산책 🏮",
            # 34 엔딩
            "짐 다 쌌다, 체크아웃 🧳",
            "덴파사르 → 인천 ✈️",
            "잘 있어 발리, 고마웠어 🌴",
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
    """샘플 커플에 대한 24개 이벤트 + ~120장 사진 시딩.

    멱등성:
    - 해당 커플의 events 가 이미 1개 이상 존재 → no-op.
    - 디스크의 사진 파일이 이미 존재 → 덮어쓰지 않음 (shutil.copy2 스킵).

    파일 저장 규칙 (photo_service 와 100% 일치):
    - 물리 경로: `<UPLOAD_DIR>/<event_id>/<photo_id>.<ext>`
    - DB file_path: `photos/<event_id>/<photo_id>.<ext>`

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
    rel_base = upload_root.parent

    events_created = 0
    photos_created = 0
    photos_missing = 0

    today = date.today()
    for (
        offset_days,
        end_offset_days,
        title,
        category,
        memo,
        photo_files,
        captions,
    ) in SEED_EVENTS:
        event_date = couple.wedding_date + timedelta(days=offset_days)
        event_end_date: date | None = None
        if end_offset_days is not None:
            event_end_date = couple.wedding_date + timedelta(
                days=end_offset_days
            )
        # 완료 판정 기준일: multi-day 면 종료일, 단일이면 시작일.
        completion_basis = event_end_date or event_date

        event = Event(
            couple_id=couple.id,
            title=title,
            date=event_date,
            end_date=event_end_date,
            category=category,
            memo=memo,
            # 실제 오늘 기준 이벤트 종료일이 과거면 완료.
            is_completed=(completion_basis <= today),
            # AI 체크리스트 중복 방지 가드(is_ai_generated=True 필터) 회피.
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

            dst_abs = upload_root / event.id / f"{photo.id}.{ext}"
            dst_abs.parent.mkdir(parents=True, exist_ok=True)
            if not dst_abs.exists():
                shutil.copy2(src, dst_abs)

            try:
                rel_path = dst_abs.resolve().relative_to(rel_base)
            except ValueError:
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
    """couples / events / photos / orders 전체 초기 데이터 시딩 (멱등).

    1. 샘플 커플(cpl_sample_001, 철수 ♥ 영희, 2026-03-14) 삽입 or 조회.
    2. 해당 커플에 24개 이벤트 + ~120장 사진 시딩.
    3. 샘플 주문 1건 시딩.
    """
    couple = db.query(Couple).filter(Couple.id == SAMPLE_COUPLE_ID).first()
    if couple is None:
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

    seed_events_and_photos(db, couple)
    seed_sample_order(db, couple)


def seed_sample_order(db: Session, couple: Couple) -> None:
    """샘플 주문 3건 시딩 (Lv2 비즈니스 로직 다양성 시연용).

    멱등성:
        - 각 주문은 고정 ID 로 식별. 이미 존재하면 해당 ID 만 건너뜀.
        - 사용자가 직접 만든 주문은 영향받지 않음.

    구성 (모든 주문이 동일한 chapters_selected 사용 — 시드 사진 기반):
        - ord_sample_001: pending,    SQUARE / HARD / qty 3 (양가 + 본인용, 결제 직후)
        - ord_sample_002: processing, A4     / SOFT / qty 1 (제작 진행 중)
        - ord_sample_003: cancelled,  SQUARE / SOFT / qty 1 (사용자가 취소)
    """
    from app.services.timeline_service import CHAPTER_MAPPING

    cat_to_idx: dict[str, int] = {
        cat: idx
        for idx, ch in enumerate(CHAPTER_MAPPING)
        for cat in ch.categories
    }

    buckets: dict[int, list[str]] = {
        i: [] for i in range(len(CHAPTER_MAPPING))
    }
    events = (
        db.query(Event).filter(Event.couple_id == couple.id).all()
    )
    for event in events:
        idx = cat_to_idx.get(event.category)
        if idx is None:
            idx = cat_to_idx.get("ETC", len(CHAPTER_MAPPING) - 1)
        for photo in event.photos:
            if photo.is_selected:
                buckets[idx].append(photo.id)

    chapters_selected: list[dict] = []
    display_number = 0
    for idx, chapter in enumerate(CHAPTER_MAPPING):
        photo_ids = buckets[idx]
        if not photo_ids:
            continue
        display_number += 1
        chapters_selected.append(
            {
                "chapter_number": display_number,
                "title": chapter.title,
                "photo_ids": photo_ids,
            }
        )

    if not chapters_selected or not any(
        ch["photo_ids"] for ch in chapters_selected
    ):
        logger.debug(
            "No selected photos for couple=%s — skip sample orders",
            couple.id,
        )
        return

    # 시드할 3건 정의. 각 항목이 ord_id 로 멱등 — 이미 있으면 건너뜀.
    sample_orders: list[dict[str, Any]] = [
        {
            "id": "ord_sample_001",
            "format": "SQUARE",
            "cover_type": "HARD",
            "quantity": 3,
            "recipient_name": "박영희 어머니",
            "recipient_phone": "010-1234-5678",
            "recipient_address": "서울시 강남구 테헤란로 123, 101동 202호",
            "status": "pending",
        },
        {
            "id": "ord_sample_002",
            "format": "A4",
            "cover_type": "SOFT",
            "quantity": 1,
            "recipient_name": "김철수 아버지",
            "recipient_phone": "010-2222-3333",
            "recipient_address": "부산시 해운대구 마린시티1로 33, 1203호",
            "status": "processing",
        },
        {
            "id": "ord_sample_003",
            "format": "SQUARE",
            "cover_type": "SOFT",
            "quantity": 1,
            "recipient_name": "김철수",
            "recipient_phone": "010-9999-0000",
            "recipient_address": "서울시 마포구 양화로 100, 501호",
            "status": "cancelled",
        },
    ]

    seeded_ids: list[str] = []
    for spec in sample_orders:
        if db.get(Order, spec["id"]) is not None:
            continue
        order = Order(
            id=spec["id"],
            couple_id=couple.id,
            format=spec["format"],
            cover_type=spec["cover_type"],
            quantity=spec["quantity"],
            chapters_selected=chapters_selected,
            album_layout=None,
            recipient_name=spec["recipient_name"],
            recipient_phone=spec["recipient_phone"],
            recipient_address=spec["recipient_address"],
            status=spec["status"],
        )
        db.add(order)
        seeded_ids.append(spec["id"])

    if seeded_ids:
        db.commit()
        logger.info(
            "Seeded sample orders %s for couple=%s",
            seeded_ids,
            couple.id,
        )
    else:
        logger.debug(
            "All sample orders already exist for couple=%s — skip",
            couple.id,
        )
