// @TASK P1.5-S0-T1 - Timeline 핸드오프 JSX 포팅
// @SPEC docs/planning/06-tasks.md#P1.5-S0-T1
// TODO: Phase 2-4에서 실제 API 연동
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DUMMY_CHAPTERS = [
  {
    id: 1,
    num: "Chapter 01",
    title: "웨딩촬영",
    subtitle: "Our First Frames",
    count: 8,
    dateRange: "2025. 08. 15 – 08. 20",
    cat: "photo",
    photos: [
      { tone: "peach",    caption: "스튜디오 본촬영" },
      { tone: "cream",    caption: "야외 세션 · 남산" },
      { tone: "lavender", caption: "드레스 2차" },
      { tone: "peach",    caption: "부케 리허설" },
      { tone: "sky",      caption: "한강 석양 컷" },
    ],
  },
  {
    id: 2,
    num: "Chapter 02",
    title: "준비의 날들",
    subtitle: "The In-Between Days",
    count: 12,
    dateRange: "2025. 07. 02 – 09. 10",
    cat: "sdm",
    sub: [
      { cat: "sdm",   label: "스드메",   count: 5, photos: ["lavender", "cream", "peach"] },
      { cat: "venue", label: "예식장",   count: 4, photos: ["mint", "cream"] },
      { cat: "jewel", label: "예물",     count: 3, photos: ["peach", "cream"] },
    ],
  },
  {
    id: 3,
    num: "Chapter 03",
    title: "그 날 — 본식",
    subtitle: "October Twenty Fifth",
    count: 15,
    dateRange: "2025. 10. 25",
    cat: "wedding",
    photos: [
      { tone: "peach",    caption: "입장 전, 대기실" },
      { tone: "cream",    caption: "첫 만남, 리빌" },
      { tone: "lavender", caption: "성혼 선언" },
      { tone: "mint",     caption: "가족 단체 사진" },
      { tone: "peach",    caption: "피로연 건배" },
    ],
  },
  {
    id: 4,
    num: "Chapter 04",
    title: "첫 여행 — 신혼여행",
    subtitle: "Our First Trip Together",
    count: 10,
    dateRange: "2025. 10. 27 – 11. 04",
    cat: "honey",
    photos: [
      { tone: "sky",      caption: "발리 도착" },
      { tone: "cream",    caption: "우붓 조식" },
      { tone: "mint",     caption: "바다 산책" },
      { tone: "peach",    caption: "선셋 디너" },
      { tone: "lavender", caption: "마지막 밤" },
    ],
  },
];

// TODO: Phase 2-4에서 실제 API 연동
export default function Timeline() {
  const [activeChapter, setActiveChapter] = useState(1);
  const navigate = useNavigate();
  const chapters = DUMMY_CHAPTERS;

  return (
    <div className="wl-page wl-page-timeline">
      {/* Top bar */}
      <div className="wl-page-topbar">
        <div className="wl-page-brand">
          <div className="wl-logo-mark">W<span className="wl-heart">♥</span></div>
          <span className="wl-logo-text">weddinglog</span>
        </div>
        <nav className="wl-page-nav">
          <span onClick={() => navigate('/')}>홈</span>
          <span onClick={() => navigate('/calendar')}>캘린더</span>
          <span className="is-active">타임라인</span>
          <span onClick={() => navigate('/orders')}>앨범</span>
        </nav>
        <div className="wl-page-actions">
          <button className="wl-icon-btn">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4" />
              <path d="M13 13l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
          <div className="wl-page-avatar-pair">
            <span className="wl-tiny-avatar" style={{background: "linear-gradient(135deg,#EBB99B,#F5D4BC)"}}>성</span>
            <span className="wl-tiny-avatar" style={{background: "linear-gradient(135deg,#B7ABD4,#D9D2E8)"}}>은</span>
          </div>
        </div>
      </div>

      <div className="wl-timeline-wrap">
        {/* Book preview header */}
        <header className="wl-tl-hero">
          <div className="wl-tl-hero-left">
            <div className="wl-tl-eyebrow">OUR BOOK · PREVIEW</div>
            <h1 className="wl-tl-title serif">
              지금까지의 <em>우리 이야기</em>
            </h1>
            <p className="wl-tl-sub">
              시간 순이 아닌 기억의 결을 따라 묶었어요. 이대로 앨범을 주문하면<br />
              아래 구성대로 한 권의 책이 됩니다.
            </p>
            <div className="wl-tl-stats">
              <div className="wl-stat">
                <div className="wl-stat-num serif">45</div>
                <div className="wl-stat-label">총 사진</div>
              </div>
              <div className="wl-stat-sep" />
              <div className="wl-stat">
                <div className="wl-stat-num serif">04</div>
                <div className="wl-stat-label">챕터</div>
              </div>
              <div className="wl-stat-sep" />
              <div className="wl-stat">
                <div className="wl-stat-num serif">128</div>
                <div className="wl-stat-label">기록된 일</div>
              </div>
              <div className="wl-stat-sep" />
              <div className="wl-stat">
                <div className="wl-stat-num serif">84<span className="wl-stat-unit">p</span></div>
                <div className="wl-stat-label">예상 페이지</div>
              </div>
            </div>
          </div>

          <div className="wl-tl-hero-book">
            <div className="wl-book-big">
              <div className="wl-book-big-spine" />
              <div className="wl-book-big-cover">
                <div className="wl-book-big-eyebrow">A WEDDING LOG</div>
                <div className="wl-book-big-title serif">
                  성우<br/><span className="wl-book-big-amp">&amp;</span><br/>은비
                </div>
                <div className="wl-book-big-line" />
                <div className="wl-book-big-date serif">MMXXV</div>
              </div>
              <div className="wl-book-big-pages" />
            </div>
          </div>
        </header>

        {/* Chapter strip nav */}
        <nav className="wl-chapter-nav">
          {chapters.map((c) => (
            <button
              key={c.id}
              className={`wl-chapter-tab ${activeChapter === c.id ? "is-active" : ""}`}
              onClick={() => setActiveChapter(c.id)}
            >
              <span className="wl-chapter-tab-num serif">{String(c.id).padStart(2, "0")}</span>
              <span className="wl-chapter-tab-title">{c.title}</span>
              <span className="wl-chapter-tab-count">{c.count}</span>
            </button>
          ))}
        </nav>

        {/* Timeline body */}
        <div className="wl-tl-body">
          <div className="wl-tl-rail" />

          {chapters.map((c) => (
            <article key={c.id} className={`wl-chapter wl-chapter-${c.cat}`}>
              <div className="wl-chapter-marker">
                <span className="wl-chapter-dot" style={{ background: `var(--wl-cat-${c.cat})` }} />
                <span className="wl-chapter-line" />
              </div>

              <div className="wl-chapter-card">
                <header className="wl-chapter-head">
                  <div className="wl-chapter-meta">
                    <span className="wl-chapter-num">{c.num}</span>
                    <span className="wl-dot-sep">·</span>
                    <span className="wl-chapter-range">{c.dateRange}</span>
                  </div>
                  <div className="wl-chapter-title-row">
                    <h2 className="wl-chapter-title serif">{c.title}</h2>
                    <div className="wl-chapter-sub serif">{c.subtitle}</div>
                  </div>
                  <div className="wl-chapter-count-pill">
                    <span className="serif">{c.count}</span>
                    <span>장의 사진</span>
                  </div>
                </header>

                {/* Body varies by chapter type */}
                {c.sub ? (
                  <div className="wl-subcat-grid">
                    {c.sub.map((s) => (
                      <div key={s.label} className="wl-subcat">
                        <div className="wl-subcat-head">
                          <span className={`wl-cat-pill wl-cat-${s.cat}`}>{s.label}</span>
                          <span className="wl-subcat-count">{s.count}장</span>
                        </div>
                        <div className="wl-subcat-stack">
                          {s.photos.map((tone, i) => (
                            <div
                              key={i}
                              className={`wl-stack-photo wl-tone-${tone}`}
                              style={{ zIndex: s.photos.length - i }}
                            >
                              <div className="wl-log-img-stripes" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="wl-chapter-scroll">
                    {c.photos.map((p, i) => (
                      <figure key={i} className="wl-tl-photo">
                        <div className={`wl-tl-photo-img wl-tone-${p.tone}`}>
                          <div className="wl-log-img-stripes" />
                          <span className="wl-tl-photo-num serif">{String(i + 1).padStart(2, "0")}</span>
                        </div>
                        <figcaption className="wl-tl-photo-cap">{p.caption}</figcaption>
                      </figure>
                    ))}
                    <div className="wl-tl-more">
                      <div className="wl-tl-more-num serif">+{c.count - c.photos.length}</div>
                      <div className="wl-tl-more-label">더 보기</div>
                    </div>
                  </div>
                )}

                <footer className="wl-chapter-foot">
                  <button className="wl-link-strong">챕터 편집 →</button>
                  <button className="wl-link">페이지 미리보기</button>
                </footer>
              </div>
            </article>
          ))}

          {/* End cap */}
          <div className="wl-tl-end">
            <span className="wl-tl-end-dot" />
            <span className="wl-tl-end-label serif">To be continued…</span>
          </div>
        </div>

        {/* Bottom CTA */}
        <section className="wl-order-cta">
          <div className="wl-order-left">
            <div className="wl-order-eyebrow">ORDER</div>
            <h2 className="wl-order-title serif">이 기록을 한 권의 책으로</h2>
            <p className="wl-order-desc">
              하드커버 · 84페이지 · 아트지 · 무광 라미네이팅. 인쇄 전 미리보기를 열어
              순서와 캡션을 한번 더 확인할 수 있어요.
            </p>
            <div className="wl-order-specs">
              <div className="wl-order-spec">
                <span className="wl-spec-k">사이즈</span>
                <span className="wl-spec-v">22 × 28 cm</span>
              </div>
              <div className="wl-order-spec">
                <span className="wl-spec-k">페이지</span>
                <span className="wl-spec-v">84p</span>
              </div>
              <div className="wl-order-spec">
                <span className="wl-spec-k">커버</span>
                <span className="wl-spec-v">하드커버 · 린넨</span>
              </div>
              <div className="wl-order-spec">
                <span className="wl-spec-k">배송</span>
                <span className="wl-spec-v">주문 후 7–10일</span>
              </div>
            </div>
          </div>
          <div className="wl-order-right">
            <div className="wl-order-price">
              <div className="wl-order-price-eyebrow">예상 가격</div>
              <div className="wl-order-price-num serif">
                ₩ 89,000
              </div>
              <div className="wl-order-price-sub">커플 첫 주문 · 20% 할인 적용</div>
            </div>
            {/* TODO: Phase 2-4에서 실제 API 연동 */}
            <button
              className="wl-btn wl-btn-primary wl-btn-lg"
              onClick={() => navigate('/order-checkout')}
            >
              이 기록을 앨범으로 만들기
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="wl-btn wl-btn-ghost">전체 미리보기</button>
          </div>
        </section>
      </div>
    </div>
  );
}
