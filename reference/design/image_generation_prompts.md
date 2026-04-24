# WeddingLog — 더미 이미지 생성 프롬프트 가이드

> 목적: **철수 & 영희** 한 커플의 1년짜리 결혼 준비 + 결혼 후 기록을 **일관된 필름 톤**으로 100+장 생성
> 배포: 젠스파크(Genspark) AI 이미지 생성 → `backend/seed_assets/photos/` 로 대체

---

## 🎯 모델 추천

| 모델 | 강점 | 약점 | 이 프로젝트에서의 용도 |
|---|---|---|---|
| **Nano Banana Pro (Gemini 3 Pro Image)** | **캐릭터 일관성 최고**, 4K, 한국 문화·음식·장소 학습 풍부, 레퍼런스 이미지 업로드 기능 | 비용↑ (크레딧 소모 多) | ⭐ **메인 모델** — 본식·웨딩촬영·커플샷 등 인물 클로즈업 전부 |
| **GPT Image 2 (OpenAI)** | 시네마틱 구도, 복잡한 씬 이해 탁월, 스타일 지시 준수도 매우 높음 | 한국인 얼굴이 간혹 애매 (혼혈 경향) | 보조 — 본식 하이라이트, 신혼여행 여행지 전경처럼 **분위기 중심** 컷 |
| **Nano Banana (Gemini 2.5 Flash Image)** | 빠름·저렴 | 캐릭터 일관성 Pro보다 약함 | **정물만** — 반지·부케·청첩장·한복 소품·호텔 룸 등 얼굴 없는 컷 |

### 추천 조합

```
1. Nano Banana Pro 로 "철수·영희 레퍼런스 시트" 3장 먼저 생성 (뒷장 참고)
2. 이후 인물 포함 컷 전부 Nano Banana Pro + 레퍼런스 업로드
3. 얼굴 없는 정물/풍경만 Nano Banana (flash) 로 비용 절감
4. 본식 드라마틱 씬은 GPT Image 2 로 한 번 더 시도 → 비교 후 선택
```

### 왜 Nano Banana Pro 인가 (핵심 이유)

- **100+장에 같은 커플이 등장**해야 "진짜 기록" 감성이 남. Gemini 3 Pro Image는 레퍼런스 이미지 2-3장을 업로드하면 **얼굴·체형·헤어스타일을 동일 인물로 유지**하며 시리즈 생성
- **한국 디테일**: 한복, 스드메 스튜디오, 예식장 계단, 한강 등 학습 데이터 풍부
- **필름 톤 재현**: Kodak Portra 400 / Fuji Pro 400H 같은 시뮬레이션 키워드를 잘 이해

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

**체크포인트**: 이 3장에서 얼굴·체형·옷 톤이 마음에 들 때까지 re-roll. 이후 모든 이미지 생성 시 **1-A, 1-B, 1-C 세 장을 레퍼런스로 업로드**.

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

### 🏠 결혼 후 (D+14 ~ D+60)

#### `31_album_order.jpg` — 앨범 주문 (D+14) · 5장

```prompt
# Photo 1/5 — 노트북 앞
Cheolsu and Younghee on their living room sofa, shared laptop
open on a wedding album design interface (blurred screen),
Younghee pointing at the screen, Cheolsu typing. Soft evening
lamp light. [Global Style Tokens]

# Photo 2/5 — 레이아웃 검토
Overhead of a printed album layout draft on a dining table,
multiple photos arranged on a large grid, red and blue pens
marking edits, coffee mug nearby. Warm morning light.
[Global Style Tokens]

# Photo 3/5 — 메모 접착 노트
Younghee writing chapter title captions on sticky notes and
sticking them next to printed photos on the album draft.
Close-up of her hand with wedding band. [Global Style Tokens]

# Photo 4/5 — 옵션 카탈로그
Two open wedding album sample catalogs on a wooden table,
different cover materials and page spreads visible, a cup
of tea on one side. [Global Style Tokens]

# Photo 5/5 — 최종 확인 웃음
Cheolsu and Younghee on the sofa, high-fiving, both laughing,
laptop and papers strewn on the coffee table.
[Global Style Tokens]
```

#### `32_parents_visit.jpg` — 양가 부모님 첫 방문 (D+20) · 3장

```prompt
# Photo 1/3 — 인사 장면
Cheolsu and Younghee in formal but casual clothes (Cheolsu in
a cardigan, Younghee in a modest blouse) bowing deeply at the
entrance of a traditional Korean home, parents partially shown
from behind welcoming them. Warm hallway light. [Global Style Tokens]

# Photo 2/3 — 거실 가족 식사
Dining table scene at Younghee's parents' home: table full of
Korean side dishes, Cheolsu and Younghee sitting next to each
other, Cheolsu receiving a plate from Younghee's mother (shown
from behind). Warm family feeling. [Global Style Tokens]

# Photo 3/3 — 신혼여행 선물
Close-up of Younghee handing a small wrapped souvenir from
Bali to her mother's hands, both hands visible. Warm indoor
lighting. [Global Style Tokens]
```

#### `33_album_draft.jpg` — 앨범 초안 확인 (D+35) · 1장

```prompt
Overhead of a printed photobook proof open on a dining table,
pages showing a photo of the wedding ceremony, Cheolsu's hand
flipping the page to reveal a page of honeymoon photos, pen
and sticky notes nearby. Soft morning daylight.
[Global Style Tokens]
```

#### `34_album_delivery.jpg` — 앨범 실물 수령 (D+45) · 2장

```prompt
# Photo 1/2 — 택배 박스
Cheolsu kneeling in the apartment hallway opening a large
cream cardboard box, three hardcover wedding albums inside
wrapped in tissue, Younghee standing behind peeking over his
shoulder with excitement. Warm apartment entry light.
[Global Style Tokens]

# Photo 2/2 — 앨범 펼친 장면
Open hardcover wedding album on the living room coffee table,
showing a double-page spread of the wedding ceremony photo,
two cups of coffee on either side. Candid hands turning pages.
[Global Style Tokens]
```

#### `35_gift_to_parents.jpg` — 양가 부모님께 앨범 선물 (D+50) · 2장

```prompt
# Photo 1/2 — 부모님께 전달
Younghee handing a wedding album wrapped in soft cream ribbon
to her mother (shown from back), mother receiving with both
hands, Cheolsu and Younghee's father also visible in a warm
living room. Afternoon natural light. [Global Style Tokens]

# Photo 2/2 — 앨범 넘기는 어머니
Close-up of an older woman's hands (Younghee's mother) turning
a page of the wedding album, looking at a photo of the
daughter in her wedding dress, a single tear visible on her
cheek (optional — softer if possible). [Global Style Tokens]
```

#### `36_month_anniversary.jpg` — 한 달 기념 외식 (D+60) · 3장

```prompt
# Photo 1/3 — 레스토랑 테이블
Cheolsu and Younghee seated across from each other at a warm-
lit Seoul upscale restaurant, both holding wine glasses in a
toast. Candles on the table, soft evening atmosphere.
[Global Style Tokens]

# Photo 2/3 — 요리 플레이팅
Close-up of a beautifully plated dish at the restaurant
(Korean-fusion, perhaps a ravioli or wagyu steak), single
sprig of microgreen, white plate, warm overhead lighting.
No people. [Global Style Tokens]

# Photo 3/3 — 서로 웃는 순간
Cheolsu and Younghee mid-laugh at the dinner table, both
leaning back slightly, Younghee covering her mouth with hand.
Candid, warm candlelight on faces. [Global Style Tokens]
```

---

## 🔁 프롬프트 활용 팁 (젠스파크 워크플로)

### 1. 배치 생성 순서
```
Step 1: 레퍼런스 시트 1-A, 1-B, 1-C (3장) → 마음에 드는 얼굴 확정
Step 2: 이벤트 01~05 (봄~여름, 17장) — 계절감 확인
Step 3: OK면 이벤트 06~36 한 번에 (나머지 ~100장)
```

### 2. 일관성 유지 안 될 때
- 얼굴이 달라 보이면 레퍼런스 1-A, 1-B 를 **"Strong Resemblance"** 설정으로 업로드
- 톤이 다르면 `Global Style Tokens` 전체를 프롬프트 **하단에 매번 재첨부**
- 여전히 안 되면 `--seed 12345` 같은 시드 고정 (젠스파크 지원 시)

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

## 💡 예상 비용 (참고)

| 모델 | 이미지 1장 가격 | 120장 총 비용 |
|---|---|---|
| Nano Banana Pro | $0.03~0.05 | $3.6~6 |
| GPT Image 2 | $0.04~0.08 | $4.8~10 |
| Nano Banana (Flash) | $0.01~0.02 | $1.2~2.4 |

젠스파크 크레딧 기준으로는 대략 **400~800 크레딧** 예상. 실제 금액은 플랫폼 정책 기준.

---

## 🎯 면접 답변 재료

> "스톡 이미지가 아닌 AI 생성 이미지로 120장의 더미 데이터를 구축했습니다. Nano Banana Pro의 **캐릭터 일관성** 기능으로 한 커플이 일년 내내 다양한 장소에서 등장하는 'real wedding journal' 감성을 재현했습니다. 덕분에 심사자가 앱을 열자마자 **'진짜 쓰던 앱'** 느낌을 받도록 했습니다. 프롬프트는 `reference/design/image_generation_prompts.md`에 재현 가능 형태로 문서화."

---

*작성일: 2026-04-24*
*대응 seed 파일: `backend/app/seed.py` SEED_EVENTS*
*대응 이벤트 수: 36 이벤트 / 120+ 이미지*
