// @TASK Landing — 영상 원칙 기반 (Storyworth 톤)
//   · 강조색 1개 (coral)
//   · 카드 ❌, 평문 + 큰 사진 + 가는 구분선
//   · 좌우 교차 3섹션
//   · 결과물 갤러리 (사회적 증명 대체)
//   · GNB: 처음 투명 → 스크롤 시 불투명
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BlessingsPage from '../components/BlessingsPage';

const HERO_IMG = '/landing/23_wedding_day_2.png';
const SECTION_IMGS = {
  s1: '/landing/01_picnic_hangang2.png',
  s2: '/landing/16_jeju_prewedding_3.png',
  s3: '/landing/14_wedding_studio_9.png',
} as const;

// 데모 갤러리 4장 + 캡션 — 시드 데이터의 캡션 톤을 그대로 노출 (차별화 어필)
const GALLERY: { name: string; caption: string; wide?: boolean }[] = [
  // 본식 풀폭 (와이드)
  { name: '23_wedding_day_4', caption: '오늘 우리 결혼함 💍', wide: true },
  // 2열 첫 줄
  { name: '01_picnic_hangang2', caption: '벚꽃 아래 피크닉 세팅 완료' },
  { name: '13_rings_gift_3', caption: '사이즈 맞춰보는 중 💍' },
  // 2열 둘째 줄
  { name: '16_jeju_prewedding_3', caption: '맨발로 제주 바다' },
  { name: '26_bali_beach_5', caption: '우리 둘 발자국만 남기고' },
];

const FINAL_CTA_IMG = '/landing/14_wedding_studio_9.png';

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="bg-bg text-ink font-body-md">
      {/* ── GNB (투명 → 스크롤 시 불투명) ─────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-bg/90 backdrop-blur-md shadow-[0_1px_0_0_#E8DFD3]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <span className="font-display-md text-[20px] tracking-tight text-ink">
            WeddingLog
          </span>
          <Link
            to="/home"
            className="px-5 py-2 rounded-full bg-coral text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            둘러보기
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg/95 via-bg/75 to-transparent" />
        </div>

        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 py-32 w-full">
          <div className="max-w-[760px]">
            <p className="font-label-caps text-[12px] tracking-[0.2em] text-ink-muted uppercase mb-6">
              결혼 준비 기록 · 앨범
            </p>
            <h1
              className="font-display-lg text-[44px] md:text-[68px] leading-[1.08] text-ink"
              style={{ wordBreak: 'keep-all' }}
            >
              결혼 준비,
              <br />
              <span className="whitespace-nowrap">그대로 한 권이 됩니다.</span>
            </h1>
            <p className="mt-6 text-[18px] leading-[1.65] text-ink-muted max-w-[520px]">
              결혼식의 여운이 가시기 전에, 1년의 준비 기록이 한 권의 책으로 도착합니다.
            </p>
            <div className="mt-10 flex items-center gap-6">
              <Link
                to="/home"
                className="px-8 py-3.5 rounded-full bg-coral text-white text-[15px] font-medium hover:opacity-90 transition-opacity"
              >
                둘러보기 →
              </Link>
              <a
                href="#how"
                className="text-[14px] text-ink-muted hover:text-ink transition-colors underline-offset-4 hover:underline"
              >
                어떻게 작동하나요
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 01 · 함께 쓰는 캘린더 (좌 텍스트 / 우 사진) ───────────── */}
      <section id="how" className="py-32 border-t border-line">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="max-w-[480px]">
            <p className="font-label-caps text-[12px] tracking-[0.2em] text-coral uppercase mb-4">
              01 · 함께 쓰는 캘린더
            </p>
            <h2 className="font-display-md text-[36px] md:text-[44px] leading-[1.15] text-ink">
              둘만의 캘린더에<br />
              사진과 메모를 남깁니다.
            </h2>
            <p className="mt-6 text-[16px] leading-[1.75] text-ink-muted">
              웨딩홀 답사, 스튜디오 촬영 등 결혼 준비 과정에서 일어나는 일들을
              둘만의 캘린더에 사진과 짧은 메모로 적어두면 끝.
            </p>
          </div>
          <div className="aspect-[4/5] overflow-hidden rounded-sm">
            <img
              src={SECTION_IMGS.s1}
              alt="한강 피크닉"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ── 02 · AI 챕터링 (좌 사진 / 우 텍스트) ─────────────────── */}
      <section className="py-32 border-t border-line">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="aspect-[4/5] overflow-hidden rounded-sm order-2 lg:order-1">
            <img
              src={SECTION_IMGS.s2}
              alt="제주 프리웨딩"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="max-w-[480px] order-1 lg:order-2">
            <p className="font-label-caps text-[12px] tracking-[0.2em] text-coral uppercase mb-4">
              02 · 자동 챕터링
            </p>
            <h2 className="font-display-md text-[36px] md:text-[44px] leading-[1.15] text-ink">
              쌓아둔 사진들이<br />
              자동으로 분류됩니다.
            </h2>
            <p className="mt-6 text-[16px] leading-[1.75] text-ink-muted">
              일상 데이트 → 본격 준비 → 웨딩촬영 → 본식 → 신혼여행.
              사진과 일정을 시간 흐름대로 자동 챕터로 묶고, 페이지
              레이아웃까지 함께 추천합니다. 마음에 안 들면 한 번 더 추천받아
              비교할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* ── 03 · 한 권으로 (좌 텍스트 / 우 사진) ─────────────────── */}
      <section className="py-32 border-t border-line">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="max-w-[480px]">
            <p className="font-label-caps text-[12px] tracking-[0.2em] text-coral uppercase mb-4">
              03 · 결혼식 이후
            </p>
            <h2 className="font-display-md text-[36px] md:text-[44px] leading-[1.15] text-ink">
              신혼여행을 마지막으로,<br />
              사진을 담으면<br /> 
              앨범도 함께 도착합니다.
            </h2>
            <p className="mt-6 text-[16px] leading-[1.75] text-ink-muted">
              신혼여행 사진까지 정리하면, 주문하기 클릭 한 번으로
              앨범이 제작됩니다. 부부용과 양가 부모님용을 한 번에 인쇄해 함께
              전해드립니다.
            </p>
          </div>
          <div className="aspect-[4/5] overflow-hidden rounded-sm">
            <img
              src={SECTION_IMGS.s3}
              alt="웨딩 스튜디오"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ── 04 · 축하 메시지 (좌 사진 / 우 텍스트) — 차별화 어필 ── */}
      <section className="py-32 border-t border-line">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* 좌측: BlessingsPage 미니 미리보기 — 실제 결과물 그대로 */}
          <div className="aspect-[3/2] overflow-hidden rounded-sm shadow-[0_8px_32px_rgba(31,27,18,0.15)] order-2 lg:order-1">
            <BlessingsPage variant="book" />
          </div>
          <div className="max-w-[480px] order-1 lg:order-2">
            <p className="font-label-caps text-[12px] tracking-[0.2em] text-coral uppercase mb-4">
              04 · 책의 첫 장에
            </p>
            <h2 className="font-display-md text-[36px] md:text-[44px] leading-[1.15] text-ink">
              모두의 마음이<br />
              함께 펼쳐집니다.
            </h2>
            <p className="mt-6 text-[16px] leading-[1.75] text-ink-muted">
              결혼식에서 받은 축하 메시지가 책의 첫 장을 엽니다. 책을 펼치면
              그날의 메시지가 한 페이지에 펼쳐지고, 책 첫 장의 QR을 스캔하면
              모든 메시지를 모바일에서 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* ── 결과물 갤러리 (사회적 증명 대체) ─────────────────────── */}
      <section className="py-24 border-t border-line bg-bg-soft">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="font-label-caps text-[12px] tracking-[0.2em] text-coral uppercase mb-3">
                데모 데이터
              </p>
              <h2
                className="font-display-md text-[24px] md:text-[32px] leading-[1.2] text-ink"
                style={{ wordBreak: 'keep-all' }}
              >
                <span className="whitespace-nowrap">"철수 ♥ 영희"의 1년 기록.</span>
              </h2>
            </div>
            <p className="text-[13px] text-ink-muted max-w-[280px] md:text-right">
              실제 시연용 시드 데이터.
              <br />
              24개 일정 · 123장 사진 · 3건 주문.
            </p>
          </div>
          {/* 본식 풀폭 와이드 + 2x2 그리드. 각 사진 아래 시드 캡션 그대로 노출 (차별화 어필) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-10">
            {GALLERY.map((item) => (
              <figure
                key={item.name}
                className={`flex flex-col gap-3 ${
                  item.wide ? 'md:col-span-2' : ''
                }`}
              >
                <div
                  className={`overflow-hidden rounded-sm ${
                    item.wide ? 'aspect-[16/7]' : 'aspect-[4/3]'
                  }`}
                >
                  <img
                    src={`/landing/${item.name}.png`}
                    alt=""
                    // wide 본식 사진은 신랑·신부 얼굴이 상단에 있어 default center crop 으로
                    // 얼굴이 잘림 → object-position 을 위쪽 30% 로 당김.
                    className={`w-full h-full object-cover ${item.wide ? '[object-position:center_30%]' : ''}`}
                    loading="lazy"
                  />
                </div>
                <figcaption
                  className="font-hand-ko text-[16px] text-ink-muted leading-snug text-center"
                  style={{ letterSpacing: '-0.3px' }}
                >
                  {item.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── 마지막 CTA — 노을 실루엣 + 한 줄 카피 ─────────────────── */}
      <section className="border-t border-line">
        {/* 풀폭 비주얼 — 결혼 앨범의 마무리 톤 */}
        <div className="relative w-full aspect-[16/7] overflow-hidden">
          <img
            src={FINAL_CTA_IMG}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg" />
        </div>

        {/* CTA 본체 */}
        <div className="py-24 lg:py-28">
          <div className="max-w-[760px] mx-auto px-6 lg:px-10 text-center">
            <h2
              className="font-display-md text-[36px] md:text-[48px] leading-[1.1] text-ink"
              style={{ wordBreak: 'keep-all' }}
            >
              펼쳐 보세요.<br />
              <span className="whitespace-nowrap">한 권의 책처럼.</span>
            </h2>
            <Link
              to="/home"
              className="mt-10 inline-block px-10 py-4 rounded-full bg-coral text-white text-[16px] font-medium hover:opacity-90 transition-opacity"
            >
              둘러보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="py-10 border-t border-line">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 text-center">
          <p className="text-[13px] text-ink-muted">© 2026 WeddingLog</p>
        </div>
      </footer>
    </div>
  );
}
