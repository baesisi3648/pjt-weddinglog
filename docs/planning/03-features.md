# 03 — Feature Specification

> 기능별 상세 명세 (Lv1/Lv2/Lv3)

---

## 목차

- [Lv1 핵심 기능](#lv1-핵심-기능)
  - 커플 프로필
  - AI 웨딩 체크리스트
  - 공유 캘린더
  - AI 캡션 생성
  - 타임라인 뷰
- [Lv2 주문 기능](#lv2-주문-기능)
- [Lv3 익스포트](#lv3-익스포트)
- [엣지케이스 및 에러 정책](#엣지케이스-및-에러-정책)

---

## Lv1: 핵심 기능

### 1.1 커플 프로필 (Couple Profile)

**개요**: 신랑·신부 이름, 결혼 예정일, 프로필 이미지, 한 줄 소개를 저장하고 조회

**입력**:
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| groom_name | string | Y | 신랑 이름 |
| bride_name | string | Y | 신부 이름 |
| wedding_date | date | Y | 결혼 예정일 (D-day 기준점) |
| profile_photo | file | N | 커플 프로필 사진 (선택) |
| tagline | string | N | 한 줄 소개 (예: "성우 ♥ 은비, 2025.10.25") |

**출력**:
```json
{
  "id": "couple_001",
  "groom_name": "김성우",
  "bride_name": "이은비",
  "wedding_date": "2026-10-25",
  "profile_photo_url": "/uploads/profile_001.jpg",
  "tagline": "성우 ♥ 은비, 2026.10.25",
  "d_day_countdown": 187,
  "created_at": "2026-04-23T10:00:00Z"
}
```

**비즈니스 룰**:
- 커플당 1개 프로필만 존재 (과제에서는 더미 데이터)
- 결혼 예정일은 오늘 기준 과거·미래 모두 가능
- D-day 카운트다운은 결혼 예정일 기준 자동 계산

**의존성**: 없음

**엣지케이스**:
- 프로필 사진 없어도 서비스 이용 가능 (기본 이미지 표시)
- 결혼 예정일이 오늘보다 과거일 경우, "결혼 완료! D+XX" 표시

---

### 1.2 AI 웨딩 체크리스트 자동 생성

**개요**: 사용자가 결혼 예정일만 입력하면, AI(OpenAI API 또는 템플릿)가 D-180 ~ D+14 범위에서 15개 준비 일정을 자동 생성

**입력**:
```json
{
  "couple_id": "couple_001",
  "wedding_date": "2026-10-25",
  "optional_budget_level": "mid",  // low, mid, high (선택)
  "optional_prep_start": "2026-04-23"  // 준비 시작 시점 (선택)
}
```

**출력** (15개 Event 배열):
```json
{
  "checklist": [
    {
      "date": "2026-04-23",
      "d_day": -186,
      "title": "예식장 투어 시작",
      "category": "VENUE",
      "description": "3~4곳 최소 비교 방문",
      "is_ai_generated": true
    },
    {
      "date": "2026-06-09",
      "d_day": -138,
      "title": "스드메 업체 미팅",
      "category": "STUDIO_DRESS_MAKEUP",
      "description": "3곳 이상 비교, 계약서 검토"
    },
    ...
  ],
  "generated_at": "2026-04-23T10:00:00Z"
}
```

**AI 프롬프트**:
```
당신은 결혼 준비 컨설턴트입니다.
신랑신부의 결혼 예정일을 받으면, D-180부터 D+14까지 준비 일정을 역산해서 제시합니다.

입력:
- 결혼 예정일: 2026-10-25
- 예산 규모 (선택): mid
- 준비 시작 시점 (선택): 2026-04-23

출력:
15개의 준비 항목을 JSON 배열로 반환합니다.
각 항목은 date, d_day, title, category, description을 포함합니다.

카테고리: VENUE, STUDIO_DRESS_MAKEUP, WEDDING_PHOTO, GIFT, INVITATION, REHEARSAL, CEREMONY, HONEYMOON, ETC
```

**비즈니스 룰**:
- 기본 15개 항목 생성 (필요시 사용자가 추가/삭제)
- 각 일정의 category는 미리 정의된 enum만 사용
- D-day 계산: date - wedding_date (음수 = D 이전, 양수 = D 이후)

**의존성**: 없음

**폴백 전략** (OpenAI API 키 없을 경우):
```
15개 사전정의 템플릿 반환:
D-180: 예식장 투어 시작
D-150: 스드메 업체 미팅
D-120: 웨딩촬영 예약
D-100: 예물·예단 쇼핑
D-90: 웨딩촬영 (예상 날짜)
D-60: 청첩장 시안 확인
D-45: 청첩장 발송
D-30: 식전영상 준비
D-14: 혼수 최종 점검
D-7: 리허설
D-1: 전야제
D-day: 본식
D+1: 아이폰스냅 수령
D+7: 신혼여행 (예상 시작)
D+14: 앨범 주문 추천
```

---

### 1.3 공유 캘린더 (Calendar)

**개요**: 월간 캘린더 뷰에서 모든 일정을 보고, 일정 CRUD 작업 수행

#### 1.3.1 Event 데이터 구조

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 고유 식별자 |
| couple_id | UUID | 커플 프로필 ID |
| title | string | 일정 제목 |
| date | date | 날짜 |
| category | enum | WEDDING_PHOTO, STUDIO_DRESS_MAKEUP, VENUE, GIFT, INVITATION, REHEARSAL, CEREMONY, HONEYMOON, ETC |
| memo | text | 메모 (선택) |
| photos | Photo[] | 첨부 사진 (0~10장) |
| is_completed | boolean | 완료 여부 |
| is_ai_generated | boolean | AI 생성 일정 여부 |
| created_at | datetime | 생성일 |
| updated_at | datetime | 수정일 |

#### 1.3.2 기능 상세

**기능 1: 일정 CRUD**

```
GET    /api/couples/{couple_id}/events?month=2026-10
POST   /api/couples/{couple_id}/events
GET    /api/couples/{couple_id}/events/{event_id}
PUT    /api/couples/{couple_id}/events/{event_id}
DELETE /api/couples/{couple_id}/events/{event_id}
PATCH  /api/couples/{couple_id}/events/{event_id}/complete
```

**기능 2: 월간 뷰**
- 해당 월의 모든 일정을 날짜별로 그리드 표시
- 각 날짜에 일정 개수 표시
- 카테고리별 색상 구분 (WEDDING_PHOTO: coral, VENUE: lavender, 등)
- D-day 카운트다운 상단 고정

**기능 3: 일정 목록 뷰**
- 월별 일정을 리스트로 표시
- 완료/미완료 체크박스 토글
- 각 일정의 메모 프리뷰

**기능 4: 사진 업로드**
- 일정당 최대 10장
- 파일 크기 제한: 장당 5MB
- 드래그 앤 드롭 지원

**비즈니스 룰**:
- 한 일정에 최대 10장의 사진 업로드 가능
- 사진 총 용량 제한 없음 (로컬 파일시스템 사용)
- 초과 시 사용자에게 "이 일정에는 최대 10장까지만 업로드 가능합니다" 메시지

**엣지케이스**:
- 사진 업로드 중 실패 시, 부분 롤백 (트랜잭션)
- 일정 삭제 시, 첨부 사진도 함께 삭제
- 완료 체크는 UI에서만 작동 (실제 비즈니스 로직에 영향 없음, Lv1에서)

---

### 1.4 AI 캡션 생성

**개요**: 사진 업로드 후 카테고리와 날짜 맥락을 고려해 감성적 캡션 3개 자동 제안

**입력**:
```json
{
  "event_id": "evt_20261025_001",
  "photo_id": "photo_12345",
  "category": "WEDDING_PHOTO",
  "date": "2026-08-15",
  "memo": "여름 햇살이 예쁜 스튜디오"
}
```

**출력** (3개 캡션 옵션):
```json
{
  "photo_id": "photo_12345",
  "caption_options": [
    {
      "id": 1,
      "text": "여름 햇살 아래, 처음으로 웨딩드레스를 입은 날",
      "source": "openai"
    },
    {
      "id": 2,
      "text": "카메라 앞에선 어색했지만, 네 손을 잡으니 웃음이 났다",
      "source": "openai"
    },
    {
      "id": 3,
      "text": "이 사진 속 우리가, 진짜 결혼하는구나 싶었다",
      "source": "openai"
    }
  ],
  "selected_caption": "여름 햇살 아래, 처음으로 웨딩드레스를 입은 날"
}
```

**AI 프롬프트**:
```
당신은 결혼 앨범 감성 에디터입니다.
아래 정보를 바탕으로 결혼앨범에 들어갈 감성적인 한 줄 캡션 3개를 제안하세요.

입력:
- 카테고리: {category}
- 날짜: {date}
- 사용자 메모: {memo}

제약:
- 20자~40자 사이
- 1인칭("나") 또는 "우리" 시점
- 감성적이고 긍정적인 톤
- 결혼과 준비 과정의 의미를 드러내기

출력:
JSON 배열로 3개의 캡션 반환. 각각 text 필드.
```

**비즈니스 룰**:
- 카테고리별 캡션 톤 변화:
  - WEDDING_PHOTO: 로맨틱, 웨딩드레스/신랑신부 중심
  - CEREMONY: 엄숙하고 감동적
  - HONEYMOON: 설렘, 신혼의 기쁨
  - 준비 항목: 팀워크, 함께 준비하는 과정의 소중함

**의존성**: 없음 (독립적 호출 가능)

**폴백 전략** (OpenAI API 키 없을 경우):
```
카테고리별 사전정의 캡션 3개씩 로테이션:

WEDDING_PHOTO:
- "여름 햇살 아래, 처음으로 웨딩드레스를 입은 날"
- "카메라 앞에선 어색했지만, 네 손을 잡으니 웃음이 났다"
- "이 사진 속 우리가, 진짜 결혼하는구나 싶었다"

HONEYMOON:
- "발리의 첫 아침, 파도 소리에 눈을 떴다"
- "신혼여행의 모든 순간이 새로웠다"
- "우리 둘이면 어디든 천국이다"

(기타 카테고리도 3개씩 준비)
```

**엣지케이스**:
- 캡션 생성 실패 시, 빈 문자열 반환하고 "AI 캡션을 가져올 수 없습니다" 메시지
- 사용자가 3개 중 원하는 것 없으면 "직접 작성" 버튼으로 수동 입력 가능
- 한 번 선택된 캡션도 언제든 수정 가능

---

### 1.5 타임라인 뷰 (Timeline View)

**개요**: 캘린더에 쌓인 기록을 카테고리별 챕터로 묶어서 보여주는 뷰 → "책의 미리보기"

**입력**:
```
GET /api/couples/{couple_id}/timeline
```

**출력**:
```json
{
  "couple": {
    "groom": "김성우",
    "bride": "이은비",
    "wedding_date": "2026-10-25"
  },
  "chapters": [
    {
      "chapter_number": 1,
      "title": "웨딩촬영",
      "category": "WEDDING_PHOTO",
      "photo_count": 8,
      "photos": [
        {
          "id": "photo_001",
          "event_id": "evt_001",
          "event_date": "2026-08-15",
          "file_url": "/uploads/photo_001.jpg",
          "caption": "여름 햇살 아래, 처음으로 웨딩드레스를 입은 날",
          "is_selected": true
        },
        ...
      ]
    },
    {
      "chapter_number": 2,
      "title": "준비의 날들",
      "category": "PREPARATION",  // 여러 카테고리의 혼합
      "photo_count": 12,
      "photos": [...]
    },
    {
      "chapter_number": 3,
      "title": "그 날 — 본식",
      "category": "CEREMONY",
      "photo_count": 15,
      "photos": [...]
    },
    {
      "chapter_number": 4,
      "title": "첫 여행 — 신혼여행",
      "category": "HONEYMOON",
      "photo_count": 10,
      "photos": [...]
    }
  ],
  "total_photos": 45,
  "total_pages_estimated": 32
}
```

**기능 상세**:

1. **자동 챕터 생성**
   - 카테고리별로 Event를 그룹핑
   - 같은 카테고리 Event의 사진을 하나의 Chapter로 통합
   - 사진이 없는 Event는 미포함 (또는 별도 처리)

2. **챕터 순서 변경** (드래그 또는 버튼)
   - 기본 순서: 일정 날짜 기준 오름차순
   - 사용자가 원하면 순서 변경 가능
   - 변경사항은 Session 또는 DB에 저장

3. **사진 선택/해제**
   - 각 사진마다 체크박스 (is_selected 토글)
   - 선택된 사진만 앨범에 포함
   - 사진 선택 상태는 DB에 저장

4. **캡션 편집**
   - 각 사진의 캡션을 인라인으로 편집 가능
   - 수정 후 저장

5. **페이지 수 추정**
   - 선택된 사진 수 기반: 대략 2~3장/페이지
   - 계산식: ceil(selected_photo_count / 2.5)
   - "총 45장 선택 시 대략 18페이지로 예상됩니다" 표시

**비즈니스 룰**:
- 카테고리 매핑:
  - WEDDING_PHOTO → Chapter "웨딩촬영"
  - STUDIO_DRESS_MAKEUP → "스드메"
  - VENUE → "준비 과정"
  - GIFT → "준비 과정"
  - INVITATION → "준비 과정"
  - CEREMONY → Chapter "그 날"
  - HONEYMOON → Chapter "신혼여행"
  - 기타 → "기타"

**의존성**: Event (사진 포함), Photo, Caption

**엣지케이스**:
- 사진이 하나도 없으면 Timeline 로드 시 "아직 사진이 없습니다" 메시지
- 챕터 변경 후 저장 전 떠나면, 변경사항 안내 후 폐기
- 모든 사진이 해제되면 "선택된 사진이 없습니다. 최소 1장 이상 선택하세요" 경고

---

## Lv2: 주문 기능

### 2.1 주문 생성 (Order Checkout)

**개요**: 타임라인 페이지에서 "앨범 주문하기" 진입 → 4단계 체크아웃

#### Order 데이터 구조

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 주문 ID |
| couple_id | UUID | 커플 프로필 ID |
| format | enum | SQUARE(21x21cm) / A4(21x29.7cm) |
| cover_type | enum | HARD / SOFT |
| quantity | int | 1~10권 |
| chapters | JSON | 포함 챕터 및 사진 ID 목록 |
| recipient_name | string | 수령인 |
| recipient_phone | string | 연락처 |
| recipient_address | string | 주소 |
| status | enum | pending / processing / completed |
| created_at | datetime | 주문일 |
| updated_at | datetime | 상태 변경일 |

#### Step 1: 앨범 구성 확인

**입력**: timeline에서 선택한 사진 목록 (is_selected=true인 것들)

**출력**:
```json
{
  "total_photos": 45,
  "total_pages_estimated": 18,
  "recommended_format": "SQUARE",
  "chapters_to_include": [
    {
      "chapter_number": 1,
      "title": "웨딩촬영",
      "photo_count": 8,
      "is_selected": true
    },
    ...
  ],
  "message": "총 45장의 사진이 있습니다. 정사각형(18페이지) 또는 A4(22페이지) 구성을 추천합니다."
}
```

**기능**:
- 선택된 사진 수 표시
- 판형별 예상 페이지 수 계산
- 각 챕터의 포함 여부 토글 가능

#### Step 2: 옵션 선택

**입력**:
```json
{
  "format": "SQUARE",
  "cover_type": "HARD",
  "quantity": 3
}
```

**출력** (가격 정보 포함):
```json
{
  "format": {
    "value": "SQUARE",
    "label": "정사각형 (21x21cm)",
    "price_per_book": 180000
  },
  "cover_type": {
    "value": "HARD",
    "label": "하드커버",
    "price_per_book": 20000  // 추가 비용
  },
  "quantity": 3,
  "base_price": 180000,  // 1권 기본가
  "cover_premium": 20000,  // 하드커버 추가
  "total_price_per_book": 200000,  // base + cover
  "total_price": 600000,  // per_book * quantity
  "message": "3권 주문 시 총 60만원입니다. 부모님께도 드릴 수 있네요!"
}
```

**옵션**:
- 판형: SQUARE(정사각형), A4
- 표지: HARD(하드커버), SOFT(소프트커버)
- 수량: 1~10권

**가격 전략** (Lv1 기획, Lv2에서 하드코딩):
- 기본 가격: 10~20만원/권 (본식앨범 100~300만원의 1/10~1/5)
- 패밀리는 가격 정책 또는 기획에서 정의

#### Step 3: 배송 정보 입력

**입력**:
```json
{
  "recipient_name": "박민준",
  "recipient_phone": "010-1234-5678",
  "recipient_address": "서울시 강남구 테헤란로 123, 456호"
}
```

**검증**:
- 수령인 이름: 필수, 2자 이상
- 연락처: 필수, 휴대폰 포맷 검증
- 주소: 필수

**기능**:
- 수령인 정보 입력
- (나중에) 배송지 여러 개 추가 가능 (현재는 1개만)

#### Step 4: 주문 완료

**출력**:
```json
{
  "order_id": "ord_20261025_001",
  "status": "pending",
  "created_at": "2026-04-28T14:00:00Z",
  "message": "주문이 생성되었습니다. 주문 ID를 저장해 두세요.",
  "redirect": "/orders/ord_20261025_001"
}
```

**기능**:
- 주문 ID 표시 및 복사 버튼
- "주문 관리 페이지로 이동" 버튼
- (나중에) 이메일 발송 (현재는 미구현)

**비즈니스 룰**:
- 주문 생성 시 최소 1장 이상의 사진 검증 → 0장이면 "최소 1장 이상 선택하세요" 경고
- 주문 생성 후 상태는 자동으로 pending
- 주문 ID 명명: ord_{YYYYMMDD}_{NUMBER} (예: ord_20261025_001)

**엣지케이스**:
- 네트워크 오류로 Step 중단 시, "다시 시도" 또는 "임시저장" 옵션 제공 (선택)
- 예상 페이지 수가 0이면 경고

---

### 2.2 주문 조회 및 상태 관리

**기능 1: 주문 목록 조회**

```
GET /api/couples/{couple_id}/orders
```

**출력**:
```json
{
  "orders": [
    {
      "id": "ord_20261025_001",
      "created_at": "2026-04-28T14:00:00Z",
      "status": "pending",
      "format": "SQUARE",
      "quantity": 3,
      "total_price": 600000,
      "recipient_name": "박민준"
    },
    ...
  ]
}
```

**기능 2: 주문 상세**

```
GET /api/orders/{order_id}
```

**출력**:
```json
{
  "id": "ord_20261025_001",
  "couple": {
    "groom": "김성우",
    "bride": "이은비"
  },
  "format": "SQUARE",
  "cover_type": "HARD",
  "quantity": 3,
  "chapters": [
    {
      "chapter_number": 1,
      "title": "웨딩촬영",
      "photo_count": 8
    },
    ...
  ],
  "total_photos": 45,
  "recipient_name": "박민준",
  "recipient_phone": "010-1234-5678",
  "recipient_address": "서울시 강남구 테헤란로 123",
  "total_price": 600000,
  "status": "pending",
  "status_updated_at": "2026-04-28T14:00:00Z",
  "created_at": "2026-04-28T14:00:00Z"
}
```

**기능 3: 주문 상태 변경** (시뮬레이션용)

```
PATCH /api/orders/{order_id}/status
```

**입력**:
```json
{
  "new_status": "processing"
}
```

**상태 전이**:
- pending → processing (주문 확인됨, 인쇄 준비)
- processing → completed (배송 완료)
- 역방향 전이 불가 (예: completed → processing 불가)

**출력**:
```json
{
  "order_id": "ord_20261025_001",
  "status": "processing",
  "updated_at": "2026-04-28T15:00:00Z",
  "message": "주문 상태가 업데이트되었습니다."
}
```

**비즈니스 룰**:
- 상태 값: pending, processing, completed만 허용
- 상태 변경 시 updated_at 자동 갱신
- (나중에) 상태 변경 시 고객에게 알림 (현재는 미구현)

**의존성**: Order, Couple, Event, Photo

---

## Lv3: 익스포트

### 3.1 주문 데이터 익스포트

**개요**: 주문 1건의 모든 데이터(사진, 메타데이터)를 ZIP으로 다운로드

```
GET /api/orders/{order_id}/export → ZIP 파일 다운로드
```

**ZIP 구조**:
```
order_20261025_001.zip
├── order.json              # 주문 메타데이터
├── chapters/
│   ├── 01_wedding_photo/
│   │   ├── photo_001.jpg
│   │   ├── photo_002.jpg
│   │   └── ...
│   ├── 02_preparation/
│   │   ├── photo_010.jpg
│   │   └── ...
│   ├── 03_ceremony/
│   │   └── ...
│   └── 04_honeymoon/
│       └── ...
└── captions.json           # 사진별 캡션 매핑
```

**order.json 명세**:
```json
{
  "order_id": "ord_20261025_001",
  "couple": {
    "groom": "김성우",
    "bride": "이은비",
    "wedding_date": "2026-10-25"
  },
  "format": "SQUARE",
  "cover_type": "HARD",
  "quantity": 3,
  "chapters": [
    {
      "chapter_number": 1,
      "title": "웨딩촬영",
      "category": "WEDDING_PHOTO",
      "photos": ["photo_001.jpg", "photo_002.jpg", ...],
      "photo_count": 8
    },
    ...
  ],
  "recipient": {
    "name": "박민준",
    "phone": "010-1234-5678",
    "address": "서울시 강남구 테헤란로 123"
  },
  "total_photos": 45,
  "total_pages": 18,
  "created_at": "2026-04-28T14:00:00Z",
  "exported_at": "2026-04-28T15:30:00Z"
}
```

**captions.json 명세**:
```json
{
  "photo_001.jpg": {
    "caption": "여름 햇살 아래, 처음으로 웨딩드레스를 입은 날",
    "date": "2026-08-15",
    "category": "WEDDING_PHOTO"
  },
  "photo_002.jpg": {
    "caption": "카메라 앞에선 어색했지만, 네 손을 잡으니 웃음이 났다",
    "date": "2026-08-15",
    "category": "WEDDING_PHOTO"
  },
  ...
}
```

**파일 생성 로직**:
1. order.json 생성 (주문 메타데이터)
2. chapters/ 디렉터리 생성 및 선택된 사진 복사
3. captions.json 생성 (각 사진의 캡션 매핑)
4. 3개 파일을 하나의 ZIP으로 압축
5. 다운로드 제공

**비즈니스 룰**:
- ZIP 파일명: order_{YYYYMMDD}_{ID}.zip
- 모든 이미지 파일 포함 (선택된 사진만)
- JSON 형식은 UTF-8 인코딩
- 파일 구조는 인쇄사(스위트북)가 파싱 가능하도록 설계

**엣지케이스**:
- 익스포트 중 이미지 손실 시, 에러 메시지 및 부분 ZIP 생성 방지
- 대용량 주문(100+ 사진)의 경우 진행 바 표시 (선택)

---

## 엣지케이스 및 에러 정책

### 사진 업로드 제한

| 제약 | 규칙 | 에러 메시지 |
|------|------|-----------|
| 일정당 최대 사진 수 | 10장 | "이 일정에는 최대 10장까지만 업로드 가능합니다" |
| 장당 파일 크기 | 5MB | "파일이 너무 큽니다 (최대 5MB)" |
| 지원 포맷 | JPG, PNG | "지원하지 않는 이미지 형식입니다 (JPG, PNG만 가능)" |

**폴백**: 초과 시 사용자에게 선택지 제공
- "기존 사진 삭제 후 업로드"
- "다른 일정에 업로드"

### 주문 생성 검증

| 제약 | 규칙 | 에러 메시지 |
|------|------|-----------|
| 최소 사진 수 | 1장 이상 | "선택된 사진이 없습니다. 최소 1장 이상 선택하세요" |
| 수량 범위 | 1~10권 | "수량은 1~10권 사이만 가능합니다" |
| 수령인 정보 | 필수 | "수령인 정보를 모두 입력해 주세요" |

### OpenAI API 폴백

| 기능 | API 실패 시 |
|------|-----------|
| 체크리스트 생성 | 15개 사전정의 템플릿 반환 |
| 캡션 생성 | 카테고리별 3개 사전 캡션 로테이션 |

### 데이터베이스 오류

| 오류 | 처리 |
|------|------|
| 네트워크 끊김 | "인터넷 연결을 확인하세요" 메시지, Retry 버튼 |
| 서버 에러 | "죄송합니다. 잠시 후 다시 시도해 주세요" + 에러 ID |
| 동시성 충돌 | 낙관적 락(Optimistic Lock) 사용, 재시도 유도 |

---

*문서 작성일: 2026-04-23*  
*버전: 1.0*  
*상태: 확정*
