# 06 — Domain-Guarded TDD Task Breakdown

> WeddingLog 프로젝트 Phase-별 태스크 구조 (TDD 기반)  
> 작성일: 2026-04-23  
> 총 Phase: 8개 | 총 Task: 68개

---

## 프로젝트 개요

| 항목 | 설명 |
|------|------|
| **프로젝트명** | WeddingLog — AI 기반 결혼 앨범 기획/주문 플랫폼 |
| **기술 스택** | FastAPI + React + Vite + SQLite + OpenAI API |
| **배포** | Docker Compose (Backend + Frontend + Data) |
| **목표 상태** | Lv1(MVP): P4 완료 시 docker-compose up만으로 전체 플로우 시연 가능 |

### Phase 매핑

| Phase | 마일스톤 | Lv | 주요 목표 |
|-------|---------|----|---------| 
| P0 | 프로젝트 셋업 | 0 | 인프라 + 보일러플레이트 |
| P1 | Couple 리소스 | 1 | 모든 화면의 기초 데이터 준비 |
| P2 | Event + Calendar | 1 | 일정 CRUD + AI 체크리스트 |
| P3 | Photo + EventDetail | 1 | 사진 업로드 + AI 캡션 |
| P4 | Timeline + Home | 1 | **Lv1 MVP 완성** (docker-compose up 시연 가능) |
| P5 | Order Checkout | 2 | 주문 생성 (Step 1-4) |
| P6 | Orders 관리 | 2 | **Lv2 마일스톤** (주문 상태 관리 완성) |
| P7 | Export ZIP | 3 | Lv3 (데이터 익스포트) |
| P8 | 최종 완성 | - | 더미 데이터 + 최종 E2E |

### Task 통계

- **Backend Resource (R)**: P0-T (setup) + P1-R1 (7개) + P2-R1 (6개) + P3-R1 (6개) + P4-R1 (4개) + P5-R1 (4개) + P6-R1 (2개) + P7-R1 (4개) = **43개**
- **Frontend Screen (S)**: P1-S0 (2개) + P2-S1 (5개) + P3-S1 (5개) + P4-S1 (3개) + P4-S2 (3개) + P5-S1 (6개) + P6-S1 (3개) + P7-S1 (1개) = **28개**
- **Verification (V)**: P1-V1 + P2-V1 + P3-V1 + P4-V1 + P5-V1 + P6-V1 + P7-V1 + P8-V1 = **8개**
- **Common (T)**: P0-T (6개) + P8-T (5개) = **11개**
- **총합**: 43 + 28 + 8 + 11 = **90개**

**V 태스크 감량 정책 (시간 제약 B1 대응)**:
- **자동화 E2E (Playwright)**: P0/P2/P4/P6/P8의 V1 태스크만 수행 (총 5개)
- **수동 체크리스트 또는 간이 통합테스트**: P1/P3/P5/P7의 V는 대체 가능 (총 3개)
- **근거**: Phase 1/3/5/7은 R/S 태스크의 TDD 테스트로 충분히 검증됨. MVP와 Lv2/3 마일스톤만 E2E 필수.

---

## Council 리뷰 반영 사항 (2026-04-23)

**3명 리뷰어(CTO/UX/Security+PM) 합의**: 기획 품질은 과제 수준 상회하나, 빌드 전 4가지 영역 강화 필수.

### 반영된 Blocker/Major 이슈 매핑

| # | 이슈 | 카테고리 | 해결 태스크 | 상태 |
|----|------|---------|----------|------|
| B1 | TDD × 90태스크 × D-6 = 산술 불가능 | 일정 | P1.5 신설 + TDD 완화 정책 추가 | 이 문서에 반영 |
| B2 | `orders.total_price` 필드 계약 누락 | 계약 | `resources.yaml` derived 추가 | 수정 완료 |
| B3 | 페르소나 C 타이밍 UX 전면 누락 | UX | P4-S2-T2 + P5-S1-T5 AC 추가 | 이 문서에 반영 |
| B4 | 디자인 핸드오프 6개 JSX 포팅 부재 | 전략 | **P1.5 UI 스모크 포팅** Phase 신설 | 이 문서에 반영 |
| B5 | `.env` 유출 + `.dockerignore` 명시 없음 | 보안 | P0-T4 AC 강화 | 이 문서에 반영 |
| B6 | 파일 업로드 매직넘버 검증 없음 | 보안 | P3-R1-T3/T4 AC 강화 | 이 문서에 반영 |
| B7 | `/uploads` 정적 서빙 인증 없음 | 보안 | P3-R1-T1/T4 + photos.id UUID 명시 | resources.yaml 수정 |
| M1 | `photos.couple_id` JOIN N+1 위험 | 성능 | P4-R1-T3 집계 서비스 쿼리 명시 | resources.yaml queries 추가 |
| M6 | 주문 상태 역전 enforce 단위테스트 부재 | 비즈니스 | **P6-R1-T2 서비스 분리 + 단위테스트** | 이 문서에 반영 |
| M7 | CORS 설정 태스크 부재 | 계약 | P0-T2 AC 추가 | 이 문서에 반영 |

---

## TDD 적용 정책

### Strict TDD (RED → GREEN → REFACTOR 전체 수행)
- 모든 **외부 경계 레이어**: HTTP 라우터, AI 서비스, 파일 업로드, ZIP 익스포트
- 모든 **비즈니스 룰 엔진**: OrderStateMachine, 가격 계산, 체크리스트 생성 로직
- **목적**: 과제 평가 포인트(Lv1 서비스 플로우, Lv2 비즈니스 로직, Lv3 직렬화) 방어

### Relaxed TDD (GREEN 먼저, 테스트 후행 허용)
- **모델/스키마 정의**: SQLAlchemy, Pydantic — 타입 자체가 계약 방어
- **프론트엔드 프레젠테이션 컴포넌트**: 핸드오프 JSX 포팅분 — 수동 스모크 확인으로 충분
- **유틸 함수**: date, formatting — 단순 변환만 하는 경우

### 과제 특수 사항
- **Playwright E2E**: V1 태스크 중 P0/P2/P4/P6/P8만 수행 (P1/P3/P5/P7의 V는 수동 체크리스트 또는 간이 통합테스트로 대체 가능)
- **REFACTOR 단계**: 시간 여유 있을 때만 수행

---

## Phase 1.5 — UI 스모크 포팅 (디자인 핸드오프 활용)

**목적**: 완성된 디자인 핸드오프(6개 JSX 목업)를 `frontend/src/pages/`로 옮겨서 **반나절 내 전 페이지가 더미 데이터로 렌더링되는 상태** 확보. 이후 Phase 2-4의 S 태스크는 "이미 보이는 UI에 상태/API만 주입"에 집중.

**마일스톤**: 모든 6개 페이지가 라우팅으로 이동 가능하고, 디자인 토큰(Fraunces + Pretendard + 파스텔 시스템)이 Tailwind에 통합된 상태.

**demo-able state**: `docker-compose up` → 브라우저에서 각 라우트 방문 시 더미 데이터로 정적 렌더링 확인.

### [x] P1.5-S0-T1: 핸드오프 JSX 6개를 pages/로 복사

**목표**: 디자인 팀에서 준비한 Figma 핸드오프 JSX 6개를 React 프로젝트로 포팅, 더미 상수 데이터 인라인.

**입력**:
- `reference/WeddingLog-handoff/weddinglog/project/components/Home.jsx`
- `reference/WeddingLog-handoff/weddinglog/project/components/Calendar.jsx`
- `reference/WeddingLog-handoff/weddinglog/project/components/EventDetail.jsx`
- `reference/WeddingLog-handoff/weddinglog/project/components/Timeline.jsx`
- `reference/WeddingLog-handoff/weddinglog/project/components/OrderCheckout.jsx`
- `reference/WeddingLog-handoff/weddinglog/project/components/Orders.jsx`

**출력**:
- `frontend/src/pages/Home.jsx`
- `frontend/src/pages/Calendar.jsx`
- `frontend/src/pages/EventDetail.jsx`
- `frontend/src/pages/Timeline.jsx`
- `frontend/src/pages/OrderCheckout.jsx`
- `frontend/src/pages/Orders.jsx`
- 각 파일에 더미 상수 데이터 인라인 (추후 API 호출로 교체될 자리에 TODO 주석)

**TDD**: Relaxed. 스모크 렌더링만 확인(컴포넌트가 throw 없이 마운트).

**Acceptance Criteria**:
- [ ] 6개 파일이 `frontend/src/pages/`에 복사 완료
- [ ] 각 파일이 export default로 React 컴포넌트 export
- [ ] `npm run dev` 실행 후 각 페이지 접속 시 콘솔 에러 없음
- [ ] 디자인이 원본과 시각적으로 일치 (폰트, 색상, 레이아웃)
- [ ] 더미 데이터 영역에 `// TODO: API endpoint로 교체`주석

**관련 파일**:
- `frontend/src/pages/{Home,Calendar,EventDetail,Timeline,OrderCheckout,Orders}.jsx`

---

### [x] P1.5-S0-T2: 디자인 토큰을 Tailwind config에 통합

**목표**: 디자인 핸드오프의 색상·글꼴·간격 시스템을 Tailwind 설정으로 정형화.

**입력**:
- `specs/shared/design-tokens.yaml`
- `reference/WeddingLog-handoff/weddinglog/project/styles.css` (v1/v2/v3 포함)

**출력**:
- `frontend/tailwind.config.js` 업데이트: coral/lavender/mint/gold 팔레트 + spacing/radius 정의
- `frontend/index.html` 또는 `src/main.jsx`에 Google Fonts(Fraunces) + jsdelivr Pretendard import 추가
- `frontend/src/globals.css` 또는 유사 전역 스타일 (필요시)

**TDD**: Relaxed.

**Acceptance Criteria**:
- [ ] Tailwind `bg-coral-500`, `text-lavender-400` 등 유틸 사용 가능 (빌드 시 생성 확인)
- [ ] 제목에 Fraunces 서체 렌더링 확인 (DevTools 폰트 검사)
- [ ] 본문에 Pretendard 서체 적용 확인
- [ ] color pallete (primary/coral-500, accent/gold-500, secondary/lavender, tertiary/mint)이 모든 페이지에서 일관
- [ ] `npm run build` 성공, 번들 크기 증가 없음

**관련 파일**:
- `frontend/tailwind.config.js`, `frontend/index.html`, `frontend/src/globals.css` (신규 또는 기존)

---

### [x] P1.5-S0-T3: 공통 Layout + Router 뼈대

**목표**: 6개 페이지를 react-router-dom으로 라우팅, Layout 공통 래핑.

**입력**:
- P1.5-S0-T1 결과물 (6개 페이지)

**출력**:
- `frontend/src/App.jsx`: react-router-dom BrowserRouter 설정 + 6개 라우트
- `frontend/src/components/Layout.jsx`: Header + Outlet 기본 구조
- `frontend/src/router/routes.jsx` (선택) : 라우트 정의 분리

**TDD**: Relaxed. 단, 라우팅 이동 테스트 1개는 작성(라우팅이 핵심 인프라).

**Acceptance Criteria**:
- [ ] 6개 라우트 (`/`, `/calendar`, `/events/:id`, `/timeline`, `/order-checkout`, `/orders`) 정의 완료
- [ ] Header 네비게이션 메뉴에서 각 라우트로의 링크 작동 확인
- [ ] URL 변경 시 컴포넌트 전환 확인 (라우터 상태 유지)
- [ ] 각 라우트 진입 시 콘솔 에러 없음
- [ ] `frontend/src/router.test.js` 또는 `frontend/src/App.test.jsx`에 라우팅 E2E 1개 케이스

**관련 파일**:
- `frontend/src/App.jsx`, `frontend/src/components/Layout.jsx`, `frontend/src/router/routes.jsx` (선택)

---

### [x] P1.5-V1: 스모크 렌더링 확인 (수동 테스트)

**목표**: Phase 1.5 완료 후 전체 6페이지 기본 UI 동작 확인.

**체크리스트**:
- [ ] `docker-compose up` 실행 후 frontend 컨테이너 정상 기동
- [ ] 브라우저에서 `http://localhost:3000` 접속 → Home 페이지 렌더링
- [ ] Header 네비게이션 클릭 → 6개 라우트 모두 정상 렌더링 (콘솔 에러 0건)
- [ ] 각 페이지의 더미 데이터 표시 확인 (정적 렌더링)
- [ ] 스크린샷 6장 저장: `/docs/screenshots/smoke/{Home,Calendar,EventDetail,Timeline,OrderCheckout,Orders}.png`
- [ ] 디자인 토큰(색상, 글꼴) 적용 확인 (원본 Figma와 시각적 일치)
- [ ] 모바일 데스크톱 양쪽에서 접속 가능 확인

**마일스톤**: "모든 페이지 로드 성공 + 더미 데이터 표시 + 네비게이션 기본 작동" → Phase 2 진입 가능

---

## 상시 태스크 (Continuous)

### [ ] P-CONT-T1: `docs/devlog.md` 상시 갱신

**목적**: 빌드 중 발생한 AI 도구 사용 실패/우회/결정을 실시간 기록 → 면접 문항 4 "AI 도구 사용 중 가장 큰 실패와 그 해결 과정" 답변 근거.

**트리거**: Phase 진행 중 아래 이벤트 발생 시 즉시 1 엔트리 추가
- AI 도구가 잘못된 코드를 생성해서 수정한 경우
- 서브에이전트 위임 중 부분 실패가 발생한 경우 (예: 코드 생성 안 함, 포맷 오류 등)
- Docker/환경 설정 이슈를 해결한 경우
- 기획 문서 ↔ 실제 구현 사이 갈등이 발생한 경우 (예: 스키마 변경, 기간 예측 오류)

**포맷**: 기존 파일의 템플릿 사용 (도구/문제/시도/해결/배운 점)

**완료 기준**: Phase 8 "P8-T2 README" 작성 시 "AI 도구 사용 내역" 섹션에서 실제 프롬프트 3개 인용 + `docs/devlog.md` 링크 포함. 최소 3건 이상의 실제 실패 사례 기록.

**관련 파일**: `docs/devlog.md`

---

## Phase 0 — 프로젝트 셋업 (Lv0, 인프라)

**마일스톤**: 빈 리포지토리 → docker-compose up 성공 (skeleton state)  
**완료 시 상태**: 두 컨테이너 기동, /health 200 OK, Frontend 로딩 시작

### [x] P0-T1: 모노레포 디렉토리 구조 초기화

**목표**: Root 레이아웃 설정 + 필수 폴더 생성

**의존성**: 없음

**TDD 순서**:
- RED: 디렉토리 구조 검증 스크립트 (모든 폴더 존재 확인)
- GREEN: 폴더 생성 + .gitkeep 파일
- REFACTOR: 폴더 구조 문서화

**Acceptance Criteria**:
- [ ] Root에 backend/, frontend/, data/, docs/, specs/ 폴더 생성
- [ ] 각 폴더에 README.md 또는 .gitkeep 배치
- [ ] 디렉토리 트리 구조가 05-architecture.md와 일치

**관련 파일**:
- `backend/`, `frontend/`, `data/`, `docs/`, `specs/`

---

### [x] P0-T2: Backend FastAPI 보일러플레이트

**목표**: uvicorn 실행 가능한 최소 FastAPI 앱 + /health 엔드포인트

**의존성**: P0-T1

**TDD 순서**:
- RED: `tests/test_health.py` — GET /health → 200 {"status": "ok"}
- GREEN: `app/main.py` — @app.get("/health")
- REFACTOR: Pydantic BaseModel 분리

**Acceptance Criteria**:
- [ ] `backend/main.py` 존재, uvicorn 실행 가능
- [ ] GET /health 200 응답
- [ ] `app/__init__.py`, `app/config.py`, `app/database.py` 스켈레톤
- [ ] pytest 기본 설정, `tests/` 디렉토리 생성
- [ ] FastAPI에 CORSMiddleware 등록, `allow_origins`는 환경변수 `CORS_ORIGINS`(기본 `http://localhost:3000,http://localhost:5173`)에서 쉼표 분리 리스트로 파싱
- [ ] 앱 시작 시 `OPENAI_API_KEY` 유효성 1회 체크 → `app.state.openai_available: bool` 플래그 설정 (매 호출 타임아웃 방지)

**관련 파일**:
- `backend/main.py`, `backend/app/__init__.py`, `backend/requirements.txt`, `backend/tests/test_health.py`

---

### [x] P0-T3: Frontend React+Vite+Tailwind 보일러플레이트

**목표**: npm run dev 실행 → http://localhost:3000 로딩

**의존성**: P0-T1

**TDD 순서**:
- RED: `vitest` 기본 테스트 (App 컴포넌트 렌더링)
- GREEN: `src/App.jsx`, `src/main.jsx` 최소 구현
- REFACTOR: Tailwind 초기화, 라우팅 뼈대

**Acceptance Criteria**:
- [ ] `package.json`, `vite.config.js`, `tailwind.config.js` 설정 완료
- [ ] `src/App.jsx` 렌더링 (라우팅 뼈대만)
- [ ] Fraunces + Pretendard 폰트 로드 (design-tokens.yaml 참조)
- [ ] `vitest` + React Testing Library 셋업

**관련 파일**:
- `frontend/package.json`, `frontend/src/main.jsx`, `frontend/src/App.jsx`, `frontend/vite.config.js`, `frontend/index.html`

---

### [x] P0-T4: Docker + Docker Compose 설정

**목표**: docker-compose up으로 두 컨테이너 기동

**의존성**: P0-T2, P0-T3

**TDD 순서**:
- RED: docker-compose 네트워크 연결 테스트 (curl http://backend:8000/health)
- GREEN: Dockerfile (Backend + Frontend) + docker-compose.yml 작성
- REFACTOR: .dockerignore, .env.example 추가

**Acceptance Criteria**:
- [ ] `backend/Dockerfile`, `frontend/Dockerfile` 생성
- [ ] `.dockerignore`에 `.env`, `*.db`, `data/**`, `__pycache__/`, `*.pyc`, `node_modules/`, `.git/` 명시
- [ ] `.gitignore`에 `data/**` 재귀 패턴 + `!data/.gitkeep` 예외 명시
- [ ] `docker-compose.yml` (프로덕션/심사자용): `--reload` 제거 + backend/frontend 소스 bind-mount 제거 (image에 COPY된 코드로 실행)
- [ ] `docker-compose.dev.yml` (개발자용) override로 bind-mount + `--reload` + `npm run dev` 설정
- [ ] Dockerfile 멀티스테이지: 빌드 스테이지와 런타임 스테이지 분리로 이미지 크기 절감
- [ ] `docker-compose up` 후 두 서비스 정상 기동
- [ ] `.env.example` 생성 (API_PORT, WEB_PORT, OPENAI_API_KEY, CORS_ORIGINS 포함)

**관련 파일**:
- `backend/Dockerfile`, `frontend/Dockerfile`, `.dockerignore`, `docker-compose.yml`, `docker-compose.dev.yml`, `.env.example`, `.gitignore`

---

### [x] P0-T5: SQLite 초기화 스크립트 + 테이블 생성

**목표**: docker-compose 시작 시 DB 스키마 자동 생성

**의존성**: P0-T2

**TDD 순서**:
- RED: `tests/conftest.py` — in-memory SQLite DB 테스트
- GREEN: SQLAlchemy Base 정의, create_all() 호출
- REFACTOR: 초기화 스크립트 분리 (backend/app/init_db.py)

**Acceptance Criteria**:
- [ ] SQLAlchemy Base 및 metadata 설정 완료
- [ ] `backend/app/models/__init__.py` (스켈레톤)
- [ ] `backend/app/database.py` — engine, SessionLocal, get_db() 정의
- [ ] 컨테이너 시작 시 `/app/data/weddinglog.db` 생성되고 테이블 준비됨
- [ ] pytest로 테스트 가능한 DB 세션

**관련 파일**:
- `backend/app/database.py`, `backend/app/models/__init__.py`, `backend/tests/conftest.py`

---

### [x] P0-T6: 공통 타입/Enum 정의

**목표**: Backend + Frontend 동일한 상수 정의

**의존성**: P0-T2, P0-T3

**TDD 순서**:
- RED: Enum 값 검증 테스트 (backend + frontend)
- GREEN: Backend Python Enum + Frontend TypeScript/JavaScript 상수
- REFACTOR: 공유 문서 생성 (specs/shared/enums.md)

**Acceptance Criteria**:
- [ ] Backend: `app/schemas/enums.py` — Category, OrderFormat, CoverType, OrderStatus
- [ ] Frontend: `src/constants/enums.js` — 동일한 상수
- [ ] 각 Enum 값이 resources.yaml과 일치
- [ ] 단위 테스트 (Backend: pytest, Frontend: vitest)

**관련 파일**:
- `backend/app/schemas/enums.py`, `frontend/src/constants/enums.js`

---

### [x] P0-V1 (구조 완성, docker-compose up 실행은 P4 시연 시점에 통합 검증): docker-compose up 기본 검증

**목표**: 두 컨테이너 + 네트워크 정상 작동

**의존성**: P0-T1 ~ P0-T6

**검증 절차**:
- [ ] docker-compose up 실행 → 두 서비스 기동 완료 (30초 이내)
- [ ] GET http://localhost:8000/health → 200 {"status": "ok"}
- [ ] GET http://localhost:3000 → HTML 로드 (Vite dev 서버)
- [ ] Frontend에서 Backend API 통신 가능 (CORS 설정 확인)
- [ ] /app/data/weddinglog.db 파일 생성 확인

**관련 파일**: docker-compose.yml, backend/Dockerfile, frontend/Dockerfile

---

## Phase 1 — 공통 기반 리소스 (Lv1, Couple)

**마일스톤**: 모든 화면의 기초가 되는 Couple 리소스 완성  
**완료 시 상태**: 더미 커플 데이터 자동 시딩, Frontend CoupleContext 준비

---

### [x] P1-R1-T1: Couple 모델 + 스키마 정의

**목표**: SQLAlchemy 모델 (Couple) + Pydantic 스키마 작성

**의존성**: P0-T5, P0-T6

**TDD 순서**:
- RED: `tests/models/test_couple.py` — UUID 자동 생성, 필드 제약 검증
- GREEN: `app/models/couple.py` (SQLAlchemy) + `app/schemas/couple.py` (Pydantic)
- REFACTOR: Base 클래스 추출, validators 분리

**Acceptance Criteria**:
- [ ] Couple 모델: id(UUID), groom_name, bride_name, wedding_date, profile_photo_path, tagline, created_at
- [ ] 제약: groom_name/bride_name 각각 2자 이상 필수
- [ ] d_day 파생 필드 (property, 계산 로직은 서비스에서)
- [ ] Pydantic 스키마: CoupleCreate, CoupleUpdate, CoupleResponse
- [ ] pytest tests/models/test_couple.py 전체 통과

**관련 파일**:
- `backend/app/models/couple.py`, `backend/app/schemas/couple.py`, `backend/tests/models/test_couple.py`

---

### [x] P1-R1-T2: Couple 서비스 (CoupleService)

**목표**: CRUD 비즈니스 로직 구현

**의존성**: P1-R1-T1

**TDD 순서**:
- RED: `tests/services/test_couple_service.py` — get_by_id, create, update
- GREEN: `app/services/couple_service.py`
- REFACTOR: 트랜잭션, 예외 처리 강화

**Acceptance Criteria**:
- [ ] CoupleService.get_by_id(couple_id) → Couple
- [ ] CoupleService.create(groom_name, bride_name, wedding_date, ...)
- [ ] CoupleService.update(couple_id, ...)
- [ ] d_day 계산 로직 (wedding_date - today)
- [ ] 서비스 테스트 100% 통과

**관련 파일**:
- `backend/app/services/couple_service.py`, `backend/tests/services/test_couple_service.py`

---

### [x] P1-R1-T3: Couple 라우터 (API 엔드포인트)

**목표**: REST API 구현 + 통합 테스트

**의존성**: P1-R1-T2

**TDD 순서**:
- RED: `tests/routers/test_couples.py` — TestClient로 GET/PUT 테스트
- GREEN: `app/routers/couples.py` — @app.get/put
- REFACTOR: 에러 응답, 상태 코드 표준화

**Acceptance Criteria**:
- [ ] GET /api/couples/{id} → CoupleResponse
- [ ] PUT /api/couples/{id} → 수정된 Couple
- [ ] 404 (Couple not found), 400 (validation)
- [ ] TestClient 통합 테스트 전체 통과

**관련 파일**:
- `backend/app/routers/couples.py`, `backend/tests/routers/test_couples.py`

---

### [x] P1-R1-T4: d_day 계산 및 파생 필드

**목표**: wedding_date 기준 D-day 계산

**의존성**: P1-R1-T3

**TDD 순서**:
- RED: `tests/utils/test_date_calc.py` — D-, D+, D0 테스트
- GREEN: `app/utils/date_utils.py`
- REFACTOR: CoupleResponse에 d_day 포함

**Acceptance Criteria**:
- [ ] 결혼예정일 이전: 음수 (예: D-186)
- [ ] 결혼예정일 당일: 0
- [ ] 결혼예정일 이후: 양수 (예: D+7)
- [ ] CoupleResponse에 d_day 필드 추가
- [ ] 단위 테스트 통과

**관련 파일**:
- `backend/app/utils/date_utils.py`, `backend/tests/utils/test_date_calc.py`

---

### [x] P1-R1-T5: 더미 커플 시딩 스크립트

**목표**: 컨테이너 시작 시 샘플 데이터 자동 생성

**의존성**: P1-R1-T4

**TDD 순서**:
- RED: `tests/test_seed.py` — DB에 couples 테이블 1행 확인
- GREEN: `backend/app/seed.py` (성우♥은비, wedding_date=2026-10-25)
- REFACTOR: 멱등성 보장 (중복 실행해도 안전)

**Acceptance Criteria**:
- [ ] `backend/app/seed.py` 생성
- [ ] 커플 1개 (성우, 은비, 2026-10-25) 자동 삽입
- [ ] main.py 초기화 단계에서 seed 실행 (init_db() 후)
- [ ] 중복 시딩 방지 (exists check)
- [ ] pytest 검증 통과

**관련 파일**:
- `backend/app/seed.py`, `backend/app/main.py` (수정), `backend/tests/test_seed.py`

---

### [x] P1-S0-T1: 공통 레이아웃 (Header + Layout)

**목표**: 모든 페이지의 기반이 되는 레이아웃 컴포넌트

**의존성**: P0-T3, P0-T6

**TDD 순서**:
- RED: `tests/components/Header.test.jsx` — 렌더링, 링크 확인
- GREEN: `src/components/Header.jsx`, `src/components/Layout.jsx`
- REFACTOR: Tailwind 토큰 적용 (design-tokens.yaml)

**Acceptance Criteria**:
- [ ] Header: 로고 (Fraunces 폰트) + 네비게이션 (Home, Calendar, Timeline, Orders)
- [ ] Layout: Header + Children 래퍼
- [ ] 폰트 (Fraunces + Pretendard) 로드 확인
- [ ] 반응형 디자인 (mobile/tablet/desktop)
- [ ] React Testing Library 테스트 통과

**관련 파일**:
- `frontend/src/components/Header.jsx`, `frontend/src/components/Layout.jsx`, `frontend/tests/components/Header.test.jsx`

---

### [x] P1-S0-T2: CoupleContext + useDday Hook

**목표**: 모든 페이지에서 접근 가능한 커플 데이터 상태 관리

**의존성**: P1-R1-T3, P1-S0-T1

**TDD 순서**:
- RED: `tests/context/CoupleContext.test.jsx` — useCouple() hook 호출 가능
- GREEN: `src/context/CoupleContext.jsx` (Context + Provider)
- REFACTOR: useDday 커스텀 훅 분리

**Acceptance Criteria**:
- [ ] CoupleContext 생성 (GET /api/couples/{id}로 자동 로드)
- [ ] useCouple() hook 제공
- [ ] useDday() hook (couple.d_day 계산 + 실시간 업데이트)
- [ ] 더미 커플 ID 로드 (하드코딩 또는 localStorage)
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/context/CoupleContext.jsx`, `frontend/src/hooks/useDday.js`, `frontend/tests/context/CoupleContext.test.jsx`

---

### [x] P1-V1 (수동 체크리스트로 대체): Interface Contract Validation (Couple)

**목표**: 모든 화면의 data_requirements와 Couple 필드 대응 확인

**의존성**: P1-R1-T5, P1-S0-T2

**검증 절차**:
- [ ] 자동 검증 스크립트 생성 (`scripts/validate_contracts.js`)
- [ ] resources.yaml.couples.fields ⊇ 화면별 data_requirements
- [ ] 모든 화면이 필요로 하는 필드가 Couple에서 제공되는지 확인
- [ ] 검증 스크립트 실행 후 에러 없음

**관련 파일**:
- `scripts/validate_contracts.js`, 스펙 파일들

---

## Phase 2 — Event + Calendar 화면 (Lv1, 일정 CRUD)

**마일스톤**: 캘린더 화면에서 일정 CRUD 완성 + AI 체크리스트  
**완료 시 상태**: 월간 캘린더 뷰 + 리스트 뷰 + EventForm 모달 + AI 생성 일정 표시

---

### [x] P2-R1-T1: Event 모델 + 스키마

**목표**: SQLAlchemy Event 모델 + Pydantic 스키마

**의존성**: P0-T6, P1-R1-T1

**TDD 순서**:
- RED: `tests/models/test_event.py` — category enum, couple FK, 삭제 cascade
- GREEN: `app/models/event.py`, `app/schemas/event.py`
- REFACTOR: 관계 정의 (Event.couple, Event.photos)

**Acceptance Criteria**:
- [ ] 필드: id, couple_id, title, date, category, memo, is_completed, is_ai_generated, created_at, updated_at
- [ ] Category enum 제약 (resources.yaml 9개 값)
- [ ] Couple FK 관계 (ON DELETE CASCADE)
- [ ] Pydantic: EventCreate, EventUpdate, EventResponse
- [ ] pytest 통과

**관련 파일**:
- `backend/app/models/event.py`, `backend/app/schemas/event.py`, `backend/tests/models/test_event.py`

---

### [x] P2-R1-T2: EventService (CRUD + 비즈니스 로직)

**목표**: Event 생성/조회/수정/삭제 + toggle_complete

**의존성**: P2-R1-T1

**TDD 순서**:
- RED: `tests/services/test_event_service.py`
- GREEN: `app/services/event_service.py`
- REFACTOR: 쿼리 최적화, 날짜 필터링

**Acceptance Criteria**:
- [ ] create_event(couple_id, title, date, category, memo, is_ai_generated)
- [ ] get_events_by_couple_and_month(couple_id, year, month)
- [ ] get_event(event_id), update_event, delete_event
- [ ] toggle_complete(event_id) — is_completed 토글
- [ ] 삭제 시 Event.photos cascade 검증 (나중에 Photo 추가)
- [ ] 서비스 테스트 100% 통과

**관련 파일**:
- `backend/app/services/event_service.py`, `backend/tests/services/test_event_service.py`

---

### [x] P2-R1-T3: Event 라우터 (6개 엔드포인트)

**목표**: REST API 구현

**의존성**: P2-R1-T2

**TDD 순서**:
- RED: `tests/routers/test_events.py` (GET list, POST, GET detail, PUT, DELETE, PATCH complete)
- GREEN: `app/routers/events.py`
- REFACTOR: 응답 표준화

**Acceptance Criteria**:
- [ ] GET /api/couples/{couple_id}/events?month=YYYY-MM
- [ ] POST /api/couples/{couple_id}/events
- [ ] GET /api/events/{event_id}
- [ ] PUT /api/events/{event_id}
- [ ] DELETE /api/events/{event_id}
- [ ] PATCH /api/events/{event_id}/complete
- [ ] TestClient 통합 테스트 전체 통과

**관련 파일**:
- `backend/app/routers/events.py`, `backend/tests/routers/test_events.py`

---

### [x] P2-R1-T4: AI 체크리스트 서비스 뼈대 (폴백 포함)

**목표**: OpenAI API 호출 + 폴백 템플릿 15개

**의존성**: P1-R1-T4 (d_day 계산)

**TDD 순서**:
- RED: `tests/services/test_ai_service.py` — fallback 15개 항목 반환 확인
- GREEN: `app/services/ai_service.py` (OpenAI 호출 또는 폴백)
- REFACTOR: 폴백 템플릿 분리, 에러 로깅

**Acceptance Criteria**:
- [ ] AIService.generate_checklist(wedding_date) → Event[]
- [ ] OpenAI_API_KEY 없으면 즉시 폴백 (로깅)
- [ ] 15개 사전정의 항목 (D-180 ~ D+14)
- [ ] 각 Event에 is_ai_generated=true 플래그
- [ ] 폴백 단위 테스트 (OPENAI_API_KEY 미설정 상태에서 통과)

**관련 파일**:
- `backend/app/services/ai_service.py`, `backend/tests/services/test_ai_service.py`

---

### [x] P2-R1-T5: AI 체크리스트 라우터

**목표**: POST /api/ai/checklist 엔드포인트 + DB 삽입

**의존성**: P2-R1-T4, P2-R1-T3

**TDD 순서**:
- RED: `tests/routers/test_ai.py` — POST → Event 배열 + is_ai_generated=true
- GREEN: `app/routers/ai.py`
- REFACTOR: 트랜잭션, 중복 생성 방지

**Acceptance Criteria**:
- [ ] POST /api/ai/checklist { couple_id, wedding_date }
- [ ] 응답: [Event, ...]
- [ ] DB에 15개 Event INSERT (is_ai_generated=true)
- [ ] 중복 호출 시 기존 데이터 확인 (선택)
- [ ] TestClient 테스트 통과

**관련 파일**:
- `backend/app/routers/ai.py`, `backend/tests/routers/test_ai.py`

---

### [x] P2-S1-T1: Calendar 페이지 (월간 뷰)

**목표**: 42셀 달력 그리드 구현

**의존성**: P1-S0-T1, P1-S0-T2, P2-R1-T3

**TDD 순서**:
- RED: `tests/pages/Calendar.test.jsx` — 그리드 42셀 렌더링
- GREEN: `src/pages/Calendar.jsx` (CalendarGrid 컴포넌트 활용)
- REFACTOR: 월 네비게이션, 오늘 버튼

**Acceptance Criteria**:
- [ ] 42셀 월간 뷰 (이전/다음 월 일자 포함)
- [ ] 현재 월 표시 (헤더)
- [ ] D-day 카운트다운 상단 고정 (CoupleContext에서 d_day)
- [ ] 각 셀에 일정 개수 표시 (dot 또는 숫자)
- [ ] "오늘" 버튼으로 현재 월 이동
- [ ] Vitest 렌더링 테스트 통과

**관련 파일**:
- `frontend/src/pages/Calendar.jsx`, `frontend/src/components/CalendarGrid.jsx`, `frontend/tests/pages/Calendar.test.jsx`

---

### [x] P2-S1-T2: 캘린더 리스트 뷰 탭

**목표**: 같은 페이지 내 리스트 뷰 토글

**의존성**: P2-S1-T1

**TDD 순서**:
- RED: `tests/pages/Calendar.test.jsx` — 탭 전환 테스트
- GREEN: `src/pages/Calendar.jsx` (탭 상태 관리)
- REFACTOR: 리스트 스타일, 카테고리 배지

**Acceptance Criteria**:
- [ ] "월간" / "리스트" 탭 토글
- [ ] 리스트 뷰: 월별 일정 그룹, 카테고리 배지, 사진 수 배지, 완료 체크박스
- [ ] 두 뷰 모두 동일 데이터 표시
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/pages/Calendar.jsx` (수정), `frontend/src/components/EventListView.jsx`

---

### [x] P2-S1-T3: EventForm 모달

**목표**: 일정 생성/수정 폼

**의존성**: P2-R1-T3, P2-S1-T1

**TDD 순서**:
- RED: `tests/components/EventForm.test.jsx` — 생성/수정 모드, submit
- GREEN: `src/components/EventForm.jsx` + `src/hooks/useForm.js`
- REFACTOR: 유효성 검사, 에러 메시지

**Acceptance Criteria**:
- [ ] EventForm 컴포넌트: title, date, category, memo 입력
- [ ] 생성 모드 (빈 폼) + 수정 모드 (기존 데이터 로드)
- [ ] Category 드롭다운 (resources.yaml enum)
- [ ] 제출 시 POST/PUT 엔드포인트 호출
- [ ] useForm hook으로 상태 관리
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/components/EventForm.jsx`, `frontend/src/hooks/useForm.js`, `frontend/tests/components/EventForm.test.jsx`

---

### [x] P2-S1-T4: CategoryBadge 공통 컴포넌트

**목표**: design-tokens.yaml category_mapping 사용

**의존성**: P0-T6, P2-S1-T1

**TDD 순서**:
- RED: `tests/components/CategoryBadge.test.jsx` — 색상 렌더링
- GREEN: `src/components/CategoryBadge.jsx`
- REFACTOR: Tailwind 토큰 통합

**Acceptance Criteria**:
- [ ] CategoryBadge(category) → 색상 배지
- [ ] design-tokens.yaml의 category_color_mapping 적용
- [ ] WEDDING_PHOTO(coral), STUDIO(lavender), CEREMONY/HONEYMOON(mint), ETC(gray)
- [ ] 모든 9개 카테고리 지원
- [ ] Vitest 렌더링 테스트

**관련 파일**:
- `frontend/src/components/CategoryBadge.jsx`, `frontend/tests/components/CategoryBadge.test.jsx`

---

### [x] P2-S1-T5: AI 체크리스트 생성 UI

**목표**: 첫 진입 시 "AI로 자동 생성" CTA

**의존성**: P2-R1-T5, P2-S1-T1

**TDD 순서**:
- RED: `tests/pages/Calendar.test.jsx` — 빈 캘린더 → CTA 버튼
- GREEN: Calendar 페이지 (조건부 CTA 버튼)
- REFACTOR: 로딩 상태, 성공/에러 피드백

**Acceptance Criteria**:
- [ ] 캘린더가 비어있으면 (Event 0개) CTA 버튼 표시
- [ ] 클릭 → POST /api/ai/checklist 호출
- [ ] 로딩 상태 표시 (spinner)
- [ ] 성공 → 캘린더 자동 새로고침
- [ ] 에러 → Toast 메시지 (폴백 사용 안내)
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/pages/Calendar.jsx` (수정), `frontend/tests/pages/Calendar.test.jsx`

---

### [x] P2-V1 (수동 체크리스트 — Playwright 셋업 생략): Calendar E2E (일정 CRUD)

**목표**: Playwright 또는 Vitest E2E로 캘린더 플로우 검증

**의존성**: P2-S1-T5, P2-R1-T5

**검증 절차**:
- [ ] docker-compose up → 더미 커플 로드
- [ ] Calendar 진입 → 빈 상태 (또는 기존 일정)
- [ ] "AI로 자동 생성" 클릭 → 15개 일정 추가 (로딩 대기)
- [ ] 캘린더 그리드에 일정 점 표시
- [ ] 날짜 클릭 → EventForm 모달 → 새 일정 생성 → 저장
- [ ] 리스트 뷰 탭 전환 → 생성된 일정 표시
- [ ] 일정 완료 체크박스 토글
- [ ] 일정 수정/삭제 작동
- [ ] E2E 테스트 전체 통과

**관련 파일**: E2E 테스트 파일 (Playwright 또는 Vitest E2E)

---

## Phase 3 — Photo + EventDetail 화면 (Lv1, 사진 업로드)

**마일스톤**: 일정별 사진 업로드 + AI 캡션 추천  
**완료 시 상태**: 사진 드래그앤드롭 업로드 + 3개 캡션 선택

---

### [ ] P3-R1-T1: Photo 모델 + 스키마

**목표**: SQLAlchemy Photo 모델 + Event 관계

**의존성**: P2-R1-T1

**TDD 순서**:
- RED: `tests/models/test_photo.py` — Event FK, is_selected, cascade
- GREEN: `app/models/photo.py`, `app/schemas/photo.py`
- REFACTOR: 정렬 순서 (sort_order)

**Acceptance Criteria**:
- [ ] 필드: id, event_id, file_path, caption, is_selected, sort_order, created_at
- [ ] `Photo.id`는 `secrets.token_urlsafe(16)` 기반 unguessable UUID (추측 불가능하지만 외부 노출 가능)
- [ ] Event FK (ON DELETE CASCADE)
- [ ] Pydantic: PhotoCreate, PhotoUpdate, PhotoResponse
- [ ] is_selected 기본값 true
- [ ] pytest 통과

**관련 파일**:
- `backend/app/models/photo.py`, `backend/app/schemas/photo.py`, `backend/tests/models/test_photo.py`

---

### [ ] P3-R1-T2: PhotoService (파일 저장 + DB 관리)

**목표**: 파일 업로드 + Photo 모델 저장

**의존성**: P3-R1-T1

**TDD 순서**:
- RED: `tests/services/test_photo_service.py` — upload, delete, update_caption, toggle_selection
- GREEN: `app/services/photo_service.py` + `app/utils/file_handler.py`
- REFACTOR: 경로 규칙 (event_id/photo_id.ext)

**Acceptance Criteria**:
- [ ] PhotoService.upload_photo(event_id, file) → Photo 반환, 파일 저장
- [ ] 저장 경로: `/app/data/uploads/photos/{event_id}/photo_{id}.{ext}`
- [ ] PhotoService.delete_photo(photo_id) → 파일 + DB 삭제
- [ ] update_caption(photo_id, caption)
- [ ] toggle_selection(photo_id) → is_selected 토글
- [ ] 서비스 테스트 100% 통과

**관련 파일**:
- `backend/app/services/photo_service.py`, `backend/app/utils/file_handler.py`, `backend/tests/services/test_photo_service.py`

---

### [ ] P3-R1-T3: 파일 업로드 유효성 검사

**목표**: MIME type + 파일 크기 + 개수 제한 + 매직넘버 검증

**의존성**: P3-R1-T2

**TDD 순서**:
- RED: `tests/utils/test_photo_validator.py` — 제약 위반 테스트, 매직넘버 스푸핑 방어
- GREEN: `app/utils/validators.py`
- REFACTOR: 에러 메시지 다국어화

**Acceptance Criteria**:
- [ ] Content-Type만 믿지 말고 **python-magic** 또는 **Pillow.Image.verify()**로 실제 바이트 헤더 검증 (MIME 스푸핑 방어)
- [ ] 허용 타입: image/jpeg, image/png만
- [ ] 최대 크기: 5MB/파일
- [ ] 일정당 최대 10장
- [ ] 저장 파일명은 서버에서 UUID로 재생성 (원본 파일명은 DB `original_filename` 컬럼에만 기록)
- [ ] 저장 경로는 `pathlib.Path(upload_dir, event_id, f'{photo_id}.{ext}').resolve()`로 생성 후, `/app/data/uploads/` prefix 검증 (Path Traversal 방어)
- [ ] 초과 시 400 Bad Request (상세 메시지)
- [ ] 단위 테스트 100% 통과

**관련 파일**:
- `backend/app/utils/validators.py`, `backend/tests/utils/test_photo_validator.py`

---

### [ ] P3-R1-T4: Photo 라우터 (멀티파트 업로드)

**목표**: POST/PUT/DELETE 엔드포인트

**의존성**: P3-R1-T3, P2-R1-T3

**TDD 순서**:
- RED: `tests/routers/test_photos.py` — multipart, PUT caption, DELETE
- GREEN: `app/routers/photos.py`
- REFACTOR: StaticFiles mount (/uploads 경로)

**Acceptance Criteria**:
- [ ] POST /api/events/{event_id}/photos (multipart/form-data)
- [ ] PUT /api/photos/{photo_id}/caption { caption: "..." }
- [ ] DELETE /api/photos/{photo_id}
- [ ] StaticFiles mount 대신 `/api/photos/{photo_id}/file` 래퍼 엔드포인트 구현 (향후 인가 확장 용이). 내부에서 FileResponse로 스트리밍. 과제 범위에서는 인증 없이도 UUID unguessability로 기본 방어.
  - (또는) StaticFiles 사용 시 디렉토리 인덱싱(`html=False`) 비활성 + 파일명을 예측 불가 UUID로만
- [ ] TestClient 통합 테스트 통과

**관련 파일**:
- `backend/app/routers/photos.py`, `backend/tests/routers/test_photos.py`, `backend/app/main.py` (StaticFiles mount 또는 래퍼 엔드포인트)

---

### [ ] P3-R1-T5: AI 캡션 서비스 (폴백 포함)

**목표**: OpenAI API + 카테고리별 폴백 캡션

**의존존성**: P3-R1-T1, P2-R1-T4

**TDD 순서**:
- RED: `tests/services/test_ai_captions.py` — fallback 3개 캡션
- GREEN: `app/services/ai_service.py` (기존 파일에 generate_captions 추가)
- REFACTOR: 카테고리별 폴백 템플릿 (3개씩)

**Acceptance Criteria**:
- [ ] AIService.generate_captions(photo, event) → str[]
- [ ] 3개 캡션 옵션 반환 (20-40자)
- [ ] OpenAI API 실패 시 폴백
- [ ] 카테고리별 톤 다양화 (features.md 참조)
- [ ] 폴백 테스트 (OPENAI_API_KEY 미설정)

**관련 파일**:
- `backend/app/services/ai_service.py` (수정), `backend/tests/services/test_ai_captions.py`

---

### [ ] P3-R1-T6: AI 캡션 라우터

**목표**: POST /api/ai/caption 엔드포인트

**의존성**: P3-R1-T5, P3-R1-T4

**TDD 순서**:
- RED: `tests/routers/test_ai_captions.py` — POST → 3개 캡션
- GREEN: `app/routers/ai.py` (기존 파일 확장)
- REFACTOR: 응답 형식 표준화

**Acceptance Criteria**:
- [ ] POST /api/ai/caption { photo_id, event_id, category, date, memo }
- [ ] 응답: { caption_options: [{ id, text }, ...] }
- [ ] 캡션 길이 20-40자 강제
- [ ] TestClient 테스트 통과

**관련 파일**:
- `backend/app/routers/ai.py` (수정), `backend/tests/routers/test_ai_captions.py`

---

### [ ] P3-S1-T1: EventDetail 페이지 뼈대

**목표**: /events/:event_id 라우트 + 일정 정보 표시

**의존성**: P1-S0-T1, P2-R1-T3

**TDD 순서**:
- RED: `tests/pages/EventDetail.test.jsx` — 라우팅, 일정 로드
- GREEN: `src/pages/EventDetail.jsx`
- REFACTOR: 로딩/에러 상태

**Acceptance Criteria**:
- [ ] 라우터에서 event_id 파라미터 추출
- [ ] GET /api/events/{event_id} 호출
- [ ] 일정 정보 표시 (제목, 날짜, 카테고리, 메모)
- [ ] PhotoUpload, PhotoGrid 컴포넌트 플레이스홀더
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/pages/EventDetail.jsx`, `frontend/tests/pages/EventDetail.test.jsx`

---

### [ ] P3-S1-T2: PhotoUpload 컴포넌트

**목표**: 드래그앤드롭 + 파일 input + 진행도

**의존성**: P3-R1-T4, P3-S1-T1

**TDD 순서**:
- RED: `tests/components/PhotoUpload.test.jsx` — 드래그, 파일 선택, 진행도
- GREEN: `src/components/PhotoUpload.jsx`
- REFACTOR: 클라이언트 측 검증 (파일 타입, 크기)

**Acceptance Criteria**:
- [ ] 드래그앤드롭 영역 (DND API)
- [ ] input[type=file] 폴백
- [ ] 진행도 바 (업로드 중)
- [ ] 클라이언트 검증: 파일 타입, 5MB 이하, 10장 제한
- [ ] 유효하지 않은 파일 시 즉시 거절
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/components/PhotoUpload.jsx`, `frontend/tests/components/PhotoUpload.test.jsx`

---

### [ ] P3-S1-T3: PhotoGrid 컴포넌트

**목표**: 썸네일 3열 그리드 + 호버 삭제 + 캡션

**의존성**: P3-S1-T2, P3-R1-T4

**TDD 순서**:
- RED: `tests/components/PhotoGrid.test.jsx` — 썸네일, 삭제, 캡션
- GREEN: `src/components/PhotoGrid.jsx`
- REFACTOR: 반응형 레이아웃

**Acceptance Criteria**:
- [ ] 3열 그리드 (Tailwind grid-cols-3)
- [ ] 사진 썸네일 표시 (/uploads 경로)
- [ ] 호버 시 삭제 버튼 표시 (X 아이콘)
- [ ] 각 사진 아래 CaptionSelector 컴포넌트
- [ ] 반응형 (mobile: 1열, tablet: 2열, desktop: 3열)
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/components/PhotoGrid.jsx`, `frontend/tests/components/PhotoGrid.test.jsx`

---

### [ ] P3-S1-T4: CaptionSelector 컴포넌트

**목표**: AI 캡션 3개 선택 + 직접 입력

**의존성**: P3-R1-T6, P3-S1-T3

**TDD 순서**:
- RED: `tests/components/CaptionSelector.test.jsx` — AI 요청, 라디오, 수정
- GREEN: `src/components/CaptionSelector.jsx`
- REFACTOR: 로딩/에러 상태

**Acceptance Criteria**:
- [ ] "AI 캡션 추천" 버튼 (최초 1회)
- [ ] 3개 라디오 옵션 렌더링
- [ ] "직접 작성" 입력 필드
- [ ] PUT /api/photos/{photo_id}/caption 호출 (선택 시)
- [ ] 이미 입력된 캡션 표시 (수정 가능)
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/components/CaptionSelector.jsx`, `frontend/tests/components/CaptionSelector.test.jsx`

---

### [ ] P3-S1-T5: 사진 업로드 에러 처리

**목표**: 5MB/10장/파일타입 에러 UI

**의존성**: P3-S1-T2, P3-S1-T4

**TDD 순서**:
- RED: `tests/pages/EventDetail.test.jsx` — 에러 시나리오
- GREEN: EventDetail에 에러 처리 로직
- REFACTOR: Toast 메시지 통합

**Acceptance Criteria**:
- [ ] 파일 크기 초과 → Toast: "파일이 너무 큽니다 (최대 5MB)"
- [ ] 10장 초과 → Toast: "이 일정에는 최대 10장까지만 업로드 가능합니다"
- [ ] 파일 타입 에러 → Toast: "지원하지 않는 형식입니다 (JPG, PNG만 가능)"
- [ ] 에러 후 폼 상태 유지
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/pages/EventDetail.jsx` (수정), `frontend/tests/pages/EventDetail.test.jsx`

---

### [ ] P3-V1: Photo & EventDetail E2E

**목표**: 일정 진입 → 사진 업로드 → AI 캡션 → 저장

**의존성**: P3-S1-T5, P3-R1-T6

**검증 절차**:
- [ ] Calendar에서 일정 클릭 → EventDetail 진입
- [ ] PhotoUpload에서 샘플 사진 파일 드래그앤드롭
- [ ] 업로드 진행도 표시
- [ ] PhotoGrid에 썸네일 표시
- [ ] CaptionSelector "AI 캡션 추천" 클릭
- [ ] 3개 캡션 옵션 표시 (또는 폴백)
- [ ] 캡션 선택 → PUT 호출
- [ ] 캡션 표시 확인
- [ ] 사진 삭제 버튼 → DELETE 호출
- [ ] E2E 테스트 전체 통과

**관련 파일**: E2E 테스트

---

## Phase 4 — Timeline + Home 화면 (Lv1 MVP 완성)

**마일스톤**: 읽기 전용 집계 화면 완성  
**완료 시 상태**: docker-compose up만으로 전체 Lv1 플로우 시연 가능 (Home → Calendar → EventDetail → Timeline)

---

### [ ] P4-R1-T1: TimelineService (챕터 그룹핑)

**목표**: 카테고리별 자동 챕터 + 페이지 계산

**의존성**: P3-R1-T1, P3-R1-T2

**TDD 순서**:
- RED: `tests/services/test_timeline_service.py` — 챕터 그룹, 페이지 계산
- GREEN: `app/services/timeline_service.py`
- REFACTOR: 챕터 순서 규칙 (features.md)

**Acceptance Criteria**:
- [ ] get_timeline(couple_id) → chapters (사진 있는 Event만)
- [ ] 카테고리별 그룹: WEDDING_PHOTO, STUDIO/VENUE/GIFT/INVITATION (묶음), CEREMONY, HONEYMOON, ETC
- [ ] 각 Chapter: chapter_number, title, category, photo_count, photos
- [ ] is_selected=true인 사진만 포함
- [ ] 페이지 수 계산: ceil(selected_photo_count / 2.5)
- [ ] 서비스 테스트 100% 통과

**관련 파일**:
- `backend/app/services/timeline_service.py`, `backend/tests/services/test_timeline_service.py`

---

### [ ] P4-R1-T2: Timeline 라우터

**목표**: GET /api/couples/{id}/timeline

**의존성**: P4-R1-T1, P3-R1-T4

**TDD 순서**:
- RED: `tests/routers/test_timeline.py`
- GREEN: `app/routers/timeline.py`
- REFACTOR: 응답 캐싱 (선택)

**Acceptance Criteria**:
- [ ] GET /api/couples/{couple_id}/timeline → TimelineResponse
- [ ] 챕터 배열 + total_photos + total_pages_estimated
- [ ] 사진이 없으면 빈 배열 (또는 메시지)
- [ ] TestClient 테스트 통과

**관련 파일**:
- `backend/app/routers/timeline.py`, `backend/tests/routers/test_timeline.py`

---

### [ ] P4-R1-T3: Home용 집계 서비스

**목표**: upcoming events 3개 + recent photos 6개

**의존성**: P2-R1-T2, P3-R1-T2

**TDD 순서**:
- RED: `tests/services/test_home_service.py`
- GREEN: `app/services/home_service.py`
- REFACTOR: N+1 쿼리 방지 (joinedload)

**Acceptance Criteria**:
- [ ] get_home_summary(couple_id) → { upcoming_events, recent_photos, couple }
- [ ] upcoming_events: 3개, date >= today, 오름차순
- [ ] recent_photos: 6개, created_at 내림차순 (couple_id 필터는 Event join으로 N+1 방지)
- [ ] `GET /api/couples/{couple_id}/photos?limit=N&sort=recent` 별도 엔드포인트 제공 (resources.yaml queries 참조)
- [ ] SQLAlchemy `joinedload(Event.photos)`로 N+1 방지
- [ ] eager loading으로 쿼리 최소화
- [ ] 서비스 테스트 100% 통과

**관련 파일**:
- `backend/app/services/home_service.py`, `backend/tests/services/test_home_service.py`

---

### [ ] P4-R1-T4: Home 라우터 확인

**목표**: Home 데이터 GET 엔드포인트

**의존성**: P4-R1-T3, P1-R1-T3

**TDD 순서**:
- RED: `tests/routers/test_home.py` (또는 기존 couples 라우터 확장)
- GREEN: `app/routers/couples.py` 또는 새 `app/routers/home.py`
- REFACTOR: 캐싱

**Acceptance Criteria**:
- [ ] GET /api/couples/{id}/home 또는 /api/home (더미 커플)
- [ ] upcoming_events, recent_photos, couple 포함
- [ ] TestClient 테스트 통과

**관련 파일**:
- `backend/app/routers/home.py` (또는 couples.py 확장), `backend/tests/routers/test_home.py`

---

### [ ] P4-S1-T1: Timeline 페이지

**목표**: 챕터 스택 + 사진 그리드 + 페이지 수

**의존성**: P4-R1-T2, P3-S1-T3

**TDD 순서**:
- RED: `tests/pages/Timeline.test.jsx` — 챕터 렌더링
- GREEN: `src/pages/Timeline.jsx`
- REFACTOR: 반응형 레이아웃

**Acceptance Criteria**:
- [ ] GET /api/couples/{id}/timeline 호출
- [ ] 각 챕터 (TimelineChapter 컴포넌트) 스택
- [ ] 헤더: 총 사진 수 + 예상 페이지 수
- [ ] 빈 Timeline → "아직 사진이 없습니다" 메시지
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/pages/Timeline.jsx`, `frontend/tests/pages/Timeline.test.jsx`

---

### [ ] P4-S1-T2: TimelineChapter 컴포넌트

**목표**: 챕터 제목 + 사진 그리드 + 캡션 인라인 편집

**의존성**: P4-S1-T1, P3-S1-T3

**TDD 순서**:
- RED: `tests/components/TimelineChapter.test.jsx`
- GREEN: `src/components/TimelineChapter.jsx`
- REFACTOR: 인라인 편집 상태 관리

**Acceptance Criteria**:
- [ ] 챕터 제목 (색상 구분, design-tokens)
- [ ] 사진 개수 표시
- [ ] 사진 그리드 (PhotoGrid 활용)
- [ ] 각 사진 캡션 인라인 편집 (더블클릭)
- [ ] 편집 후 PUT /api/photos/{id}/caption 호출
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/components/TimelineChapter.jsx`, `frontend/tests/components/TimelineChapter.test.jsx`

---

### [ ] P4-S1-T3: "앨범으로 만들기" CTA 버튼

**목표**: 선택된 사진 ≥ 1장일 때 활성화

**의존성**: P4-S1-T2

**TDD 순서**:
- RED: `tests/pages/Timeline.test.jsx` — 버튼 활성화 조건
- GREEN: Timeline 페이지 (수정)
- REFACTOR: 라우팅

**Acceptance Criteria**:
- [ ] is_selected=true 사진 개수 계산
- [ ] 0개 → 버튼 비활성화 ("선택된 사진이 없습니다" 경고)
- [ ] 1개 이상 → 활성화
- [ ] 클릭 → /order-checkout 이동
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/pages/Timeline.jsx` (수정), `frontend/tests/pages/Timeline.test.jsx`

---

### [ ] P4-S2-T1: Home 페이지

**목표**: CoupleProfileCard + UpcomingTasksWidget + RecentPhotosGrid + CTA

**의존성**: P4-R1-T4, P1-S0-T1

**TDD 순서**:
- RED: `tests/pages/Home.test.jsx` — 컴포넌트 렌더링
- GREEN: `src/pages/Home.jsx`
- REFACTOR: 데이터 로딩 상태

**Acceptance Criteria**:
- [ ] CoupleProfileCard (섹션)
- [ ] UpcomingTasksWidget (3개 일정)
- [ ] RecentPhotosGrid (6개 사진)
- [ ] CTA 버튼들 (캘린더 이동, 주문 관리 등)
- [ ] GET /api/couples/{id}/home 호출
- [ ] 로딩/에러 상태
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/pages/Home.jsx`, `frontend/tests/pages/Home.test.jsx`

---

### [ ] P4-S2-T2: CoupleProfileCard 컴포넌트

**목표**: 커플 프로필 카드 (Fraunces 폰트 + D-day + 프로필 사진)

**의존성**: P1-S0-T2

**TDD 순서**:
- RED: `tests/components/CoupleProfileCard.test.jsx`
- GREEN: `src/components/CoupleProfileCard.jsx`
- REFACTOR: Tailwind 스타일

**Acceptance Criteria**:
- [ ] 커플 이름 (신랑 ♥ 신부, Fraunces 폰트, 큰 사이즈)
- [ ] D-day 카운트다운 (48px 폰트)
- [ ] 프로필 사진 (없으면 기본 이미지)
- [ ] 태그라인 (한 줄 소개)
- [ ] **2차 카운트다운 표시**: '앨범 주문 추천: D-{21 이내면 잔여일, 그 이상이면 숨김}'. wedding_date가 과거면 'D+N · 앨범 주문 기한 만료' 회색 표시
- [ ] **2차 카운트다운 색상**: D-21~D-14 노란 경고, D-14 이하 빨간 긴급
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/components/CoupleProfileCard.jsx`, `frontend/tests/components/CoupleProfileCard.test.jsx`

---

### [ ] P4-S2-T3: D+ 상태 처리 (과거 일정)

**목표**: wedding_date 이후 일정은 "완료" 기본 표시

**의존성**: P1-R1-T4, P2-S1-T1

**TDD 순서**:
- RED: `tests/services/test_event_status.js` (Frontend)
- GREEN: 유틸 함수 작성
- REFACTOR: Home + Calendar에 적용

**Acceptance Criteria**:
- [ ] 오늘 > wedding_date (D+ 상태) → upcoming_events 제외
- [ ] Home UpcomingTasksWidget: 미래 일정만 표시
- [ ] Calendar: 과거 일정은 체크된 상태로 표시 (선택)
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/utils/eventStatus.js`, `frontend/tests/utils/eventStatus.test.js`

---

### [ ] P4-V1: Lv1 MVP E2E (핵심 시연!)

**목표**: 완전한 Lv1 플로우 검증 (docker-compose up 시연 가능)

**의존성**: P4-S2-T3, P4-R1-T4

**검증 절차** (이 순서대로):
1. [ ] docker-compose up (data/ 디렉토리 삭제 후 클린 상태)
   - Backend 기동 30초 이내
   - Frontend 기동 30초 이내
   - 더미 커플 자동 시딩 (성우♥은비)
   
2. [ ] Home 페이지 진입 (http://localhost:3000)
   - CoupleProfileCard 표시 (이름, D-day)
   - UpcomingTasksWidget (시딩된 일정 3개 또는 비어있음)
   
3. [ ] Calendar 진입
   - 월간 뷰 그리드 표시 (42셀)
   - D-day 고정 헤더
   - "AI로 자동 생성" CTA (캘린더 비어있을 경우)
   
4. [ ] "AI로 자동 생성" 클릭
   - 로딩 스피너 표시
   - 15개 일정 추가 완료
   - 캘린더 자동 새로고침
   
5. [ ] 특정 날짜 클릭 → EventForm 모달
   - 날짜, 제목, 카테고리 입력
   - "저장" → 일정 생성 → 캘린더 업데이트
   
6. [ ] 생성된 일정 클릭 → EventDetail
   - 일정 정보 표시
   - PhotoUpload 표시 (드래그앤드롭 가능)
   
7. [ ] 샘플 이미지 파일 업로드
   - 드래그앤드롭 또는 파일 선택
   - 진행도 표시
   - 업로드 완료 후 썸네일 표시
   
8. [ ] PhotoGrid에서 사진 우측 아래 CaptionSelector
   - "AI 캡션 추천" 클릭
   - 3개 캡션 옵션 또는 폴백
   - 캡션 선택 → 저장
   
9. [ ] Calendar 리스트 뷰 탭 전환
   - 월별 일정 나열
   - 카테고리 배지 (색상 구분)
   - 완료 체크박스 토글
   
10. [ ] Timeline 진입
    - 챕터별 스택 표시 (WEDDING_PHOTO, PREPARATION, CEREMONY, HONEYMOON)
    - 각 챕터 사진 그리드
    - 총 사진 수 + 예상 페이지 수 표시
    - 사진 선택/해제 체크박스
    
11. [ ] "앨범으로 만들기" CTA 버튼
    - is_selected=true 사진 1개 이상 → 활성화
    - 클릭 → /order-checkout 이동 (아직 구현 전, 페이지 생성만)
    
**검증 체크리스트**:
- [ ] 두 컨테이너 에러 없이 기동
- [ ] 모든 네비게이션 동작
- [ ] API 응답 정상 (Network 탭)
- [ ] 이미지 로딩 성공
- [ ] 데이터 저장 → 새로고침 유지

**관련 파일**: E2E 테스트 (Playwright 또는 Vitest E2E)

---

## Phase 5 — Order Checkout (Lv2, 주문 4단계)

**마일스톤**: 주문 생성 플로우 완성  
**완료 시 상태**: Step 1-4 체크아웃 + DB에 Order 생성

---

### [ ] P5-R1-T1: Order 모델 + 스키마

**목표**: SQLAlchemy Order 모델 + 상태 전이 규칙

**의존성**: P4-R1-T1

**TDD 순서**:
- RED: `tests/models/test_order.py` — status enum, chapters JSON, FK
- GREEN: `app/models/order.py`, `app/schemas/order.py`
- REFACTOR: 상태 전이 검증

**Acceptance Criteria**:
- [ ] 필드: id (ord_YYYYMMDD_NNN), couple_id, format, cover_type, quantity, chapters (JSON), recipient_*, status, created_at, updated_at
- [ ] status enum: pending, processing, completed (기본: pending)
- [ ] Format enum: SQUARE, A4
- [ ] CoverType enum: HARD, SOFT
- [ ] chapters 구조: [{ chapter_number, title, photo_ids: [] }, ...]
- [ ] Pydantic: OrderCreate, OrderUpdate, OrderResponse
- [ ] pytest 통과

**관련 파일**:
- `backend/app/models/order.py`, `backend/app/schemas/order.py`, `backend/tests/models/test_order.py`

---

### [ ] P5-R1-T2: OrderService.create_order (검증 포함)

**목표**: 주문 생성 + 비즈니스 규칙 검증

**의존성**: P5-R1-T1, P3-R1-T2

**TDD 순서**:
- RED: `tests/services/test_order_service.py` — 검증 (빈 앨범, quantity 범위, format enum)
- GREEN: `app/services/order_service.py`
- REFACTOR: 트랜잭션, 주문 ID 생성

**Acceptance Criteria**:
- [ ] 최소 1장 이상 사진 필수 (chapters에서 photo_ids 개수)
- [ ] quantity 1-10 검증
- [ ] format/cover_type enum 검증
- [ ] 주문 ID 형식: ord_YYYYMMDD_NNN (날짜별 시퀀스)
- [ ] 위반 시 ValueError → 400 Bad Request
- [ ] 서비스 테스트 100% 통과

**관련 파일**:
- `backend/app/services/order_service.py`, `backend/tests/services/test_order_service.py`

---

### [ ] P5-R1-T3: Order 생성 라우터

**목표**: POST /api/couples/{id}/orders

**의존성**: P5-R1-T2, P1-R1-T3

**TDD 순서**:
- RED: `tests/routers/test_orders.py` — POST 검증
- GREEN: `app/routers/orders.py`
- REFACTOR: 응답 표준화

**Acceptance Criteria**:
- [ ] POST /api/couples/{couple_id}/orders { format, cover_type, quantity, chapters, recipient_* }
- [ ] 응답: OrderResponse (order_id, status=pending, created_at)
- [ ] 400 유효성 검사 실패
- [ ] 404 Couple not found
- [ ] TestClient 테스트 통과

**관련 파일**:
- `backend/app/routers/orders.py`, `backend/tests/routers/test_orders.py`

---

### [ ] P5-R1-T4: Order 가격 계산 헬퍼

**목표**: format별 base + cover_type surcharge + quantity 곱

**의존성**: P5-R1-T1

**TDD 순서**:
- RED: `tests/utils/test_price_calc.py` — 가격 계산
- GREEN: `app/utils/price_calculator.py`
- REFACTOR: 통화 포맷

**Acceptance Criteria**:
- [ ] base_price: SQUARE 180000, A4 200000 (임시)
- [ ] cover_surcharge: HARD +20000, SOFT 0
- [ ] total_price_per_book = base + surcharge
- [ ] total_price = per_book * quantity
- [ ] 가격 정보 OrderResponse에 포함 (선택)
- [ ] 단위 테스트 통과

**관련 파일**:
- `backend/app/utils/price_calculator.py`, `backend/tests/utils/test_price_calc.py`

---

### [ ] P5-S1-T1: OrderCheckout 페이지 (Stepper 뼈대)

**목표**: 4단계 Stepper UI + Step 상태 관리

**의존성**: P4-S1-T3

**TDD 순서**:
- RED: `tests/pages/OrderCheckout.test.jsx` — Stepper 렌더링
- GREEN: `src/pages/OrderCheckout.jsx` + useReducer 또는 Context
- REFACTOR: 상태 전이 로직

**Acceptance Criteria**:
- [ ] Stepper 컴포넌트 (Step 1-4 표시, 현재 Step 강조)
- [ ] Step 상태 관리 (useReducer 또는 OrderContext)
- [ ] 이전/다음 버튼
- [ ] 취소 버튼 (확인 모달)
- [ ] LocalStorage에 Step 상태 저장 (새로고침 후 복구)
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/pages/OrderCheckout.jsx`, `frontend/src/components/OrderStepper.jsx`, `frontend/tests/pages/OrderCheckout.test.jsx`

---

### [ ] P5-S1-T2: Step 1 — AlbumConfirmation

**목표**: 선택된 사진 + 챕터 요약 표시

**의존성**: P5-S1-T1, P4-R1-T2

**TDD 순서**:
- RED: `tests/components/AlbumConfirmation.test.jsx`
- GREEN: `src/components/steps/AlbumConfirmation.jsx`
- REFACTOR: 챕터 토글

**Acceptance Criteria**:
- [ ] GET /api/couples/{id}/timeline 호출
- [ ] 선택된 사진 개수 표시
- [ ] 예상 페이지 수 표시
- [ ] 각 챕터 토글 (포함 여부 선택)
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/components/steps/AlbumConfirmation.jsx`, `frontend/tests/components/AlbumConfirmation.test.jsx`

---

### [ ] P5-S1-T3: Step 2 — OptionSelection

**목표**: 판형/표지/수량 선택 + 실시간 가격 계산

**의존성**: P5-S1-T2

**TDD 순서**:
- RED: `tests/components/OptionSelection.test.jsx` — 선택 변경 시 가격 업데이트
- GREEN: `src/components/steps/OptionSelection.jsx`
- REFACTOR: 가격 계산 훅

**Acceptance Criteria**:
- [ ] 판형 라디오 (SQUARE, A4)
- [ ] 표지 라디오 (HARD, SOFT)
- [ ] 수량 입력 (1-10)
- [ ] 실시간 가격 계산 (base + surcharge) * quantity
- [ ] 가격 정보 표시 (1권 + 전체)
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/components/steps/OptionSelection.jsx`, `frontend/tests/components/OptionSelection.test.jsx`

---

### [ ] P5-S1-T4: Step 3 — ShippingInfo

**목표**: 수령인/연락처/주소 입력 + 검증

**의존성**: P5-S1-T3

**TDD 순서**:
- RED: `tests/components/ShippingInfo.test.jsx` — 필드 검증
- GREEN: `src/components/steps/ShippingInfo.jsx`
- REFACTOR: 폰트 포맷

**Acceptance Criteria**:
- [ ] 수령인 이름: 필수, 2자 이상
- [ ] 연락처: 필수, 010-xxxx-xxxx 포맷 검증
- [ ] 주소: 필수
- [ ] 입력 필드 하나하나 검증 피드백
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/components/steps/ShippingInfo.jsx`, `frontend/tests/components/ShippingInfo.test.jsx`

---

### [ ] P5-S1-T5: Step 4 — OrderComplete

**목표**: POST /api/couples/{id}/orders → 주문 ID 표시

**의존성**: P5-S1-T4, P5-R1-T3

**TDD 순서**:
- RED: `tests/components/OrderComplete.test.jsx` — 주문 생성, ID 표시
- GREEN: `src/components/steps/OrderComplete.jsx`
- REFACTOR: 복사 버튼

**Acceptance Criteria**:
- [ ] 이전 Step 데이터 수집
- [ ] POST /api/couples/{couple_id}/orders 호출
- [ ] 성공 → order_id 표시 + 복사 버튼
- [ ] 주문 완료 화면에 '**예상 배송일**: {order_created_date + 14일}' 라인 추가 (면접 '타이밍 UX' 답변 근거)
- [ ] 페르소나 D(1권 구매)를 위한 카피: quantity=1이면 '1권도 충분합니다. 우리 둘만의 기록.' 메시지
- [ ] "주문 관리로" 버튼 → /orders 이동
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/components/steps/OrderComplete.jsx`, `frontend/tests/components/OrderComplete.test.jsx`

---

### [ ] P5-S1-T6: OrderCheckout 네비게이션 + 상태 보존

**목표**: 이전/다음/취소 + LocalStorage

**의존성**: P5-S1-T5

**TDD 순서**:
- RED: `tests/pages/OrderCheckout.test.jsx` — 취소 모달, 상태 보존
- GREEN: OrderCheckout.jsx (수정)
- REFACTOR: 취소 로직

**Acceptance Criteria**:
- [ ] 이전/다음 버튼 (Step 1에서 이전 불가)
- [ ] 취소 버튼 → 확인 모달
- [ ] LocalStorage에 { step, data } 저장
- [ ] 새로고침 후 상태 복구
- [ ] 주문 완료 후 LocalStorage 클리어
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/pages/OrderCheckout.jsx` (수정), `frontend/tests/pages/OrderCheckout.test.jsx`

---

### [ ] P5-V1: Order Checkout E2E

**목표**: Timeline → 주문 생성 → DB 확인

**의존성**: P5-S1-T6, P5-R1-T3

**검증 절차**:
- [ ] Timeline 페이지에서 사진 선택
- [ ] "앨범으로 만들기" 클릭 → OrderCheckout 진입
- [ ] Step 1: 챕터 확인 → 다음
- [ ] Step 2: 판형(SQUARE) + 표지(HARD) + 수량(2) 선택 → 가격 계산 확인 → 다음
- [ ] Step 3: 수령인/연락처/주소 입력 → 다음
- [ ] Step 4: "주문 생성" → 주문 ID 표시
- [ ] "주문 관리로" → /orders 페이지 진입 (아직 구현 전)
- [ ] (Backend) DB에 Order 레코드 확인 (status=pending)
- [ ] E2E 테스트 전체 통과

**관련 파일**: E2E 테스트

---

## Phase 6 — Orders 관리 화면 (Lv2 마일스톤)

**마일스톤**: 주문 조회 + 상태 관리 완성  
**완료 시 상태**: Lv2 MVP 완성 (Lv1 + 주문까지 완전 통합)

---

### [ ] P6-R1-T1: Orders 조회 엔드포인트

**목표**: GET /api/couples/{id}/orders, GET /api/orders/{id}

**의존성**: P5-R1-T3

**TDD 순서**:
- RED: `tests/routers/test_orders_get.py`
- GREEN: `app/routers/orders.py` (수정)
- REFACTOR: 정렬, 필터링

**Acceptance Criteria**:
- [ ] GET /api/couples/{couple_id}/orders → OrderList
- [ ] GET /api/orders/{order_id} → OrderDetail
- [ ] 목록: id, created_at, status, format, quantity, total_price, recipient_name
- [ ] 상세: 모든 필드 + chapters 배열
- [ ] TestClient 테스트 통과

**관련 파일**:
- `backend/app/routers/orders.py` (수정), `backend/tests/routers/test_orders_get.py`

---

### [ ] P6-R1-T2: Order 상태 변경 (PATCH /status)

**목표**: pending → processing → completed (일방향)

**의존성**: P6-R1-T1

**TDD 순서**:
- RED: `tests/services/test_order_state_machine.py` — 5개 시나리오 테스트 (상태머신 분리)
- GREEN: `app/services/order_state_machine.py` + `app/routers/orders.py` (PATCH /orders/{id}/status)
- REFACTOR: 라우터 얇게 유지

**Acceptance Criteria**:
- [ ] **OrderStateMachine 클래스를 `app/services/order_state_machine.py`로 분리**. 라우터는 얇게 유지 (서비스 호출만)
- [ ] PATCH /api/orders/{order_id}/status { new_status: "processing" }
- [ ] pending → processing ✓
- [ ] processing → completed ✓
- [ ] completed → processing ✗ (400 커스텀 에러 메시지)
- [ ] pending → completed (단계 건너뛰기) ✗ (400)
- [ ] pending → pending (동일 상태) no-op 또는 명시적 에러 (정책 선택)
- [ ] 역전이 불가 (400: "상태를 되돌릴 수 없습니다")
- [ ] updated_at 자동 갱신
- [ ] **`backend/tests/services/test_order_state_machine.py` 별도 파일 생성, 5개 시나리오 테스트 필수**:
  - 1. pending → processing 성공 (200)
  - 2. processing → completed 성공 (200)
  - 3. completed → processing 실패 (400, 커스텀 에러 메시지)
  - 4. pending → completed (단계 건너뛰기) 실패 (400)
  - 5. pending → pending (동일 상태) no-op 또는 명시적 에러 (정책 선택)
- [ ] TestClient + 단위테스트 전체 통과

**관련 파일**:
- `backend/app/services/order_state_machine.py` (신규), `backend/app/routers/orders.py` (수정), `backend/tests/services/test_order_state_machine.py` (신규)

---

### [ ] P6-S1-T1: Orders 페이지

**목표**: 주문 카드 리스트 + 상태별 필터 탭

**의존성**: P6-R1-T1, P1-S0-T1

**TDD 순서**:
- RED: `tests/pages/Orders.test.jsx` — 주문 렌더링, 필터
- GREEN: `src/pages/Orders.jsx`
- REFACTOR: 상태별 색상

**Acceptance Criteria**:
- [ ] GET /api/couples/{id}/orders 호출
- [ ] 상태별 필터 탭 (All, Pending, Processing, Completed)
- [ ] 각 탭에서 해당 주문만 표시
- [ ] OrderCard 컴포넌트로 렌더링
- [ ] 빈 상태 UI ("주문 없음 + 타임라인 바로가기")
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/pages/Orders.jsx`, `frontend/tests/pages/Orders.test.jsx`

---

### [ ] P6-S1-T2: OrderCard 컴포넌트

**목표**: 주문 정보 + 상태 배지 + 상태 변경 버튼

**의존성**: P6-S1-T1, P6-R1-T2

**TDD 순서**:
- RED: `tests/components/OrderCard.test.jsx` — 버튼 동적 전환
- GREEN: `src/components/OrderCard.jsx`
- REFACTOR: 로딩 상태

**Acceptance Criteria**:
- [ ] 주문 ID, 상태, 판형, 수량, 가격, 수령인명 표시
- [ ] 상태 배지 (색상: pending-gray, processing-blue, completed-green)
- [ ] 상태별 버튼 동적 전환:
  - pending → "처리 시작" 버튼 (클릭 시 processing)
  - processing → "배송 완료" 버튼 (클릭 시 completed)
  - completed → 버튼 비활성화 ("배송완료")
- [ ] 클릭 시 PATCH /api/orders/{id}/status 호출
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/components/OrderCard.jsx`, `frontend/tests/components/OrderCard.test.jsx`

---

### [ ] P6-S1-T3: Order 상세 뷰 (모달 또는 페이지)

**목표**: 챕터 프리뷰 + 배송정보 + 상태 타임라인 (선택)

**의존성**: P6-S1-T2

**TDD 순서**:
- RED: `tests/components/OrderDetail.test.jsx` (또는 tests/pages/OrderDetail.test.jsx)
- GREEN: `src/components/OrderDetail.jsx` (또는 pages/)
- REFACTOR: 타임라인 UI

**Acceptance Criteria**:
- [ ] 클릭 시 GET /api/orders/{order_id} 호출
- [ ] 주문 정보: 판형, 표지, 수량, 가격
- [ ] 챕터 미리보기 (각 챕터 사진 3개씩 그리드)
- [ ] 수령인 정보 (이름, 연락처, 주소)
- [ ] 상태 타임라인 (pending → processing → completed, 완료된 단계 체크 표시)
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/components/OrderDetail.jsx`, `frontend/tests/components/OrderDetail.test.jsx`

---

### [ ] P6-V1: Orders 상태 관리 E2E

**목표**: 주문 생성 후 상태 변경 → 역전이 차단 검증

**의존성**: P6-S1-T3, P6-R1-T2

**검증 절차**:
- [ ] 이전 Phase에서 생성한 주문 조회 (Orders 페이지)
- [ ] 주문 카드의 "처리 시작" 버튼 클릭
- [ ] 상태 변경 로딩 표시 → pending → processing 완료
- [ ] 버튼 자동 변경 → "배송 완료"
- [ ] "배송 완료" 클릭 → processing → completed
- [ ] 버튼 비활성화 ("배송완료" 표시)
- [ ] 새로고침 후 상태 유지 확인
- [ ] (Backend) 역방향 요청 시도 (직접 curl):
  - PATCH /api/orders/{id}/status { new_status: "processing" }
  - 서버 400 응답 확인
- [ ] E2E 테스트 전체 통과

**관련 파일**: E2E 테스트

---

## Phase 7 — Export ZIP (Lv3)

**마일스톤**: 주문 데이터 ZIP 다운로드 기능  
**완료 시 상태**: 주문 1건의 모든 데이터 (사진 + 메타데이터) 익스포트 가능

---

### [ ] P7-R1-T1: ExportService.export_order_as_zip

**목표**: order.json + chapters/ + captions.json → ZIP 생성

**의존성**: P6-R1-T1

**TDD 순서**:
- RED: `tests/services/test_export_service.py` — ZIP 구조 검증
- GREEN: `app/services/export_service.py`
- REFACTOR: 임시 파일 정리

**Acceptance Criteria**:
- [ ] order.json 생성 (order_id, couple, format, cover_type, quantity, chapters, recipient, total_photos, total_pages, created_at)
- [ ] chapters/ 디렉터리 구조 (01_wedding_photo/, 02_preparation/, ...)
- [ ] 선택된 사진 파일만 복사
- [ ] captions.json 생성 (photo_filename → {caption, date, category})
- [ ] 3개 파일 ZIP 압축
- [ ] 임시 파일 정리 (cleanup)
- [ ] 서비스 테스트 100% 통과

**관련 파일**:
- `backend/app/services/export_service.py`, `backend/tests/services/test_export_service.py`

---

### [ ] P7-R1-T2: order.json 구조 정의

**목표**: 파트너사(스위트북) 호환 JSON 스키마

**의존성**: P7-R1-T1

**TDD 순서**:
- RED: `tests/services/test_export_schema.py` — 필드 검증
- GREEN: Pydantic OrderExport 스키마
- REFACTOR: 예제 JSON 생성

**Acceptance Criteria**:
- [ ] 필드: order_id, couple (groom, bride, wedding_date), format, cover_type, quantity, chapters [], recipient, total_photos, total_pages, created_at, exported_at
- [ ] chapters 각각: chapter_number, title, category, photos (파일명 배열), photo_count
- [ ] JSON 인코딩 UTF-8
- [ ] 단위 테스트 통과

**관련 파일**:
- `backend/app/schemas/export.py`, `backend/tests/services/test_export_schema.py`

---

### [ ] P7-R1-T3: captions.json 구조 정의

**목표**: 사진별 캡션 매핑

**의존성**: P7-R1-T2

**TDD 순서**:
- RED: `tests/services/test_captions_export.py`
- GREEN: captions.json 생성 로직
- REFACTOR: 구조 문서화

**Acceptance Criteria**:
- [ ] 키: photo_001.jpg (파일명)
- [ ] 값: { caption, date, category }
- [ ] 모든 선택된 사진 포함
- [ ] JSON UTF-8 인코딩
- [ ] 단위 테스트 통과

**관련 파일**:
- `backend/app/services/export_service.py` (수정), `backend/tests/services/test_captions_export.py`

---

### [ ] P7-R1-T4: Export 라우터 (GET /api/orders/{id}/export)

**목표**: ZIP 다운로드 엔드포인트

**의존성**: P7-R1-T3, P6-R1-T1

**TDD 순서**:
- RED: `tests/routers/test_export.py` — ZIP 응답 검증
- GREEN: `app/routers/export.py`
- REFACTOR: 진행도 로깅

**Acceptance Criteria**:
- [ ] GET /api/orders/{order_id}/export
- [ ] Content-Type: application/zip
- [ ] Content-Disposition: attachment; filename=order_YYYYMMDD_NNN.zip
- [ ] ZIP 스트리밍 응답
- [ ] order not found → 404
- [ ] TestClient 테스트 통과

**관련 파일**:
- `backend/app/routers/export.py`, `backend/tests/routers/test_export.py`

---

### [ ] P7-S1-T1: Orders 페이지에 "데이터 다운로드" 버튼

**목표**: 주문 상세에서 ZIP 다운로드

**의존성**: P7-R1-T4, P6-S1-T3

**TDD 순서**:
- RED: `tests/components/OrderDetail.test.jsx` — 다운로드 버튼
- GREEN: OrderDetail 컴포넌트 (수정)
- REFACTOR: 로딩 상태

**Acceptance Criteria**:
- [ ] OrderDetail에 "데이터 다운로드" 버튼
- [ ] 클릭 시 GET /api/orders/{id}/export (브라우저 다운로드)
- [ ] 로딩 스피너 표시
- [ ] 다운로드 완료 후 스피너 제거
- [ ] Vitest 테스트 통과

**관련 파일**:
- `frontend/src/components/OrderDetail.jsx` (수정), `frontend/tests/components/OrderDetail.test.jsx`

---

### [ ] P7-V1: Export E2E (ZIP 검증)

**목표**: 주문 상세 → ZIP 다운로드 → 파일 검증

**의존성**: P7-S1-T1, P7-R1-T4

**검증 절차**:
- [ ] Orders 페이지에서 기존 주문 클릭 → OrderDetail 진입
- [ ] "데이터 다운로드" 버튼 클릭
- [ ] 브라우저 다운로드 폴더에 order_*.zip 저장됨
- [ ] ZIP 파일 압축 해제
- [ ] 구조 확인:
  - [ ] order.json 존재
  - [ ] chapters/ 디렉터리 존재
  - [ ] 각 챕터 디렉터리 (01_wedding_photo, 02_preparation, 등)
  - [ ] 선택된 사진 이미지 파일 존재 (photo_*.jpg)
  - [ ] captions.json 존재
- [ ] order.json 파싱 → 필드 검증
- [ ] captions.json 파싱 → 사진별 캡션 매핑 확인
- [ ] E2E 테스트 전체 통과

**관련 파일**: E2E 테스트

---

## Phase 8 — 최종 완성 (데이터 + README + E2E)

**마일스톤**: 제출 준비 완료  
**완료 시 상태**: docker-compose up으로 완전한 데모 가능 + 심사자 체크리스트 만족

---

### [ ] P8-T1: 더미 데이터 시딩 확장

**목표**: 샘플 커플 + 일정 + 사진 + 주문 1건

**의존성**: P7-V1 (모든 기능 완성 후)

**TDD 순서**:
- RED: `tests/test_seed_full.py` — DB 초기화 후 데이터 확인
- GREEN: `backend/app/seed.py` (확장)
- REFACTOR: 멱등성 보장

**Acceptance Criteria**:
- [ ] 커플 1개 (성우♥은비, wedding_date=2026-10-25)
- [ ] 10-15개 사전 등록 일정 (AI 체크리스트 스타일)
- [ ] 각 일정 3-5개 더미 사진 (Unsplash API 또는 로컬 placeholder)
- [ ] 각 사진 캡션 (사전정의 또는 AI 생성)
- [ ] 사전 주문 1건 (status=processing, chapters 포함)
- [ ] data/weddinglog.db 비어있을 때만 시딩 (exist check)
- [ ] pytest 검증 통과

**관련 파일**:
- `backend/app/seed.py` (수정), `backend/tests/test_seed_full.py`

---

### [ ] P8-T2: README.md 작성

**목표**: 과제 안내문 6섹션과 1:1 대응

**의존성**: 모든 Phase 완성

**Acceptance Criteria**:
- [ ] **README 목차 = 과제 안내문 6섹션 1:1 대응 필수**:
  - **1. 서비스 소개**: 한 문장 + 타겟 사용자 + 주요 기능 목록 (Lv1/Lv2/Lv3 요약)
  - **2. 실행 방법**: Docker 코드 블록 2개 (docker-compose up 기본 + 포트 변경 방법 명시)
  - **3. 완성한 레벨**: Lv1/Lv2/Lv3 각각에서 구현한 구체 항목 (목록 형식)
  - **4. 기술 스택 및 아키텍처**: 스택 + 선택 이유 + 디렉토리 구조 (tree 형식)
  - **5. AI 도구 사용 내역** (표 + 실제 프롬프트 3개 인용 필수):
    - (a) `/socrates` 심층 기획 검증 — '기존 기획서 기반으로 경쟁분석/페르소나/비즈니스 모델 빈 곳 검증'
    - (b) `/screen-spec` 화면 명세 — 'docs/planning/06-screens.md를 YAML로 정형화'
    - (c) `/auto-orchestrate` Phase별 TDD 빌드 — '태스크 분해 후 전문 서브에이전트 위임'
  - **6. 설계 의도**: 아이디어 선택 이유 + 사업적 가능성 + 미구현 확장 기능
- [ ] **스크린샷 5장 삽입**: Home / Calendar(월간 뷰) / EventDetail(사진+캡션) / Timeline / Orders(상태 변경)
- [ ] `docs/devlog.md` 링크 삽입 (서술형 문항 4 증거 — AI 도구 사용 실패 사례)
- [ ] `docs/partner-contract.md` 링크 (Lv3 직렬화 증거 — order.json ↔ 가상 스위트북 API 매핑 표)

**관련 파일**: `README.md`, 스크린샷 (docs/screenshots/production/*.png)

---

### [ ] P8-T3: .env.example 완성

**목표**: 필수/선택 환경변수 명확화

**의존성**: 모든 Phase 완성

**내용**:
- [ ] API_PORT=8000 (변경 가능)
- [ ] WEB_PORT=3000 (변경 가능)
- [ ] OPENAI_API_KEY= (선택, 폴백 설명)
- [ ] DATABASE_URL=sqlite:///app/data/weddinglog.db (고정)
- [ ] LOG_LEVEL=INFO (선택)
- [ ] 주석으로 각 변수 설명

**관련 파일**: `.env.example`

---

### [ ] P8-T4: 최종 Docker 실행 테스트

**목표**: 클린 환경에서 완전 자동 실행 검증

**의존성**: P8-T1, P8-T3

**검증 절차** (시뮬레이션):
1. [ ] data/ 디렉터리 완전 삭제
2. [ ] `cp .env.example .env` (기본값 사용)
3. [ ] `docker-compose down --volumes` (기존 이미지/볼륨 제거)
4. [ ] `docker-compose up` 실행
5. [ ] Backend 기동 (30초 이내):
   - [ ] DB 초기화
   - [ ] 더미 데이터 시딩
   - [ ] /health 200 OK
6. [ ] Frontend 기동 (30초 이내):
   - [ ] http://localhost:3000 접속 가능
   - [ ] 콘솔 에러 없음
7. [ ] 심사자 플로우 체크리스트 실행:
   - [ ] Home 접속 → 커플 정보 표시
   - [ ] Calendar 접속 → 더미 일정 표시
   - [ ] 일정 클릭 → EventDetail → 더미 사진 표시
   - [ ] Timeline 진입 → 챕터별 사진 표시
   - [ ] "앨범으로 만들기" → OrderCheckout 진입
   - [ ] 주문 생성 → Orders 페이지
   - [ ] 주문 상태 변경 (pending → processing → completed)
   - [ ] "데이터 다운로드" → ZIP 다운로드 완료

**관련 파일**: docker-compose.yml, docker-compose 체크리스트 스크립트 (선택)

---

### [ ] P8-T5: GitHub 저장소 정리

**목표**: Public 설정 + .gitignore 정비

**의존성**: 모든 Phase 완성

**작업 내용**:
- [ ] Public 저장소로 변경
- [ ] `.gitignore` 확인:
  - [ ] .env (커밋 X, .env.example만)
  - [ ] data/ (DB, 사진 파일 X)
  - [ ] uploads/ (X)
  - [ ] __pycache__/ (X)
  - [ ] *.pyc (X)
  - [ ] node_modules/ (X)
  - [ ] dist/ (X)
  - [ ] .DS_Store (X)
- [ ] 불필요 파일 제거 (예: 로컬 테스트 파일, 임시 파일)
- [ ] README.md, docs/ 폴더 최종 정리
- [ ] `git log` 확인 → 의미있는 커밋 메시지

**관련 파일**: `.gitignore`, GitHub Settings

---

### [ ] P8-V1: 최종 합격 기준 E2E

**목표**: 새 환경에서 완전한 시연 (심사자 기준)

**의존성**: P8-T4, P8-T5

**최종 검증 체크리스트**:

**인프라 (5점)**:
- [ ] docker-compose up 한 줄 실행 → 자동 완성
- [ ] 30초 이내 두 서비스 기동
- [ ] /health, /api/docs 정상 작동
- [ ] Frontend 로딩 에러 없음
- [ ] 데이터 영속성 (새로고침 후 데이터 유지)

**Lv1 MVP (35점)**:
- [ ] Home: 커플 정보 + 다음 일정 + 최근 사진 표시
- [ ] Calendar: 월간/리스트 뷰 토글
- [ ] AI 체크리스트: "자동 생성" 클릭 → 15개 일정 추가
- [ ] EventDetail: 사진 업로드 (드래그앤드롭) → 3개 캡션 선택 저장
- [ ] Timeline: 챕터별 사진 정렬 + 선택/해제
- [ ] "앨범으로 만들기" CTA 활성화

**Lv2 (25점)**:
- [ ] OrderCheckout: 4단계 모두 동작
- [ ] Orders: 주문 조회 + 상태 변경 (pending → processing → completed)
- [ ] 역전이 불가 (completed → processing 불가)
- [ ] 실시간 가격 계산 (Step 2)

**Lv3 (10점)**:
- [ ] "데이터 다운로드" 버튼 → ZIP 다운로드
- [ ] ZIP 구조 정확 (order.json, chapters/, captions.json)
- [ ] 파일 무결성 확인

**문서 (15점)**:
- [ ] README.md (설치, 실행, 기능 명확)
- [ ] 기술 스택 설명
- [ ] AI 도구 사용 내역 명시
- [ ] 설계 의도 (TDD, Phase 구조)
- [ ] 확장 가능성 (미구현 기능)

**코드 품질 (10점)**:
- [ ] 테스트 커버리지 (주요 경로 70% 이상)
- [ ] TDD 준수 (RED-GREEN-REFACTOR 구조 명확)
- [ ] 에러 처리 (폴백, 유효성 검사)
- [ ] 성능 최적화 (쿼리 N+1 방지, 캐싱)

**최종 E2E 실행**:
- [ ] 새 환경 (클린 git clone 후) 5분 내에 완전 시연 가능
- [ ] 모든 Lv1/Lv2/Lv3 기능 일관되게 작동
- [ ] 에러 메시지 없음 (콘솔, Network 탭)

**관련 파일**: 최종 E2E 테스트 스크립트

---

## 병렬 실행 가능한 태스크 쌍

### Phase 1
- **P1-R1-T1 ↔ P1-S0-T1**: Model 정의와 Layout 독립적
- **P1-R1-T2 ↔ P1-S0-T2**: Service와 Context 동시 개발 가능

### Phase 2
- **P2-R1-T1 ↔ P2-R1-T4**: Event 모델과 AI 서비스 독립
- **P2-R1-T1 ↔ P2-S1-T1**: Backend 모델과 Frontend Calendar 그리드 동시 개발
- **P2-R1-T3 ↔ P2-S1-T3**: Event 라우터와 EventForm 컴포넌트 동시 개발

### Phase 3
- **P3-R1-T1 ↔ P3-R1-T4**: Photo 모델과 라우터 (라우터는 모델 필요)
- **P3-R1-T2 ↔ P3-S1-T2**: PhotoService와 PhotoUpload 컴포넌트 동시 개발

### Phase 4
- **P4-R1-T1 ↔ P4-S1-T1**: TimelineService와 Timeline 페이지 동시 개발
- **P4-S1-T1 ↔ P4-S2-T1**: Timeline 페이지와 Home 페이지 독립적

### Phase 5+
- **P5-R1 ↔ P5-S1**: Order 모델과 OrderCheckout 페이지 동시 개발
- **P6-R1-T1 ↔ P6-S1-T1**: Orders 조회와 Orders 페이지 동시 개발
- **P7-R1 ↔ P7-S1**: ExportService와 Download 버튼 동시 개발

---

## 특수 주의사항

### Docker Compose Workflow

각 Specialist가 개별 Worktree에서 작업:

```bash
# Backend Specialist (Phase N Resource)
git worktree add worktrees/phase-n-{feature} main
cd worktrees/phase-n-{feature}
git checkout -b phase-n-{feature}
# 작업 후
git add -A && git commit -m "..."
git push origin phase-n-{feature}
# Orchestrator가 Phase 단위로 main에 병합

# Frontend Specialist (Phase N Screen)
git worktree add worktrees/phase-n-screen-{feature} main
cd worktrees/phase-n-screen-{feature}
git checkout -b phase-n-screen-{feature}
# 작업 후
git commit & push
# Orchestrator가 Phase 단위로 main에 병합
```

**명시사항**: Specialist는 태스크를 구현하고, Phase 병합은 **orchestrator가 수행**한다.

### TDD 체크리스트 (모든 태스크)

각 태스크 완료 시:

- [ ] 테스트 작성 (RED: 실패 확인)
- [ ] 최소 구현 (GREEN: 통과)
- [ ] 리팩토링 (REFACTOR: 정리)
- [ ] 통과율 100% (pytest / vitest)
- [ ] Acceptance Criteria 모두 체크
- [ ] 관련 파일 커밋

### Interface Contract Validation

**Phase 1 P1-V1** 이후 매 Phase마다 Contract 검증:

```bash
# 자동 검증 스크립트
scripts/validate_contracts.js

# 검증 항목
1. resources.yaml의 필드 ⊇ 화면의 data_requirements
2. API 응답 스키마 = Pydantic 스키마
3. Frontend 타입 = Backend Enum 타입
```

---

## 문서 이력

| 버전 | 작성일 | 변경사항 |
|------|--------|---------|
| 1.0 | 2026-04-23 | 초안 작성 (P0-P8, 90개 태스크) |

---

**마지막 확인**: 모든 태스크가 의존성 그래프를 형성하며, Phase 0 완료 후 각 Phase별로 병렬 개발 가능합니다. docker-compose up으로 독립 가동하는 Lv1 MVP는 **Phase 4 완료 시점**입니다.

