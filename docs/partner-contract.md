# 파트너 API 호환 계약 (가상 스위트북)

> **Lv3 평가 포인트**: 데이터 모델링·직렬화 능력 증거 문서.
> 본 문서는 WeddingLog 의 `GET /api/orders/{order_id}/export` 가 생성하는
> ZIP 바이너리가 **파트너(가상의 스위트북 인쇄소)** 의 주문 접수 API 와
> 어떻게 1:1 로 매핑되는지 정의한다.

## 왜 ZIP 인가?

파트너는 외부 시스템이고, 우리는 그들의 API 변경 주기 · 인증 · 레이트리밋을
통제할 수 없다. 따라서 **한 번의 다운로드로 주문 1건이 완전히 복원 가능한
셀프 완결(self-contained) 파일 묶음** 을 넘기는 것이 가장 낮은 결합도이며
사람이 검수 · 재처리 · 보관하기에도 적합하다.

ZIP 은 네트워크 전송 · 수동 검수 · 재업로드(webhook 재시도) · 아카이빙 네
가지 목적을 동시에 충족한다.

## ZIP 내부 구조

```
ord_xxxxx.zip
├── order.json              (주문 메타 + 커플 + album_layout, schema_version 포함)
├── captions.json           (photo_id → caption/date/category 룩업)
└── chapters/
    ├── 01_wedding_photo/
    │   ├── pho_xxx.jpg
    │   └── pho_yyy.jpg
    ├── 02_preparation/
    ├── 03_ceremony/
    ├── 04_honeymoon/
    └── 05_etc/
```

### 구조의 이유 (각 결정의 근거)

| 결정 | 이유 |
|------|------|
| `chapters/NN_key/` 디렉토리 | 파트너가 챕터 순서를 **파일시스템만으로** 인식. JSON 을 파싱하지 않고도 인쇄 큐에 투입 가능. |
| `{photo_id}.jpg` 파일명 | `album_layout.chapters[*].pages[*].photo_refs[*].file` 과 1:1 매칭. 페이지 레이아웃이 파일 경로를 직접 참조. |
| `captions.json` 의 **photo_id 키** | 파트너가 캡션을 페이지에 주입할 때 **O(1) 룩업**. 배열 순회 불필요 (Council m7 권고). |
| `schema_version` 필드 | 파트너가 자신이 지원하는 스키마 버전을 바로 식별 → API 진화에 대비. |
| UTF-8 JSON + `ensure_ascii=False` | 한글 캡션·주소를 원본 그대로 보존. 파트너가 re-encode 불필요. |

---

## order.json ↔ 파트너 API 페이로드 매핑

WeddingLog 가 생성하는 `order.json` 과 **가상 스위트북 API**
`POST https://api.sweetbook.com/v1/orders` 요청 바디의 필드별 매핑.

| order.json 필드 | 파트너 API 필드 | 변환 규칙 |
|---|---|---|
| `order_id` | `partner_ref` | 파트너가 자신의 주문 ID 와 별도로 외부 참조용으로 보관. |
| `schema_version` | `api_version` | 버전 협상 ("1.0" → 파트너 v1 호환). |
| `couple.groom_name`, `couple.bride_name` | `metadata.couple_names` | `"{groom}/{bride}"` 로 join. |
| `couple.wedding_date` | `metadata.wedding_date` | ISO 8601 (YYYY-MM-DD), 동일. |
| `couple.tagline` | `metadata.tagline` | 앨범 표지 문구. |
| `specs.format` | `product.size_variant` | `SQUARE` → `"21x21"`, `A4` → `"21x29.7"`. |
| `specs.cover_type` | `product.cover_variant` | `HARD` → `"hardcover"`, `SOFT` → `"softcover"`. |
| `specs.quantity` | `product.quantity` | 1–10 정수. |
| `specs.total_pages` | `product.page_count` | 동일. |
| `specs.total_price` | `billing.total_krw` | 파트너는 원화(KRW) 고정 통화. |
| `album_layout.chapters[*]` | `layout.sections[*]` | 1:1 (chapter → section 리네이밍). |
| `album_layout.chapters[*].pages[*].template` | `layout.sections[*].pages[*].template_code` | `T1`–`T5` 코드를 그대로 전달. |
| `album_layout.chapters[*].pages[*].photo_refs[*].file` | `layout.sections[*].pages[*].assets[*].path` | ZIP 내부 상대 경로 → 파트너 저장소의 경로로 resolve. |
| `recipient.name` | `shipping.recipient_name` | 1:1. |
| `recipient.phone` | `shipping.recipient_phone` | 010-xxxx-xxxx → 파트너가 국가코드 +82 재포맷. |
| `recipient.address` | `shipping.address_line` | 한국 기본 주소 체계. |
| `status` | `order_state` | `pending` → `"received"`, `processing` → `"in_production"`, `completed` → `"delivered"`. |
| `created_at`, `export_at` | `timestamps.*` | ISO 8601 UTC (`...Z`). |

## captions.json ↔ 파트너 캡션 주입 API

파트너의 페이지 렌더링 엔진은 주로 **페이지 순회 + 각 사진에 캡션 매칭** 으로
동작한다. 캡션을 페이지 구조에 직접 임베드하지 않고 별도 `captions.json` 으로
분리한 이유:

1. **재생성 비용**: 캡션은 AI/수동 편집으로 자주 바뀌므로 사진 파일과 레이아웃에는
   손대지 않고 captions.json 만 diff 로 교체 가능.
2. **다국어 확장**: 현재는 한글만 지원하지만, 추후 `captions.{locale}.json` 로
   다국어 테이블을 얹을 수 있다.
3. **O(1) 룩업**: 파트너 엔진이 `photo_id` 로 직접 조회 → 성능 확보.

```json
{
  "pho_abc123": {
    "file": "chapters/01_wedding_photo/pho_abc123.jpg",
    "caption": "처음 웨딩드레스를 입던 날",
    "caption_source": "ai",
    "date": "2025-12-14",
    "category": "WEDDING_PHOTO"
  }
}
```

| captions.json 필드 | 파트너 필드 | 비고 |
|---|---|---|
| `<photo_id>` (key) | `asset_id` | 파트너 자산 ID 와 동일. |
| `.file` | `asset.path` | ZIP 내부 경로 → 파트너 저장소 경로. |
| `.caption` | `asset.caption_ko` | 한글. |
| `.caption_source` | `asset.caption_origin` | `"ai"`/`"template"`/`"manual"`. |
| `.date` | `asset.captured_date` | ISO 8601 (YYYY-MM-DD). |
| `.category` | `asset.tags` | 1-element 배열로 래핑. |

---

## 에러 / 엣지 케이스

| 상황 | WeddingLog 응답 | 파트너 측 처리 |
|---|---|---|
| `order_id` 없음 | `404 Not Found` | N/A (요청 전 검증). |
| `chapters_selected` 의 총 photo 0장 | `400 Bad Request`, `"no photos selected"` | 빈 앨범은 인쇄 불가. |
| 디스크에 사진 파일 누락 | 해당 파일을 ZIP 에서 제외, 로그 경고 | 파트너가 `captions.json` 에는 있는데 asset path 를 찾지 못하면 에러 리포트. |
| `album_layout` 미존재 | 서버에서 `chapters_selected + photo.category` 기반 폴백 레이아웃 생성 | 파트너는 차이를 알 수 없음 (항상 채워진 layout 수신). |

---

## 면접 답변 포인트

> **"Lv3 데이터 모델링의 핵심은 파트너가 ZIP 하나만 받으면 즉시 인쇄 큐에
> 투입할 수 있는 셀프 완결 구조를 설계한 것.**
>
> `order.json` 은 주문·스펙·수령인·layout 까지 **주문 1건의 상태 스냅샷**
> 이다. `captions.json` 은 캡션을 사진 파일명 기준으로 분리해 **O(1) 룩업**
> 과 **다국어/편집 교체** 를 쉽게 만든다. `chapters/` 디렉토리 구조는 JSON
> 을 파싱하지 않더라도 파일시스템만 보고 챕터 순서를 읽을 수 있게 설계했다.
>
> `schema_version` 필드로 API 진화(v1 → v2)에 대비하고, Path Traversal 방어
> (Council B6) 를 통과한 경로만 ZIP 에 포함시켜 보안을 유지한다. 100MB 이하
> 주문은 `BytesIO + ZIP_DEFLATED` 메모리 방식으로 처리하고, 이후 대형
> 프리미엄 상품이 생기면 `/tmp` 스풀링으로 전환하도록 서비스 경계를
> 잡아두었다."

---

## 변경 이력

| 버전 | 날짜 | 변경 | 근거 |
|------|------|------|------|
| 1.0 | 2026-04-23 | 최초 스키마 (Lv3 과제) | Phase 6 Lv3 완료 |
