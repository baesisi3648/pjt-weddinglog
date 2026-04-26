# WeddingLog — 더미 이미지 생성 프롬프트 가이드

> 목적: **철수 & 영희** 한 커플의 1년짜리 결혼 준비 + 결혼 후 기록을 **일관된 필름 톤**으로 100+장 생성
> 배포: 젠스파크(Genspark) AI 이미지 생성 → `backend/seed_assets/photos/` 로 대체
>
> ⚡ **복붙용 프롬프트는 별도 파일에**: [`image_prompts_ready_to_use.md`](./image_prompts_ready_to_use.md)
>    → 각 블록이 오버라이드·옷·씬·스타일을 모두 포함한 자체완결 형태. 한 번 복사로 바로 젠스파크 투입.
>
> 이 파일은 **모델 선택 가이드 · 워크플로 · 의상 표 · 팁** 등 참고 정보 전용.

---

## 🎯 모델 추천 (하이브리드 전략)

> **결론**: Nano Banana (Flash) 메인 110장 + GPT Image 2 하이라이트 10장
> **총 예상 비용**: 약 $2~3 (Pro 단독 대비 절반 이하)

| 모델 | 비용 | 강점 | 약점 | 이 프로젝트 용도 |
|---|---|---|---|---|
| ⭐ **Nano Banana (Gemini 2.5 Flash Image)** | 매우 저렴 · 빠름 | 레퍼런스 업로드 시 한국 커플 일관성 충분, 한국 장소·한복 학습 풍부 | Pro 대비 디테일·구도 약간 평범 | **메인 110장** — 일상 데이트·스드메·준비·신혼여행 일반 컷·결혼 후 가족 이벤트 |
| 🎬 **GPT Image 2 (OpenAI)** | 중간 | 시네마틱 구도·조명·감정 전달 탁월, 복잡한 장면 정확 해석 | 한국인 얼굴이 간혹 애매(혼혈 경향), 많이 쓰면 비용↑ | **하이라이트 10장** — 본식 6컷 + 신혼여행 일몰·실루엣 4컷 |
| Nano Banana Pro (Gemini 3 Pro Image) | 비쌈 | 일관성·디테일 최고 | 120장 돌리면 $6+ | 과제 범위엔 오버스펙. 실서비스 시 재검토 |

### 추천 워크플로

```
Step 1. Nano Banana 로 '철수·영희 레퍼런스 시트' 3장 생성
        → 얼굴 마음에 들 때까지 re-roll (빠르니 부담 없음)
Step 2. 확정된 3장을 이후 모든 이미지의 레퍼런스로 업로드
Step 3. 일상·준비·신혼여행 일반 컷 ~110장 Nano Banana
Step 4. 하이라이트 10장만 GPT Image 2 로 (리스트는 아래 섹션)
Step 5. backend/seed_assets/photos/ 에 번호 규칙대로 저장
```

### 왜 Nano Banana (Flash) 메인인가

- **캐릭터 일관성은 레퍼런스 업로드로 보강 가능**. Gemini 2.5 Flash Image도 업로드 레퍼런스를 참조하는 기능이 있어, 얼굴·헤어·톤을 꽤 일관되게 유지함
- **한국 디테일은 여전히 강함**: 한복·예식장·한강·남산 등 Google 학습 데이터 기반
- **속도 × 비용**: 120장 규모에서 빠르고 저렴. re-roll 부담 없음
- **과제 목적에 충분**: 심사자가 앱을 열고 1~2초 내 "분위기 괜찮네" 느끼면 합격선. 영화 수준 완벽함 불필요

### 언제 GPT Image 2 가 결정적인가

- **본식 제단 앞 서약 · 반지 교환 · 퇴장** 같은 **감정 드라마틱 씬**: 시네마틱 구도·조명이 결과물 인상을 확 바꿈
- **신혼여행 일몰·실루엣**: 실루엣은 빛 처리가 까다로운데 GPT Image 2 가 압도적
- **복잡한 multi-element 구성**: 예식장 채플 넓은 샷, 하객 + 신랑신부 + 천장 유리 한 컷에 배치 등

---

## 🎨 전체 스타일 가이드 (모든 이미지 공통)

**Global Style Tokens** — 모든 프롬프트 말미에 붙여서 톤 일관성 유지:

```
Style: shot on Kodak Portra 400 film, natural daylight preferred,
soft warm shadows, subtle grain, shallow depth of field (f/2.8 feel),
candid documentary feel — not posed; warm ivory base tone with
soft coral highlights; slight desaturation; aspect ratio 4:3.
Avoid: plastic skin, waxy skin, over-saturation, dramatic HDR,
AI artifacts, extra fingers, deformed faces, watermark,
generic stock photo look.
```

**이유**: Stitch 디자인 시스템(`#FFF8F1` 아이보리 + `#E89F8E` 소프트 코랄)과 톤을 맞춰 앱 내에서 폴라로이드 프레임에 들어갔을 때 UI와 충돌하지 않음.

---

## 👤 Step 1 — 캐릭터 레퍼런스 시트 (먼저 생성!)

**이 3장을 먼저 만들고, 이후 모든 인물 프롬프트에 레퍼런스로 업로드**합니다. Nano Banana Pro 권장.

### 1-A. 신랑 "철수" (32세)

```prompt
Full-body portrait of a 32-year-old Korean man named Cheolsu.
Average build, height 178cm, clean-shaven, naturally dark hair
in a short side-parted cut, warm brown eyes, gentle
closed-mouth smile. Wearing a cream-colored Oxford shirt
(untucked, sleeves rolled to mid-forearm) and beige chinos,
minimalist white sneakers. Standing in neutral off-white
studio lighting, 3/4 angle to camera, both hands in pockets.
Photorealistic, Kodak Portra 400 film simulation, soft natural
shadows, no makeup, no retouching artifacts. Aspect ratio 4:3.
```

### 1-B. 신부 "영희" (29세)

```prompt
Full-body portrait of a 29-year-old Korean woman named Younghee.
Slim build, height 164cm, natural long wavy hair reaching
mid-back in warm black-brown, dewy fair skin, almond-shaped
eyes with subtle no-makeup makeup, soft nude-pink lips, calm
gentle smile. Wearing a soft ivory oversized knit sweater,
light-wash wide-leg jeans, beige loafers. Standing in neutral
off-white studio lighting, 3/4 angle to camera. Photorealistic,
Kodak Portra 400 film simulation, soft natural shadows,
no retouching artifacts. Aspect ratio 4:3.
```

### 1-C. 커플 기준샷 (두 레퍼런스 업로드 상태에서 생성)

```prompt
[Upload 1-A and 1-B as character references]
Couple portrait: Cheolsu and Younghee standing naturally next
to each other, Cheolsu's hand lightly on Younghee's lower back,
Younghee's head tilted slightly toward him, both softly smiling
at the camera. Neutral off-white studio background. Same
lighting, skin tone, and film stock as reference photos.
Height difference is natural (14cm). Shoulders relaxed.
Kodak Portra 400 simulation. Aspect ratio 4:3.
```

**체크포인트**: 이 3장에서 얼굴·체형이 마음에 들 때까지 re-roll. 이후 모든 이미지 생성 시 **1-A, 1-B, 1-C 세 장을 레퍼런스로 업로드**.

---

## 🎭 Step 1.5 — 의상 변주 (레퍼런스 옷 복제 방지) ⭐ 중요

> **문제**: 레퍼런스 시트의 옷(철수 크림 옥스퍼드 + 베이지 치노 / 영희 아이보리 니트 + 와이드 진)이 **1년 120장 내내 반복**됨. 계절·장소가 바뀌어도 옷만 똑같아 부자연스러움.
>
> **해결**: ① 레퍼런스는 **얼굴·체형만 참고**하도록 프롬프트에 명시 + ② 각 씬에 **옷을 새로 지정**.

### 필수 오버라이드 지시문 (모든 이벤트 프롬프트 **머리에 항상 첨부**)

```
Use the uploaded reference images ONLY for facial features,
hairstyle, and body proportions of Cheolsu and Younghee.
Do NOT copy the clothing from the references — dress them
according to the outfit description in this specific prompt.
```

### 이벤트별 의상 표 (36 이벤트)

각 이벤트마다 **Cheolsu wears / Younghee wears** 라인을 프롬프트 본문 앞에 붙여 복사. 한국 2030 세련된 커플 감성 기준.

| # | 파일 | 계절 | 철수 복장 | 영희 복장 |
|---|---|---|---|---|
| 01 | picnic_hangang | 봄(4월) · 벚꽃 | light beige cardigan, white short-sleeve tee, faded blue denim, white sneakers | pastel floral midi dress, beige cropped cardigan, flat leather sandals |
| 02 | cafe_seongsu | 봄(5월) · 실내 | pale-blue oxford shirt, beige chinos, brown penny loafers | cream ruffle blouse, A-line light-wash denim midi skirt, tan loafers |
| 03 | movie_night | 초여름(6월) · 저녁 | navy short-sleeve tee, black slim jeans, white sneakers | black satin slip dress, ivory light cardigan, black strappy flats |
| 04 | bookstore | 여름(7월) · 실내 | white linen short-sleeve shirt, beige chino shorts, canvas sneakers | ivory french-sleeve mini dress, beige ballet flats |
| 05 | venue_tour | 늦여름(8월) · 격식 | light-gray dress pants, cream button-down shirt, brown oxford shoes | oatmeal midi dress with subtle belt, low nude heels, beige shoulder bag |
| 06 | flower_market | 초가을(9월) · 야외 | beige linen short-sleeve shirt, black tailored slacks, loafers | ivory linen long dress, hair tied low, flat sandals, small woven bag |
| 07 | sdm_meeting | 가을(9월말) · 정돈 | navy fine-knit pullover, beige wool slacks, brown loafers | ivory silk blouse, cream A-line midi skirt, nude flats |
| 08 | autumn_park | 가을(9월말) · 산책 | beige trench coat, white tee, straight denim, white sneakers | cream cable-knit sweater, brown pleated maxi skirt, tan ankle boots |
| 09 | aquarium | 가을(10월) · 실내 | navy hoodie, dark washed jeans, white sneakers | light-gray crewneck knit, wide-leg beige trousers, white sneakers |
| 10 | theme_park | 가을(10월) · 저녁 외출 | camel corduroy jacket, plaid flannel shirt, dark jeans, sneakers | beige corduroy jacket, cream knit, checked midi skirt, brown ankle boots |
| 11 | museum | 늦가을(11월) · 실내 | charcoal wool coat, black turtleneck, gray dress pants, chelsea boots | black turtleneck, long beige wool coat, dark wide pants, loafers |
| 12 | namsan_night | 늦가을(11월) · 야간 | navy wool coat, white fine-knit, black dress pants, charcoal check scarf | camel long wool coat, ivory ribbed knit, black trousers, cream knit scarf |
| 13 | rings_gift | 겨울(12월) · 외출 | camel double-breasted wool coat, white dress shirt, charcoal slacks, brown leather boots | long ivory wool coat, cream knit midi dress, black leather knee boots, small clutch |
| 14 | wedding_studio | 겨울(12월) · **웨딩 촬영** | black tuxedo, white dress shirt, satin black bowtie, black oxford shoes | classic A-line ivory silk wedding gown with lace bodice, soft veil, low ivory heels |
| 15 | christmas_market | 겨울(12월) · 야외 | navy wool duffle coat, ivory turtleneck, dark jeans, plaid scarf, beanie | ivory long padded coat, red tartan scarf, black tights, cream winter boots, mittens |
| 16 | jeju_prewedding | 겨울(12월말) · 여행 | thick cream cable-knit sweater, beige relaxed slacks, brown leather boots | long cream knit dress, ivory long coat, tan ankle boots, crossbody bag |
| 17 | invitation | 겨울(1월 중) · 실내 | gray henley knit top, black lounge pants | oatmeal oversized knit sweater, soft off-white lounge pants |
| 18 | shopping_date | 겨울(1월말) · 외출 | black long wool coat, gray knit, dark jeans, chelsea boots | camel double-breasted coat, ivory fine-knit, black cropped trousers, ankle boots |
| 19 | hanbok_prep | 늦겨울(2월 중) · **한복** | P1~P3: traditional hanbok — navy-blue jeogori (top) with white goreum ribbon, light-gray baji (bottom pants), black beoseon socks, traditional black shoes; P4~P5: casual (cream knit + beige skirt, no hanbok) | P1~P3: traditional hanbok — pale mint-green jeogori with white collar and long goreum ribbon, soft peach-colored chima (long wrap skirt), hair simply pinned with a small ornament; P4~P5: modern ivory knit + beige midi skirt |
| 20 | prewed_late | 초봄(2월말) · 홈 | charcoal oversized sweatshirt, gray sweatpants, white socks | ivory loose-fit t-shirt, cream knit cardigan, soft beige jogger pants |
| 21 | final_packing | 초봄(3월초) · 준비 | P1~P2 실내 casual (gray henley + lounge pants); P3 드라이브 beige light jacket + white tee + dark jeans | P1 실내 cream knit + black slim pants, P2 navy cardigan + jeans, P3 cream coat + beige scarf |
| 22 | rehearsal | 초봄(3월초) · 리허설 | light-gray linen suit, crisp white shirt, no tie, brown loafers | flowy white off-white midi dress with simple bodice, soft pin-up hair, nude heels |
| 23 | wedding_day | **본식** (3/14) | P1~P6: classic black tuxedo, crisp white dress shirt, black satin bowtie, polished black oxford shoes, white pocket square | P1~P6: full A-line ivory silk wedding gown with lace bodice and train, long delicate veil, pearl earrings, ivory satin heels, hair half-up |
| 24 | airport_departure | 초봄(3/17) · 공항 | oversized cream hoodie, black jogger pants, white sneakers, black baseball cap | ivory comfy knit, light-wash straight jeans, white sneakers, black crossbody bag |
| 25 | hotel_checkin | 봄(3/18) · 정물 | (사람 없음) | (사람 없음) |
| 26 | bali_beach | 봄(3/19) · 비치 | P1 white linen open shirt + beige swim shorts + straw hat, P2 silhouette, P3 발자국, P4 navy swim shorts (shirtless), P5 rash guard + swim shorts | P1 ivory crochet cover-up over white one-piece swimsuit, P2 silhouette, P3 발자국, P4 black one-piece swimsuit, P5 snorkel gear over swimsuit |
| 27 | infinity_pool | 봄(3/20) · 풀 | swim shorts only | white cutout one-piece swimsuit (pool lounge float) |
| 28 | bali_dinner | 봄(3/21) · 저녁 | white linen long-sleeve shirt, beige chinos, leather sandals | soft coral silk slip midi dress, gold thin necklace, strappy nude sandals |
| 29 | island_daytrip | 봄(3/22) · 액티브 | pale blue linen shirt (unbuttoned over a white tee), beige tailored shorts, straw hat | P1 ivory linen jumpsuit + straw hat, P2 flowy white maxi dress, P3 cream wrap dress |
| 30 | return_home | 봄(3/24) · 공항 귀국 | gray hoodie, black joggers, white sneakers, tired expression OK | oatmeal cardigan over white tee, dark-wash jeans, white sneakers, messy low bun |
| 31 | album_order | 봄(3/28) · 홈 | charcoal knit top, black joggers | ivory oversized button-down shirt, soft beige knit pants, hair in loose low bun |
| 32 | parents_visit | 봄(4월초) · 단정 외출 | navy knit cardigan, white button-down shirt underneath, beige slacks, brown loafers | ivory satin blouse, beige pleated midi skirt, low nude pumps, small pearl earrings |
| 33 | album_draft | 봄(4/18) · 홈 | (overhead shot, hands only — gray knit sleeve) | (overhead shot, hands only — ivory knit sleeve) |
| 34 | album_delivery | 봄(4/28) · 홈 | plain gray t-shirt, black sweatpants | cream knit cardigan over white tee, soft beige sweatpants |
| 35 | gift_to_parents | 봄(5/3) · 외출 | light beige blazer, white dress shirt, gray trousers, brown loafers | soft coral silk blouse, ivory midi A-line skirt, nude low heels |
| 36 | month_anniversary | 늦봄(5/13) · 저녁 데이트 | charcoal slim suit (no tie), white shirt with top button open, black oxford shoes | black satin slip midi dress, simple gold pendant, black strappy heels |

### 적용 예시 (프롬프트에 어떻게 끼워 넣는가)

**원래 프롬프트**:
```
Photo 1/3 — 돗자리 위의 두 사람
Cheolsu and Younghee sitting on a beige linen picnic blanket
under full-bloom pink cherry blossom trees at Yeouido Han River
Park, Seoul. Spring afternoon golden hour...
```

**옷 덮어쓰기 적용 버전** (머리에 오버라이드 + 옷 라인 추가):
```
Use the uploaded reference images ONLY for facial features,
hairstyle, and body proportions of Cheolsu and Younghee.
Do NOT copy the clothing from the references — dress them
according to the outfit description below.

Outfit:
- Cheolsu wears a light beige cardigan over a white short-sleeve
  tee, faded blue denim jeans, and white sneakers.
- Younghee wears a pastel floral midi dress, a beige cropped
  cardigan, and flat leather sandals.

Scene:
Cheolsu and Younghee sitting on a beige linen picnic blanket
under full-bloom pink cherry blossom trees at Yeouido Han River
Park, Seoul. Spring afternoon golden hour...

[Global Style Tokens]
```

### 01~04 재생성 옵션 (사용자가 이미 만든 것)

현재 01~04는 레퍼런스 옷 그대로 나왔을 가능성이 높습니다. 3가지 선택:

1. **그대로 두기** — 봄~여름 초반이라 레퍼런스 옷(크림 셔츠 + 아이보리 니트)이 아주 크게 어색하진 않음. 시간 절약.
2. **재생성** — 위 의상 표에 맞춰 01~04 재생성. 일관된 스토리 기준으로는 권장.
3. **부분 재생성** — 옷이 특히 어색한 컷만 (예: 04 서점 여름인데 니트 입고 있으면) 골라서 재생성.

05번부터는 위 표 + 오버라이드 지시문으로 바로 적용.

---

## 📆 Step 2 — 이벤트별 프롬프트 (38 이벤트, 총 ~120장)

아래 각 블록을 그대로 젠스파크에 붙여넣고 **Step 1 레퍼런스 3장을 함께 업로드**. 파일명은 `backend/seed_assets/photos/NN_xxx.jpg` 규칙으로 저장.

> 표기 규칙: `# 01_xxx.jpg (N장)` — 01은 파일 시리얼 번호, N장은 해당 이벤트에 필요한 장수.

---

### 🌸 2025년 봄 (D-330 ~ D-270)

#### `01_picnic_hangang.jpg` — 한강 피크닉 (벚꽃, D-330) · 3장

```prompt
# Photo 1/3 — 돗자리 위의 두 사람
Cheolsu and Younghee sitting on a beige linen picnic blanket
under full-bloom pink cherry blossom trees at Yeouido Han River
Park, Seoul. Spring afternoon golden hour. Cheolsu leaning back
propped on one hand, Younghee pouring coffee from a thermos into
a white ceramic cup. Scattered pink cherry petals on the blanket.
Other picnickers blurred in the far background. Soft natural
backlight through petals. [Global Style Tokens]
```

```prompt
# Photo 2/3 — 꽃잎 클로즈업
Close-up of Younghee's open palm holding three pink cherry
blossom petals. Shallow focus, out-of-focus Han River path
and cherry trees behind. Natural sunlight filtering through
branches. [Global Style Tokens]
```

```prompt
# Photo 3/3 — 뒷모습 산책
Cheolsu and Younghee walking away from camera along a Han
River promenade, cherry trees arching overhead, Cheolsu's
arm around Younghee's shoulder. They are mid-laugh, heads
tilted toward each other. Late afternoon warm light, long
soft shadows. [Global Style Tokens]
```

#### `02_cafe_seongsu.jpg` — 단골 카페 (D-310) · 3장

```prompt
# Photo 1/3 — 창가의 영희
Younghee sitting alone by the large window of a modern
Seongsu-dong minimalist café, hands wrapped around a white
ceramic latte cup, looking out at the street. Natural morning
light streaming in from the left. Open notebook and a pressed
flower bookmark on the wooden table. Other tables blurred.
Shallow depth of field. [Global Style Tokens]

# Photo 2/3 — 테이블 오버헤드
Overhead flat-lay of the café table: two glass latte mugs,
a slice of carrot cake on a small ceramic plate, open paper
magazine, Cheolsu's hand writing in a small notebook with a
black fine-tip pen. Warm oak wood table surface, diffused
daylight. No faces visible. [Global Style Tokens]

# Photo 3/3 — 대화 중인 두 사람
Cheolsu and Younghee across from each other at the café table,
both leaning forward mid-conversation, both softly smiling.
Window light from behind Cheolsu softens his outline. Candid
mid-sentence moment, not posed. [Global Style Tokens]
```

#### `03_movie_night.jpg` — 영화 관람 (D-280) · 1장

```prompt
Cheolsu and Younghee in the lobby of CGV Yongsan multiplex in
Seoul at night, standing near a digital movie poster display.
Younghee pointing up at the poster with a grin, Cheolsu balancing
two popcorn boxes and a medium coke in his arms, making a mock-
serious face. Warm interior commercial lighting, reflections on
polished floor. Documentary-style candid. [Global Style Tokens]
```

---

### ☀️ 2025년 여름 (D-250 ~ D-180)

#### `04_bookstore.jpg` — 서점 데이트 (D-230) · 2장

```prompt
# Photo 1/2 — 서가 사이
Younghee in the aisle of a large Kyobo-style bookstore, pulling
a hardcover essay book from an eye-level shelf, Cheolsu crouching
lower in the same aisle reading the spine of another book.
Rows of warmly lit bookshelves recede behind them. Natural
documentary feel. [Global Style Tokens]

# Photo 2/2 — 책 두 권
Overhead shot of two open books on a light oak reading table:
one on wedding essays in Korean, one photobook on European
travel. Cheolsu's and Younghee's hands near the page edges,
not touching each other. Warm reading lamp creating gentle
yellow glow. [Global Style Tokens]
```

#### `05_venue_tour.jpg` — 예식장 투어 강남구 (D-200) · 5장

```prompt
# Photo 1/5 — 채플 입장
Wide shot of an elegant modern chapel-style Seoul wedding hall
interior in Gangnam, Cheolsu and Younghee walking down the
central aisle from the back, looking up at the high glass ceiling.
Soft daylight flooding through. Empty white chairs on both
sides. Their silhouettes centered. [Global Style Tokens]

# Photo 2/5 — 리셉션 홀
Reception hall interior: long tables draped in ivory linen,
white eucalyptus centerpieces, soft chandelier light. Cheolsu
and Younghee standing mid-aisle talking with an off-camera
wedding coordinator. Candid, photographed slightly from behind.
[Global Style Tokens]

# Photo 3/5 — 테이블 세팅 클로즈업
Close-up of a single place setting: white porcelain plates,
gold-rimmed goblet, folded ivory napkin with a sprig of
eucalyptus, small printed menu card in calligraphy Korean.
Warm overhead lighting. No people visible. [Global Style Tokens]

# Photo 4/5 — 천장 샹들리에
Low-angle shot looking up at an elegant crystal chandelier
in the Seoul wedding hall, afternoon sunlight refracting
through crystals. Architectural detail. No people.
[Global Style Tokens]

# Photo 5/5 — 계단 앞 커플
Cheolsu and Younghee standing at the foot of a grand white
marble staircase inside the wedding hall, looking up. Both
casually dressed (not in wedding attire). Hand in hand.
Afternoon warm light. [Global Style Tokens]
```

#### `06_flower_market.jpg` — 꽃시장 나들이 (D-180) · 3장

```prompt
# Photo 1/3 — 시장 골목
Cheolsu and Younghee walking through the Goto-dong Seoul
Namdaemun flower market, narrow alley flanked by buckets of
peonies, roses, and pampas grass. Younghee holding a small
bunch of pink ranunculus, Cheolsu looking at a price tag.
Natural mid-morning light. [Global Style Tokens]

# Photo 2/3 — 꽃다발 클로즈업
Close-up of Younghee's hands holding a small bouquet of
soft-pink and ivory ranunculus mixed with white eucalyptus,
against the background of more buckets of flowers.
[Global Style Tokens]

# Photo 3/3 — 붉은 장미 다발
Cheolsu holding a large bouquet of dark-red roses wrapped
in brown craft paper, smiling sheepishly at camera.
Flower market stalls blurred behind. [Global Style Tokens]
```

---

### 🍁 2025년 가을 (D-170 ~ D-120)

#### `07_sdm_meeting.jpg` — 스드메 업체 미팅 (D-170) · 5장

```prompt
# Photo 1/5 — 드레스 샵
Younghee standing in front of a bridal boutique mirror in
Cheongdam, Seoul, trying on a simple A-line ivory wedding
dress, back unzipped, hands slightly lifted to the side, looking
down shyly. Dress consultant partially visible adjusting the back.
Warm boutique interior, soft golden-hour window light.
[Global Style Tokens]

# Photo 2/5 — 피팅 룸 거울
Younghee alone seen in a dressing room mirror, in a different
lace-bodice wedding dress, arms hanging naturally, soft smile,
looking at her own reflection. Three-fold mirror showing side
angles. Candid moment. [Global Style Tokens]

# Photo 3/5 — 드레스 디테일
Close-up of the bodice of a wedding dress: delicate ivory lace
with small pearl details, Younghee's hand lightly touching the
fabric. Out-of-focus boutique interior. [Global Style Tokens]

# Photo 4/5 — 웨딩 슈즈
Two pairs of ivory wedding shoes on a white display stand: a
low block heel and a higher pointed-toe heel, Younghee's
fingertip pointing at the block heel as if deciding. Natural
boutique light. [Global Style Tokens]

# Photo 5/5 — 리허설 메이크업 테스트
Younghee in a makeup studio chair, side profile, professional
makeup artist (off-frame arm only) applying blush with a large
brush. Gentle natural makeup look, hair half pinned up.
Studio ring light reflection in eye. [Global Style Tokens]
```

#### `08_autumn_park.jpg` — 산책하러 공원 (단풍, D-165) · 2장

```prompt
# Photo 1/2 — 단풍 길
Cheolsu and Younghee walking hand in hand along a red-maple-lined
path in Seoul Forest park in late September, autumn foliage
glowing in low afternoon sun. Back to camera. Scattered fallen
leaves. Dreamy bokeh. [Global Style Tokens]

# Photo 2/2 — 벤치 위
Younghee sitting on a wooden park bench holding a paper cup
of hot americano, Cheolsu crouching nearby picking up a bright
red maple leaf. Autumn woodland background, golden hour warmth.
[Global Style Tokens]
```

#### `09_aquarium.jpg` — 수족관 (D-150) · 2장

```prompt
# Photo 1/2 — 대형 수조 앞
Cheolsu and Younghee silhouetted against a huge illuminated
aquarium tank at Lotte World Aquarium, Seoul. Blue-cyan glow of
the water covering them. Younghee's hand raised to the glass,
a large stingray swimming past. Back to camera. Moody blue
lighting. [Global Style Tokens]

# Photo 2/2 — 펭귄관 웃음
Close-up of Younghee's face lit by the soft cyan glow of the
penguin exhibit, laughing with her hand covering her mouth,
Cheolsu out-of-focus in the background also watching penguins.
[Global Style Tokens]
```

#### `10_theme_park.jpg` — 놀이공원 (D-145) · 2장

```prompt
# Photo 1/2 — 관람차
Cheolsu and Younghee inside a Ferris wheel gondola at Everland
at dusk, sitting across from each other, Seoul cityscape visible
through the window. Warm interior lighting of the gondola, both
smiling softly looking out. [Global Style Tokens]

# Photo 2/2 — 뛰어가는 뒷모습
Cheolsu and Younghee running hand in hand through a theme park
plaza decorated with autumn lights, captured in slight motion
blur. Carousel glowing in the background. Evening ambient light.
[Global Style Tokens]
```

#### `11_museum.jpg` — 미술관 (D-130) · 2장

```prompt
# Photo 1/2 — 작품 앞
Cheolsu and Younghee standing in front of a large abstract
painting at National Museum of Modern and Contemporary Art
Seoul (MMCA), Cheolsu's hands behind his back, Younghee tilting
her head to read the small wall label. Muted neutral gallery
lighting, polished concrete floor. [Global Style Tokens]

# Photo 2/2 — 복도 웃음
Younghee laughing in a wide museum corridor, white walls, single
bench, Cheolsu sitting on the bench watching her with a smile.
Tall ceiling, natural skylight filtering down. [Global Style Tokens]
```

#### `12_namsan_night.jpg` — 남산 야경 (D-120) · 3장

```prompt
# Photo 1/3 — 서울 야경
Cheolsu and Younghee standing at the Namsan Seoul Tower
observation deck railing, backs to camera, looking out at the
sparkling nighttime Seoul cityscape. Soft warm tower light on
their shoulders. [Global Style Tokens]

# Photo 2/3 — 자물쇠 울타리
Close-up of Younghee's hand clipping a small heart-shaped
padlock onto the love-locks fence at Namsan, Cheolsu's hand
holding the key. Night, warm fairy lights. [Global Style Tokens]

# Photo 3/3 — 실루엣 키스
Silhouette of Cheolsu and Younghee at Namsan park, foreheads
touching, against a backdrop of distant city lights. Dark navy
sky, scattered bokeh city lights. Not a kiss, just foreheads
touching softly. [Global Style Tokens]
```

---

### ❄️ 2025년 겨울 (D-100 ~ D-60)

#### `13_rings_gift.jpg` — 예물·예단 쇼핑 (D-100) · 6장

```prompt
# Photo 1/6 — 반지 고르는 손
Close-up top-down shot of a jeweler's black velvet tray holding
three pairs of simple platinum wedding bands, Younghee's ring
finger extended with a ring being placed on it by an off-frame
jeweler's hand. Warm boutique lighting. [Global Style Tokens]

# Photo 2/6 — 약혼 반지 박스
Small open jewelry box with a solitaire diamond engagement ring
(1ct round cut on platinum band), held by Cheolsu's hands.
Out-of-focus warm boutique background. [Global Style Tokens]

# Photo 3/6 — 다이아몬드 매크로
Macro shot of a single solitaire diamond engagement ring on
a white marble surface, light refracting through the stone.
No hands visible. [Global Style Tokens]

# Photo 4/6 — 예단 주얼리 박스
Overhead shot of an open lacquered Korean jewelry box with
several gold pieces: a pair of earrings, a thin chain necklace,
a jade pendant. Cream satin lining. No people. [Global Style Tokens]

# Photo 5/6 — 향수 고르기
Younghee and Cheolsu in a luxury perfume boutique at Shinsegae
Department Store, Younghee holding a small perfume tester
strip to her nose, Cheolsu smelling another one. Warm
boutique wood and brass. [Global Style Tokens]

# Photo 6/6 — 반지 낀 손
Close-up of Younghee's and Cheolsu's hands resting together
on a white marble table, each now wearing a matching simple
platinum wedding band. Warm natural window light.
[Global Style Tokens]
```

#### `14_wedding_studio.jpg` — 웨딩촬영 스튜디오 (D-90) · 5장

```prompt
# Photo 1/5 — 스튜디오 포트레이트
Formal studio wedding portrait: Younghee in a classic A-line
ivory silk wedding dress, Cheolsu in a charcoal black tuxedo
with a subtle pattern bowtie, standing together, Younghee
holding a small white-and-green bouquet, both smiling gently
at camera. Neutral soft-beige studio backdrop, soft-box
lighting from left. [Global Style Tokens]

# Photo 2/5 — 서로를 바라보는 순간
Same attire as 1/5 but different pose: Cheolsu and Younghee
facing each other, Younghee's bouquet held loosely between
them, both mid-laugh. Slight motion, candid. [Global Style Tokens]

# Photo 3/5 — 영희 단독 포트레이트
Younghee alone in the wedding dress, seated on a simple
wooden stool, hands on lap holding the bouquet, looking softly
off-camera. Low-key studio lighting, one key light, warm skin.
[Global Style Tokens]

# Photo 4/5 — 철수 단독 포트레이트
Cheolsu alone in the tuxedo, standing with hands in pockets,
slight smile, three-quarter angle to camera. Same studio setup
as 3/5. [Global Style Tokens]

# Photo 5/5 — 무대 뒤 캔디드
Behind-the-scenes: Younghee in the dress, hair being adjusted
by a stylist (off-frame hands), looking down at her bouquet.
Soft makeup lights around a large mirror behind her.
[Global Style Tokens]
```

#### `15_christmas_market.jpg` — 크리스마스 마켓 (D-80) · 2장

```prompt
# Photo 1/2 — 조명 아래
Cheolsu and Younghee at an outdoor winter Christmas market in
Seoul Forest, December evening, warm string lights overhead,
both in wool coats holding hot chocolate in paper cups, breath
slightly visible. Small wooden stalls lining the path blurred
behind them. [Global Style Tokens]

# Photo 2/2 — 오너먼트 고르기
Close-up of Younghee's gloved hand holding a small glass snowflake
ornament in front of a market stall display of vintage-style
Christmas decorations. Warm fairy lights. [Global Style Tokens]
```

#### `16_jeju_prewedding.jpg` — 프리웨딩 제주 여행 (D-75) · 3장

```prompt
# Photo 1/3 — 제주 해변
Cheolsu and Younghee standing barefoot at the edge of Hamdeok
Beach in Jeju, Younghee in a long cream knit dress, Cheolsu
in a beige sweater and rolled chinos, both looking out at the
turquoise sea. Cold winter light, clear sky. Back and side view.
[Global Style Tokens]

# Photo 2/3 — 감귤밭
Cheolsu and Younghee walking through a Jeju tangerine orchard,
rows of green trees with bright orange fruits. Younghee holding
a tangerine up to Cheolsu playfully. Overcast but bright winter
daylight. [Global Style Tokens]

# Photo 3/3 — 카페 창가
Cheolsu and Younghee inside a cozy Jeju ocean-view café,
seated by a large window overlooking the sea, Cheolsu taking
a photo of Younghee with a small film camera. Warm interior
lighting contrasting cool outside. [Global Style Tokens]
```

#### `17_invitation.jpg` — 청첩장 시안 확인 (D-60) · 3장

```prompt
# Photo 1/3 — 청첩장 견본 3종
Overhead flat-lay of three different wedding invitation card
samples on a cream linen tablecloth: one with pressed pressed-
flower detail, one with gold foil calligraphy, one minimalist
beige with thin black lines. All written in Korean.
[Global Style Tokens]

# Photo 2/3 — 청첩장 한 장
Close-up of a single wedding invitation in Korean calligraphy
on textured cream paper, a small dried wildflower placed on top.
Soft natural light from left. [Global Style Tokens]

# Photo 3/3 — 사인하는 손
Younghee's hand signing the bottom of a guest invitation card
with a black fountain pen. Open envelope and wax stamp nearby.
No face. [Global Style Tokens]
```

#### `18_shopping_date.jpg` — 쇼핑 데이트 (예복·가구, D-50) · 2장

```prompt
# Photo 1/2 — 가전 매장
Cheolsu and Younghee in a modern home-appliance showroom at
Hyundai Department Store, looking at a minimalist beige washing
machine, Younghee checking a tag, Cheolsu looking at a matching
dryer. Bright showroom lighting. [Global Style Tokens]

# Photo 2/2 — 가구 매장
Cheolsu and Younghee sitting on a light-gray sofa at a
minimalist furniture store, testing comfort, both leaning back
with small smiles. Other sofas and lamps in soft focus around.
[Global Style Tokens]
```

---

### 🌿 2026년 초봄 · 본식 직전 (D-40 ~ D-1)

#### `19_hanbok_prep.jpg` — 식전영상·식순·한복 (D-30) · 5장

```prompt
# Photo 1/5 — 한복 입은 영희
Younghee in a traditional Korean hanbok, pale-mint jeogori
(top) and soft-peach chima (skirt), standing in a traditional
hanok courtyard in Bukchon Seoul, hair simply pinned up with
a small hairpin. Hands folded neatly in front.
[Global Style Tokens]

# Photo 2/5 — 한복 입은 철수
Cheolsu in a traditional Korean men's hanbok, navy-blue jeogori
and gray baji, standing in the same hanok courtyard, slight
smile. [Global Style Tokens]

# Photo 3/5 — 두 사람 한복
Both Cheolsu and Younghee in hanbok side by side, matching
courtyard background, slight formal pose but relaxed
expressions. [Global Style Tokens]

# Photo 4/5 — 부케 디테일
Close-up of a delicate freesia and white eucalyptus bridal
bouquet wrapped in ivory silk ribbon, held by Younghee's hand
(in modern street clothes, hanbok not in this shot). Soft
natural daylight. [Global Style Tokens]

# Photo 5/5 — 폐백상
Top-down view of a traditional Korean paebaek table: red and
gold brocade cloth, small stacks of jujubes, chestnuts, small
rice cakes arranged in neat rows. No people. [Global Style Tokens]
```

#### `20_prewed_late.jpg` — 프리웨딩 촬영 후반 (D-20) · 3장

```prompt
# Photo 1/3 — 거실 캔디드
Cheolsu and Younghee on a warm beige sofa in their shared
Seoul apartment, Younghee's legs across Cheolsu's lap, both
laughing over something on a tablet screen. Soft afternoon
window light, houseplants. [Global Style Tokens]

# Photo 2/3 — 셀카
Casual selfie style shot: Cheolsu holding up his phone high,
both faces pressed cheek to cheek, apartment kitchen visible
in background. Warm overhead light. [Global Style Tokens]

# Photo 3/3 — 하트 손
Close-up overhead of Cheolsu's and Younghee's hands forming
a small heart shape with thumbs and index fingers. Wedding
bands visible. [Global Style Tokens]
```

#### `21_final_packing.jpg` — 축가·웨딩카·환전 (D-10) · 3장

```prompt
# Photo 1/3 — 여행 가방
Open large silver suitcase on a bedroom floor, neatly folded
cream and pastel travel clothes inside, passport and a small
travel journal on top. Younghee's hand adding a paper map of
Bali to the pile. Warm overhead light. [Global Style Tokens]

# Photo 2/3 — 지도와 계획
Overhead flat-lay of a tourist map of Bali spread on a wooden
table, marked with colored pen circles, two paper boarding
passes on top, Cheolsu's pen in his hand pointing.
[Global Style Tokens]

# Photo 3/3 — 차 내부
Cheolsu driving a car (rented white sedan), Younghee in the
passenger seat laughing, windshield showing a sunset-lit road.
Film-look grain. [Global Style Tokens]
```

#### `22_rehearsal.jpg` — 리허설 (D-7) · 2장

```prompt
# Photo 1/2 — 리허설 촬영 스튜디오
Pre-wedding rehearsal shoot: Younghee in a simple flowy white
off-white dress, Cheolsu in a light-gray suit, walking toward
camera on a natural-light studio floor. Soft big-window light.
[Global Style Tokens]

# Photo 2/2 — 드레스 레이스 디테일
Close-up of delicate ivory lace trim on Younghee's rehearsal
dress, her hand lightly touching it. Soft daylight, no face.
[Global Style Tokens]
```

---

### 💒 본식 당일 (2026-03-14, D-day)

#### `23_wedding_day.jpg` — 본식 · 6장 (핵심 컷)

```prompt
# Photo 1/6 — 입장
Wide shot of Younghee in a full A-line ivory silk wedding gown
walking down the central aisle of the Gangnam wedding hall on
her father's arm (father shown only partially from behind),
guests seated on white chairs on both sides, all standing.
Soft natural light through the glass ceiling. [Global Style Tokens]

# Photo 2/6 — 제단 앞 맹세
Cheolsu and Younghee standing at the altar facing each other,
both holding each other's hands, the officiant (out of focus,
background) presiding. Cheolsu visibly emotional, smiling with
tears. Warm side light. [Global Style Tokens]

# Photo 3/6 — 서약서 읽기
Younghee reading her vow from a small cream paper card, Cheolsu
listening intently, her voice barely holding. Slight blur on
the paper in her hand. [Global Style Tokens]

# Photo 4/6 — 반지 교환
Close-up of Cheolsu's hand sliding a platinum wedding band onto
Younghee's ring finger at the altar, no faces shown. Guest
silhouettes blurred behind. [Global Style Tokens]

# Photo 5/6 — 케이크 자르기
Cheolsu and Younghee standing together at a three-tier white
wedding cake, both holding a cake knife and laughing at a guest
off-camera. Champagne glasses on a nearby table. [Global Style Tokens]

# Photo 6/6 — 퇴장
Cheolsu and Younghee walking back down the aisle together after
the ceremony, hand in hand, guests tossing rose petals, both
laughing with pure joy. Motion blur of petals in air.
[Global Style Tokens]
```

---

### ✈️ 신혼여행 (D+3 ~ D+10, 발리)

#### `24_airport_departure.jpg` — 신혼여행 출발 (D+3) · 3장

```prompt
# Photo 1/3 — 공항 출국장
Cheolsu and Younghee at Incheon Airport Terminal 2 departure
gate, both in light travel outfits (Younghee in a cream knit
and jeans, Cheolsu in a beige jacket), holding passports,
Younghee with a small smile, Cheolsu mid-laugh. Background
shows flight info board with flight to Denpasar. [Global Style Tokens]

# Photo 2/3 — 기내 창밖
View from an airplane window at cruise altitude, clouds below
like cotton, the edge of a wing visible. Empty passenger seat
space. Soft golden hour light from window. [Global Style Tokens]

# Photo 3/3 — 도착 공항
Cheolsu and Younghee walking out of Ngurah Rai International
Airport Denpasar arrivals, rolling their silver suitcases,
tropical greenery and palm trees outside, Younghee looking up
with a grin at Cheolsu. [Global Style Tokens]
```

#### `25_hotel_checkin.jpg` — 호텔 체크인 & 조식 (D+4) · 2장

```prompt
# Photo 1/2 — 호텔 룸 발코니
View of a luxury Bali resort villa balcony overlooking the
infinity pool and ocean beyond, two woven lounge chairs, a
small breakfast tray with fresh tropical fruits and coffee
cups on a low table. Soft morning light, palm leaves framing.
No people. [Global Style Tokens]

# Photo 2/2 — 조식 플랫레이
Overhead flat-lay of breakfast: two plates of fresh tropical
fruits (dragon fruit, mango, papaya), two cups of cappuccino
with latte art, small pastry basket, a single white orchid on
the wooden tray. Soft morning window light. [Global Style Tokens]
```

#### `26_bali_beach.jpg` — 발리 해변 (D+5) · 5장

```prompt
# Photo 1/5 — 파도 맞으며
Cheolsu and Younghee walking ankle-deep in clear turquoise sea
water at Nusa Dua beach Bali, holding hands, both in light
linen beach outfits. Bright midday sun, white sand.
[Global Style Tokens]

# Photo 2/5 — 노을 실루엣
Silhouette of Cheolsu and Younghee facing each other on the
beach at sunset, sky in soft coral and peach tones, ocean
reflection. Back side view. [Global Style Tokens]

# Photo 3/5 — 모래 위 발자국
Two pairs of footprints in wet sand leading toward the ocean,
small waves lapping at the edge of the frame. No people.
Soft afternoon light. [Global Style Tokens]

# Photo 4/5 — 비치 타월
Cheolsu and Younghee lying side by side on a striped beach
towel on white sand, reading books, Younghee wearing sunglasses.
Beach umbrella shadow on them. [Global Style Tokens]

# Photo 5/5 — 스노클링
Cheolsu and Younghee in snorkeling gear (masks pushed up on
foreheads), emerging from shallow water laughing, colorful
coral visible through clear shallow water around them.
[Global Style Tokens]
```

#### `27_infinity_pool.jpg` — 인피니티 풀 (D+6) · 3장

```prompt
# Photo 1/3 — 풀 와이드
Wide shot of a Bali resort infinity pool at sunset, Cheolsu
and Younghee floating on inflatable pool lounges, ocean
stretching beyond the pool edge. Warm sky reflected in water.
[Global Style Tokens]

# Photo 2/3 — 열대 꽃
Close-up of a single frangipani flower floating on the pool
water, no people. Soft focus pool tiles below. [Global Style Tokens]

# Photo 3/3 — 칵테일 두 잔
Overhead view of two tropical cocktails (piña colada in coconut
shells with paper umbrellas) on a pool-side ledge, Younghee's
hand reaching for one. Blue pool water behind.
[Global Style Tokens]
```

#### `28_bali_dinner.jpg` — 발리 로컬 레스토랑 (D+7) · 2장

```prompt
# Photo 1/2 — 로컬 식당 외관
Candid shot of Cheolsu and Younghee walking into a traditional
Balinese wooden-roofed open-air restaurant at dusk, tropical
plants around, warm candle lanterns inside. Back-side angle.
[Global Style Tokens]

# Photo 2/2 — 음식 테이블
Overhead flat-lay of traditional Balinese dinner: nasi campur,
satay skewers, young coconut, small banana leaf platters,
two glasses of white wine. Warm candlelight. No people.
[Global Style Tokens]
```

#### `29_island_daytrip.jpg` — 근교 섬 여행 (D+8) · 3장

```prompt
# Photo 1/3 — 배 위
Cheolsu and Younghee on a small wooden boat heading to Nusa
Penida island, sea breeze blowing Younghee's hair, Cheolsu
pointing at a distant cliff. Open ocean, bright blue sky.
[Global Style Tokens]

# Photo 2/3 — 절벽 뷰
Wide shot of Cheolsu and Younghee at Kelingking Beach cliff
viewpoint, Bali, famous T-Rex-shaped cliff visible below,
both standing near the edge with backs to camera, Younghee's
dress flowing in wind. [Global Style Tokens]

# Photo 3/3 — 일몰 바다
Cheolsu and Younghee walking barefoot on a quiet Bali beach
at sunset, reflections on wet sand. Minimalist composition,
lots of sky and soft orange-pink sunset. [Global Style Tokens]
```

#### `30_return_home.jpg` — 신혼여행 귀국 (D+10) · 3장

```prompt
# Photo 1/3 — 출국 게이트
Cheolsu and Younghee at the departure gate of Denpasar
airport, both looking slightly tired but content, Younghee's
head leaning on Cheolsu's shoulder. Warm airport lighting.
[Global Style Tokens]

# Photo 2/3 — 기내 잠든 영희
Younghee asleep in an airplane seat, Cheolsu's jacket covering
her as a blanket, he is reading a book. Warm dim cabin light.
[Global Style Tokens]

# Photo 3/3 — 인천공항 도착
Cheolsu and Younghee pushing a luggage cart through Incheon
airport arrival hall, both wearing tired smiles, Younghee
waving at someone (family) off-camera. Bright modern interior.
[Global Style Tokens]
```
---

## 🔁 프롬프트 활용 팁 (젠스파크 워크플로)

### 1. 배치 생성 순서
```
Step 1: 레퍼런스 시트 1-A, 1-B, 1-C (3장) → 마음에 드는 얼굴 확정
Step 2: 이벤트 01~05 (봄~여름, 17장) — 계절감 확인
Step 3: OK면 이벤트 06~36 한 번에 (나머지 ~100장)
```

### 2. 일관성 유지 (Flash 사용 시 특히 중요)

Nano Banana (Flash) 는 Pro 보다 일관성이 약간 약해서 아래 테크닉 **모두 적용**:

- **레퍼런스 업로드**: Step 1-A (철수), 1-B (영희), 1-C (커플) 세 장을 **매 요청마다 함께** 업로드. Strong Resemblance 설정 있으면 ON
- **프롬프트 머리에 강조 문구 추가**:
  ```
  Same couple as reference — maintain identical facial features,
  hairstyle, body proportions, and skin tone as the uploaded
  reference images. [기존 프롬프트 내용 이어서]
  ```
- **Global Style Tokens 매번 하단에 재첨부** (생략 금지)
- **시드 고정**: 젠스파크에 `seed` 옵션 있으면 `12345` 같은 고정값 사용
- **수렴 기법**: 처음 뽑힌 20장 중 얼굴이 제일 잘 나온 3~5장을 **새 레퍼런스로 재업로드** → 이후 생성 시 일관성 극대화
- **실패 컷은 과감히 re-roll**: Flash는 빠르니 3번까지 돌려도 비용 낮음

### 3. 재촬영 기준
| 상태 | 조치 |
|---|---|
| 얼굴 다른 사람 | Re-roll, 레퍼런스 강도 ↑ |
| 배경만 현실감 없음 | 배경 프롬프트 구체화 (장소 + 시간대 + 날씨) |
| 의상 톤 다름 | "ivory knit sweater, beige chinos" 같은 구체 묘사 |
| 포즈 어색 | "candid, mid-action, not posed" 강화 |

### 4. 파일명 규칙 (seed.py 와 매칭되도록)

저장 시 **반드시 아래 번호로 이름 지정** (seed.py 가 이 파일명을 참조):

```
01_picnic_hangang_*.jpg    (_1, _2, _3 suffix 로 여러 장 구분)
02_cafe_seongsu_*.jpg
...
36_month_anniversary_*.jpg
```

기존 `backend/seed_assets/photos/` 내 18~98번 파일들은 **교체**하거나, 아니면 `backend/app/seed.py`의 SEED_EVENTS photo_files 배열만 새 번호로 수정.

---

## ✨ GPT Image 2 하이라이트 10장 리스트

> 이 10장만 GPT Image 2 로 생성. 나머지 110장은 모두 Nano Banana (Flash).

| # | 파일 | 이벤트 | 프롬프트 번호 | 이유 |
|---|---|---|---|---|
| 1 | 23_wedding_day_1.jpg | 본식 | Photo 1/6 | 넓은 채플 + 아버지 입장 — 복잡 멀티 엘리먼트 |
| 2 | 23_wedding_day_2.jpg | 본식 | Photo 2/6 | 제단 맹세 — 감정·조명 드라마 |
| 3 | 23_wedding_day_3.jpg | 본식 | Photo 3/6 | 서약서 읽기 — 표정 디테일 중요 |
| 4 | 23_wedding_day_4.jpg | 본식 | Photo 4/6 | 반지 교환 클로즈업 — 손 정밀도 중요 |
| 5 | 23_wedding_day_5.jpg | 본식 | Photo 5/6 | 케이크 자르기 — 복합 씬 |
| 6 | 23_wedding_day_6.jpg | 본식 | Photo 6/6 | 퇴장 + 꽃잎 뿌리기 모션 — motion blur 표현 |
| 7 | 26_bali_beach_2.jpg | 발리 해변 | Photo 2/5 | 노을 실루엣 — 빛 처리 핵심 |
| 8 | 27_infinity_pool_1.jpg | 인피니티 풀 | Photo 1/3 | 와이드 풍경 + 인물 — 구도 복잡 |
| 9 | 29_island_daytrip_2.jpg | 근교 섬 | Photo 2/3 | Kelingking 절벽 뷰 — 시네마틱 풍경 |
| 10 | 24_airport_departure_1.jpg | 공항 출국장 | Photo 1/3 | 공항 환경 + 인물 감정 — 복합 |

**이 10장은 `Photo N/M` 블록 그대로 GPT Image 2 에 붙여넣고, 레퍼런스로 Step 1 의 3장을 업로드**. 나머지 프롬프트에 붙인 Global Style Tokens 는 GPT Image 2 에서도 동일하게 작동 (필름 톤 재현 잘 함).

---

## 💡 예상 비용 (참고)

**하이브리드 전략 (권장)**:

| 모델 | 장수 | 1장 가격 | 소계 |
|---|---|---|---|
| Nano Banana (Flash) | 110장 | $0.01~0.02 | $1.1~2.2 |
| GPT Image 2 | 10장 | $0.06~0.08 | $0.6~0.8 |
| **총합** | **120장** | | **$1.7~3.0** |

**단독 전략 비교 (참고)**:

| 전략 | 120장 총 비용 |
|---|---|
| Nano Banana Pro 단독 | $3.6~6 |
| GPT Image 2 단독 | $4.8~10 |
| Nano Banana Flash 단독 | $1.2~2.4 (하이라이트 퀄리티 ↓) |

→ **하이브리드가 비용·퀄리티 스위트 스팟**. 젠스파크 크레딧 기준 대략 **200~400 크레딧** 예상.

---

## 🎯 면접 답변 재료

> "스톡 이미지가 아닌 AI 생성 이미지로 120장의 더미 데이터를 구축했습니다. **Nano Banana (Flash) 메인 + GPT Image 2 하이라이트 10장 하이브리드** 전략으로 비용을 $2~3 수준으로 낮추면서도 본식·일몰 같은 결정적 컷은 시네마틱 퀄리티로 확보했습니다. 캐릭터 레퍼런스 시트 3장을 먼저 만들어 이후 전 이미지에 업로드함으로써 '한 커플이 일년 내내 등장하는 real wedding journal' 감성을 재현했습니다. 프롬프트와 하이라이트 10장 리스트는 `reference/design/image_generation_prompts.md`에 재현 가능 형태로 문서화되어 있어, 심사자가 본인 커플 데이터로 재생성도 가능합니다."

---

*작성일: 2026-04-24*
*대응 seed 파일: `backend/app/seed.py` SEED_EVENTS*
*대응 이벤트 수: 36 이벤트 / 120+ 이미지*
