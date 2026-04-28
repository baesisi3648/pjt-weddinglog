# WeddingLog

> 결혼 준비 과정의 일정·사진·축하 메시지를 한 권의 책으로 묶어주는 서비스.

[![Tests](https://img.shields.io/badge/tests-280%20BE%20%2F%20177%20FE-green)]() [![Stack](https://img.shields.io/badge/stack-FastAPI%20%2B%20React%2018-blue)]() [![Docker](https://img.shields.io/badge/run-docker--compose%20up-success)]()

---

## 1. 서비스 소개

WeddingLog 는 사용자가 **6개월 ~ 1년에 걸친 결혼 준비 과정**을 가볍게 기록하면, 마지막에 그 기록이 **한 권의 양장본 앨범** 으로 변환되는 서비스입니다. 단순한 SNS 사진첩이 아니라, **준비 과정 자체가 콘텐츠** 가 되는 흐름을 지향합니다.

### 시작한 이유

제가 작년 가을에 결혼하면서 본식 앨범을 6개월 넘게 기다린 경험에서 출발했습니다. 그 사이 양가 인사 · 지인과의 만남은 모두 지나갔고, 정작 앨범이 가장 필요한 자리에는 앨범이 없었습니다. 같은 결혼식의 *아이폰 스냅* 은 다음 날 받았다는 점이 더 아이러니했습니다 — **사진은 빨라졌는데 앨범만 6개월**. WeddingLog 는 이 격차를 메우려는 시도입니다.

### 풀려는 문제

| 기존 흐름 | 문제 |
|----------|------|
| 본식 앨범 외주 (스튜디오) | 80~300만원, 2~6개월 대기 |
| 일정과 사진이 카톡 / 구글캘린더 / 인스타로 분산 | 1년 준비 과정의 일상이 책에 안 남음 |
| 신혼여행 사진은 본식 앨범과 별개 | 통합된 한 권이 없음 |

### 해결 방법

6개월 ~ 1년 동안 일정 따라 사진을 가볍게 쌓아두면, 본식 끝난 시점에 그동안의 기록이 한 권의 양장본으로 자동 변환됩니다. 일상 데이트, 스튜디오 / 본식의 아이폰 스냅, 신혼여행이 모두 하나의 흐름으로 묶입니다. 결과적으로 *신혼여행 직후* 에 앨범을 받을 수 있어, 양가 부모님 인사 자리에 앨범과 함께 갈 수 있는 속도가 됩니다.

### 타겟 사용자

- 결혼식까지 6~12개월 남은 예비 부부
- 본식 사진 외에 데이트, 상견례, 스튜디오, 신혼여행 같은 **준비 과정의 사진과 일정** 까지 한 권에 담고 싶은 사람
- 카카오톡 · 인스타 · 구글캘린더로 흩어진 기록을 한 곳에 모으고 싶은 사람

### 핵심 사용자 흐름

```
홈 (D-day)
   ↓
캘린더 — 일정 추가 (또는 자동 체크리스트로 24개 한 번에)
   ↓
일정 상세 — 사진 업로드 + 캡션
   ↓
타임라인 — 5개 챕터로 자동 그룹핑
   ↓
사진 정리 — 60/70/80/90장 프리셋 큐레이션
   ↓
앨범 미리보기 — 양면 펼침 책 모션
   ↓
주문 — 정사각형 / 가로 양장본, 하드/소프트커버 선택
```

### 한 가지 더 — 책 첫 장의 축하 메시지

기존 본식 앨범은 *예쁜 사진을 모아 책으로 만드는 흐름* 입니다. WeddingLog 는 책의 첫 장을 **하객들의 손글씨 축하 메시지 + QR 코드** 로 엽니다. 사진 한 장을 더 넣는 대신, 결혼식에 함께해 준 사람들의 흔적을 표제 다음에 두는 작은 결정입니다.

---

## 2. 실행 방법

### Quick Start

```bash
docker-compose up
```

위 명령 한 번이면 다음이 모두 자동으로 준비됩니다:

- 백엔드 FastAPI (포트 **8000**)
- 프론트엔드 React (포트 **3000**)
- SQLite 자동 시딩 — 더미 커플 "철수 ♥ 영희" (wedding_date 2026-03-14) + 24개 일정 + 123장 사진 + 9개 축하 메시지 + 샘플 주문 1건
- 헬스체크 통과 후 프론트엔드가 백엔드를 의존성으로 기동

브라우저에서 **http://localhost:3000** 접속.

### 포트 충돌 시

`.env.example` 을 `.env` 로 복사 후 포트 변경:

```env
API_PORT=8100   # 8000 충돌 시
WEB_PORT=3100   # 3000 충돌 시
```

> ⚠️ `VITE_API_URL` 은 프론트엔드 빌드 시점에 번들에 박히는 값이라, `.env` 의 `API_PORT` 를 바꿨다면 `docker-compose up --build` 로 프론트를 재빌드해야 반영됩니다.

### OpenAI API 키 (선택)

키가 없어도 모든 UX를 확인할 수 있도록 **템플릿 폴백** 을 구현했습니다.

| 기능 | OpenAI 키 있음 | OpenAI 키 없음 |
|------|---------------|----------------|
| AI 체크리스트 자동 생성 | GPT-4o-mini 가 일정 생성 | 사전 정의 24개 일정 (D-360 ~ D+14) |
| 사진 캡션 추천 | GPT-4o-mini 가 3개 후보 | 카테고리별 3개 사전 캡션 (9 카테고리 × 3 = 27개 풀) |
| 앨범 자동 구성 | GPT-4o-mini 가 레이아웃 설계 | 시간순 챕터 + T1 한 페이지 한 장 |

UI에는 **"자동 추천"** vs **"기본 템플릿"** 배지로 출처가 표시됩니다.

키가 있다면 `.env` 에 추가:

```env
OPENAI_API_KEY=sk-...
```

### 한 번 따라가 보는 데모 시나리오

1. http://localhost:3000 접속 → 랜딩 페이지 → "둘러보기" 클릭 → 홈 페이지 (철수 ♥ 영희, D-day)
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
12. **주문 관리** → 시드된 샘플 주문 + 신규 주문 표시. 상태 전이 + ZIP 데이터 다운로드

---

## 3. 구현 기능

### 핵심 기능 (Lv1 — MVP, 사진/일정 기록 + 앨범 미리보기) ✅

- 더미 커플 데이터 자동 시딩 (`docker-compose up` 한 번에 시연 가능)
- 사진 업로드 (multipart, magic number 검증) / 캡션 인라인 편집
- 캘린더 — 월간 / 리스트 뷰, 다일 일정(start_date / end_date), 9개 카테고리
- 자동 체크리스트 — D-360 ~ D+14 24개 일정 일괄 생성 (AI 또는 폴백)
- 타임라인 — 5개 챕터 자동 그룹핑 + 사용자 정의 챕터 제목 (localStorage)
- AlbumEditor — 페이지 직접 편집 (사진 교체 / 순서 / 캡션 / 챕터 제목 / 페이지 추가·삭제)
- 양면 펼침 책 미리보기 (`react-pageflip`)

### 주문 / 비즈니스 로직 (Lv2) ✅

- 4단계 결제 플로우 (만족도 → 옵션 → 정보 → 확인)
- 가격 계산:
  - 정사각형 양장본 150,000원 / 가로 양장본 180,000원
  - 하드커버 +20,000원 / 소프트커버 +0원
  - × 수량
- 다음 우편번호 API 연동 (한국 표준 주소 입력)
- `OrderStateMachine` — `pending → processing → completed`, `pending → cancelled`

### 데이터 직렬화 / 익스포트 (Lv3) ✅

- ZIP 익스포트 — `GET /api/orders/{id}/export` (`Content-Type: application/zip`)
- 콘텐츠 구조 (자세한 계약은 [`docs/partner-contract.md`](docs/partner-contract.md) 참고):

```
{order_id}.zip
├── order.json                       # 주문 메타 + 앨범 레이아웃 (album.chapters[].pages[])
├── captions.json                    # { photo_id: caption } 평탄 매핑
└── chapters/
    └── {NN}_{chapter_key}/          # 예: 01_wedding_photo
        └── {photo_id}.{ext}         # 원본 사진 (jpg/png)
```

파트너사가 받아 `order.json` 만 보고 인쇄 페이지를 구성하고, `chapters/.../{photo_id}.{ext}` 로 사진을 매칭할 수 있는 구조입니다.

---

## 4. 기술 스택 및 아키텍처

### Backend

| 영역 | 기술 | 선정 이유 |
|------|------|----------|
| 언어 | Python 3.11 | OpenAI SDK 안정성, 타이핑 성숙도 |
| 웹 프레임워크 | FastAPI | Pydantic 기반 자동 검증 + OpenAPI 자동 생성 |
| ORM | SQLAlchemy 2.0 | 명시적 모델, FastAPI Depends 와 자연스러운 결합 |
| DB | SQLite | 단일 파일, 환경 의존성 0 — 로컬 데모에 최적 |
| AI | OpenAI GPT-4o-mini (`AsyncOpenAI`) | 가성비 + 폴백으로 키 없이도 시연 가능 |
| 테스트 | pytest + pytest-asyncio | Contract-First TDD |

### Frontend

| 영역 | 기술 | 선정 이유 |
|------|------|----------|
| 프레임워크 | React 18 + Vite | HMR 빠름, 빌드 간단 |
| 언어 | TypeScript | API 계약 타입 공유 |
| 스타일 | Tailwind CSS + 4색 팔레트 | bg #FFFCF7 / ink #1A1614 / line #E8DFD3 / coral #C46A53 |
| 폰트 | Fraunces (헤딩) + Pretendard (본문) | 양장본 정통 톤 |
| 상태관리 | useState / useContext + localStorage | 외부 스토어 없이 충분한 규모 |
| 책 미리보기 | react-pageflip | 양면 펼침 모션 |
| QR | qrcode.react | 축하 메시지 페이지 QR |
| 주소 | react-daum-postcode | 한국 표준 우편번호 검색 |

### 인프라

| 영역 | 기술 |
|------|------|
| 컨테이너 | Docker + docker-compose |
| 빌드 | 멀티스테이지 Dockerfile (백/프론트 각각) |
| 정적 서빙 | Vite build + serve |

### 디렉터리 구조

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
│   ├── seed_assets/            # 시딩용 이미지
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
├── docs/                       # 기획·설계·계약 문서
│   ├── planning/               # PRD / 화면 명세 / 태스크 등 9개
│   ├── partner-contract.md     # Lv3 ZIP 직렬화 계약
│   └── devlog.md               # 개발 일지 (AI 도구 실패 사례 포함)
├── specs/                      # 화면 YAML 명세 + 도메인 리소스
├── docker-compose.yml          # 기본 (이미지 COPY 기반, 안정 동작)
├── docker-compose.dev.yml      # 개발자 override (bind-mount + --reload)
└── .env.example
```

### 주요 API 엔드포인트

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

## 5. AI 도구 사용 내역

### 사용한 AI 도구

| AI 도구 | 활용 단계 | 활용 내용 |
|---------|----------|----------|
| **Claude Code (Opus 4.7)** | 기획 + 빌드 메인 | 9개 기획 문서 작성, 화면 명세, 태스크 분해, 백엔드/프론트 구현, 테스트, 디버깅 — 50 커밋의 메인 페어 프로그래머 |
| **가상 패널 리뷰** (Claude 기반) | 기획 보강 | CTO / UX / Security 3 인 관점으로 기획서 검토 → `OrderStateMachine` 별도 분리, `photo_id` unguessable, magic number 검증 등 *실무 디테일* 보강 |
| **Google Stitch MCP** | 디자인 단계 | 6개 화면 (Home / Calendar / EventDetail / Timeline / OrderCheckout / Orders) HTML/JSX 목업 생성 → React 18 포팅 입력 |
| **OpenAI GPT-4o-mini** | 앱 내 런타임 | 체크리스트 자동 생성 / 사진 캡션 추천 / 앨범 레이아웃 자동 구성 (모두 폴백 짝지어둠) |
| **nano_banana** | 더미 데이터 | 시드용 결혼 준비 사진 123장 생성 (한강 피크닉 / 발리 신혼여행 등 시나리오별) |

### 실제 프롬프트 인용 — 핵심 3개
-- 이 내용은 들어가는게 좋을까?
**(a) `/socrates` — 심층 기획 검증**

> *"기존 기획서를 기반으로 경쟁분석 / 페르소나 / 비즈니스 모델 빈 곳을 검증해 주세요. 가설이 약한 부분은 질문으로 짚어 주세요."*

→ 결과물: `docs/planning/08-competitive-analysis.md`, `09-personas.md`, `07-business-model.md` 보강. 특히 비즈니스 모델의 *책 한 권 단위 객단가* 가설을 다시 점검.

**(b) `/screen-spec` — 화면 명세**

> *"`docs/planning/06-screens.md` 를 YAML 로 정형화해 주세요. 화면이 필요로 하는 데이터 (data_requirements) 와 도메인 리소스를 분리해서, 백엔드 단독 변경이 가능하도록."*

→ 결과물: `specs/screens/*.yaml`. 화면이 백엔드 API에 종속되지 않는 *Domain-Guarded* 구조 확보.

**(c) `/auto-orchestrate` — Phase별 TDD 빌드**

> *"태스크를 Phase 단위로 분해하고, 각 Phase 안에서 모델 → 스키마 → 라우터 → 서비스 → 테스트 순으로 전문 서브에이전트에게 위임해 주세요. 외부 경계는 strict TDD, 내부 유틸은 relaxed."*

→ 결과물: 8 Phase × 평균 15 태스크 = 약 120 태스크 자동 분배. 백엔드 280 + 프론트엔드 177 테스트 통과.

### AI 도구 사용 실패 사례

개발 중 AI 도구가 잘못 답한 사례, 폴백 트리거 케이스, 디버깅 일지는 [`docs/devlog.md`](docs/devlog.md) 에 따로 정리되어 있습니다.

---

## 6. 설계 의도

### 6.1 도메인 분리 — Domain-Guarded 화면 명세

`/screen-spec` 단계에서 화면은 "어떤 데이터가 필요한지" 만 선언하고, 백엔드는 `specs/domain/resources.yaml` 에 정의된 리소스로 응답합니다. 화면이 백엔드 API에 직접 종속되지 않아, 백엔드 단독 변경 / 리팩토링이 가능합니다.

### 6.2 Contract-First TDD

- 모델 → 스키마 → 라우터 → 서비스 → 테스트 순으로 작성
- 외부 경계 (라우터, AI, 파일 업로드) 와 비즈니스 룰 (가격 계산, `OrderStateMachine`) 은 strict TDD
- 프레젠테이션 컴포넌트와 유틸은 relaxed TDD

### 6.3 보안 — 파일 업로드

- `photos.id` = `secrets.token_urlsafe(16)` unguessable 서버 UUID (URL Enumeration 방어)
- 업로드 시 Pillow magic number 검증 (MIME 스푸핑 방어)
- 저장 파일명은 서버 UUID로 재생성, 원본명은 `original_filename` 컬럼만 보존
- `pathlib.Path.resolve()` 로 `/app/data/uploads/` prefix 검증 (Path Traversal 방어)

### 6.4 AI 폴백을 1급 시민으로

`OPENAI_API_KEY` 가 없어도 모든 UX 가 동작해야 한다는 원칙으로, 앱 시작 시 OpenAI 가용성을 1회 체크 → `app.state.openai_available: bool` 플래그로 보관하고, 모든 AI 응답에 `source: "ai" | "template"` 을 함께 내려보냅니다.

- **AI 클라이언트**: `AsyncOpenAI()` async-native — 이벤트 루프 비차단
- **타임아웃**: SDK 30초 — 응답 지연 시 즉시 폴백
- **응답 검증**: JSON 파싱 실패 / 스키마 불일치 / `source` 누락 시 자동 폴백
- **앨범 구성 추가 검증**: AI 가 정통 양장본 톤을 위반하는 다중 사진 레이아웃을 반환하면 거부 → 폴백 (T1 / T5 만 허용)

### 6.5 Docker — 두 프로파일

| 파일 | 용도 | 특성 |
|------|------|------|
| `docker-compose.yml` | 기본 | bind-mount 없음, `--reload` 없음, 이미지 COPY 기반 |
| `docker-compose.dev.yml` | 개발자 override | bind-mount + `--reload` + `npm run dev` |

기본 프로파일은 안정 동작에 맞춰져 있고, 개발 시에는 override 를 함께 사용합니다:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 6.6 시각 톤 — 카드 / 아이콘 최소화, 책 정통 톤

- 색상 토큰 12개 → 4개 (bg / ink / line / coral) 축소 — 메인 1색 (coral) + 흑백 + 보조 1색
- Material Symbols 아이콘 90% 제거 → 텍스트 라벨 위주
- 폴라로이드는 타임라인 1군데만 (랜덤 회전 ±2°)
- 카드 그림자 / 그라데이션 / 글로우 등 *AI slop* 회피
- 책 미리보기:
  - 모든 본문 페이지 = T1 (한 페이지에 사진 1장)
  - 챕터 첫 페이지는 T5 (커버 사진)
  - 폴리오 (쪽수) `— 1 —` 표기
  - 1:1 (30×30cm) ↔ 3:2 (35×23cm) 미리보기 안에서 즉시 토글

### 6.7 사업적 가능성 + 미구현 확장

이 서비스는 *책 한 권* 을 결과물로 갖는 인쇄 회사의 도메인 위에 있습니다. 그래서 확장 방향도 *책 그 자체의 폭과 깊이* 를 늘리는 쪽이 자연스럽습니다.

1. **손글씨 축하 메시지 OCR** — 현재는 시드된 9개 메시지로 축하 페이지를 구성합니다. 하객이 직접 종이에 쓴 메시지를 사진으로 찍어 올리면, 손글씨를 OCR로 보존하면서도 검색 가능한 텍스트 레이어를 함께 저장하는 방향. 첫 페이지의 무게가 진짜 사람의 글씨에서 나오게 됩니다. 
-- 그게 아니라 따로 모바일 청첩장이나, 일반 청첩장에 응원 메세지를 넣을 qr을 넣고, 그 메시지들을 앨범에 넣을거야. 
2. **AI 캡션 톤 조정** — 지금 `GPT-4o-mini` 가 캡션 3개를 후보로 제시하는데, 양장본 정통 톤 / 캐주얼 / 시적 같은 *책 한 권의 보이스* 를 선택하면 모든 캡션을 일관된 결로 다시 써 주는 흐름. 책의 통일감은 사진보다 글에서 무너지기 쉬워서 가치가 큽니다.
3. **인쇄물 라인업 확장** — 책 한 권 외에도 *같은 콘텐츠 위에서 파생되는 인쇄물* 로 미니북, 포토카드, 액자 인화 같은 라인업을 같은 주문 흐름에 흡수. 이미 큐레이션된 70 ~ 90장 중 베스트컷을 그대로 다른 형태로 인쇄할 수 있어, 콘텐츠를 다시 만드는 비용 없이 객단가가 올라갑니다.
4. **다국어 양장본** — 국제 결혼 / 해외 거주 가족 케이스를 위해 영문 / 일문 폰트 페어와 종이 사이즈 (Letter / A4) 옵션을 추가. 현재는 한글 본문 + Pretendard 전제로만 레이아웃이 잡혀 있습니다.

핵심은 *결혼 준비 콘텐츠 → 한 권의 양장본* 이라는 변환을 더 정밀하게 만드는 것이고, 그 정밀도가 곧 인쇄 회사 입장에서의 차별화입니다.

---

## 7. 테스트 실행

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

## 8. 라이선스 / 크레딧

- 더미 사진: nano_banana 시드 (자체 생성)
- 폰트: Fraunces (Google Fonts), Pretendard (jsdelivr)
- 폴라로이드 손글씨 폰트: Nanum Pen Script, Caveat (Google Fonts)
- 양면 펼침 모션: react-pageflip
- 한국 우편번호: react-daum-postcode

---

> 결혼이라는 일생의 한 챕터가, 양가에 한 권의 책으로 남기를.
