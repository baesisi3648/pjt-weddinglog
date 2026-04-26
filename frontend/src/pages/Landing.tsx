// @TASK Landing — 영상 원칙 기반 (Storyworth 톤)
//   · 강조색 1개 (coral)
//   · 카드 ❌, 평문 + 큰 사진 + 가는 구분선
//   · 좌우 교차 3섹션
//   · 결과물 갤러리 (사회적 증명 대체)
//   · GNB: 처음 투명 → 스크롤 시 불투명
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const HERO_IMG = '/landing/23_wedding_day_2.png';
const SECTION_IMGS = {
  s1: '/landing/01_picnic_hangang2.png',
  s2: '/landing/16_jeju_prewedding_3.png',
  s3: '/landing/14_wedding_studio_9.png',
} as const;
const GALLERY = [
  '01_picnic_hangang2',
  '13_rings_gift_3',
  '14_wedding_studio_9',
  '16_jeju_prewedding_3',
  '23_wedding_day_2',
  '26_bali_beach_5',
];

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
            데모 둘러보기
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
          <div className="max-w-[620px]">
            <p className="font-label-caps text-[12px] tracking-[0.2em] text-ink-muted uppercase mb-6">
              결혼 준비 기록 · 앨범
            </p>
            <h1 className="font-display-lg text-[44px] md:text-[68px] leading-[1.04] text-ink">
              결혼 준비,
              <br />
              그대로 한 권이 됩니다.
            </h1>
            <p className="mt-6 text-[18px] leading-[1.65] text-ink-muted max-w-[480px]">
              매일의 일정과 사진이 끝나는 날, 자동으로 책 한 권이 됩니다.
              <br className="hidden md:block" />
              부모님께 가장 오래 남는 선물.
            </p>
            <div className="mt-10 flex items-center gap-6">
              <Link
                to="/home"
                className="px-8 py-3.5 rounded-full bg-coral text-white text-[15px] font-medium hover:opacity-90 transition-opacity"
              >
                데모 둘러보기 →
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
              D-day 한 칸에<br />
              사진과 메모를 남깁니다.
            </h2>
            <p className="mt-6 text-[16px] leading-[1.75] text-ink-muted">
              예식장 답사, 스드메 미팅, 청첩장 발송. 매일 일어나는 작은 일들을
              한 사람이 적어도 두 사람이 기억합니다. 한 일정에 여러 장의 사진을
              올리고, 짧은 캡션을 붙여둡니다.
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
              02 · AI 챕터링
            </p>
            <h2 className="font-display-md text-[36px] md:text-[44px] leading-[1.15] text-ink">
              누른 적 없는데,<br />
              이미 책처럼 묶입니다.
            </h2>
            <p className="mt-6 text-[16px] leading-[1.75] text-ink-muted">
              카테고리별 자동 챕터링. 웨딩촬영 → 준비의 날들 → 본식 → 신혼여행.
              AI가 한 번에 페이지 단위 레이아웃까지 추천하고, 마음에 안 들면
              템플릿으로 즉시 폴백합니다.
            </p>
          </div>
        </div>
      </section>

      {/* ── 03 · 한 권으로 (좌 텍스트 / 우 사진) ─────────────────── */}
      <section className="py-32 border-t border-line">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="max-w-[480px]">
            <p className="font-label-caps text-[12px] tracking-[0.2em] text-coral uppercase mb-4">
              03 · 양가 부모님께
            </p>
            <h2 className="font-display-md text-[36px] md:text-[44px] leading-[1.15] text-ink">
              주문 한 번이면,<br />
              가족에게 한 권씩.
            </h2>
            <p className="mt-6 text-[16px] leading-[1.75] text-ink-muted">
              하드커버 양장본으로 인쇄해 양가 부모님께. 결혼 후 가장 오래 남는
              선물은 "두 사람이 거기에 있었다"는 증거입니다. 주문 데이터는
              인쇄 파트너에게 넘길 수 있는 형식으로 한 번에 내보낼 수 있습니다.
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

      {/* ── 결과물 갤러리 (사회적 증명 대체) ─────────────────────── */}
      <section className="py-24 border-t border-line bg-bg-soft">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="font-label-caps text-[12px] tracking-[0.2em] text-coral uppercase mb-3">
                데모 데이터
              </p>
              <h2 className="font-display-md text-[28px] md:text-[36px] leading-[1.15] text-ink max-w-[520px]">
                가상 커플 "철수 ♥ 영희"의 1년 기록.
              </h2>
            </div>
            <p className="text-[13px] text-ink-muted max-w-[280px] md:text-right">
              실제 시연용 시드 데이터.
              <br />
              24개 일정 · 125장 사진 · 1건 주문.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {GALLERY.map((name) => (
              <div key={name} className="aspect-square overflow-hidden rounded-sm">
                <img
                  src={`/landing/${name}.png`}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 마지막 CTA ───────────────────────────────────────────── */}
      <section className="py-32 border-t border-line">
        <div className="max-w-[800px] mx-auto px-6 lg:px-10 text-center">
          <h2 className="font-display-md text-[36px] md:text-[48px] leading-[1.1] text-ink">
            지금 바로 둘러보세요.
          </h2>
          <p className="mt-5 text-[16px] leading-[1.7] text-ink-muted">
            로그인 없이 데모 데이터로 모든 기능을 확인할 수 있습니다.
          </p>
          <Link
            to="/home"
            className="mt-10 inline-block px-10 py-4 rounded-full bg-coral text-white text-[16px] font-medium hover:opacity-90 transition-opacity"
          >
            데모 둘러보기
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="py-10 border-t border-line">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-[13px] text-ink-muted">
            © 2026 WeddingLog — (주)스위트북 채용 과제 데모
          </p>
          <p className="text-[13px] text-ink-muted">
            Powered by FastAPI · React · OpenAI
          </p>
        </div>
      </footer>
    </div>
  );
}
