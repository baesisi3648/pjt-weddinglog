# 04 — Technology Stack Decisions

> 기술 선택의 의사결정 근거 (면접 대비)

---

## 개요

WeddingLog는 **면접관이 납득할 수 있는 기술 선택**을 우선으로 설계했습니다. 모든 선택에 "왜?"가 있습니다.

---

## 전체 스택 요약

| 영역 | 기술 | 버전 | 선택 이유 |
|------|------|------|---------|
| **백엔드** | FastAPI | 0.104+ | Python 자산, 빠른 API 개발, 자동 Swagger 문서 |
| **프론트엔드** | React + **TypeScript** | 18+ / 5.5+ | 컴포넌트 재사용성 + 타입 안전성(실서비스 전환 대비), 팀 협업 용이 |
| **빌드 도구** | Vite | 5+ | 초저속 핫 리로드, TSX 기본 지원, 최소 설정 |
| **스타일링** | Tailwind CSS | 3+ | 유틸리티 기반 빠른 스타일링, 디자인 토큰 일관성 |
| **상태관리** | Context API | - | Lv1 규모에서 충분, 의존성 최소화 |
| **데이터베이스** | SQLite | 3.40+ | 배포 간편, 외부 서버 불필요, 과제 규모 최적 |
| **파일 저장** | 로컬 파일시스템 | - | Docker 볼륨으로 관리, 외부 의존 제거 |
| **컨테이너화** | Docker Compose | 2.20+ | 과제 필수 요구사항, 재현성 보장 |
| **AI** | OpenAI API | GPT-4o-mini | 비용 효율성, 폴백 전략 보유 |

---

## 프론트엔드 언어: TypeScript (v5.5)

### 선택 이유 (P1.5 이후 전환)

**핵심 1: 실서비스 전환 가능성**
- 과제가 회사 실서비스로 이어질 수 있다는 판단 하에, 유지보수 수명이 길어질 것을 대비.
- 스위트북은 포토북 인쇄 **API 회사** → 주문 데이터(`Order`, `Chapter`) 계약 정합성이 비즈니스 핵심. 런타임 에러를 컴파일 타임으로 당기는 가치가 크다.

**핵심 2: 타입이 곧 계약**
- `specs/domain/resources.yaml`의 리소스 정의를 `src/types/*.ts`로 1:1 미러링.
- Pydantic 응답 스키마 ↔ TS 인터페이스 일치로 Backend-Frontend 드리프트 원천 차단.
- 예: `DeadlineUrgency = 'normal' | 'warning' | 'urgent' | 'expired'` 리터럴 유니온으로 4 urgency 규칙을 타입 수준에서 강제.

**핵심 3: Props 계약**
- 각 컴포넌트의 Props를 인터페이스로 명시 → 리팩토링 시 변경 영향도 IDE가 즉시 드러냄.
- Gemini/Claude Code 같은 AI 도구의 코드 생성 정확도도 올라감 (타입이 컨텍스트 보강).

### 트레이드오프

| 선택 | vs | 거절 이유 |
|------|----|---------:|
| **TypeScript 5.5** | 순수 JavaScript | 현재 20+ 컴포넌트·7 API 클라이언트 유지보수 시 타입 없는 상태는 회귀 위험 ↑, 채용 과제에서도 “왜 JS만?” 답변 약함 |
| **TypeScript** | Flow | 생태계 축소, React 공식 예제·라이브러리 모두 TS 기본 |
| **strict: true** | strict: false | any 남용 차단, 빈 옵션(strictNullChecks 등) 세분 제어보다 일괄 strict로 일관성 확보 |

### 마이그레이션 노트

- P0~P1.5 동안은 JSX로 빠르게 UI 확정 → P2 진입 전에 TSX로 일괄 이식.
- 모든 .jsx/.js → .tsx/.ts 확장자 변환 + `tsconfig.json` strict 설정.
- `src/types/` 폴더에 도메인 타입 중앙 집중 (couple, event, photo, ai, timeline, home).
- 137개 테스트 모두 TSX로 이식 후 `tsc --noEmit` 0 errors.

---

## 백엔드: FastAPI

### 선택 이유

**핵심 1: 개발 생산성**
- 보일러플레이트 최소화 (Express보다 간결)
- 자동 API 문서 생성 (Swagger UI, ReDoc)
- Pydantic 기반 타입 검증으로 런타임 에러 감소

**핵심 2: 성능**
- 비동기 처리(async/await) 기본 지원
- 동시 다중 요청 처리 능력
- 가벼운 메모리 사용량

**핵심 3: 포트폴리오 일관성**
- Virtual Lab 프로젝트(학습용)에서 이미 검증 완료
- 면접관이 "왜 FastAPI인지" 묻을 때 실제 경험 근거 제시 가능

**핵심 4: 필요충분함**
- 결제, 실시간 기능 없음 → Django 오버킬 아님
- 마이크로서비스 아님 → Spring Boot 필요 없음
- 빠른 API 개발에 최적화

### 트레이드오프

| 선택 | vs | 거절 이유 |
|------|----|---------:|
| **FastAPI** | Flask | Flask는 자동 문서화 없어서 API 테스트 시 Postman 필수 → 심사자 편의성 ↓ |
| **FastAPI** | Django | Django는 과제 규모(7일)에 비해 학습곡선 높음, ORM 복잡도 ↑ |
| **FastAPI** | Express.js | Express는 타입 검증이 약해서 런타임 에러 위험 ↑ |

---

## 데이터베이스: SQLite

### 선택 이유

**핵심 1: 배포 간편성**
- 별도 서버 설치 불필요
- docker-compose에서 이미지 하나만 관리하면 됨
- 심사자 환경에서 즉시 실행 가능

**핵심 2: 개발 속도**
- SQL 학습곡선 최소 (모든 관계형 DB 동일)
- 세팅 시간: 5분 (MySQL/PostgreSQL은 30분+)
- 더미 데이터 생성 및 마이그레이션 간단

**핵심 3: 과제 규모 적합**
- 동시 사용자: 1명 (심사자)
- 데이터 규모: 커플 1쌍, 일정 50개, 사진 200개
- 트랜잭션 요구사항: 단순 (ACID는 필수)

**핵심 4: 재현성**
- 파일 기반이라 Docker 볼륨에 그대로 저장 가능
- 데이터 손실 공포 없음 (파일을 그대로 저장하고 컨테이너 폐기 가능)

### 트레이드오프

| 선택 | vs | 거절 이유 |
|------|----|---------:|
| **SQLite** | PostgreSQL | PostgreSQL은 높은 동시성·복잡한 쿼리 최적화 필요 → 과제 규모 오버킬 |
| **SQLite** | MySQL | MySQL 설정 복잡도 ↑, Docker 이미지 관리 ↑ |
| **SQLite** | MongoDB | 관계형 스키마 필요 (커플-이벤트-사진), Document DB 불필요 |

### SQLite의 한계와 대책

| 한계 | 대책 |
|------|------|
| 대용량 동시 쓰기 약함 | 과제에선 쓰기 1명, 읽기만 고려 |
| 풀텍스트 검색 미흡 | 일정 검색 미구현 (Lv1 스코프 아님) |
| 복잡한 조인 성능 저하 | 쿼리 최소화, 필요시 캐시 적용 |

---

## 프론트엔드: React + Vite + Tailwind CSS

### React 선택 이유

**핵심 1: 포트폴리오 강점**
- 국내 웹 개발 표준 스택
- 면접관도 잘 알고 있어서 질문 용이
- "왜 Vue나 Svelte가 아닌가?"에 명확한 답변 가능

**핵심 2: 컴포넌트 재사용성**
- 캘린더, 모달, 사진 그리드 등 재사용 컴포넌트 많음
- Props Drilling 최소화 (Context API로 충분)
- 7일 개발 기간 내 완성 가능

**핵심 3: 생태계**
- 라우터: React Router (표준)
- 상태관리: Context API (번들 크기 작음)
- HTTP: Axios/Fetch (선택 자유)
- UI 라이브러리: 필요 시 헤드리스 컴포넌트만 사용

**핵심 4: 디버깅**
- React DevTools (크롬 확장) 우수
- 심사자도 콘솔에서 상태 추적 가능

### Vite 선택 이유

**vs Create React App (CRA)**:
| 항목 | Vite | CRA |
|------|------|-----|
| 초기 스탠드업 시간 | 30초 | 5분 |
| HMR (핫 모듈 리로드) | <100ms | 2~3초 |
| 빌드 시간 | 1초 | 30초 |
| 번들 크기 | 더 작음 | 중간 |

7일 개발 기간에서 **빠른 피드백 루프가 생산성 향상에 직결**됩니다.

### Tailwind CSS 선택 이유

**핵심 1: 스타일링 속도**
- 클래스명만으로 스타일링 완성
- 커스텀 CSS 거의 불필요
- 디자인 일관성 자동 보장

**핵심 2: 디자인 토큰 통합**
- WeddingLog의 파스텔 컬러 시스템(Coral, Lavender, Mint, Gold)을 Tailwind 설정에 정의
- 모든 개발자(또는 AI)가 `text-coral-500`, `bg-lavender-100` 같이 일관되게 사용

**핵심 3: 모바일 우선**
- Responsive 클래스 (`md:`, `lg:`) 기본 지원
- 캘린더, 타임라인 반응형 처리 간단

### CSS 전략

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#FFF5F2',
          100: '#FFE6DD',
          200: '#FFCCBB',
          500: '#FF9966',  // Primary
          600: '#FF7744',
        },
        lavender: {
          50: '#F9F5FF',
          100: '#F0E6FF',
          500: '#D4AAFF',  // Secondary
        },
        mint: {
          50: '#F0FFF7',
          500: '#66FFCC',  // Tertiary
        },
        gold: {
          500: '#FFD700',  // Accent
        },
      },
    },
  },
};
```

---

## 상태관리: Context API

### 선택 이유

**필요한 전역 상태**:
- 현재 커플 정보 (groom, bride, wedding_date)
- 현재 달력 월 (navigation)
- 사용자 UI 설정 (언어, 테마 - 선택)

**Redux/Zustand가 오버킬인 이유**:
- 상태 개수: ~5개 (Redux는 20+ 상태일 때 빛남)
- 비동기 로직: Fetch API (Redux Thunk/Redux Saga 불필요)
- 번들 크기: Context API로 충분

**구현 예**:
```javascript
// CoupleContext.js
const CoupleContext = createContext();

export function CoupleProvider({ children }) {
  const [couple, setCouple] = useState(null);

  useEffect(() => {
    // GET /api/couples/{couple_id}
    fetch('/api/couples/couple_001')
      .then(r => r.json())
      .then(setCouple);
  }, []);

  return (
    <CoupleContext.Provider value={{ couple, setCouple }}>
      {children}
    </CoupleContext.Provider>
  );
}
```

**제약**: 상태 변경 시 Context 내 모든 구독자가 리렌더링 → 성능 최적화 필요 시 `useMemo` 활용

---

## 파일 저장: 로컬 파일시스템

### 선택 이유

**핵심 1: 외부 의존 제거**
- AWS S3, Google Cloud Storage 없음
- API 키 관리 최소화
- 배포 복잡도 낮음

**핵심 2: Docker 볼륨 관리**
- Host 머신의 `/data` 디렉터리를 Container의 `/app/data`에 마운트
- 사진 저장 경로: `/app/data/uploads/photos/{event_id}/{photo_id}.jpg`
- 컨테이너 폐기해도 데이터 유지

**구조**:
```
data/
├── weddinglog.db          # SQLite 데이터베이스
├── uploads/
│   └── photos/
│       ├── evt_001/
│       │   ├── photo_001.jpg
│       │   ├── photo_002.jpg
│       │   └── ...
│       └── evt_002/
│           └── ...
└── exports/               # ZIP 파일 저장 위치
    └── ord_20261025_001.zip
```

### 트레이드오프

| 선택 | vs | 거절 이유 |
|------|----|---------:|
| **로컬 파일시스템** | S3 | S3 비용+복잡도, 과제 규모에 불필요 |
| **Docker 볼륨** | 컨테이너 내장 | 컨테이너 폐기 시 데이터 손실 |

---

## AI: OpenAI API (GPT-4o-mini)

### 모델 선택 이유

**GPT-4o-mini를 선택한 이유**:

| 지표 | 4o-mini | 4o | 3.5-turbo |
|------|---------|-----|----------|
| 비용/1K tokens | $0.15 (입력) | $2.50 | $0.50 |
| 응답 속도 | 빠름 | 표준 | 표준 |
| 컨텍스트 길이 | 128K | 128K | 4K |
| 텍스트 생성 품질 | 충분 | 최상 | 보통 |

**선택 근거**:
1. **비용 효율**: 과제 기간 7일, OpenAI API 비용 예산 한정 → 4o-mini로 10배 저렴
2. **품질 충분**: 웨딩 체크리스트, 캡션 생성 task는 4o-mini로 충분
3. **속도**: 사용자 응답 시간(1~3초) 내에 완료 가능

### 사용 시나리오

#### 1. 웨딩 체크리스트 생성

**프롬프트 비용**: 입력 ~500 tokens, 출력 ~300 tokens = $0.12/호출

**호출 빈도**: 심사자가 "체크리스트 생성" 버튼 1회 → 비용 $0.12

#### 2. 캡션 생성

**프롬프트 비용**: 입력 ~200 tokens, 출력 ~100 tokens = $0.05/호출

**호출 빈도**: 사진당 1회 → 50장 기준 $2.50

#### 총 예산**: ~$5 (심사자 환경에서)

### 폴백 전략

**OpenAI API 키 없을 경우** (또는 에러):

```python
# backend/app/services/ai_service.py

def generate_checklist(wedding_date: date) -> List[Event]:
    try:
        # OpenAI API 호출
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[...]
        )
        return parse_checklist(response)
    except Exception as e:
        # 폴백: 사전정의 템플릿
        logger.warning(f"OpenAI API failed: {e}, using template")
        return PREDEFINED_CHECKLIST

PREDEFINED_CHECKLIST = [
    {"date": ..., "d_day": -180, "title": "예식장 투어 시작", ...},
    {"date": ..., "d_day": -150, "title": "스드메 업체 미팅", ...},
    # ... 15개 항목
]
```

**이점**: 심사자가 OpenAI 키 없어도 **전체 UX를 확인할 수 있음** (과제 요구사항)

---

## Docker Compose

### 구성

```yaml
# docker-compose.yml
version: '3.9'

services:
  backend:
    build: ./backend
    ports:
      - "${API_PORT:-8000}:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
      - DATABASE_URL=sqlite:///app/data/weddinglog.db
    volumes:
      - ./data:/app/data
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000

  frontend:
    build: ./frontend
    ports:
      - "${WEB_PORT:-3000}:3000"
    environment:
      - VITE_API_URL=http://localhost:${API_PORT:-8000}
    depends_on:
      - backend
```

### 의도

1. **일문일답 실행**: `docker-compose up`으로 백엔드+프론트엔드 동시 기동
2. **환경변수 주입**: `OPENAI_API_KEY` 없어도 실행 (폴백으로 동작)
3. **포트 유연성**: `API_PORT=9000 docker-compose up`으로 포트 변경 가능 (심사자 환경 충돌 회피)
4. **데이터 영속성**: `./data` 볼륨으로 데이터 손실 방지

---

## 기술 스택 선택 FAQ (면접 대비)

### Q1: 왜 FastAPI인가? (Node.js/Express가 아니라)

**답변 템플릿**:
> FastAPI는 Python 자산과 자동 문서화(Swagger)가 강점입니다. 이전 Virtual Lab 프로젝트에서 검증했고, Pydantic 기반 타입 검증으로 런타임 에러를 줄일 수 있습니다. Express는 Node.js 커뮤니티가 크지만, 타입 검증이 약해서 과제 규모에서는 FastAPI가 더 적합합니다.

### Q2: 왜 SQLite인가? (PostgreSQL이 아니라)

**답변 템플릿**:
> 배포 간편성 때문입니다. Docker Compose에서 이미지 하나만 관리하고, 심사자 환경에서 즉시 실행 가능합니다. PostgreSQL은 높은 동시성을 지원하지만, 이 과제는 심사자 1명이 사용하기 때문에 SQLite로 충분합니다.

### Q3: 왜 Tailwind CSS인가? (Bootstrap/Material UI가 아니라)

**답변 템플릿**:
> 개발 속도 때문입니다. 유틸리티 클래스만으로 스타일링이 완성되어, 7일 개발 기간에 UI 구현 시간을 절약할 수 있습니다. 또한 디자인 토큰(파스텔 컬러 시스템)을 Tailwind 설정에 통합해서 모든 개발자가 일관되게 사용할 수 있습니다.

### Q4: AI 모델은 어떻게 선택했는가?

**답변 템플릿**:
> GPT-4o-mini를 선택했습니다. 비용이 4o의 1/10이고 웨딩 체크리스트·캡션 생성 task는 4o-mini로 충분합니다. 만약 OpenAI API 키가 없으면 사전정의 템플릿으로 폴백해서 전체 UX를 확인할 수 있도록 설계했습니다.

### Q5: 왜 Context API인가? (Redux가 아니라)

**답변 템플릿**:
> 전역 상태가 5개 정도로 적기 때문입니다. Redux는 미들웨어, 액션, 리듀서 등 보일러플레이트가 많아서, 7일 개발에는 오버킬입니다. Context API로 충분하고, 필요하면 useMemo로 성능 최적화할 수 있습니다.

---

## 성능 목표

| 지표 | 목표 | 달성 방법 |
|------|------|---------|
| API 응답 시간 | <500ms | 인덱싱, N+1 쿼리 방지 |
| 페이지 로드 시간 | <2초 | Vite 번들 최적화, 이미지 lazyload |
| 캘린더 렌더링 | <200ms | 가상 스크롤, 메모이제이션 |
| AI 응답 시간 | <3초 | 폴백 전략, 프롬프트 최적화 |

---

*문서 작성일: 2026-04-23*  
*버전: 1.0*  
*상태: 확정*
