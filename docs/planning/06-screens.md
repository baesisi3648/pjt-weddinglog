# 06 — Screen Inventory & Design Specifications

> 6개 화면 목록, 디자인 토큰, 컴포넌트 상세

---

## 디자인 핸드오프 참조

**저장소**: `reference/WeddingLog-handoff/weddinglog/`

**포함 자료**:
- 6개 화면의 HTML/CSS/JSX 목업
- 디자인 시스템 (Fraunces + Pretendard, 파스텔 컬러)
- 3가지 버전의 Mockup (v1, v2, v3)

**활용 방법**:
1. 디자인 토큰(컬러, 폰트)은 Tailwind CSS와 React에 통합
2. JSX 컴포넌트는 목업을 기반으로 마운트 및 이벤트 로직 추가
3. 반응형 디자인은 Tailwind의 `md:`, `lg:` 브레이크포인트 활용

---

## 디자인 토큰 (Design System)

### 타이포그래피

| 용도 | 폰트명 | 가중치 | 크기 | 행높이 |
|------|--------|--------|------|--------|
| **로고/제목** | Fraunces | 700 | 28~32px | 1.2 |
| **섹션 제목** | Fraunces | 600 | 20~24px | 1.3 |
| **본문** | Pretendard | 400 | 14~16px | 1.5 |
| **라벨/버튼** | Pretendard | 500 | 12~14px | 1.4 |
| **작은 텍스트** | Pretendard | 400 | 12px | 1.4 |

**폰트 로드**:
```html
<!-- index.html -->
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Pretendard:wght@400;500;700&display=swap" rel="stylesheet">
```

### 컬러 팔레트 (Warm Pastel System)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#FFF5F2',     // 배경
          100: '#FFE6DD',    // 선택
          200: '#FFCCBB',    // 호버
          300: '#FFB3AA',
          400: '#FF9988',
          500: '#FF7766',    // Primary (웨딩촬영)
          600: '#FF6644',
          700: '#FF5533',
        },
        lavender: {
          50: '#F9F5FF',     // 배경
          100: '#F0E6FF',    // 선택
          200: '#E6CCFF',    // 호버
          300: '#DDBBFF',
          400: '#D4AAFF',
          500: '#CC99FF',    // Secondary (스드메, 준비)
          600: '#BB88FF',
        },
        mint: {
          50: '#F0FFF9',     // 배경
          100: '#D9FFEF',    // 선택
          200: '#CCFFE6',    // 호버
          300: '#99FFDD',
          400: '#66FFCC',
          500: '#33FFBB',    // Tertiary (본식, 신혼여행)
          600: '#00FFAA',
        },
        gold: {
          50: '#FFFEF0',     // 배경
          100: '#FFFCD1',    // 선택
          200: '#FFFFB3',    // 호버
          300: '#FFFD99',
          400: '#FFFC80',
          500: '#FFD700',    // Accent (호출)
          600: '#FFC700',
        },
      },
    },
  },
};
```

**카테고리별 컬러 매핑**:

| 카테고리 | 색상 | 용도 |
|---------|------|------|
| WEDDING_PHOTO | Coral (500) | 웨딩촬영 일정, 챕터 |
| STUDIO_DRESS_MAKEUP | Lavender (500) | 스드메 일정 |
| VENUE | Lavender (500) | 예식장 일정 |
| GIFT | Lavender (500) | 예물·예단 일정 |
| INVITATION | Lavender (500) | 청첩장 일정 |
| CEREMONY | Mint (500) | 본식 일정 |
| HONEYMOON | Mint (500) | 신혼여행 일정 |
| ETC | Gray (400) | 기타 |
| CTA 버튼 | Gold (500) | "앨범 주문하기" 등 |

### 간격 시스템 (Spacing)

```css
/* Tailwind 기본값 사용 */
/* 4px = 1 unit */
p-2 = 8px
p-4 = 16px
p-6 = 24px
p-8 = 32px
gap-4 = 16px
```

### 모서리 반지름 (Border Radius)

| 용도 | 값 |
|------|-----|
| 버튼 | 8px (rounded-lg) |
| 카드 | 12px (rounded-xl) |
| 입력 필드 | 8px (rounded-lg) |
| 모달 | 16px (rounded-2xl) |

### 그림자 (Shadows)

| 수준 | CSS |
|-----|-----|
| 낮음 (lifted) | shadow-sm (0 1px 2px rgba...) |
| 중간 (card) | shadow-md (0 4px 6px rgba...) |
| 높음 (modal) | shadow-lg (0 10px 15px rgba...) |

---

## 6개 화면 상세

### 1. Home (홈 페이지)

**목적**: 결혼 준비 상황 한눈에 보기, 다음 단계 안내

**URL**: `/`

**주요 컴포넌트**:

```jsx
<Home>
  ├─ CoupleProfileCard
  │  ├─ 프로필 사진 (또는 기본 이미지)
  │  ├─ "신랑 ♥ 신부" 텍스트 (Fraunces Bold)
  │  └─ D-day 카운트다운 (크고 임팩트 있음)
  │
  ├─ UpcomingTasksWidget
  │  ├─ "이번 주 할 일" 제목
  │  ├─ 다음 3개 일정 리스트
  │  └─ 각 일정 카테고리별 아이콘 색상
  │
  ├─ RecentPhotosWidget
  │  ├─ "최근 등록 사진" 제목
  │  ├─ 최근 6장 썸네일 그리드 (3x2)
  │  └─ "사진 보기" 링크
  │
  └─ CTAButtons
     ├─ "캘린더로 이동" (Primary)
     └─ "앨범 주문하기" (Gold Accent) - 선택된 사진이 5개+ 이상일 때만 활성화
```

**데이터 요구사항**:
- `GET /api/couples/{couple_id}` → 프로필, D-day 계산
- `GET /api/couples/{couple_id}/events?limit=3` → 다음 3개 일정
- `GET /api/couples/{couple_id}/photos?limit=6&sort=recent` → 최근 사진 6개

**디자인 특성**:
- 여유로운 공간 활용 (padding 큼)
- 주요 수치(D-day)는 매우 크게 (40~48px)
- 카드 기반 레이아웃 (shadow-md)
- 모바일: 단일 열, 데스크톱: 2열 레이아웃

---

### 2. Calendar (캘린더 & 일정 관리)

**목적**: 결혼 준비 일정을 월간 캘린더와 리스트로 보기, 일정 CRUD

**URL**: `/calendar`

**주요 컴포넌트**:

```jsx
<Calendar>
  ├─ CalendarHeader
  │  ├─ "< 월 >" 네비게이션 (이전/다음)
  │  ├─ 현재 월 표시 (예: 2026년 4월)
  │  └─ "오늘" 버튼
  │
  ├─ CalendarGrid (월간 뷰)
  │  ├─ 일~토 헤더
  │  ├─ 42개 셀 (6주 × 7일)
  │  ├─ 각 셀:
  │  │  ├─ 날짜 번호 (오른쪽 위 모서리)
  │  │  ├─ 그 날의 모든 일정 (최대 3개, 색상 점으로 표시)
  │  │  └─ 일정 개수 (예: "+2")
  │  └─ D-day는 특별한 배경색 (coral-100)
  │
  ├─ EventListView (리스트 뷰, 토글 버튼)
  │  ├─ "월간" / "리스트" 탭
  │  ├─ 리스트 뷰일 때:
  │  │  ├─ 월별 헤더
  │  │  ├─ 각 일정 카드:
  │  │  │  ├─ 카테고리 아이콘 (컬러)
  │  │  │  ├─ 일정 제목
  │  │  │  ├─ 날짜와 시간 (있으면)
  │  │  │  ├─ 사진 개수 배지
  │  │  │  ├─ 완료 체크박스
  │  │  │  └─ 편집/삭제 버튼
  │  │  └─ 스크롤 가능
  │
  ├─ EventModal
  │  ├─ "일정 추가" 버튼 (상단 우측, Gold)
  │  └─ 클릭 시 EventForm 모달 표시
  │
  └─ CategoryFilter (선택)
     └─ 카테고리별 필터링 (예: 웨딩촬영만 보기)
```

**데이터 요구사항**:
- `GET /api/couples/{couple_id}/events?month=2026-04` → 월별 일정 목록
- `POST /api/couples/{couple_id}/events` → 일정 생성
- `PUT /api/couples/{couple_id}/events/{event_id}` → 일정 수정
- `DELETE /api/couples/{couple_id}/events/{event_id}` → 일정 삭제

**디자인 특성**:
- 월간 캘린더는 전체 너비 활용
- 각 셀은 최소 60px × 80px (터치 친화적)
- 모바일에서는 일정 개수만 표시 (클릭 시 상세)
- 리스트 뷰는 카드 스택 (gap-3)

---

### 3. EventDetail (일정 상세 & 사진 업로드)

**목적**: 특정 일정의 메모, 사진, AI 캡션 관리

**URL**: `/events/{event_id}`

**주요 컴포넌트**:

```jsx
<EventDetail>
  ├─ EventHeader
  │  ├─ 뒤로 가기 버튼
  │  ├─ 일정 제목 (Fraunces, 큼)
  │  ├─ 날짜 (2026.08.15)
  │  ├─ 카테고리 배지 (컬러)
  │  └─ 편집/삭제 버튼
  │
  ├─ EventForm
  │  ├─ 제목 입력 필드
  │  ├─ 날짜 선택기
  │  ├─ 카테고리 드롭다운
  │  └─ 메모 텍스트에어리어
  │
  ├─ PhotoUploadZone
  │  ├─ 드래그 앤 드롭 영역 (대형, dashed border)
  │  │  ├─ 클라우드 아이콘
  │  │  ├─ "사진을 여기로 드래그하세요" 텍스트
  │  │  └─ "또는 클릭하여 선택" 하이퍼링크
  │  ├─ 숨김 파일 입력 (accept="image/*")
  │  └─ 업로드 진행도 바 (업로드 중일 때)
  │
  ├─ PhotoGrid (업로드된 사진)
  │  ├─ 썸네일 그리드 (3열, responsive)
  │  ├─ 각 사진 카드:
  │  │  ├─ 썸네일 이미지
  │  │  ├─ 사진 위에 호버 시 삭제 버튼 (X)
  │  │  └─ 아래에 "AI 캡션" 버튼
  │  └─ 총 사진 개수 표시 (예: "5/10")
  │
  ├─ CaptionSelector (각 사진마다)
  │  ├─ 사진 아래 캡션 입력 필드
  │  ├─ "AI 캡션 추천" 버튼 (Lavender)
  │  └─ 추천 시:
  │     ├─ 3개 옵션 표시 (라디오 버튼)
  │     ├─ 직접 입력도 가능
  │     └─ "적용" 버튼
  │
  └─ ActionButtons
     ├─ "저장" 버튼 (Primary, Coral)
     └─ "취소" 버튼 (Secondary, Gray)
```

**데이터 요구사항**:
- `GET /api/couples/{couple_id}/events/{event_id}` → 일정 상세
- `PUT /api/couples/{couple_id}/events/{event_id}` → 일정 수정
- `POST /api/events/{event_id}/photos` → 사진 업로드
- `DELETE /api/photos/{photo_id}` → 사진 삭제
- `POST /api/ai/caption` → 캡션 생성
- `PUT /api/photos/{photo_id}/caption` → 캡션 저장

**디자인 특성**:
- 세로 스크롤 (길이 있는 폼)
- 드래그 앤 드롭 영역은 시각적으로 강조 (점선, 큰 텍스트)
- 사진 그리드는 responsive (모바일: 2열, 태블릿: 3열, 데스크톱: 4열)
- 로딩 상태: 스피너 표시

---

### 4. Timeline (타임라인 & 앨범 미리보기)

**목적**: 카테고리별 챕터로 정렬된 사진들을 "책의 미리보기"처럼 보기

**URL**: `/timeline`

**주요 컴포넌트**:

```jsx
<Timeline>
  ├─ TimelineHeader
  │  ├─ "타임라인" 제목 (Fraunces)
  │  ├─ "총 XX장의 추억" 요약
  │  ├─ 예상 페이지 수 (예: "18페이지 예상")
  │  └─ 챕터 순서 변경 안내 (선택)
  │
  ├─ ChapterList (스크롤 가능)
  │  ├─ Chapter 1: "웨딩촬영" (Coral)
  │  │  ├─ 챕터 제목과 사진 개수 배지
  │  │  ├─ 사진 그리드 (2~3열)
  │  │  ├─ 각 사진 카드:
  │  │  │  ├─ 썸네일
  │  │  │  ├─ 아래 캡션 (1~2줄)
  │  │  │  └─ 체크박스 (is_selected 토글)
  │  │  └─ "챕터 삭제" 버튼 (선택)
  │  │
  │  ├─ Chapter 2: "준비의 날들" (Lavender)
  │  │  └─ (동일 구조)
  │  │
  │  ├─ Chapter 3: "그 날 — 본식" (Mint)
  │  │  └─ (동일 구조)
  │  │
  │  └─ Chapter 4: "첫 여행 — 신혼여행" (Mint)
  │     └─ (동일 구조)
  │
  ├─ ChapterDragHandle (선택)
  │  └─ 각 챕터 상단에 드래그 핸들 아이콘
  │
  └─ CTAButtons
     ├─ "수정하기" 버튼 (Secondary)
     └─ "앨범으로 만들기" 버튼 (Gold, 크고 강조)
```

**데이터 요구사항**:
- `GET /api/couples/{couple_id}/timeline` → 챕터 정렬된 사진 목록
- `PATCH /api/photos/{photo_id}/is_selected` → 사진 선택 상태 변경
- `PUT /api/photos/{photo_id}/caption` → 캡션 수정 (인라인)

**디자인 특성**:
- 세로 스크롤 (매우 길 수 있음)
- 챕터별 구분선 (border-b)
- 사진 그리드는 각 챕터마다 동일 스타일
- 체크박스 토글 시 사진 opacity 변경 (선택 안 된 것은 50% 불투명)
- 모바일: 1열, 데스크톱: 2~3열

---

### 5. OrderCheckout (주문 4단계)

**목적**: 타임라인에서 사진을 선택하고 앨범으로 주문

**URL**: `/order-checkout`

**주요 컴포넌트**:

```jsx
<OrderCheckout>
  ├─ OrderStepper (4단계 진행도)
  │  ├─ Step 1: "앨범 확인" (완료 또는 현재)
  │  ├─ Step 2: "옵션 선택" (완료 또는 현재)
  │  ├─ Step 3: "배송 정보" (완료 또는 현재)
  │  └─ Step 4: "주문 완료" (완료 또는 현재)
  │
  ├─ Step 1: AlbumConfirmation
  │  ├─ "앨범 구성 확인"
  │  ├─ 선택된 사진 수와 예상 페이지 수
  │  ├─ 포함 챕터 목록 (각각 토글 가능)
  │  └─ "다음" 버튼
  │
  ├─ Step 2: OptionSelection
  │  ├─ "판형 선택"
  │  │  ├─ 라디오 버튼: 정사각형 (21x21cm)
  │  │  └─ 라디오 버튼: A4 (21x29.7cm)
  │  ├─ "표지 선택"
  │  │  ├─ 라디오 버튼: 하드커버
  │  │  └─ 라디오 버튼: 소프트커버
  │  ├─ "수량 선택"
  │  │  └─ 스피너 또는 드롭다운 (1~10권)
  │  ├─ 가격 요약
  │  │  ├─ "1권 기본가: \\180,000"
  │  │  ├─ "표지 추가: +\\20,000"
  │  │  └─ "총 가격: \\600,000" (3권)
  │  └─ "다음" 버튼
  │
  ├─ Step 3: ShippingInfo
  │  ├─ "배송 정보 입력"
  │  ├─ 수령인 이름 입력
  │  ├─ 연락처 입력 (휴대폰 포맷 검증)
  │  ├─ 주소 입력 (또는 주소 검색 API - 선택)
  │  └─ "다음" 버튼
  │
  ├─ Step 4: OrderComplete
  │  ├─ 체크마크 아이콘 (큼)
  │  ├─ "주문이 완료되었습니다!"
  │  ├─ 주문 ID 표시 (복사 버튼)
  │  ├─ 주문 요약 (판형, 표지, 수량, 가격)
  │  ├─ "주문 관리 페이지로" 버튼 (Primary)
  │  └─ "홈으로 돌아가기" 버튼 (Secondary)
  │
  └─ NavigationButtons
     ├─ "이전" 버튼 (Step 2 이상에서만)
     ├─ "다음" 또는 "주문하기" 버튼
     └─ "취소" 버튼 (언제든 가능, 확인 모달)
```

**데이터 요구사항**:
- `POST /api/couples/{couple_id}/orders` → 주문 생성
- 모든 데이터는 프론트엔드 상태에서 Step 간 유지 (또는 LocalStorage)

**디자인 특성**:
- 수평 Stepper (모바일에서는 세로)
- 각 Step은 전체 너비 폼
- 가격은 실시간 계산 (수량 변경 시 즉시 업데이트)
- 주문 완료 후 진행도 바는 100% (녹색)
- 확인 모달 (취소 시)

---

### 6. Orders (주문 관리)

**목적**: 생성된 모든 주문 조회, 상태 관리, 데이터 익스포트

**URL**: `/orders`

**주요 컴포넌트**:

```jsx
<Orders>
  ├─ OrdersHeader
  │  ├─ "주문 관리" 제목
  │  ├─ 전체 주문 개수 (예: "2개의 주문")
  │  └─ 필터링 탭 (전체, pending, processing, completed) - 선택
  │
  ├─ OrdersList
  │  └─ OrderCard (각 주문마다, 카드 스택)
  │     ├─ 주문 ID (복사 버튼)
  │     ├─ 주문 날짜
  │     ├─ 상태 배지 (pending: 회색, processing: 파랑, completed: 초록)
  │     ├─ 요약 정보
  │     │  ├─ 판형/표지/수량 (예: "정사각형 하드커버 3권")
  │     │  ├─ 선택 사진 수 (예: "45장 선택")
  │     │  └─ 예상 페이지 수
  │     ├─ 수령인 정보 (한 줄)
  │     ├─ 총 가격 (크고 강조)
  │     ├─ 상태 변경 버튼 (시뮬레이션용)
  │     │  └─ pending일 때: "processing으로 변경" 버튼
  │     │  └─ processing일 때: "completed로 변경" 버튼
  │     │  └─ completed일 때: 버튼 비활성화
  │     ├─ "상세 보기" 링크
  │     └─ "데이터 다운로드" 버튼 (Lv3, 초록색)
  │
  └─ 주문이 없을 때
     ├─ 빈 상태 아이콘 (선물 상자)
     ├─ "아직 주문이 없습니다"
     └─ "앨범을 만들어보세요" 링크 (Timeline으로)
```

**상세 뷰**:

```jsx
<OrderDetail>
  ├─ OrderHeader
  │  ├─ 뒤로 가기
  │  ├─ 주문 ID와 날짜
  │  ├─ 현재 상태 (크고 강조)
  │  └─ 편집/삭제 버튼 (pending 상태에서만)
  │
  ├─ OrderInfo
  │  ├─ "주문 정보"
  │  ├─ 판형, 표지, 수량
  │  └─ 가격 요약
  │
  ├─ ChapterPreview
  │  ├─ "앨범 구성"
  │  ├─ 각 챕터별 사진 개수
  │  └─ 예상 페이지 수
  │
  ├─ RecipientInfo
  │  ├─ "수령인 정보"
  │  ├─ 이름, 연락처, 주소
  │  └─ 편집 버튼 (pending 상태에서만)
  │
  ├─ StatusTimeline (선택)
  │  ├─ pending → processing → completed
  │  ├─ 각 단계별 시간 표시
  │  └─ 현재 상태를 강조
  │
  └─ ExportButton (Lv3)
     └─ "데이터 다운로드" (ZIP)
        └─ 클릭 시 다운로드 시작
```

**데이터 요구사항**:
- `GET /api/couples/{couple_id}/orders` → 주문 목록
- `GET /api/orders/{order_id}` → 주문 상세
- `PATCH /api/orders/{order_id}/status` → 상태 변경
- `GET /api/orders/{order_id}/export` → ZIP 다운로드 (Lv3)

**디자인 특성**:
- 카드 레이아웃 (gap-4)
- 상태별 색상 구분 (pending: gray, processing: blue, completed: green)
- 모바일: 전체 너비 카드, 데스크톱: 2열 그리드 (선택)
- ZIP 다운로드: 브라우저 기본 다운로드 사용

---

## 반응형 디자인 (Responsive)

### 브레이크포인트

| 기기 | 너비 | Tailwind | 사용 사례 |
|------|------|---------|---------|
| 모바일 | <640px | (기본) | 스마트폰 |
| 스몰 태블릿 | 640px | sm: | iPad Mini |
| 태블릿 | 768px | md: | iPad |
| 데스크톱 | 1024px | lg: | 노트북 |
| 와이드 | 1280px | xl: | 데스크톱 모니터 |

### 레이아웃 예시

```jsx
// 모바일: 1열, 태블릿: 2열, 데스크톱: 3열
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {photos.map(photo => <PhotoCard key={photo.id} photo={photo} />)}
</div>

// 모바일: 스택, 데스크톱: 나란히
<div className="flex flex-col lg:flex-row gap-6">
  <aside className="w-full lg:w-64">{/* Sidebar */}</aside>
  <main className="flex-1">{/* Content */}</main>
</div>
```

---

## 접근성 (Accessibility)

### 색상 대비

- 텍스트와 배경의 명도 비율 ≥ 4.5:1 (WCAG AA)
- 버튼: Coral 텍스트 + 흰 배경 (충분한 대비)

### 포커스 상태

```css
/* 키보드 네비게이션 */
button:focus {
  outline: 2px solid #FF7766 (Coral);
  outline-offset: 2px;
}

input:focus {
  border: 2px solid #FF7766;
  box-shadow: 0 0 0 3px rgba(255, 119, 102, 0.1);
}
```

### 아리아 레이블 (ARIA)

```jsx
<button aria-label="사진 삭제">
  <TrashIcon />
</button>

<form aria-label="일정 추가">
  <input aria-label="일정 제목" />
</form>
```

---

## 로딩 & 에러 상태

### 로딩 상태

```jsx
<Spinner size="lg" className="text-coral-500" />
<p className="text-gray-500">데이터를 불러오는 중...</p>
```

### 에러 상태

```jsx
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
  <p className="text-red-700 font-medium">오류가 발생했습니다</p>
  <p className="text-red-600 text-sm">파일을 다시 시도해 주세요</p>
  <button className="mt-2">다시 시도</button>
</div>
```

### 빈 상태

```jsx
<div className="text-center py-12">
  <EmptyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
  <p className="text-gray-500 text-lg">아직 주문이 없습니다</p>
  <button className="mt-4">주문 만들기</button>
</div>
```

---

## 컴포넌트 라이브러리 (미니 가이드)

### 버튼 변형

```jsx
// Primary (Coral)
<button className="bg-coral-500 text-white px-4 py-2 rounded-lg">
  저장
</button>

// Secondary (Gray)
<button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">
  취소
</button>

// Accent (Gold)
<button className="bg-gold-500 text-white px-4 py-2 rounded-lg">
  앨범 주문하기
</button>

// Outline
<button className="border-2 border-coral-500 text-coral-500 px-4 py-2 rounded-lg">
  편집
</button>
```

### 배지

```jsx
<span className="inline-block bg-coral-100 text-coral-700 px-3 py-1 rounded-full text-sm font-medium">
  웨딩촬영
</span>
```

### 토스트 메시지

```jsx
<div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg">
  일정이 저장되었습니다
</div>
```

---

*문서 작성일: 2026-04-23*  
*버전: 1.0*  
*상태: 확정*
