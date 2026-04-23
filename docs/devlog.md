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

---

## 문항 4 답변 초안 (제출 직전 작성)

> 이 섹션은 Phase 8에서 위 기록들을 종합하여 **서술형 문항 4**("AI 도구 사용 중 겪은 실패 또는 문제") 답변 초안으로 정리한다.

<!-- 빌드 완료 후 작성 -->

---

*파일 생성일: 2026-04-23*  
*관리 정책: Phase별 주요 결정·실패·우회 발생 시 즉시 추가 (상시 갱신 태스크 `P-CONT-T1`)*
