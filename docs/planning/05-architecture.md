# 05 — System Architecture

> 시스템 설계, 데이터 흐름, 배포 구조

---

## 고수준 아키텍처 (High-Level Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                     사용자 브라우저                           │
│                  (Chrome, Safari, Edge)                      │
└────────────────────────┬──────────────────────────────────────┘
                         │ HTTPS
┌─────────────────────────▼──────────────────────────────────────┐
│                   프론트엔드 (React + Vite)                      │
│              Port 3000 (http://localhost:3000)                │
├──────────────────────────────────────────────────────────────┤
│ • Home 페이지 (D-day 카운트다운, 이번주 할일)                    │
│ • Calendar (월간/리스트 뷰, 일정 CRUD)                        │
│ • EventDetail (사진 업로드, AI 캡션)                          │
│ • Timeline (챕터 정렬, 앨범 미리보기)                          │
│ • OrderCheckout (4단계 체크아웃)                             │
│ • Orders (주문 목록, 상세, 상태 관리)                          │
└────────────────────────┬──────────────────────────────────────┘
                         │ RESTful API
                         │ JSON 요청/응답
┌─────────────────────────▼──────────────────────────────────────┐
│                   백엔드 (FastAPI)                              │
│              Port 8000 (http://localhost:8000)                │
├──────────────────────────────────────────────────────────────┤
│ ├─ /api/couples/{id}                                        │
│ ├─ /api/couples/{id}/events                                 │
│ ├─ /api/ai/checklist                                        │
│ ├─ /api/ai/caption                                          │
│ ├─ /api/events/{id}/photos                                  │
│ ├─ /api/couples/{id}/timeline                               │
│ ├─ /api/couples/{id}/orders                                 │
│ └─ /api/orders/{id}/export                                  │
└────────────────────────┬──────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌────────┐      ┌────────┐      ┌──────────┐
    │ SQLite │      │로컬    │      │OpenAI   │
    │ DB     │      │파일시스│      │API      │
    │        │      │템(사진)│      │         │
    └────────┘      └────────┘      └──────────┘
```

---

## 서비스 경계 (Service Boundaries)

### 백엔드 구조

```
backend/
├── main.py                          # FastAPI 엔트리포인트
├── app/
│   ├── models/                      # SQLAlchemy 모델
│   │   ├── couple.py
│   │   ├── event.py
│   │   ├── photo.py
│   │   └── order.py
│   ├── schemas/                     # Pydantic 스키마 (요청/응답)
│   │   ├── couple.py
│   │   ├── event.py
│   │   ├── photo.py
│   │   ├── order.py
│   │   └── ai.py
│   ├── routers/                     # APIRoute 정의
│   │   ├── couples.py
│   │   ├── events.py
│   │   ├── photos.py
│   │   ├── ai.py
│   │   ├── timeline.py
│   │   └── orders.py
│   ├── services/                    # 비즈니스 로직
│   │   ├── couple_service.py
│   │   ├── event_service.py
│   │   ├── photo_service.py
│   │   ├── ai_service.py            # ChatGPT 통합
│   │   ├── timeline_service.py
│   │   ├── order_service.py
│   │   └── export_service.py        # ZIP 생성
│   ├── database.py                  # SQLAlchemy 세션
│   ├── config.py                    # 환경변수 관리
│   └── utils/
│       ├── exceptions.py
│       ├── validators.py
│       └── file_handler.py          # 파일 업로드/저장
├── data/                            # Docker 볼륨 마운트 경로
│   ├── weddinglog.db
│   └── uploads/
│       └── photos/
├── requirements.txt
└── Dockerfile
```

### 프론트엔드 구조

```
frontend/
├── src/
│   ├── main.jsx                     # React 엔트리
│   ├── App.jsx                      # 라우팅
│   ├── pages/                       # 페이지 컴포넌트
│   │   ├── Home.jsx
│   │   ├── Calendar.jsx
│   │   ├── EventDetail.jsx
│   │   ├── Timeline.jsx
│   │   ├── OrderCheckout.jsx
│   │   └── Orders.jsx
│   ├── components/                  # 재사용 컴포넌트
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── CalendarGrid.jsx
│   │   ├── EventForm.jsx
│   │   ├── PhotoUpload.jsx
│   │   ├── PhotoGrid.jsx
│   │   ├── CaptionSelector.jsx
│   │   ├── TimelineChapter.jsx
│   │   ├── OrderStepper.jsx
│   │   └── OrderCard.jsx
│   ├── context/                     # Context API
│   │   ├── CoupleContext.jsx
│   │   └── CalendarContext.jsx
│   ├── hooks/                       # Custom Hooks
│   │   ├── useFetch.js
│   │   ├── useForm.js
│   │   └── useLocalStorage.js
│   ├── services/                    # API 호출
│   │   ├── api.js                   # Axios 인스턴스
│   │   ├── couple_api.js
│   │   ├── event_api.js
│   │   ├── photo_api.js
│   │   ├── ai_api.js
│   │   ├── timeline_api.js
│   │   └── order_api.js
│   ├── styles/                      # Tailwind 커스텀
│   │   ├── globals.css
│   │   ├── colors.css               # 파스텔 컬러 토큰
│   │   └── animations.css
│   └── utils/
│       ├── date.js
│       ├── formatting.js
│       └── validation.js
├── public/
│   ├── logo.svg
│   └── favicon.ico
├── index.html
├── vite.config.js
├── tailwind.config.js
└── Dockerfile
```

---

## 데이터 흐름 (Data Flow)

### Sequence 1: 일정 생성 플로우

```
1. 사용자가 캘린더에서 날짜 선택
   └─> EventForm 모달 표시

2. 사용자가 일정 정보 입력 (제목, 카테고리, 메모)
   └─> Form validation (Frontend)

3. 사용자가 "저장" 버튼 클릭
   └─> POST /api/couples/{couple_id}/events
        {
          "title": "웨딩촬영",
          "date": "2026-08-15",
          "category": "WEDDING_PHOTO",
          "memo": "여름 햇살이 예쁜 스튜디오"
        }

4. Backend EventService.create_event()
   ├─> Event 객체 생성 (UUID 자동 생성)
   ├─> SQLite에 INSERT
   └─> Event 응답 반환
        {
          "id": "evt_20260815_001",
          "title": "웨딩촬영",
          "date": "2026-08-15",
          "category": "WEDDING_PHOTO",
          ...
        }

5. Frontend
   ├─> 캘린더 리렌더링 (새 일정 표시)
   ├─> "일정이 저장되었습니다" 토스트 메시지
   └─> 모달 자동 닫기
```

### Sequence 2: 사진 업로드 + AI 캡션 플로우

```
1. 사용자가 EventDetail에서 사진 파일 선택
   └─> 파일 유효성 검사 (크기, 포맷)
       └─> 5MB 초과 시 "파일이 너무 큽니다" 경고

2. 사용자가 드래그 앤 드롭으로 사진 업로드
   └─> FormData에 파일 포함
        {
          "file": File,
          "event_id": "evt_20260815_001"
        }

3. POST /api/events/{event_id}/photos
   ├─> Backend FileHandler.save_photo()
   │   ├─> 파일을 /data/uploads/photos/{event_id}/photo_{id}.jpg로 저장
   │   ├─> Photo 객체 생성
   │   └─> SQLite에 INSERT
   │
   └─> PhotoService.get_photo_details()
       └─> Photo 객체 응답
            {
              "id": "photo_001",
              "event_id": "evt_20260815_001",
              "file_path": "/uploads/photos/evt_001/photo_001.jpg",
              "caption": null,
              ...
            }

4. Frontend에서 사진 썸네일 표시
   └─> "AI 캡션 추천" 버튼 활성화

5. 사용자가 "AI 캡션 추천" 클릭
   └─> POST /api/ai/caption
        {
          "photo_id": "photo_001",
          "event_id": "evt_20260815_001",
          "category": "WEDDING_PHOTO",
          "date": "2026-08-15",
          "memo": "여름 햇살이 예쁜 스튜디오"
        }

6. Backend AIService.generate_captions()
   ├─> OpenAI API 호출
   │   └─> (또는 폴백 템플릿)
   │
   └─> 3개 캡션 옵션 반환
        {
          "caption_options": [
            {
              "id": 1,
              "text": "여름 햇살 아래, 처음으로 웨딩드레스를 입은 날"
            },
            ...
          ]
        }

7. Frontend에서 캡션 선택지 표시
   └─> 사용자가 하나 선택 또는 직접 입력

8. PUT /api/photos/{photo_id}/caption
   {
     "caption": "여름 햇살 아래, 처음으로 웨딩드레스를 입은 날"
   }

9. Backend PhotoService.update_caption()
   └─> SQLite 업데이트

10. Frontend
    └─> 사진 아래에 캡션 표시
```

### Sequence 3: 앨범 주문 플로우

```
1. Timeline 페이지에서 "앨범 주문하기" 클릭
   └─> OrderCheckout 페이지로 이동

2. Step 1: 앨범 구성 확인
   └─> GET /api/couples/{couple_id}/timeline
       └─> 선택된 사진 목록과 예상 페이지 수 표시
           {
             "total_photos": 45,
             "total_pages_estimated": 18,
             "chapters": [...]
           }

3. Step 2: 옵션 선택 (판형, 표지, 수량)
   └─> Frontend 상태 업데이트 (Context 또는 State)

4. Step 3: 배송 정보 입력
   └─> 수령인 이름, 연락처, 주소
   └─> 유효성 검사 (Frontend)

5. Step 4: 주문 생성
   └─> POST /api/couples/{couple_id}/orders
        {
          "format": "SQUARE",
          "cover_type": "HARD",
          "quantity": 3,
          "chapters": [...],
          "recipient_name": "박민준",
          ...
        }

6. Backend OrderService.create_order()
   ├─> Order 객체 생성 (ID: ord_YYYYMMDD_001)
   ├─> SQLite에 INSERT
   ├─> 상태: pending
   └─> 응답
        {
          "order_id": "ord_20261025_001",
          "status": "pending",
          "created_at": "2026-04-28T14:00:00Z"
        }

7. Frontend
   ├─> "주문이 생성되었습니다" 메시지
   ├─> 주문 ID 표시 및 복사 버튼
   └─> "주문 관리" 페이지로 이동
```

### Sequence 4: 데이터 익스포트 (Lv3)

```
1. Orders 페이지에서 주문 상세 조회
   └─> GET /api/orders/{order_id}

2. 사용자가 "데이터 다운로드" 버튼 클릭
   └─> GET /api/orders/{order_id}/export

3. Backend ExportService.export_order_as_zip()
   ├─> order.json 생성
   │   ├─> order_id, couple, format, chapters, ...
   │   └─> /tmp/order_20261025_001_metadata.json에 쓰기
   │
   ├─> chapters/ 디렉터리 생성
   │   ├─> 01_wedding_photo/ 생성
   │   ├─> 각 선택된 사진 파일 복사
   │   └─> 02_ceremony/, 03_honeymoon/, ... 동일
   │
   ├─> captions.json 생성
   │   ├─> {photo_001.jpg: {caption: "...", date: "...", category: "..."}}
   │   └─> /tmp/captions_20261025_001.json에 쓰기
   │
   └─> ZIP 파일 생성
       ├─> /tmp/order_20261025_001.zip
       ├─> order.json, chapters/, captions.json 포함
       └─> 응답 헤더: Content-Disposition: attachment; filename=...

4. Frontend
   └─> 브라우저의 다운로드 폴더에 ZIP 저장
```

---

## 데이터베이스 스키마

### couples 테이블

```sql
CREATE TABLE couples (
    id TEXT PRIMARY KEY,                       -- UUID
    groom_name TEXT NOT NULL,
    bride_name TEXT NOT NULL,
    wedding_date DATE NOT NULL,
    profile_photo_path TEXT,
    tagline TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### events 테이블

```sql
CREATE TABLE events (
    id TEXT PRIMARY KEY,                       -- UUID
    couple_id TEXT NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL,                    -- enum: WEDDING_PHOTO, VENUE, ...
    memo TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_couple_date ON events(couple_id, date);
```

### photos 테이블

```sql
CREATE TABLE photos (
    id TEXT PRIMARY KEY,                       -- UUID
    event_id TEXT NOT NULL,
    file_path TEXT NOT NULL,                   -- /uploads/photos/evt_001/photo_001.jpg
    caption TEXT,
    is_selected BOOLEAN DEFAULT TRUE,          -- 앨범에 포함 여부
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX idx_photos_event ON photos(event_id);
```

### orders 테이블

```sql
CREATE TABLE orders (
    id TEXT PRIMARY KEY,                       -- UUID: ord_YYYYMMDD_001
    couple_id TEXT NOT NULL,
    format TEXT NOT NULL,                      -- SQUARE, A4
    cover_type TEXT NOT NULL,                  -- HARD, SOFT
    quantity INTEGER NOT NULL,                 -- 1~10
    chapters JSON NOT NULL,                    -- 포함 챕터 및 사진 ID 목록
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    status TEXT DEFAULT 'pending',             -- pending, processing, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
);

CREATE INDEX idx_orders_couple ON orders(couple_id);
CREATE INDEX idx_orders_status ON orders(status);
```

---

## 배포 구조 (Docker Compose)

### docker-compose.yml

```yaml
version: '3.9'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: weddinglog-backend
    ports:
      - "${API_PORT:-8000}:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
      - DATABASE_URL=sqlite:///app/data/weddinglog.db
      - LOG_LEVEL=INFO
    volumes:
      - ./data:/app/data                       # 데이터 영속성
      - ./backend:/app                         # 개발 시 코드 리로드
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: weddinglog-frontend
    ports:
      - "${WEB_PORT:-3000}:3000"
    environment:
      - VITE_API_URL=http://localhost:${API_PORT:-8000}
    volumes:
      - ./frontend:/app                        # 개발 시 코드 리로드
    depends_on:
      - backend
    command: npm run dev

volumes:
  data:
    driver: local
```

### 환경변수 (.env.example)

```bash
# 포트 설정
API_PORT=8000
WEB_PORT=3000

# OpenAI API (선택)
OPENAI_API_KEY=sk-...

# 데이터베이스
DATABASE_URL=sqlite:///app/data/weddinglog.db

# 로깅
LOG_LEVEL=INFO
```

### 실행 방법

```bash
# 저장소 클론
git clone <repo-url>
cd pjt-weddinglog

# 환경변수 설정 (선택)
cp .env.example .env
# nano .env (필요하면 OPENAI_API_KEY 입력)

# 실행
docker-compose up

# 접속
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Swagger 문서: http://localhost:8000/docs
```

### Docker 배포 전략: 개발 vs 심사자(프로덕션) 분리

#### 심사자용 (`docker-compose.yml`)
**원칙**: 이미지에 코드 COPY (bind-mount X), 시작 후 코드 변경 없이 안정 동작

```yaml
# docker-compose.yml (심사자용 — 프로덕션 최적화)
version: '3.9'
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: weddinglog-backend
    ports:
      - "${API_PORT:-8000}:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
      - DATABASE_URL=sqlite:///app/data/weddinglog.db
      - LOG_LEVEL=INFO
    volumes:
      - ./data:/app/data                       # 데이터만 마운트
    # ⚠️ --reload 제거, bind-mount 제거
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: weddinglog-frontend
    ports:
      - "${WEB_PORT:-3000}:3000"
    environment:
      - VITE_API_URL=http://localhost:${API_PORT:-8000}
    # ⚠️ bind-mount 제거
    depends_on:
      - backend
    # npm run build 후 정적 파일 서빙 (또는 Node 프로세스)
    command: npm run build && npm run preview

volumes:
  data:
    driver: local
```

#### 개발자용 (`docker-compose.dev.yml`, override)
**원칙**: 소스 bind-mount + `--reload` + `npm run dev` 활성화, 코드 수정 즉시 반영

```yaml
# docker-compose.dev.yml (개발자용 — override)
version: '3.9'
services:
  backend:
    volumes:
      - ./backend:/app                         # 코드 리로드 용
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    volumes:
      - ./frontend:/app                        # 코드 리로드 용
    command: npm run dev
```

**실행**:
```bash
# 심사자
docker-compose up

# 개발자
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

## 에러 처리 및 폴백

### AI 폴백 전략 (앱 시작 시 1회 체크)

```python
# backend/main.py
from fastapi import FastAPI
import asyncio
import os

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    """
    앱 시작 시 OPENAI_API_KEY 유효성 1회 체크
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    
    if not api_key:
        logger.warning("OPENAI_API_KEY not set. AI features will use template fallback.")
        app.state.openai_available = False
    else:
        try:
            # 1회 유효성 검증 (빠른 타임아웃)
            from openai import OpenAI
            client = OpenAI(api_key=api_key, timeout=5)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": "test"}],
                max_tokens=1
            )
            logger.info("OpenAI API is available")
            app.state.openai_available = True
        except Exception as e:
            logger.warning(f"OpenAI API validation failed: {e}. AI features will use template fallback.")
            app.state.openai_available = False

# backend/app/services/ai_service.py

class AIService:
    @staticmethod
    async def generate_checklist(wedding_date: date, app_state) -> List[Event]:
        """
        체크리스트 생성 (OpenAI 또는 폴백)
        """
        # 앱 상태 플래그 먼저 확인 (매 호출 타임아웃 방지)
        if not app_state.openai_available:
            logger.info("Using template fallback for checklist (OpenAI unavailable)")
            return get_predefined_checklist(wedding_date)
        
        try:
            # OpenAI API 호출
            response = await openai_client.ChatCompletion.create(
                model="gpt-4o-mini",
                messages=[{
                    "role": "user",
                    "content": f"결혼 예정일: {wedding_date}에 대한 준비 체크리스트 생성..."
                }],
                temperature=0.7,
                max_tokens=1500,
                timeout=10  # 명시적 타임아웃
            )
            checklist = parse_checklist(response)
            logger.info(f"Checklist generated via OpenAI: {len(checklist)} items")
            return checklist
        except Exception as e:
            logger.warning(f"OpenAI API failed: {e}. Using template fallback.")
            # 폴백: 사전정의 15개 항목
            return get_predefined_checklist(wedding_date)

    @staticmethod
    async def generate_captions(event: Event, photo: Photo) -> List[str]:
        """
        캡션 생성 (OpenAI 또는 폴백)
        """
        try:
            response = await openai_client.ChatCompletion.create(
                model="gpt-4o-mini",
                messages=[{
                    "role": "user",
                    "content": f"카테고리: {event.category}, 날짜: {event.date}, 메모: {event.memo}에 대한 캡션 3개..."
                }],
                temperature=0.8,
                max_tokens=300
            )
            captions = parse_captions(response)
            logger.info(f"Captions generated via OpenAI: {len(captions)} options")
            return captions
        except Exception as e:
            logger.warning(f"OpenAI API failed: {e}. Using template fallback.")
            # 폴백: 카테고리별 사전 캡션 3개
            return get_predefined_captions(event.category)
```

### HTTP 에러 응답

```python
# backend/app/routers/events.py

@router.post("/couples/{couple_id}/events")
async def create_event(
    couple_id: str,
    event_in: EventCreate,
    db: Session = Depends(get_db)
) -> EventResponse:
    """
    일정 생성
    
    Responses:
      200: 일정 생성 성공
      400: 유효성 검사 실패
      404: 커플을 찾을 수 없음
      500: 서버 오류
    """
    # 커플 존재 확인
    couple = db.query(Couple).filter(Couple.id == couple_id).first()
    if not couple:
        raise HTTPException(
            status_code=404,
            detail="Couple not found"
        )
    
    # 일정 생성
    try:
        event = EventService.create_event(db, couple_id, event_in)
        return EventResponse.from_orm(event)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating event: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )
```

---

## 보안 고려사항

### 1. 파일 업로드 검증 (매직넘버 + Path Traversal 방어)

```python
# backend/app/utils/validators.py
import magic
from pathlib import Path
import secrets
import uuid

def validate_photo_file(file: UploadFile, event_id: str, upload_dir: Path) -> tuple[str, str]:
    """
    사진 파일 유효성 검사 (MIME 스푸핑 + Path Traversal 방어)
    - 실제 바이트 헤더로 타입 검증 (Content-Type 위조 방지)
    - UUID로 파일명 재생성 (Path Traversal 방지)
    - 저장 경로 prefix 검증
    
    Returns: (saved_filename, original_filename)
    """
    ALLOWED_TYPES = {"image/jpeg", "image/png"}
    MAX_SIZE = 5 * 1024 * 1024  # 5MB
    
    # 1. Content-Type 기본 검증
    if file.content_type not in ALLOWED_TYPES:
        raise ValueError("Only JPG and PNG files are allowed")
    
    if file.size > MAX_SIZE:
        raise ValueError(f"File size must be less than {MAX_SIZE} bytes")
    
    # 2. 실제 바이트 헤더로 MIME 검증 (매직넘버)
    file_bytes = file.file.read()
    mime = magic.Magic(mime=True)
    actual_mime = mime.from_buffer(file_bytes)
    
    if actual_mime not in ALLOWED_TYPES:
        raise ValueError(f"File signature mismatch. Detected: {actual_mime}")
    
    # 또는 Pillow를 사용한 검증
    from PIL import Image
    from io import BytesIO
    try:
        img = Image.open(BytesIO(file_bytes))
        img.verify()
    except Exception as e:
        raise ValueError(f"Invalid image file: {e}")
    
    # 3. 파일명 UUID 재생성 (원본명은 DB에만 기록)
    ext = file.filename.split('.')[-1].lower()
    if ext not in ['jpg', 'jpeg', 'png']:
        ext = 'jpg'  # 기본값
    
    photo_id = secrets.token_urlsafe(16)  # unguessable UUID
    saved_filename = f"{photo_id}.{ext}"
    
    # 4. 저장 경로 구성 + prefix 검증
    event_dir = upload_dir / event_id
    event_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = (event_dir / saved_filename).resolve()
    upload_dir_resolved = upload_dir.resolve()
    
    # Path Traversal 방어: 저장 경로가 upload_dir 하위인지 확인
    if not str(file_path).startswith(str(upload_dir_resolved)):
        raise ValueError("Invalid file path")
    
    return saved_filename, file.filename
```

### 2. SQL Injection 방지

```python
# SQLAlchemy ORM 사용으로 자동 방지
# 절대 f-string이나 +로 쿼리 작성 안 함
event = db.query(Event).filter(Event.id == event_id).first()  # OK
# event = db.query(Event).filter(f"id = {event_id}").first()  # NO! SQL Injection 위험
```

### 3. API 인증 (현재 미구현, 향후 추가)

```python
# 과제 범위에서는 구현 X, 향후 JWT 추가 가능
# from fastapi.security import HTTPBearer
# security = HTTPBearer()
```

---

## 성능 최적화

### 1. 데이터베이스 인덱싱

```sql
-- 자주 조회되는 필터링
CREATE INDEX idx_events_couple_date ON events(couple_id, date);
CREATE INDEX idx_photos_event ON photos(event_id);
CREATE INDEX idx_orders_couple ON orders(couple_id);
```

### 2. N+1 쿼리 방지

```python
# Bad: N+1 쿼리 발생
events = db.query(Event).filter(Event.couple_id == couple_id).all()
for event in events:
    photos = event.photos  # 각 event마다 쿼리 발생!

# Good: Eager loading
from sqlalchemy.orm import joinedload
events = db.query(Event)\
    .options(joinedload(Event.photos))\
    .filter(Event.couple_id == couple_id)\
    .all()
```

### 3. 응답 캐싱 (선택)

```python
# 캘린더는 자주 변경되지 않으므로 캐시 가능
from functools import lru_cache

@lru_cache(maxsize=32)
def get_timeline_cached(couple_id: str, db: Session):
    return get_timeline(couple_id, db)
```

---

## 모니터링 및 로깅

### Logging 설정

```python
# backend/app/config.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/data/weddinglog.log'),
        logging.StreamHandler()
    ]
)
```

### 헬스체크 엔드포인트

```python
# backend/app/main.py
@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now()}
```

---

*문서 작성일: 2026-04-23*  
*버전: 1.0*  
*상태: 확정*
