# WeddingLog

> 결혼 준비 과정의 일정·사진·축하 메시지를 한 권의 책으로 묶어주는 서비스.

[![Tests](https://img.shields.io/badge/tests-280%20BE%20%2F%20177%20FE-green)]() [![Stack](https://img.shields.io/badge/stack-FastAPI%20%2B%20React%2018-blue)]() [![Docker](https://img.shields.io/badge/run-docker--compose%20up-success)]()

---

## 1. 서비스 소개

**스위트북** 에서 풀어낼 핵심 가설은 분명합니다.

> "결혼 준비라는 1년의 여정은 그 자체로 한 권의 책이 될 만큼 농밀하다."

WeddingLog 는 사용자가 **6개월 ~ 1년에 걸친 결혼 준비 과정**을 가볍게 기록하면, 마지막 단계에서 그 기록이 **양가 부모님께 드리는 한 권의 양장본 앨범** 으로 변환되도록 설계했습니다. 단순 SNS 사진첩이 아니라, **준비 과정 자체가 콘텐츠**가 되는 흐름입니다.

### 핵심 사용자 흐름

```
홈 (D-day 카운트)
   ↓
캘린더 — 일정 추가 (또는 자동 체크리스트로 24개 한 번에)
   ↓
일정 상세 — 사진 업로드 + 캡션
   ↓
타임라인 — 5개 챕터로 자동 그룹핑된 사진들
   ↓
사진 정리 — 60/70/80/90장 프리셋으로 큐레이션
   ↓
앨범 미리보기 — 양면 펼침 책 모션
   ↓
주문 — 정사각형 / 가로 양장본, 하드/소프트커버 선택
```

### 차별화 포인트 — 축하 메시지

스냅스가 2026.02 에 공동 포토북을 출시한 시점에서, **"누가 만드냐"** 가 아니라 **"무엇을 책에 담을 것이냐"** 가 차별화의 본질이라 판단했습니다.

WeddingLog 는 책 첫 장에 **하객들의 손글씨 축하 메시지** + **QR 코드** 를 넣습니다. 양가 부모님이 첫 페이지를 펼쳤을 때 가장 먼저 보이는 것이 사진이 아니라, **결혼식에 함께해준 모든 사람의 마음**입니다.

---

## 2. 실행 방법 (심사자용)

### Quick Start — 한 줄로 시연

```bash
docker-compose up
```

위 명령 한 번이면 다음 모두가 자동으로 준비됩니다:

- 백엔드 FastAPI (포트 **8000**)
- 프론트엔드 React (포트 **3000**)
- SQLite 자동 시딩 — 더미 커플 "철수 ♥ 영희" (wedding_date 2026-03-14) + 24개 일정 + 123장 사진 + 9개 축하 메시지 + 샘플 주문 1건
- 헬스체크 통과 후 프론트엔드가 백엔드를 의존성으로 기동

브라우저에서 **http://localhost:3000** 접속.

### 포트 충돌 시

`.env.example` 을 `.env` 로 복사 후 `API_PORT`, `WEB_PORT` 변경:

```env
API_PORT=8100   # 8000 충돌 시
WEB_PORT=3100   # 3000 충돌 시
```

### OpenAI API 키 (선택)

키가 없어도 모든 UX를 확인할 수 있도록 **템플릿 폴백** 을 구현했습니다.

| 기능 | OpenAI 키 있음 | OpenAI 키 없음 |
|------|---------------|----------------|
| AI 체크리스트 자동 생성 | GPT-4o-mini 가 일정 생성 | 사전 정의 24개 일정 (D-360 ~ D+14) |
| 사진 캡션 추천 | GPT-4o-mini 가 3개 후보 | 카테고리별 3개 사전 캡션 (9개 카테고리 × 3 = 27개 풀) |
| 앨범 자동 구성 | GPT-4o-mini 가 레이아웃 설계 | 시간순 챕터 + T1 한 페이지 한 장 |

UI에는 **"자동 추천"** vs **"기본 템플릿"** 배지로 출처가 표시됩니다.

키가 있다면 `.env` 에 추가:
```env
OPENAI_API_KEY=sk-...
```

### 시연 시나리오 (Lv1 MVP E2E)

1. http://localhost:3000 접속 → 랜딩 페이지 → "둘러보기" 클릭 → 홈 페이지 (철수 ♥ 영희, D-day 카운트)
2. **캘린더** 클릭 → 24개 일정이 월간/리스트 뷰로 표시 (스튜디오, 본식, 신혼여행 포함)
3. 다일 일정(예: 발리 신혼여행) 클릭 → 일정 상세 + 사진 갤러리
4. 캡션 더블클릭 → 인라인 편집
5. **타임라인** 클릭 → 5개 챕터 폴라로이드 그리드 (총 123장)
6. 챕터 제목 클릭 → "함께 쌓아온 날들" 을 원하는 제목으로 수정 (localStorage 저장)
7. **앨범으로 만들기** 클릭 → 사진 정리 모달 (60/70/80/90장 프리셋)
8. **70장 추천 적용** → 자동 큐레이션
9. **다음** → 앨범 미리보기 + AlbumEditor 직접 편집 (사진 교체/순서/캡션/챕터 제목)
10. **책으로 미리보기** → 양면 펼침 책 모션, 상단 토글로 1:1 ↔ 3:2 비율 전환
11. 주문 정보 입력 → 다음 우편번호 검색 → 주문 완료
12. **주문 관리** → 시드된 샘플 주문 + 신규 주문 표시. 상태 전이 + ZIP 데이터 다운로드 (Lv3, 파트너 인계용)

---

## 3. 레벨별 구현 범위

| 레벨 | 범위 | 상태 |
|------|------|------|
| **Lv1 — MVP** | 사진/일정 기록 + 타임라인 + 앨범 미리보기 | ✅ 완료 |
| **Lv2 — 주문** | 옵션 선택 + 가격 계산 + 주문 생성/상태 전이 | ✅ 완료 |
| **Lv3 — 익스포트** | 주문 콘텐츠 ZIP 다운로드 (파트너 인계용 메타데이터 + 사진) | ✅ 완료 |

### Lv1 MVP 시연 가능 (독립 가동)

`docker-compose up` 만으로 다음이 모두 동작:
- 더미 커플 데이터 자동 시딩
- 사진 업로드 / 캡션 편집 / 캘린더 / 타임라인
- AlbumEditor 직접 편집 (사진 교체, 페이지 순서, 템플릿, 추가/삭제)
- 양면 펼침 책 미리보기 (react-pageflip)

### Lv2 추가 기능

- 4단계 결제 플로우 (만족도 → 옵션 → 정보 → 확인)
- 가격 계산: 정사각형 150,000원 / 가로 양장본 180,000원, 하드커버 +20,000원 / 소프트커버 +0원, × 수량
- 다음 우편번호 API 연동 (한국 표준 주소 입력)
- OrderStateMachine — pending → processing → completed, pending → cancelled

### Lv3 추가 기능

- ZIP 익스포트 — `GET /api/orders/{id}/export` (response: `application/zip`)
- 콘텐츠 구조 (`docs/partner-contract.md` 기반):
  ```
  {order_id}.zip
  ├── order.json                       # 주문 메타 + 앨범 레이아웃 (album.chapters[].pages[])
  ├── captions.json                    # { photo_id: caption } 평탄 매핑
  └── chapters/
      └── {NN}_{chapter_key}/          # 예: 01_wedding_photo
          └── {photo_id}.{ext}         # 원본 사진 (jpg/png)
  ```
- 파트너사가 받아 `order.json` 만 보고 인쇄 페이지를 구성, `chapters/.../{photo_id}.{ext}` 로 사진 매칭 가능

---

## 4. 기술 스택

### Backend

| 영역 | 기술 | 선정 이유 |
|------|------|----------|
| 언어 | Python 3.11 | OpenAI SDK 안정성, 타이핑 성숙도 |
| 웹 프레임워크 | FastAPI | Pydantic 기반 자동 검증 + OpenAPI 자동 생성 |
| ORM | SQLAlchemy 2.0 | 명시적 모델, FastAPI Depends 와 자연스러운 결합 |
| DB | SQLite | 단일 파일, 심사자 환경 의존성 0 |
| AI | OpenAI GPT-4o-mini | 가성비 + 폴백으로 키 없이도 시연 가능 |
| 테스트 | pytest + pytest-asyncio | Contract-First TDD |

### Frontend

| 영역 | 기술 | 선정 이유 |
|------|------|----------|
| 프레임워크 | React 18 + Vite | HMR 빠름, 빌드 간단 |
| 언어 | TypeScript | API 계약 타입 공유 |
| 스타일 | Tailwind CSS + 4색 팔레트 | bg(이보리 #FFFCF7) / ink(잉크 #1A1614) / line(구분선 #E8DFD3) / coral(강조 #C46A53) |
| 폰트 | Fraunces (헤딩) + Pretendard (본문) | 양장본 정통 톤 |
| 상태관리 | useState/useContext + localStorage | 외부 스토어 없이 충분 |
| 책 미리보기 | react-pageflip | 양면 펼침 모션 |
| QR | qrcode.react | 축하 메시지 페이지 QR |
| 주소 | react-daum-postcode | 한국 표준 우편번호 검색 |

### 인프라

| 영역 | 기술 |
|------|------|
| 컨테이너 | Docker + docker-compose |
| 빌드 | 멀티스테이지 Dockerfile (백/프론트 각각) |
| 정적 서빙 | Vite build + serve |

---

## 5. AI 사용 — 폴백 전략

> "OpenAI 키가 있는 심사자만 좋은 경험을 받게 하면 안 된다."

앱 시작 시 `OPENAI_API_KEY` 유효성을 1회 체크 → `app.state.openai_available: bool` 플래그 보관.

### 3가지 AI 기능 모두 폴백 보유

| 기능 | AI 응답 | 폴백 |
|------|---------|------|
| 체크리스트 자동 생성 | GPT-4o-mini 가 커플 wedding_date 기준 일정 생성 | 사전 정의 24개 (D-360 ~ D+14) |
| 캡션 추천 | GPT-4o-mini 가 3개 후보 | 카테고리별 3개 사전 캡션 (9 카테고리) |
| 앨범 자동 구성 | GPT-4o-mini 가 챕터/페이지 레이아웃 설계 | T5 챕터 커버 + 나머지 T1 한 페이지 한 장 |

### 투명성

API 응답에 `source: "ai" | "template"` 포함. UI는 "자동 추천" / "기본 템플릿" 배지로 노출.

### 안전장치

- AI 호출은 `asyncio.to_thread + asyncio.wait_for(timeout=30s)` 로 보호
- AI 응답 JSON 파싱 실패 / 스키마 불일치 / 타임아웃 → 자동 폴백 진입
- 앨범 구성: AI가 T2/T3/T4 생성 시 검증에서 거부 → 폴백 (T1/T5만 허용)

---

## 6. 설계 의도

### 6.1 도메인 분리 — Domain-Guarded 화면 명세

`/screen-spec` 단계에서 화면은 "어떤 데이터가 필요한지" 만 선언하고, 백엔드는 `specs/domain/resources.yaml` 에 정의된 리소스로 응답합니다. 화면이 백엔드 API에 종속되지 않아, 백엔드 단독 변경/리팩토링이 가능합니다.

### 6.2 Contract-First TDD

- 모델/스키마 → 라우터 → 서비스 → 테스트 순으로 작성
- 외부 경계(라우터, AI, 파일 업로드)와 비즈니스 룰(가격 계산, OrderStateMachine)은 strict TDD
- 프레젠테이션 컴포넌트와 유틸은 relaxed TDD

### 6.3 보안 — 파일 업로드

- `photos.id` = `secrets.token_urlsafe(16)` unguessable 서버 UUID (URL Enumeration 방어)
- 업로드 시 Pillow magic number 검증 (MIME 스푸핑 방어)
- 저장 파일명은 서버 UUID로 재생성, 원본명은 `original_filename` 컬럼만 보존
- `pathlib.Path.resolve()` 로 `/app/data/uploads/` prefix 검증 (Path Traversal 방어)

### 6.4 Docker — 두 프로파일

| 파일 | 용도 | 특성 |
|------|------|------|
| `docker-compose.yml` | **심사자용** (이 README의 기본) | bind-mount 없음, `--reload` 없음, 이미지 COPY 기반 |
| `docker-compose.dev.yml` | 개발자 override | bind-mount + `--reload` + `npm run dev` |

심사자가 `docker-compose up` 한 번에 안정 동작하도록 프로덕션 프로파일을 별도 분리.

### 6.5 영상 톤 — 카드/아이콘 최소화

- 색상 토큰 12개 → 4개 (bg / ink / line / coral) 축소 — 메인 1색(coral) + 흑백 + 보조 1색 원칙
- Material Symbols 아이콘 90% 제거 → 텍스트 라벨 위주
- 폴라로이드는 타임라인 1군데만 (랜덤 회전 ±2°)
- 카드 그림자 / 그라데이션 / 글로우 등 "AI slop" 회피

### 6.6 책 미리보기 — 정통 양장본 톤

- 모든 본문 페이지 = T1 (한 페이지에 사진 1장)
- 챕터 첫 페이지는 T5 (커버 사진) — react-pageflip 에서 단일 사진 렌더
- 폴리오(쪽수) `— 1 —` 표기 (양장본 정통 톤)
- 정사각형 1:1 (30×30cm) ↔ 가로 양장본 3:2 (35×23cm) 미리보기 안에서 즉시 토글

---

## 7. 디렉터리 구조

```
.
├── backend/                    # FastAPI
│   ├── app/
│   │   ├── models/             # SQLAlchemy (couple, event, photo, order)
│   │   ├── schemas/            # Pydantic + enums
│   │   ├── routers/            # /api/* 8개 라우터
│   │   ├── services/           # 비즈니스 로직 + 상태머신
│   │   ├── utils/              # 파일 검증, 날짜 계산
│   │   ├── seed.py             # 더미 데이터 24 events / 123 photos / 1 sample order
│   │   └── main.py             # FastAPI 앱 + lifespan
│   ├── seed_assets/            # 시딩용 jpg
│   └── tests/                  # pytest (모델/서비스/라우터)
├── frontend/                   # React 18 + Vite
│   └── src/
│       ├── pages/              # Landing, Home, Calendar, EventDetail,
│       │                       # Timeline, OrderCheckout, Orders
│       ├── components/         # AlbumEditor, BookPreviewModal,
│       │                       # PhotoCurationModal, BlessingsPage 등
│       ├── services/           # API 클라이언트
│       ├── types/              # 도메인 타입
│       ├── utils/              # photoUrl, chapterTitle 헬퍼
│       └── constants/          # blessings 시드, 폰트, enum 라벨
├── data/                       # SQLite + 업로드 (gitignore)
├── docs/planning/              # 기획 문서 9개 + tasks
├── specs/                      # 화면 명세 + 도메인 리소스
├── docker-compose.yml          # 심사자용 (프로덕션)
├── docker-compose.dev.yml      # 개발자 override
└── .env.example
```

---

## 8. 주요 API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/health` | `{ status, openai_available, timestamp }` |
| GET | `/api/couples/{id}/home` | 홈 — D-day, 다가오는 일정, 최근 사진 |
| GET | `/api/couples/{id}/events/` | 일정 목록 (start/end_date) |
| POST | `/api/couples/{id}/events/` | 일정 생성 |
| POST | `/api/ai/checklist` | 체크리스트 자동 생성 (body: couple_id) |
| POST | `/api/ai/caption` | 캡션 3개 추천 (body: event_id, photo_id?) |
| POST | `/api/events/{event_id}/photos` | 사진 업로드 (multipart) |
| GET | `/api/couples/{id}/timeline` | 챕터 그룹핑 + 사진 |
| POST | `/api/couples/{id}/album/compose` | 앨범 자동 구성 (body: selected_photo_ids) |
| POST | `/api/couples/{id}/orders` | 주문 생성 |
| GET | `/api/orders/{id}` | 주문 단건 조회 |
| PATCH | `/api/orders/{id}/status` | 상태 전이 |
| GET | `/api/orders/{id}/export` | ZIP 익스포트 (Lv3) |

OpenAPI 자동 문서: `http://localhost:8000/docs` (포트는 `.env` 의 `API_PORT`)

---

## 9. 테스트 실행

### Backend
```bash
cd backend
pytest -q
```

### Frontend
```bash
cd frontend
npm test -- --run
```

현재 상태: **백엔드 280 + 프론트엔드 177 테스트 통과** (총 457개).

---

## 10. 라이선스 / 크레딧

- 더미 사진: nano_banana 시드 (자체 생성)
- 폰트: Fraunces (Google Fonts), Pretendard (jsdelivr)
- 폴라로이드 손글씨 폰트: Nanum Pen Script, Caveat (Google Fonts)
- 양면 펼침 모션: react-pageflip
- 한국 우편번호: react-daum-postcode

---

> 결혼이라는 일생의 한 챕터가, 양가에 한 권의 책으로 남기를.
