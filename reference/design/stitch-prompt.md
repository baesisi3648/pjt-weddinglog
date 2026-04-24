# WeddingLog — Stitch 리디자인 프롬프트 (v2)

> Google Stitch(withgoogle.com/stitch)에 **한 번에 복사·붙여넣기**해서 WeddingLog를 **공유 다이어리 감성**(레퍼런스: Lubble류 커플 다이어리 앱)으로 리디자인하기 위한 프롬프트 모음.

---

## 사용법

1. https://stitch.withgoogle.com 접속 → 새 프로젝트 생성
2. 아래 **[1] 메인 프롬프트** 전체를 복사해서 붙여넣기
3. `{{ACCENT_OPTION}}` 을 **Soft Coral** (권장, 레퍼런스와 동일) 또는 **Olive Green** 으로 치환
4. Generate → 6개 화면 × 2개 뷰(desktop/mobile) 시안
5. 마음에 들면 Export → HTML/CSS 다운로드 후 코드베이스에 이식
6. 특정 화면만 재시안하려면 **[2] 화면별 개별 프롬프트** 사용

---

## 디자인 방향 요약 (레퍼런스 인사이트)

- **종이 · 다이어리 감성** — 배경이 순백(#FFFFFF)이 아니라 따뜻한 아이보리(#F5F0E6), 마치 크림 색 편지지나 낡은 다이어리
- **레이어드 폴라로이드** — 사진 카드는 흰 테두리 + 살짝 회전(-2~+3도) + 아주 얇은 그림자. 포스트잇처럼 서로 살짝 겹침
- **손글씨 느낌 없이** — 폰트는 깔끔한 세리프(Fraunces)와 산세리프(Pretendard). 아날로그 감성은 **색·레이아웃·여백**으로 전달
- **취소선 완료** — 완료된 항목은 취소선 + 연한 muted 색상 (체크박스는 accent 색 채우기)
- **검은 원형 FAB** — 우측 하단 56px 검은 원, 흰 아이콘(+ 또는 ✎)
- **아코디언 체크리스트** — 체크박스 하나당 한 줄, 1px hairline으로만 구분

---

## 컬러 팔레트

**포인트 컬러 둘 중 하나만** 선택 (배경은 항상 아이보리 고정).

### 옵션 A — Soft Coral (권장, 레퍼런스 그대로)
```
accent-50   #FFF5F1   very soft coral tint
accent-200  #FFD4C8   light peach
accent-500  #E89F8E   primary coral (로고, 체크, 이모지 강조, CTA)
accent-700  #C77D6D   deep coral (hover, active, 진한 텍스트 강조)
```

### 옵션 B — Olive Green (서브)
```
accent-50   #F3F5EF   very light sage
accent-200  #DCE4D3   soft sage
accent-500  #6B7A5A   primary sage/olive
accent-700  #4A5642   deep olive
```

### 공통 Neutrals
```
ink         #0F0F10   헤드라인 + 본문 (near-black)
ink-80      #2B2B2D   보조 텍스트
paper       #FFFFFF   카드 배경 (폴라로이드, 포스트잇 카드)
paper-raise #FFFEFB   약간 더 밝은 흰 (레이어드 카드 위 카드)
bg          #F5F0E6   페이지 배경 (따뜻한 아이보리 — 편지지 느낌)
bg-soft     #EDE7D8   더 진한 아이보리 (섹션 구분 대신 미묘한 톤 차이)
line        #E3DBC8   1px 하어라인 (아이보리 톤에 맞춘 베이지 라인)
muted       #8A8376   보조 텍스트 (warm gray, 아이보리 배경에 어울림)
muted-strike #B5AEA0  완료 취소선용 연한 muted
```

---

## [1] 메인 프롬프트 (복사·붙여넣기용 — 영문)

> 아래 블록 전체를 Stitch에 붙여넣으세요.
> **`{{ACCENT_OPTION}}`** 를 `Soft Coral (#E89F8E primary, #C77D6D deep)` 또는 `Olive Green (#6B7A5A primary, #4A5642 deep)` 로 치환.

```
# Project: WeddingLog — a shared wedding diary web app

## Concept
A warm, paper-diary-style web app for couples preparing for their wedding. Couples jot milestones on a shared monthly calendar, paste photos like polaroids, check off to-dos together, and the accumulated records flow straight into a printed wedding photo book they can order. The vibe is a couple's shared paper diary, not a corporate productivity tool.

## Target users
Korean couples in late 20s to mid 30s preparing for small or medium weddings. Tasteful, sentimental, budget-aware.

## Mood board
- Warm ivory paper, like a thick letter pad or an old diary
- Polaroid photos with thin white borders, slightly rotated (-3 to +3 degrees), very faint drop shadow
- Sticky notes, handwritten-feel arrangements — but fonts remain clean serif/sans
- Think: Kinfolk magazine warmth meets a couple's personal journal
- Reference feeling: a shared diary couples keep in a drawer and open together on Sundays

## Color system (STRICT)
- Ink (primary text, icons, dark CTAs): #0F0F10
- Paper (card surfaces, polaroid borders): #FFFFFF
- Background (page): #F5F0E6 (warm ivory, the "diary paper")
- Background soft (section differentiation): #EDE7D8
- Hairline (1px borders): #E3DBC8
- Muted (secondary text): #8A8376
- Muted strike (completed item text): #B5AEA0
- Accent: {{ACCENT_OPTION}}

NO gradients. NO colorful category chips (coral/lavender/mint mix) — all categories use monochrome ink text + a small icon. Accent color is used ONLY for:
- Brand mark (W♥ logo heart)
- Checked state (checkbox fill, radio)
- Active navigation underline
- Hover state on interactive text
- D-day countdown hero (subtly)
- Filled primary CTA in emotional moments (e.g., "앨범으로 만들기" on Timeline)

## Typography
- Display / headlines: Fraunces (serif), weights 300-500, loose letter-spacing for large sizes
- UI / body: Pretendard (sans-serif), weights 400-600
- Mono (order IDs only): JetBrains Mono or ui-monospace, sized down to 13px
- Use serif for: screen titles, couple names, D-day numbers, chapter numbers, hero copy
- Use sans for: buttons, navigation, labels, body copy, form inputs, metadata

## Layout primitives
- Radius: 8px for cards, 12px for the FAB and prominent CTAs, 2-4px for inline tags
- Shadow: mostly avoid. Polaroid photos get `0 1px 2px rgba(0,0,0,0.06)` + `0 2px 8px rgba(0,0,0,0.04)`. FAB gets a soft `0 4px 12px rgba(0,0,0,0.1)`. Everything else flat.
- Grid: 1200px max-width on desktop, 24px horizontal padding. Mobile single column with 20px side padding.
- Buttons: 44px height standard, 52px for primary emotional CTA. Rounded 8px.
- Icons: Lucide style (outlined, 1.5px stroke), 20px default. No emoji unless directly written by the user.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64
- Photo cards (polaroid): white frame 6px padding around image, subtle rotation, optional small caption below the photo in Fraunces Italic 13px

## Shared top header (every screen)
Pinned top, background matches page (ivory), with a 1px hairline bottom divider.
- Left: square monogram "W" with a tiny accent-colored "♥" next to it, then wordmark "WeddingLog" in Fraunces Medium 20px
- Right: nav "Home · Calendar · Timeline · Orders" in Pretendard 14px. Active link: 2px accent underline below the word, tight to the baseline. Hover: text-color shifts to accent-700.
- No search, no dropdowns, no avatar menu (single dummy couple for now)

## Floating Action Button (where applicable)
- 56px diameter, pure black (#0F0F10), white icon (Lucide + or pencil), subtle shadow
- Fixed to bottom-right, 24px from edges on desktop, 20px on mobile
- On Calendar → "+" (new event). On EventDetail → pencil (edit). On Timeline → no FAB.

---

## 6 Screens to design (Korean UI text, responsive desktop 1440 + mobile 390)

### Screen 1 — Home (홈)
A warm opening, like the first page of a diary.

Hero card (full-width, inside the main container, ivory with a 1px hairline):
- Top small eyebrow label in Pretendard uppercase: "TOGETHER SINCE 2026"
- Couple names large in Fraunces 44px desktop / 32px mobile: "철수 ♥ 영희" — heart in accent color
- D-day in Fraunces 80px desktop / 56px mobile, very elegant: "D-184"
- Sub-note below in Pretendard 13px muted: "앨범 주문 추천: D-21" — accent dot when inside 21 days
- No hero background image, just generous whitespace

Section "이번 주 할 일" (eyebrow: "THIS WEEK"):
- Max 3 rows. Each row is like a to-do line: circular checkbox left (accent fill when checked, ink hairline when unchecked), title middle, D-N badge right in serif
- Completed items: checkbox filled with accent, title gets strikethrough and muted-strike color
- Hairline between rows
- Below the list: a muted "모두 보기 →" link

Section "최근 기록" (eyebrow: "RECENT"):
- 6 polaroid-style photos in a 3-column × 2-row grid
- Each polaroid: 6px white frame, slight random rotation (-2 to +2 degrees), soft shadow
- Empty state: muted "아직 기록이 없어요 — 첫 사진을 올려보세요" + an arrow link

Bottom CTA pair:
- Primary black filled button "캘린더로 이동" with arrow icon (full-width on mobile, auto-width on desktop)
- Accent outline button "앨범 주문하기" — enabled when selected photos ≥ 1

### Screen 2 — Calendar (캘린더)
The heart of the app — a shared monthly calendar that feels like a pinboard.

Header row:
- Tab toggle left: "월간" / "리스트" (ink filled when active)
- Month label center in Fraunces 20px: "2026년 4월"
- Right: "◀", "오늘" (hairline-outlined pill), "▶"
- Small ghost button top-right: "AI 체크리스트 자동 생성" in accent text

Monthly grid 6 rows × 7 cols:
- Each cell min-height 96px desktop / 72px mobile
- Date number top-left in Pretendard 14px. Weekends in muted. Today wrapped with 1px accent ring.
- If a date has photos, show up to 2 stacked polaroid-mini thumbnails (40×40px, tiny 2px white frame, small rotation), with "+N" badge top-right if more
- If a date has events without photos, show a single-line monochrome label in Pretendard 11px: small ink icon + title truncated
- Sunday column dates in a slightly muted tone to distinguish weekends
- Hairline between cells (#E3DBC8)

Floating black FAB "+" bottom-right for quick event creation.

### Screen 3 — EventDetail (일정 상세 · 다이어리 페이지)
This is where the diary-page feeling is strongest.

Top nav:
- Back arrow + breadcrumb "2026년 4월 · 캘린더" in muted
- Title in Fraunces 32px
- Date below in Pretendard 13px muted + monochrome category tag (ink border, small icon + label)

Diary body, vertical flow with breathing space:
- "오늘의 메모" eyebrow + textarea with hairline border, ivory background (inherit page bg), placeholder "오늘 기록하고 싶은 이야기는..."
- Photo upload zone: dashed 1.5px accent border, 160px tall, centered camera icon + "사진을 드래그하거나 클릭해서 올려주세요" in muted. On drag-over, fill with accent-50 tint.
- Photo grid: 3 cols desktop, 2 cols mobile, 12px gap. Each photo as polaroid (6px white frame, very subtle rotation, soft shadow) with caption text in Fraunces Italic 13px below the frame (not inside).
- Each polaroid has a tiny delete X top-right on hover (black circle with white X, 24px).
- Under each photo: small "AI 캡션 추천" link in accent text — opens a compact caption selector showing 3 radio options with a source badge "AI 생성" (accent dot) or "기본 템플릿" (muted dot).

Sticky bottom bar:
- "저장" (ink filled, primary) + "취소" (ghost)

### Screen 4 — Timeline (타임라인 · 앨범 미리보기)
The app's magic moment — scattered diary pages come together as a draft photo book.

Top meta band (centered, hairline below):
- "Timeline" in Fraunces 28px
- Subtitle in Pretendard 13px muted: "총 30장 · 12페이지 예상"
- Right-side mini CTA "앨범으로 만들기 →" in accent text

Chapter blocks (each like a chapter divider page in a book):
- Huge Fraunces "01." in accent color, 80px, letter-spacing -2px, sits left
- Right of the number: chapter title in Fraunces 28px "웨딩촬영 · 10장"
- 48px gap, then the photos

Photo grid per chapter:
- 3 columns desktop, 2 columns mobile, 16px gap
- Each photo as larger polaroid: 8px white frame, 1:1 aspect, very subtle rotation (-1 to +2 degrees)
- Caption below each polaroid in Fraunces Italic 14px
- Checkbox top-right of the polaroid (circular, accent-filled when checked): toggles include/exclude from album
- Unchecked photos: 40% opacity overall + caption becomes muted-strike with strikethrough
- 64px vertical gap between chapters

Bottom anchor band:
- Full-width accent filled CTA "앨범으로 만들기 (N장 선택됨)" at 56px height
- Below it, tiny muted note: "선택된 사진만 앨범에 포함됩니다"

### Screen 5 — OrderCheckout (주문 체크아웃)
A minimal 4-step flow that feels like a quiet confirmation ritual.

Stepper at top, horizontally laid out:
- 4 circular step markers connected by 1px hairlines
- Completed steps: filled ink, white checkmark inside
- Current step: ink outlined, accent-filled inside
- Future steps: muted outlined, empty
- Labels below each marker: "앨범 확인 · 옵션 선택 · 배송 정보 · 주문 완료"

Step 1 — 앨범 확인:
- Two-column on desktop, stacked on mobile
- Left: chapter summary list with count, using the same category labels as elsewhere
- Right: mini book illustration — a simple line drawing of a closed photo book with the names "철수 & 영희" in Fraunces on the cover, tiny year below
- Summary card: "총 30장 · 12페이지 · 4개 챕터"

Step 2 — 옵션 선택:
- Three option groups as large radio cards:
  - 판형: two side-by-side radios "정사각형 21cm" / "A4 21×29.7cm" — each card shows a tiny proportion diagram
  - 표지: "하드커버 (+20,000원)" / "소프트커버"
  - 수량: number stepper with - / + buttons, 1 to 10
- Live price in Fraunces 40px on the right: "180,000원"
- Below price, Pretendard 12px muted breakdown: "1권 기본가 · 하드커버 +20,000원"
- If quantity = 1: muted note "1권도 충분합니다. 우리 둘만의 기록."
- If quantity ≥ 2: muted note "양가 부모님께도 드리기 좋은 권수예요."

Step 3 — 배송 정보:
- Single-column form, stacked inputs with 1px hairline border, 48px tall, label above each
- 수령인 이름, 연락처 (010-xxxx-xxxx placeholder), 주소 (2-line input)

Step 4 — 주문 완료:
- Centered vertical stack
- Large accent circle with check icon (96px, 2px stroke)
- Fraunces 28px "주문이 완료되었습니다"
- Pretendard 14px muted "주문 ID: ord_20261025_001"
- Fraunces 16px accent "예상 배송일: 2026.11.08 (결혼식 D+14)"
- Two buttons: ink filled "주문 관리로" + ghost "홈으로 돌아가기"

Bottom nav bar on steps 1-3:
- "이전" (ghost, muted) + "다음" or "주문하기" (ink filled or accent filled for final step) + "취소" (tiny text button, muted)

### Screen 6 — Orders (주문 관리)
A quiet list of orders, each one a page in a ledger.

Header:
- Title "주문 관리" in Fraunces 28px
- Subtitle in Pretendard 13px muted "2개의 주문"
- Filter chips row (optional): "전체 · 제작 대기 · 제작 중 · 완료" — current in ink filled

Order cards (vertical stack, 16px gap, each 1px hairline border with 8px radius):
- Top row of card: order ID in mono 14px (left) + date in muted 13px (left) + status chip (right, 1px ink border, thin accent dot + status text)
- Middle row: spec summary in Pretendard 14px "정사각형 · 하드커버 · 3권"
- Price row: "540,000원" in Fraunces 20px right-aligned
- Bottom row: state transition button (pending→processing or processing→completed) as accent outlined button, disabled gray when completed. Next to it: "데이터 다운로드" ghost button with accent text

Empty state:
- Centered in the main area
- Fraunces 24px "아직 주문이 없습니다"
- Pretendard 14px muted "쌓인 기록을 한 권의 앨범으로 만들어보세요"
- Primary ink button "타임라인 보기" with arrow

---

## Interaction notes
- Hover: text color shifts to accent-700 for links, or background gets a 4% accent-50 overlay for cards. No scale, no rotate on hover (rotation is a static polaroid touch, not interactive).
- Focus ring: 2px accent solid, 2px offset, rounded to match the component
- Empty states always in muted with a ghost button to the next logical action
- Loading states: thin skeleton with 1px hairline matching the component shape. No shimmer.
- Success toast: ink filled rounded pill, white text, slides up from bottom-right, 3 sec duration
- All transitions: 160ms ease-out. No bounces, no spring.

## Do NOT include
- Colorful category chips (coral/lavender/mint/gold rainbow) — monochrome category tags only, accent color reserved for a few semantic purposes
- Drop shadows beyond the two exceptions (polaroid, FAB)
- Emoji-style icons (use outlined Lucide icons)
- Bottom tab bar — use the top header nav only
- Side navigation drawers
- Gradient backgrounds — the ivory paper is enough
- Rounded corners beyond 12px
- Pastel gradient fills on buttons

## Deliverables
- 6 screens × 2 viewports (desktop 1440px, mobile 390px) = 12 frames
- Component library to export:
  - Button: ink-filled, ink-outlined, accent-filled, accent-outlined, ghost, text-only
  - Input, Textarea (1px hairline, ivory-fill-on-focus)
  - Checkbox (circular, accent-filled when checked)
  - Radio card (large option card with icon or diagram)
  - CategoryTag (monochrome, icon + label)
  - StatusChip (1px border, tiny accent dot)
  - Stepper (horizontal 4-step with hairline connectors)
  - Modal (simple centered, subtle overlay)
  - PhotoCard / Polaroid (6-8px white frame, rotation -2 to +3, soft shadow, optional checkbox and source badge)
  - EmptyState
  - FAB (black 56px with white icon)
  - Navbar (top header with active underline)

- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96
- Grid: 12-column desktop with 24px gutter; single column mobile with 20px side padding
```

---

## [2] 화면별 개별 프롬프트 (fine-tune용)

Stitch에서 특정 화면만 재시안할 때.

### Home only
```
Redesign WeddingLog Home as the first page of a warm paper diary. Palette: ivory #F5F0E6 page, white #FFFFFF cards, ink #0F0F10 text, accent {{ACCENT_OPTION}}. Hero: "철수 ♥ 영희" in Fraunces 44px with heart in accent, D-184 in Fraunces 80px, sub-note "앨범 주문 추천: D-21". Section "이번 주 할 일": up to 3 rows with circular accent-fill checkbox, title, D-N right — completed row gets strikethrough + muted-strike color. Section "최근 기록": 3×2 polaroid grid with -2 to +2 degree rotation and soft shadow. Bottom CTAs: ink-filled "캘린더로 이동" primary, accent-outlined "앨범 주문하기" secondary. No colorful chips.
```

### Calendar only
```
Redesign WeddingLog monthly calendar as a shared paper pinboard. Ivory bg #F5F0E6, 6×7 grid min-height 96px. Date cells with photos show up to 2 stacked polaroid-minis (40×40, 2px white frame, tiny rotation) and "+N" badge if more. Cells with only text events show a one-line monochrome label (small icon + title). Today has 1px accent ring around the date. Black 56px FAB bottom-right with white "+". Top right ghost "AI 체크리스트 자동 생성" in accent text. Tab toggle "월간/리스트". No rainbow category chips.
```

### EventDetail only
```
Redesign WeddingLog event detail as a diary page. Ivory bg. Back arrow + breadcrumb muted. Title Fraunces 32px, date + monochrome category tag under. Memo textarea with hairline border inherits page bg. Dashed 160px photo upload zone accent border. 3-col (2 mobile) polaroid grid with 6px white frame, -2 to +2 degree rotation, soft shadow; caption in Fraunces Italic 13px below the frame. Each polaroid has hover delete X and an "AI 캡션 추천" link below. Caption source badge shows "AI 생성" (accent dot) or "기본 템플릿" (muted dot). Sticky bottom: ink-filled "저장" + ghost "취소".
```

### Timeline only
```
Redesign WeddingLog Timeline as a draft photo book. Ivory bg, center container max 880px. Each chapter has huge Fraunces "01." (80px, accent, letter-spacing -2) left and chapter title "웨딩촬영 · 10장" Fraunces 28px right. 3-col (2 mobile) polaroid grid per chapter, 8px white frame, -1 to +2 degree rotation, 1:1 ratio, caption in Fraunces Italic 14px below frame. Checkbox top-right of polaroid toggles include/exclude; unchecked goes 40% opacity and caption strikethrough muted. 64px gap between chapters. Header "총 30장 · 12페이지 예상". Bottom anchor: full-width accent filled "앨범으로 만들기 (N장 선택됨)" 56px tall.
```

### OrderCheckout only
```
Redesign WeddingLog 4-step checkout as a quiet confirmation ritual. Ivory bg. Horizontal stepper with 4 circular markers on 1px hairlines: completed = ink filled with white check, current = ink outlined with accent fill, future = muted outlined. Step 2 option cards: 판형(정사각형/A4 with proportion diagrams), 표지(하드/소프트), 수량(number stepper). Live price Fraunces 40px right. quantity=1 → "1권도 충분합니다" muted note; ≥2 → "양가 부모님께도" note. Step 4: centered, 96px accent circle with check, Fraunces 28px "주문이 완료되었습니다", mono order ID, accent "예상 배송일: D+14" line, two buttons. Bottom nav bar steps 1-3: ghost prev, filled next/order, text cancel.
```

### Orders only
```
Redesign WeddingLog Orders as a quiet ledger. Ivory bg. Title "주문 관리" Fraunces 28px + subtitle muted "2개의 주문". Order cards stacked 16px gap, each 1px hairline border with 8px radius. Card layout: order ID in mono 14px + date muted + status chip (1px ink border, small accent dot + status text) — spec summary Pretendard 14px — price Fraunces 20px right-aligned — bottom row with accent-outlined state transition button ("제작 시작" / "완료로 변경" / disabled) + ghost "데이터 다운로드" with accent text. Empty state: Fraunces 24px "아직 주문이 없습니다" + muted sub + ink "타임라인 보기" button.
```

---

## [3] 현 코드베이스 이식 가이드

### Tailwind config 치환 (Soft Coral 선택 시)
```js
// frontend/tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        ink: '#0F0F10',
        'ink-80': '#2B2B2D',
        paper: '#FFFFFF',
        'paper-raise': '#FFFEFB',
        bg: '#F5F0E6',        // warm ivory
        'bg-soft': '#EDE7D8',
        line: '#E3DBC8',
        muted: '#8A8376',
        'muted-strike': '#B5AEA0',
        accent: {
          50:  '#FFF5F1',
          200: '#FFD4C8',
          500: '#E89F8E',   // soft coral — 레퍼런스 톤
          700: '#C77D6D',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Pretendard', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '8px',
        button: '8px',
        fab: '9999px',
      },
      boxShadow: {
        polaroid: '0 1px 2px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        fab: '0 4px 12px rgba(0,0,0,0.1)',
      },
      rotate: {
        'polaroid-l': '-2deg',
        'polaroid-r': '2deg',
        'polaroid-r2': '3deg',
      },
    },
  },
};
```

### 일괄 치환할 것
- 기존 `coral-500 / lavender-500 / mint-500 / gold-500` → 전부 **accent-500** 하나로
- 기존 카테고리 색상 매핑(`specs/shared/design-tokens.yaml`의 `category_color_mapping`) → **이모지 아이콘 + 모노크롬 라벨** 구조로 전환 (색상 제거)
- `handoff.css`의 `--wl-coral` 등 CSS 변수 → accent 변수 하나로 수렴
- 모든 shadow-md, shadow-lg → 삭제 또는 hairline border로 대체 (Polaroid, FAB 예외)

### 폴라로이드 컴포넌트 예시 (참고)
```tsx
function Polaroid({ src, caption, rotate = 'polaroid-r' }: Props) {
  return (
    <figure className={`bg-paper p-[6px] shadow-polaroid rotate-${rotate} inline-block`}>
      <img src={src} alt="" className="block w-full aspect-square object-cover" />
      {caption && (
        <figcaption className="font-display italic text-[13px] text-ink-80 mt-2 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
```

### 면접 답변 재료
- **"왜 모노크롬 + 단일 포인트로 리디자인했나?"**
  → Council 리뷰에서 "카테고리 9개 vs 색 4계열 공유 → 색만으로 식별 불가" 지적이 있었고, WCAG 2.1 AA 권고(색상 단독 정보 전달 금지)에도 위배. 아이콘 + 모노크롬 전략으로 접근성과 브랜드 일관성을 동시 확보.
- **"왜 Soft Coral이었나?"**
  → 페르소나 C(부모 효도형)·D(스몰웨딩/만혼)가 원하는 "따뜻하고 고급 감성"을 충족. Coral은 결혼의 설렘·온기와 어울리되, 기존 쨍한 핑크와 달리 차분한 톤으로 "성숙한 커플" 포지셔닝.
- **"왜 폴라로이드 은유?"**
  → "기록이 그대로 책이 된다(Zero Friction)"는 USP를 **시각적으로** 체감시키는 장치. 페이지 안에서 이미 사진이 책 페이지처럼 배열되어 있으면 사용자는 "내가 이미 만들고 있는 책"을 느낌. 스냅스 대비 핵심 차별화.

---

## 작성 규칙

- Stitch가 한국어 UI 텍스트를 그대로 보존하도록 프롬프트는 **영어 지시 + 한국어 UI 텍스트** 이중 구조
- 색상 HEX는 `Color system` 섹션에서만 바꾸면 전체 전파
- 레퍼런스 스크린샷의 정체(앱 이름)는 프롬프트에 직접 언급하지 않고 **분위기만** 서술 (Stitch가 특정 앱 복제 방어 로직에 걸리지 않도록)

---

*작성일: 2026-04-24 (v2 — 공유 다이어리 감성 레퍼런스 반영)*
*선행 참조: `specs/shared/design-tokens.yaml`, `docs/planning/06-screens.md`, Council 리뷰 M3*
