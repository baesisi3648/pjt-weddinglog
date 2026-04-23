# Council 리뷰 리포트 — WeddingLog 빌드 전 종합 검토

> **실행 모드**: 단일세션 (Agent 3명 병렬)
> **리뷰 일시**: 2026-04-23
> **리뷰 대상**: `docs/planning/01-09.md` + `specs/**/*.yaml` + `06-tasks.md` + 디자인 핸드오프
> **결과 요약**: 세 리뷰어 모두 **6.5/10 수렴**. 기획 품질은 과제 수준 상회, 단 **빌드 전 보강 필수**.

---

## 참여자

| 이름 | 역할 | 유형 | 점수 |
|-----|------|------|------|
| CTO | 기술 아키텍처 | Agent 서브에이전트 | 6.5/10 |
| UX | 사용자 경험·디자인 | Agent 서브에이전트 | 6.5/10 |
| Security + PM | 보안·과제 요구사항·면접 대응 | Agent 서브에이전트 | 6.5/10 |

---

## 합의 사항 (세 리뷰어 전원 동의)

1. **기획·명세·태스크 문서 품질은 신입 과제 기준을 넘어섬.** PRD → 리소스 계약 → 화면 명세 → Phase 매핑의 체인이 끊기지 않고 정렬됨.
2. **AI 폴백 전략이 1급 시민으로 설계된 점**은 합격점. 심사자 키 없음 시나리오 커버.
3. **현 상태로 빌드 시작하면 위험**. 빌드 전 계약·보안·UX·일정 4군데를 손봐야 함.

## 미합의 쟁점

- **TDD 유지 vs 완화**: CTO는 "외부 경계만 TDD, 내부 유틸은 후행 허용" 제안. 과제 평가에 TDD가 필수 아님을 고려하면 현실적.
- **핸드오프 포팅 전략**: UX는 "P1.5 UI 스모크 포팅 Phase 신설"(JSX → React 그대로 옮김)을 강력 권고. CTO도 "TDD 90태스크 불가능" 관점에서 동일 방향.

---

## 🚨 Blocker 종합 (빌드 전 반드시 수정)

### B1. TDD × 90태스크 × D-6 = 산술 불가능 (CTO)
- **근거**: 태스크당 평균 40분 × 90개 = 60시간+. 신입 1인 실가용 40-50시간.
- **조치**: TDD 완화 + 태스크 50개로 감량. V 태스크 8개 → 5개(P0/P2/P4/P6/P8만).

### B2. `orders.total_price` 계약 누락 (CTO)
- **근거**: `06_orders.yaml:15`와 `05_order_checkout.yaml:26`이 요구하지만 `resources.yaml:90-118`에 필드 없음.
- **조치**: `resources.yaml`에 `orders.derived: [total_price, total_pages_estimated]` 추가.

### B3. 페르소나 C 타이밍 UX 전면 누락 (UX)
- **근거**: C의 1순위 구매 결정 요인이 "결혼식+14일 내 수령"인데 Home/OrderCheckout 어디에도 배송 SLA·주문 데드라인 없음. `CoupleProfileCard`는 D-day만 표시.
- **조치**:
  - `CoupleProfileCard`에 2차 카운트다운: "앨범 주문 추천: D-21"
  - `OrderCheckout Step 4`에 "예상 배송일: 결혼식 D+14" 명시
  - `C-8` 스토리의 "3명 수령인"과 현 `step_3_shipping_info`(단일 수령인) 충돌 해결

### B4. 디자인 핸드오프 6개 JSX 포팅 태스크 부재 (UX)
- **근거**: Mockup v1/v2/v3의 Home/Calendar/EventDetail/Timeline/OrderCheckout/Orders.jsx가 완성돼 있는데, 모든 S 태스크는 `RED → GREEN` scratch로 새로 쓰는 구성. D-6 내 비현실.
- **조치**: `P1.5` "UI 스모크 포팅" Phase 신설 — 반나절에 JSX 6개를 `frontend/src/pages/`로 복사 + 더미 데이터 인라인 + 라우팅. 이후 S 태스크는 "상태/API 연동"에만 집중.

### B5. `.env` 유출 + `.dockerignore` 명시 없음 (Security)
- **근거**: `05-architecture.md:454` `volumes: ./backend:/app` + `./data:/app/data`에서 루트 `.env` 전체 마운트 위험. `P0-T4` AC에 `.dockerignore`만 언급, `.env` 명시 없음.
- **조치**: `P0-T4` AC에 "`.dockerignore`에 `.env`, `data/**`, `*.db`, `__pycache__/`, `node_modules/` 명시" 필수.

### B6. 파일 업로드 매직넘버 검증·Path Traversal 방어 없음 (Security)
- **근거**: `05-architecture.md:633-649` content_type만 체크(위조 가능). 저장 경로가 PathParam의 `event_id`를 그대로 사용 → `../` 공격 가능.
- **조치**: `P3-R1-T3` AC에 "python-magic 또는 Pillow로 실제 바이트 헤더 검증 + UUID로 파일명 재생성 + `pathlib.Path.resolve()`로 `/app/data/uploads/` prefix 확인" 추가.

### B7. `/uploads` 정적 파일 서빙 인증 없음 (CTO + Security 중복)
- **근거**: `P3-R1-T4`가 `StaticFiles mount /uploads`로 멀티 커플 환경에서 전 사진 탐색 가능. 면접에서 "멀티 커플일 때는?" 질문 직격탄.
- **조치**: `photos.id`를 `secrets.token_urlsafe(16)`로 unguessable UUID 강제 + `/api/photos/{id}/file` 래퍼 엔드포인트 선호(시간 되면). 단일 커플 더미 환경에서도 **UUID 생성 방식 명시**는 필수.

---

## ⚠️ Major 이슈 (빌드 중 반영)

### M1. `photos.couple_id` 필터 JOIN N+1 위험 (CTO)
- photos 테이블엔 event_id FK만. couple_id 필터는 JOIN 필요.
- **조치**: `P4-R1-T3` 집계 서비스에서 `joinedload(Event.photos)` 사용 + 별도 엔드포인트 `GET /api/couples/{id}/photos?filter=recent` 스펙 명시.

### M2. Docker `--reload` + bind-mount + SQLite 같은 볼륨 (CTO + Security)
- 심사자 환경(Windows/Mac)에서 파일 워처 루프 위험. 업로드 진행 중 재시작으로 데이터 손실 가능.
- **조치**: `docker-compose.yml`을 **심사자용(prod)** 로 단순화: `--reload` 제거, `./backend:/app` bind-mount 제거. `docker-compose.dev.yml`은 override로 분리(개발자용). `P8-T4`에 추가.

### M3. 카테고리 9개 vs 색 4계열 — 색만으로 식별 불가 (UX)
- lavender 4공유, mint 3공유. WCAG 위반(색만으로 정보 전달).
- **조치**: `design-tokens.yaml`의 `category_color_mapping`에 `icon` 필드 추가. CalendarGrid 셀에 `color_dot + icon` 조합 의무.

### M4. AI 캡션 폴백 투명성 부재 (UX)
- `03_event_detail` 명세에 "AI 생성 vs 템플릿" 구분 UI 없음. 페르소나 B/D의 감성 신뢰도 직격.
- **조치**: API 응답에 `source: "ai" | "template"` 필드 추가. `CaptionSelector`에 조건부 배지 렌더링.

### M5. 반응형 태스크가 REFACTOR 단계로만 (UX)
- 심사자가 모바일로 볼 가능성 높음. 핸드오프는 1440px 데스크톱 기준.
- **조치**: `P8-T4`에 "모바일 사파리/크롬 스크린샷 5장" 체크리스트 추가.

### M6. 주문 상태 역전 enforce 단위테스트 부재 (Security)
- E2E에만 있고 서비스 레이어 단위테스트 분리 안 됨. Lv2 "비즈니스 로직" 평가 핵심인데 약함.
- **조치**: `backend/tests/services/test_order_state_machine.py` 추가 — 5개 시나리오(정방향 2 + 역방향 2 + 동일상태 1).

### M7. CORS 설정 태스크 부재 (Security)
- `06-tasks.md:190`에 문구만 있음. 브라우저 `:3000 → :8000` 호출 시 CORS 필요.
- **조치**: `P0-T2` AC에 "CORSMiddleware 등록, `CORS_ORIGINS` 환경변수 분리" 명시.

---

## ⚙️ Minor 이슈 (여유 있을 때)

- **m1. Alembic 부재** — 과제 규모엔 불필요하지만 면접 질문 대비 "프로덕션은 Alembic 도입" 답변 준비.
- **m2. `OPENAI_API_KEY` 폴백 정책 일관성** — "실패 시" vs "미설정 시" 모호. 시작 시 1회 체크 후 플래그 고정 권고.
- **m3. SNAPS 진입 시점 사실관계** — `08-competitive-analysis.md:13` **"2025년 2월"** 표기됨. 유저 맥락은 "2026.02". **통일 필수** (면접 사실관계 오류 방지).
- **m4. `docs/devlog.md` 부재** — 면접 문항 4 "AI 도구 사용 중 실패" 답변 근거 0. **상시 갱신 태스크 `P-CONT-T1` 신설 권고**.
- **m5. README 6섹션 1:1 매핑 부재** — `P8-T2` 9항목 나열만 있음. 과제 안내문 원문 6섹션과 정확히 매칭되도록 재정렬.
- **m6. ZIP 익스포트 스트리밍 미고려** — 50장 × 5MB = 250MB 동기 빌드 시 메모리 폭발 가능. `fastapi.responses.StreamingResponse` 권고.
- **m7. `captions.json` 키가 파일명** — UUID 키로 변경하고 value에 filename 포함 권고.

---

## 🎯 면접 대응력 평가

| 문항 | 점수 | 보강 필요 |
|---|---|---|
| 1. 서비스 기획 의도 | 7/10 | SNAPS 시점 수정 후, "스냅스 2026.02 공동포토북 출시" 선제 언급 |
| 2. 바이브코딩 수행 과정 | 5/10 | **실제 프롬프트 예시 3개 README 인용** |
| 3. 가장 중요한 판단 | 7/10 | "Lv3 기획 완성" 방어논리(파트너 API 호환 설계) 추가 |
| 4. AI 도구 사용 실패 | **3/10** | **`docs/devlog.md` 상시 갱신 즉시 시작** |

---

## 💡 Top 7 즉시 실행 액션 (우선순위)

| # | 액션 | 소요 | 담당 Phase |
|---|---|---|---|
| 1 | `resources.yaml`에 `orders.derived` 추가, `ai_services` 위치 이동 | 20분 | 빌드 전 |
| 2 | `.dockerignore`/`.gitignore` 재귀 패턴 명시 (`P0-T4` 강화) | 10분 | 빌드 전 |
| 3 | `P1.5 UI 스모크 포팅` Phase 신설 (핸드오프 JSX 6개 복사) | 30분 | 빌드 전 |
| 4 | `TASKS.md`에 TDD 완화 정책 명문화 + V 태스크 5개로 감량 | 30분 | 빌드 전 |
| 5 | `08-competitive-analysis.md` SNAPS 시점 2026.02로 통일 | 5분 | 빌드 전 |
| 6 | `docs/devlog.md` + `P-CONT-T1` 상시 갱신 태스크 신설 | 10분 | 빌드 전 |
| 7 | Docker compose `--reload` 제거 + bind-mount 정리 (`P0-T4` 개정) | 15분 | 빌드 전 |

**총 소요**: 약 2시간. 빌드 시작 전 완료 권장.

---

## 📋 빌드 중 반영할 UX 보강 (Phase 2-5에서)

- Home `CoupleProfileCard`에 "앨범 주문 추천: D-21" 2차 카운트다운 (Phase 4)
- `OrderCheckout Step 4`에 "예상 배송일" 라인 추가 (Phase 5)
- `CategoryBadge`에 icon + color 조합 (Phase 2)
- `CaptionSelector`에 AI/템플릿 구분 배지 (Phase 3)
- API 응답 `source: "ai" | "template"` 필드 추가 (Phase 2-3 AI 라우터)

---

## 📎 제출 직전 체크리스트 (Phase 8 강화)

- [ ] 클린 머신(또는 VM)에서 `git clone → cp .env.example .env → docker-compose up` 검증
- [ ] `git log --all --diff-filter=A --name-only | grep -E '\.env$|\.db$'` 0건
- [ ] `grep -rE 'sk-[a-zA-Z0-9]{20,}' .` 0건
- [ ] README에 스크린샷 5장 (Home/Calendar/EventDetail/Timeline/Orders+ZIP 다운)
- [ ] `docs/devlog.md`를 README에서 링크 (문항 4 증거)
- [ ] `docs/partner-contract.md` 추가 (order.json ↔ 가상 스위트북 API 필드 매핑 — Lv3 면접 증거)
- [ ] 주문 상태머신 단위테스트 5개 커밋 (Lv2 면접 증거)

---

*리포트 작성일: 2026-04-23*
*다음 단계: 사용자 의사결정 → 빌드 시작 전 수정사항 적용 → `/auto-orchestrate` 또는 직접 빌드*
