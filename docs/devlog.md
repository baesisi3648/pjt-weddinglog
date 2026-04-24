# 개발 로그 (WeddingLog Devlog)

> 바이브코딩 과정에서 발생한 **AI 도구 사용 실패·우회·성공 결정**을 상시 기록.
> 면접 서술형 문항 4("AI 도구 사용 중 겪은 실패 또는 문제") 답변의 원천 재료.

---

## 기록 포맷

```
### YYYY-MM-DD HH:MM — {제목}
- **도구**: Claude Code / Codex / ChatGPT / Copilot / 기타
- **문제**: 무엇이 안 되었는가 (구체적으로)
- **시도**: 어떻게 해결하려 했는가
- **해결**: 최종 방법 (또는 미해결)
- **배운 점**: 다음에 비슷한 상황에서 활용할 인사이트
```

---

## 기획 단계 (2026-04-23)

### 2026-04-23 12:40 — 기획서 중복 검증 vs 시간 트레이드오프
- **도구**: Claude Code (skill: `/forge`)
- **문제**: 기획서(세부 기획서 MD)가 이미 상세한데, `/socrates`를 한 번 더 돌릴지 결정. 시간 압박 vs 검증 누락 위험.
- **시도**: AskUserQuestion으로 "4개 빈 곳(경쟁분석/페르소나/비즈니스모델/엣지)" 차원으로 나눠 심층 검증 선택.
- **해결**: 집중 검증 + docs-specialist 서브에이전트에 9개 문서 일괄 생성 위임 (메인 컨텍스트 보호).
- **배운 점**: socrates 같은 긴 대화형 스킬은 기존 산출물이 있으면 "빈 곳 집중 검증"으로 전환하는 게 시간 효율적. 무조건 처음부터 다 돌리면 Day 1이 증발한다.

### 2026-04-23 14:50 — 디자인 핸드오프 포팅 태스크 누락 발견
- **도구**: Claude Code (skill: `/council`)
- **문제**: 디자인 에이전시의 핸드오프(Mockup v1/v2/v3 + 6개 JSX 컴포넌트)가 이미 완성돼 있었는데, tasks-generator가 생성한 `06-tasks.md`의 모든 S 태스크가 "RED → GREEN" scratch TDD로 새로 쓰는 구성이었음. D-6 마감에서 치명적 시간 낭비 리스크.
- **시도**: Council의 UX 리뷰어(Agent 서브에이전트)가 "P1.5 UI 스모크 포팅 Phase 신설" 제안. 반나절에 JSX 6개를 `frontend/src/pages/`로 복사하고 라우팅만 연결하면, 이후 S 태스크는 "상태/API 연동"에만 집중 가능.
- **해결**: `06-tasks.md` 개정으로 Phase 1.5 추가.
- **배운 점**: **AI가 만드는 태스크 로드맵은 입력 자료(기존 산출물)를 무시하고 "처음부터 모든 걸 새로" 짜는 경향이 있다**. Council 리뷰 없이 바로 빌드 시작했으면 첫 3일 동안 이미 있는 UI를 TDD로 재작성하고 있었을 것.

### 2026-04-23 14:55 — 경쟁 분석 사실관계 오류 (SNAPS 진입 시점)
- **도구**: Claude Code (docs-specialist)
- **문제**: `08-competitive-analysis.md`가 SNAPS 웨딩 시장 진입을 "2025년 2월"로 기재. 실제 유저가 제공한 맥락(WebSearch 결과 기반)은 "2026.02 공동 포토북 출시". 면접에서 사실관계 오류가 될 수 있는 치명타.
- **시도**: 빌드 전 Council 리뷰(Security+PM 관점)에서 발견 → 메인 세션에서 직접 수정.
- **해결**: 2026.02로 통일 + "공동 포토북" 기능 설명 추가 + 면접 답변 요지(스냅스의 '업로드 시점 고객' vs WeddingLog의 'D-180 고객') 삽입.
- **배운 점**: **서브에이전트가 생성하는 문서에 날짜·수치는 입력 없이 추정으로 채우는 경향이 있다**. 크리티컬한 사실관계는 메인에서 검증 필수. 특히 면접 재료가 되는 경쟁 분석은 WebSearch로 실제 데이터 확인.

---

## 빌드 단계

### 2026-04-23 16:30 — P0 완료: 보일러플레이트 병렬 위임
- **도구**: Claude Code (auto-orchestrate) + backend-specialist + frontend-specialist (병렬)
- **결과**: 40 파일, backend 13/13 pytest 통과, frontend 보일러플레이트 + 6 라우트 placeholder 완성
- **주요 결정**:
  - SQLAlchemy 2.0 동기 모드(SQLite 단일 파일 기준) — async 복잡도 회피
  - OpenAI 검증은 `models.list()` (토큰 소비 없이 네트워크·인증만 확인)
  - CORS는 `field_validator(mode="before")`로 쉼표 분리 파싱
  - Windows 호환성: `python-magic-bin; sys_platform == "win32"`, Linux는 apt `libmagic1`
  - Docker 멀티스테이지 + Frontend는 `serve`로 정적 서빙(프로덕션)
- **배운 점**: backend/frontend 병렬 위임 시 **enum 값 일치 검증**을 양쪽 모두에 박아두니 조정 비용 0. `specs/domain/resources.yaml`이 계약서 역할을 정확히 했다.

### 2026-04-23 17:10 — P1 완료: Couple 리소스 + 공통 레이아웃
- **도구**: backend-specialist + frontend-specialist (병렬)
- **결과**: Backend 47/47 테스트 통과 (기존 13 + Couple 34), Frontend 25/25 통과
- **백엔드 결정**:
  - Couple ID: `cpl_{secrets.token_urlsafe(8)}` (예측 불가 + 가독성)
  - `d_day` 는 Pydantic `@computed_field` — Response 직렬화 시 자동 포함
  - `seed_initial_data()` 멱등성 보장 (`db.query(Couple).count() > 0` 가드)
  - Lifespan 훅에 seed 자동 호출
- **프런트 결정**:
  - `CoupleContext` 마운트 시 `cpl_sample_001` 고정 조회 (과제 범위 단일 커플 가정)
  - `useDday(weddingDate)` 훅은 순수 계산 (hook 안에 state 없음 — useMemo 기반)
  - `Layout`은 `<Outlet />` 중첩 라우팅, Header sticky + backdrop-blur
- **이슈**: backend-specialist가 자체적으로 `worktree/phase-1-couple` 브랜치를 만들어 커밋함. auto-orchestrate 표준 워크플로우이지만 사용자 규칙(Phase 끝 main 커밋)과 달라, 메인에서 `git merge --squash`로 단일 커밋으로 통합.
- **배운 점**: 서브에이전트의 worktree 작업은 `merge --squash` + 메인에서 Phase 단위 커밋 구조가 "명시적 Phase 경계"와 궁합 잘 맞음. worktree 자체는 `.gitignore`로 제외.

### 2026-04-23 18:40 — P1.5 완료: UI 스모크 포팅 (Council 리뷰 반영 핵심)
- **도구**: frontend-specialist (메인 디렉토리 직접 작업, worktree 없이)
- **결과**: 6 페이지 1,614줄 포팅 + handoff.css 통합 2,829줄. 37/37 테스트 통과.
- **의의**: Council UX 리뷰어가 지적한 Blocker B4("핸드오프 JSX 6개 포팅 태스크 부재") 해결. 이 단계 없이 P2부터 바로 TDD로 갔으면 Phase 2-4 동안 "이미 있는 UI를 다시 쓰는" 낭비 발생했을 것.
- **포팅 전략**:
  - UMD `const { useState } = React;` → ES Module `import React, { useState } from 'react'`
  - `useStateV3`, `useStateC` 같은 suffix 변수명 → 일반 이름으로 정리
  - `postMessage` edit mode 로직 제거 (Claude Design UI 내 편집 모드는 프로덕션 불필요)
  - 페이지 간 이동 `<a href>` / `onClick` → `<Link to>` / `useNavigate()`
  - JSX 마크업·className·텍스트 전부 그대로 유지 (디자인 보존)
  - 3개 CSS 파일(styles/styles-v2/styles-v3) 병합 우선순위 v3>v2>v1
- **배운 점**: 디자인 핸드오프가 있을 때 **"포팅 Phase" 선행**이 TDD 대체재가 된다. 스모크 테스트는 "마운트 + 키워드 1개 존재"만으로 충분 (세부 인터랙션은 Phase 2-4에서 API 연동 시 추가). Relaxed TDD 정책이 정확히 들어맞음.

### 2026-04-23 20:30 — P2 완료: Event CRUD + AI 체크리스트 + Calendar API 연동
- **도구**: backend-specialist + frontend-specialist (병렬, 모두 메인 디렉토리)
- **결과**: Backend 101/101 테스트(54 신규), Frontend 76/76 테스트(39 신규)
- **백엔드 결정**:
  - Pydantic v2 `date` 필드명-타입 섀도잉 이슈 → `from datetime import date as _date` 앨리어싱으로 해결
  - 월 필터링 `calendar.monthrange()` 사용 (윤년 2028-02-29 정확 커버)
  - couple 소속 검증: `get_or_404`에서 `event.couple_id != couple_id`면 404 — 다른 커플 이벤트 격리 철저
  - AI 폴백: 15개 템플릿 (D-180 ~ D+14), 응답에 `source: "ai"|"template"` 투명성 필드
  - dry_run 모드: AI 체크리스트 미리보기(DB 저장 없이) 추가 — UX 개선
- **프런트 결정**:
  - **CategoryBadge에 이모지 추가** (Council M3 반영): 📷💄🏛️💍✉️🎭💒✈️📌 — 4색 공유 문제 아이콘으로 보완
  - ConfirmModal / Toast는 인라인 구현 (라이브러리 추가 없이)
  - Calendar 월간/리스트 탭 전환, AI 체크리스트 버튼 gold-500 accent
- **이슈**: handoff.css `@import` 순서 경고. 기능 영향 없으나 Phase 4 완료 시점에 정리 예정.
- **배운 점**: backend에서 enum 값과 응답 포맷을 **processed by AI vs fallback** 구분하는 필드를 둔 설계가, 프론트에서 투명성 배지로 바로 활용됨. Council 리뷰의 "AI/템플릿 투명성"이 **응답 스키마 → UI 배지**로 일관되게 흘러감.

### 2026-04-23 22:15 — P3 완료: Photo 업로드 + AI 캡션 + 보안 강화
- **도구**: backend-specialist + frontend-specialist (병렬, 메인 디렉토리)
- **결과**: Backend 167/167 (신규 66), Frontend 97/97 (신규 21)
- **Council 보안 Blocker 3건 모두 실구현 반영**:
  - B6 매직넘버 검증: `Pillow.Image.verify()` + Content-Type 교차검증. 비-이미지 바이트 → 400
  - B6 Path Traversal: `Path.resolve()` + `relative_to()` prefix 검증. `../..` 시도 → 400
  - B6 서버 UUID 재생성: `pho_{secrets.token_urlsafe(16)}`. 원본 파일명은 `original_filename` 컬럼에만 로깅
  - B7 래퍼 엔드포인트: `GET /api/photos/{id}/file` (StaticFiles mount 안 함, FileResponse)
- **설계 결정**:
  - Photo 선삽입 후 파일 저장 순서 → DB 발급 UUID를 경로에 사용 = Path Traversal 근본 차단
  - 두 router prefix 분리: 업로드/목록은 `/api/events/{event_id}/photos`, 단건은 `/api/photos/{id}` (프론트 사용 편의)
  - `file_url` computed field로 프론트 URL 계산 단순화
  - 폴백 캡션 9개 카테고리 모두 3개씩 완비 (심사자 환경 완전 대응)
- **프런트 결정**:
  - Toast를 Calendar에서 승격해 `src/components/Toast.jsx`로 공용화
  - CaptionSelector의 `source: "ai"` → coral badge "AI 생성" / `"template"` → gray badge "기본 템플릿" (M4 투명성)
  - PhotoUpload 네이티브 드래그앤드롭(react-dropzone 없이), 클라이언트측 + 서버측 2중 검증
- **이슈**: `python-multipart` 의존성이 requirements에 있었지만 설치 안 되어 있던 에이전트 환경에서 한 번 걸림. Docker 빌드 시점엔 문제없음.
- **배운 점**: **보안 AC를 "스펙 → 테스트 → 코드" 순으로 TDD하면 의도가 절대 새지 않는다**. `test_dotdot_event_id_rejected` 같은 테스트가 먼저 있으면 구현이 그걸 통과하게 되어 있어서 자동으로 옳은 코드가 나옴.

### 2026-04-23 23:40 — P4 완료: Lv1 MVP 완성 (Timeline + Home)
- **도구**: backend-specialist + frontend-specialist (병렬)
- **결과**: Backend 204/204 (+37), Frontend 137/137 (+40)
- **백엔드 결정**:
  - Timeline 챕터 그룹핑: 9 카테고리 → 5 챕터 (웨딩촬영/준비의 날들/본식/신혼여행/기타). 빈 챕터는 응답에서 제외 + chapter_number 재부여
  - `selectinload(Couple.events).selectinload(Event.photos)`로 단일 쿼리 — N+1 완벽 방지
  - `total_pages_estimated = ceil(selected / 2.5)` (4장당 1페이지 기본 + 타이틀 페이지 반영)
  - **Council B3 album_order_deadline 백엔드 완성**: 4 urgency 레벨(normal/warning/urgent/expired)을 API에서 분류해 프런트는 색상만 매핑
  - `today` 파라미터로 테스트 결정성 확보 (freezegun 없이도 깔끔)
- **프런트 결정**:
  - TimelineChapter: 큰 번호 "01." + Fraunces 챕터 제목 → **Council 차별화 평가의 "북 메타포" 반영**
  - optimistic UI: is_selected 체크박스 즉시 토글, API 실패 시 롤백
  - 인라인 캡션 편집: 더블클릭 → input, Enter/Escape 처리
  - CoupleProfileCard 2차 카운트다운: `data-urgency` 속성으로 CSS 테스트 용이
  - Home D+ 상태: "결혼 후 타임라인 정리를 마무리하세요" 메시지 (수동 UX)
- **서로 상이한 urgency 해석**: backend가 `D-21~D-14 warning / D-14 이하 urgent`로 구현, frontend는 API 응답을 그대로 사용 → 한 곳에서만 규칙 정의(서버가 source of truth). 프런트에서 재계산하지 않아 일관성 보장.
- **Lv1 MVP 시연 준비**: docker-compose up 시점에 10단계 E2E 플로우 모두 가능한 상태. 테스트 341개(backend 204 + frontend 137)가 통합적으로 증명.
- **배운 점**: **집계/derived 필드는 반드시 서버가 결정**해서 응답에 포함시켜야 프론트-백엔드 드리프트를 막는다. urgency 같은 "비즈니스 룰 + 날짜 계산"을 프런트에서 계산하면 반드시 차이가 생긴다.

### 2026-04-24 01:15 — TypeScript 마이그레이션 (전체 Frontend)
- **도구**: frontend-specialist
- **사용자 판단**: "회사 실서비스 전환 가능성을 고려하면 TS가 유리. 지금 전환"
- **결과**: `.jsx`/`.js` 43개 → `.tsx`/`.ts` 52개(types/ 폴더 추가분). `tsc --noEmit` 0 errors. 기존 137 테스트 유지.
- **진행**:
  - tsconfig.json (strict, target ES2022, jsx react-jsx) + tsconfig.node.json
  - `src/types/{couple,event,photo,ai,timeline,home,index}.ts` 중앙 타입 모음
  - 각 컴포넌트 Props 인터페이스 명시 (React.FC 대신 함수 시그니처 직접 타입)
  - services는 `api.get<Event[]>(...)` Generic 주입
  - CoupleContext는 `CoupleContextValue` 인터페이스로 계약화
- **이슈**: frontend-specialist가 `.jsx` 원본을 삭제하지 않고 `.tsx`를 추가만 해서 테스트가 274개(기존 137×2)로 중복 실행됨. 메인 세션에서 `find -delete`로 중복 제거 후 52 TS 파일만 남김.
- **배운 점**: 마이그레이션 위임 시 "원본 파일 제거까지 AC에 포함"을 명시 필요. 한 단계 위에서 "add + remove"를 명시해야 모호성 제거. 또한 `find src \( -name '*.jsx' -o -name '*.js' \) -delete`가 안전 + 빠름.
- **04-tech-stack.md 업데이트**: 프론트엔드 언어 섹션 신설, TS 선택 이유 3가지(실서비스 전환/타입=계약/Props 계약)와 트레이드오프 문서화. 면접 "왜 TS?" 답변 바로 준비됨.

### 2026-04-24 11:00 — TS 마이그레이션 잔여 이슈: index.html 참조 오류
- **도구**: Claude Code (메인)
- **문제**: Docker 빌드 중 Vite가 `[vite]: Rollup failed to resolve import "/src/main.jsx" from "/app/index.html"` 에러로 실패. vite build 단계에서 컨테이너 빌드 중단.
- **원인**: frontend-specialist가 `main.jsx` → `main.tsx`로 파일은 바꿨지만 **`index.html`의 `<script type="module" src="/src/main.jsx">` 참조는 업데이트하지 않음**. `.jsx` 원본을 삭제한 이후부터 생긴 잠복 버그. 로컬 `npm run dev`는 Vite dev 서버가 자동 확장자 해석으로 넘어갔을 수 있지만, **프로덕션 `vite build` + Rollup은 엄격해서 에러 발생**.
- **포트 충돌 상황도 겹침**: 사용자 환경에서 PID 24980(개인 포트폴리오 서버)이 3000 점유 중. `.env`의 `WEB_PORT=3100` 변경으로 우회. **과제 평가 포인트 "포트 변경 가능"이 실전에서 정확히 필요한 상황 시연**.
- **해결**: `frontend/index.html`의 `main.jsx` → `main.tsx` 교체 (1줄).
- **배운 점**: TS 마이그레이션에서 **파일 확장자 변경은 소스만 아니라 참조 체인 전체**(index.html, vite.config 진입점, 테스트 import 경로 등)를 훑어야 한다. 위임 AC에 "`grep -r '\.jsx' src/ index.html` 0건 확인"을 명시했으면 예방 가능했을 것. Rollup이 Vite dev보다 엄격한 덕분에 프로덕션 빌드 시점에서 잡힘 — 안전망 역할.

### 2026-04-24 11:30 — Backend CORS_ORIGINS 파싱 실패 + CSS @import 순서 경고
- **도구**: Claude Code (메인)
- **문제 1 (치명)**: Docker 빌드는 성공했으나 backend 컨테이너 기동 시 `pydantic_settings.SettingsError: error parsing value for field "CORS_ORIGINS"` + `json.JSONDecodeError: Expecting value`로 크래시. 의존하는 frontend도 `depends_on: backend healthy`라 함께 기동 실패.
- **원인**: `pydantic-settings` **2.14.0**(Docker 빌드 시점 최신) 버전에서 `list[str]` 타입 필드에 대해 **env source가 JSON 배열 파싱을 강제**. `field_validator(mode="before")`보다 먼저 호출되어 쉼표 분리 문자열(`http://localhost:3100,...`)이 JSON 파싱으로 즉시 실패.
  - 로컬 pytest 환경에서는 `.env`가 없고 default_factory의 list가 바로 주입되어 통과 → Docker 환경에서만 노출되는 이슈.
- **해결**: `CORS_ORIGINS` 필드를 `str`로 변경, `cors_origins_list` property에서 JSON/CSV 양쪽 파싱. `main.py`에서 `allow_origins=settings.cors_origins_list`.
- **문제 2 (경고)**: Vite build `[vite:css] @import must precede all other statements (besides @charset or empty @layer)`. `globals.css`에서 `@tailwind` 뒤에 `@import './handoff.css'`가 위치.
- **해결**: `@import`를 최상단으로 이동. 빌드는 원래도 통과했지만 CSS 스펙 준수 + 프로덕션 번들 안정성.
- **배운 점**: **로컬 테스트 ≠ 프로덕션 빌드 환경**. SQLAlchemy 2.0.49, Pydantic 2.13, pydantic-settings 2.14 등 Docker가 자동 최신 설치. `requirements.txt`에 `>=` pinning만 있으면 빌드 시점의 최신 버전 거동을 커버 불가. **제출 직전에 빌드 시점 버전 pinning 권고** (`==` or `~=`로 메이저 버전 고정). 하지만 과제 범위에서는 이번 픽스로 충분.

### 2026-04-24 12:30 — 첫 시연 UX 이슈 3종 + 보안 경고
- **도구**: Claude Code (메인) + frontend-specialist
- **배경**: 사용자가 첫 docker-compose 시연 성공 후 Home 스크린샷 공유. 3가지 UX 문제 지적.
- **문제 1 (헤더/네비 중복)**: Layout의 `<Header>`와 핸드오프 원본 페이지 내부의 `wl-statusbar` "9:41" iOS 상태바 + `wl-topbar` 앱바 + `wl-tabbar` 하단 네비가 이중으로 렌더링. 모바일 폰 프레임 mockup이 그대로 포팅된 잔재.
- **문제 2 ("D-?")**: CORS_ORIGINS가 3000/5173만 허용인데 사용자가 WEB_PORT를 3100으로 변경해 접속 → 브라우저 CORS policy block → Home의 **하드코딩 폴백 블록**("D-?") 실행. API 자체는 정상(`curl`로 d_day: -185 확인).
- **문제 3 (온보딩 부재)**: 첫 방문 시 커플 정보 수정/입력 UI 없음. 과제 "더미 시딩" 요건과 실서비스 UX 사이 결정 필요.
- **해결**:
  - A: 6개 페이지에서 wl-statusbar/wl-topbar/wl-tabbar 제거 (-138줄, Home/Calendar/Timeline/Orders)
  - B: Home.tsx의 "D-?" 하드코딩 폴백 → "커플 정보를 불러올 수 없습니다 / 백엔드 API 상태를 확인해주세요" 명확한 에러 UI
  - C: **하이브리드 결정** — 더미 시딩 유지(심사자 편의) + CoupleProfileEditModal 신설(285줄) + Home에 "편집" 버튼 → PUT /api/couples/{id} 연동. 심사자는 바로 데이터 보고, 사용자는 언제든 자기 이름/결혼일로 수정.
  - CORS: `.env`의 CORS_ORIGINS를 `http://localhost:3100`으로 사용자가 직접 수정
- **🚨 보안 사고**: 사용자가 `.env` 파일 내용을 채팅으로 공유하면서 **실제 OpenAI API 키 전체가 노출**됨(`sk-proj-...`). 사용자에게 즉시 Revoke 권고. `.gitignore`로 커밋은 막혔지만 채팅 기록에는 평문 남음.
- **배운 점 1**: **포트 변경과 CORS 일관성은 인프라 계약**. `.env.example`에 "WEB_PORT 변경 시 CORS_ORIGINS도 같은 포트로 맞추세요" 주석은 있었으나, **CORS_ORIGINS 기본값 자체에 모든 상용 포트(3000/3100/5173) 포함**하거나, **main.py에서 `*` 와일드카드 옵션**을 개발 모드에서 허용하는 식으로 더 관대한 기본값 필요.
- **배운 점 2**: **폴백 UI에 하드코딩 더미 절대 금지**. "D-?" 표시는 디버깅을 방해한다 — 사용자는 "API는 되는데 왜 D-?만 안 뜨지?"로 혼란. 폴백은 **항상 원인을 알 수 있는 에러 메시지**로.
- **배운 점 3 (보안)**: 사용자가 env 파일 내용을 공유하기 전에 **"키 부분은 가려서"** 안내했어야 한다. 앞으로 "환경변수 확인" 같은 요청 시 `head -n 5 .env` 또는 `grep -v API_KEY` 식으로 키 제외하고 공유 유도.
- **모바일 프레임 제거의 추가 통찰**: 디자인 핸드오프가 1440px 목업 안에 "모바일 폰 프레임"을 그려놓았을 경우(wl-phone 래퍼), **포팅 단계에서 "래퍼만 unwrap" 태스크**가 필요. P1.5 스모크 포팅 시에는 이걸 놓쳐서 지금 와서 드러남.

### 2026-04-24 13:00 — 프로덕션 빌드의 API baseURL 문제
- **도구**: Claude Code (메인)
- **문제**: 두 번째 시연에서 헤더 중복·"9:41" 이슈는 해결됐으나, **"커플 정보를 불러올 수 없습니다"** 에러 UI가 계속 표시. 백엔드 컨테이너는 Healthy, `curl http://localhost:8100/api/couples/cpl_sample_001`는 JSON 정상 응답 + `d_day: -184`. 그런데 프론트만 실패.
- **진단**: `curl http://localhost:3100/api/couples/cpl_sample_001` 했더니 **`<!DOCTYPE html>` 반환**. 즉 브라우저가 **자기 포트(3100)에게 `/api` 요청을 보냈고, `serve -s dist` SPA fallback이 index.html을 반환**해서 Axios가 JSON 파싱 실패.
- **원인**: `api.ts`의 `baseURL: '/api'` (상대 경로). 개발 모드에선 Vite `server.proxy`가 `/api` → `http://localhost:8000`으로 전달해주지만, **프로덕션 빌드(`serve -s dist`)에는 proxy 없음**. 정적 파일 서버는 `/api/*`를 모르니까 SPA fallback으로 index.html만 준다.
- **해결**: 빌드 시점에 `VITE_API_URL`을 절대 URL로 주입해 브라우저가 백엔드 포트를 직접 호출.
  1. `frontend/src/services/api.ts`: `baseURL = import.meta.env.VITE_API_URL || '/api'`
  2. `frontend/Dockerfile`: `ARG VITE_API_URL=/api` + `ENV VITE_API_URL=$VITE_API_URL` (ENV 필수 — Vite가 빌드 시 읽으려면)
  3. `docker-compose.yml`: `frontend.build.args.VITE_API_URL: http://localhost:${API_PORT:-8000}/api`
  - dev는 여전히 `/api` 상대 경로로 Vite proxy 사용 (기존 동작 유지)
  - prod는 docker가 `.env`의 API_PORT를 읽어 자동 치환 → 심사자가 포트 바꿔도 자동 매칭
- **배운 점 1**: **Vite `server.proxy`는 dev 전용**. 프로덕션 빌드는 HTML+JS+CSS 정적 파일만 남음. `serve -s`는 SPA 라우팅 fallback이라 **모든 unknown path → index.html**. 이건 React Router에는 필수지만 API 호출에는 함정.
- **배운 점 2**: `VITE_*` 환경변수는 **빌드 시점**에 인라인됨. 런타임 변경 불가. Docker 재빌드 필요. 반면 backend의 `OPENAI_API_KEY` 등은 런타임 환경변수라 컨테이너 재시작만으로 반영. **프런트/백엔드 환경변수 타이밍 차이 숙지 필요**.
- **배운 점 3**: 프로덕션에서 `/api` 상대 호출을 계속 쓰려면 **nginx reverse proxy**(frontend 컨테이너를 nginx로) 또는 **backend가 frontend dist 서빙**(FastAPI StaticFiles) 구조가 필요. 이번에는 단순성 위해 브라우저 직접 호출 선택 + CORS로 조율.
- **P8 제출 준비 시 반영**: README의 "실행 방법"에 "포트 바꾸려면 `.env`의 `WEB_PORT`, `API_PORT` + `CORS_ORIGINS` 3개를 맞춰주세요" 안내 필요. 이번 사건이 정확히 그 시나리오.

### 2026-04-24 13:30 — 풍부한 더미 스토리 + 캘린더 비주얼 업그레이드
- **도구**: Claude Code (메인) + backend-specialist + frontend-specialist (병렬)
- **배경**: 사용자가 Apple App Store "Shared Calendar" 앱 레퍼런스 공유. 날짜 셀에 사진 썸네일이 직접 박히는 비주얼 우선 캘린더. 그리고 "더미 이미지 너가 찾아줄 수 있어? 드라마 연예인 커플? 내 사진은 이상할까?" 질문.
- **더미 이미지 저작권·프라이버시 판단**:
  - 본인 사진 ❌ — GitHub Public 영구 기록, 면접관 관점 이상함, 프라이버시 리스크
  - 드라마/연예인 ❌ — 초상권·저작권 침해 (법적 리스크)
  - **Unsplash/LoremFlickr 익명 스톡 이미지 ✅** — CC0 라이센스, 상업 이용 자유, 익명 모델
- **외부 의존 회피**: 과제 안내문 "외부 의존 없이 독립 동작" 원칙에 맞게 **repo에 직접 번들** (`backend/seed_assets/photos/`). 심사자가 오프라인이어도 사진 표시.
- **Unsplash Source API는 deprecation 확인** (HTML 에러 반환). **LoremFlickr로 전환** (`https://loremflickr.com/800/600/wedding`) — 키워드 기반 + 리다이렉트 추적 + 실제 JPEG 반환.
- **18장 다운로드**: 카테고리별 키워드(`wedding,venue` / `bridal,dress` / `wedding,couple` / `honeymoon,beach` / ...) 18장. 총 1.4MB.
- **Backend 시딩 (backend-specialist)**:
  - `seed.py`에 `SEED_EVENTS` 상수 추가 — 15개 이벤트 (D-180부터 D+14까지 스토리 라인)
  - 각 이벤트에 1-3장 사진 + 사전 캡션 (총 18장, 18 캡션 — 모두 `caption_source="template"`)
  - 파일 저장 규칙 `file_storage.safe_save_photo`와 100% 일치: `photos/{event_id}/{photo_id}.{ext}`
  - 멱등성 3단계: 커플 / 이벤트 / 물리 파일 각각 가드
  - `is_completed = (offset_days <= 0)` — D-day 이전은 완료 처리 (진행도 UX)
  - `backend/.dockerignore` 에 `seed_assets/` 포함 가드 추가
- **Frontend 캘린더 비주얼 (frontend-specialist)**:
  - Calendar.tsx 월간 뷰 셀 렌더링 교체
  - `Promise.all(events.map(e => listEventPhotos(e.id)))` 일괄 fetch (N+1이지만 15개 이벤트 규모에선 수용 가능)
  - 사진 있는 이벤트 → `wl-cal-photo-thumb` 44px 썸네일 + "+N" 배지 + 클릭 시 `/events/:id`
  - 사진 없는 이벤트 → 카테고리 컬러 라벨만
  - 빈 셀 클릭 → EventForm 모달 (기존 동작 유지, `stopPropagation`으로 썸네일 클릭과 분리)
  - 모바일 반응형 (390px 이하: 32px 썸네일)
- **배운 점 1**: **스톡 이미지 서비스는 수명이 있다**. Unsplash Source가 조용히 deprecation된 걸 curl 한 번으로 발견. 시연용 외부 서비스는 실패 시나리오 포함해서 번들 전략이 안전.
- **배운 점 2**: **시드 데이터에 "스토리"가 있으면 기획 의도가 바로 전달**. 15개 이벤트가 D-180 "예식장 투어" → D-day "본식" → D+14 "앨범 주문"으로 이어지면, 심사자가 아무 설명 없이도 "아 이 앱은 이런 흐름이구나" 체득. 시드는 샘플이 아니라 데모 내러티브.
- **배운 점 3**: **레퍼런스 이미지는 UX 결정의 지름길**. 사용자가 "Shared Calendar" 스크린샷 하나 공유한 덕분에, "월간 뷰에 썸네일 어떻게 배치할지"를 긴 설명 없이 즉시 공유. 기획 문서보다 한 장의 적절한 스크린샷.

---

## 문항 4 답변 초안 (제출 직전 작성)

> 이 섹션은 Phase 8에서 위 기록들을 종합하여 **서술형 문항 4**("AI 도구 사용 중 겪은 실패 또는 문제") 답변 초안으로 정리한다.

<!-- 빌드 완료 후 작성 -->

---

*파일 생성일: 2026-04-23*  
*관리 정책: Phase별 주요 결정·실패·우회 발생 시 즉시 추가 (상시 갱신 태스크 `P-CONT-T1`)*
