// @TASK P1.5-S0-T1 - OrderCheckout 핸드오프 JSX 포팅
// @SPEC docs/planning/06-tasks.md#P1.5-S0-T1
// TODO: Phase 2-4에서 실제 API 연동
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Format = 'square' | 'a4';
type Cover = 'hard' | 'soft';

interface Step {
  id: number;
  label: string;
  sub: string;
}

interface QuantitySuggest {
  n: number;
  label: string;
}

export default function OrderCheckout() {
  const [format, setFormat] = useState<Format>('square');
  const [cover, setCover] = useState<Cover>('hard');
  const [qty, setQty] = useState(3);
  const navigate = useNavigate();

  const unitPrice = cover === 'hard' ? 35000 : 28000;
  const total = unitPrice * qty;
  const fmt = (n: number) => '₩ ' + n.toLocaleString();

  const steps: Step[] = [
    { id: 1, label: '구성 확인',  sub: 'Review' },
    { id: 2, label: '옵션 선택',  sub: 'Options' },
    { id: 3, label: '배송 정보',  sub: 'Shipping' },
    { id: 4, label: '완료',       sub: 'Done' },
  ];
  const current = 2;

  const qtySuggests: QuantitySuggest[] = [
    { n: 1, label: '우리 집 소장용' },
    { n: 3, label: '우리 + 양가' },
    { n: 5, label: '가족 · 친지' },
  ];

  return (
    <div className="wl-page">
      <div className="wl-page-topbar">
        <button className="wl-icon-btn wl-back-btn" onClick={() => navigate('/timeline')}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>타임라인</span>
        </button>
        <div className="wl-page-crumbs">
          <span>앨범 주문</span>
          <span className="wl-crumb-sep">·</span>
          <span>성우 &amp; 은비의 기록</span>
        </div>
        <div className="wl-page-actions">
          <button className="wl-btn wl-btn-ghost">임시 저장</button>
        </div>
      </div>

      {/* Stepper */}
      <div className="wl-stepper">
        {steps.map((s, i) => {
          const state = s.id < current ? 'done' : s.id === current ? 'active' : 'upcoming';
          return (
            <React.Fragment key={s.id}>
              <div className={`wl-step wl-step-${state}`}>
                <div className="wl-step-num">
                  {state === 'done' ? (
                    <svg viewBox="0 0 14 14" width="10" height="10">
                      <path d="M2 7.5L5.5 11L12 3.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span className="serif">{String(s.id).padStart(2, '0')}</span>
                  )}
                </div>
                <div className="wl-step-text">
                  <div className="wl-step-sub">{s.sub}</div>
                  <div className="wl-step-label">{s.label}</div>
                </div>
              </div>
              {i < steps.length - 1 && <div className={`wl-step-rail wl-step-rail-${s.id < current ? 'done' : 'upcoming'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="wl-order-body">
        <main className="wl-order-main">
          {/* AI recommendation */}
          <div className="wl-ai-rec">
            <div className="wl-ai-rec-badge">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2l1.2 2.6L11 5.8 8.2 7 7 10 5.8 7 3 5.8 5.8 4.6 7 2z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
              </svg>
              <span>AI 추천</span>
            </div>
            <div className="wl-ai-rec-body">
              <div className="wl-ai-rec-title serif">
                총 <em>45장</em>의 사진, <em>4개 챕터</em> — <em>32페이지</em> 구성을 추천해요
              </div>
              <div className="wl-ai-rec-sub">
                가로형보다는 정사각형 판형이 수평·수직 사진이 섞인 이 앨범에 어울려요.
              </div>
            </div>
            <button className="wl-ai-rec-apply">추천 적용</button>
          </div>

          {/* Format */}
          <section className="wl-opt-sec">
            <div className="wl-opt-head">
              <div>
                <div className="wl-opt-eyebrow">01 · Format</div>
                <h3 className="wl-opt-title serif">판형</h3>
              </div>
              <span className="wl-opt-hint">원하는 비율로 골라주세요</span>
            </div>
            <div className="wl-opt-grid wl-opt-grid-2">
              <label className={`wl-opt-card ${format === 'square' ? 'is-selected' : ''}`}>
                <input type="radio" name="format" checked={format === 'square'} onChange={() => setFormat('square')} />
                <div className="wl-opt-preview wl-opt-preview-format">
                  <div className="wl-opt-book wl-opt-book-square">
                    <div className="wl-opt-book-spine" />
                    <div className="wl-opt-book-cover">
                      <div className="wl-opt-book-label">21 × 21</div>
                    </div>
                  </div>
                </div>
                <div className="wl-opt-card-body">
                  <div className="wl-opt-card-title">정사각형</div>
                  <div className="wl-opt-card-meta">21 × 21 cm · 추천</div>
                </div>
                <span className="wl-opt-radio" />
              </label>

              <label className={`wl-opt-card ${format === 'a4' ? 'is-selected' : ''}`}>
                <input type="radio" name="format" checked={format === 'a4'} onChange={() => setFormat('a4')} />
                <div className="wl-opt-preview wl-opt-preview-format">
                  <div className="wl-opt-book wl-opt-book-a4">
                    <div className="wl-opt-book-spine" />
                    <div className="wl-opt-book-cover">
                      <div className="wl-opt-book-label">21 × 29.7</div>
                    </div>
                  </div>
                </div>
                <div className="wl-opt-card-body">
                  <div className="wl-opt-card-title">A4 세로형</div>
                  <div className="wl-opt-card-meta">21 × 29.7 cm</div>
                </div>
                <span className="wl-opt-radio" />
              </label>
            </div>
          </section>

          {/* Cover */}
          <section className="wl-opt-sec">
            <div className="wl-opt-head">
              <div>
                <div className="wl-opt-eyebrow">02 · Cover</div>
                <h3 className="wl-opt-title serif">표지</h3>
              </div>
              <span className="wl-opt-hint">오래 두고 볼 책이라면 하드커버</span>
            </div>
            <div className="wl-opt-grid wl-opt-grid-2">
              <label className={`wl-opt-card ${cover === 'hard' ? 'is-selected' : ''}`}>
                <input type="radio" name="cover" checked={cover === 'hard'} onChange={() => setCover('hard')} />
                <div className="wl-opt-preview wl-opt-preview-cover">
                  <div className="wl-cover-preview wl-cover-hard">
                    <div className="wl-cover-edge" />
                    <div className="wl-cover-face" />
                  </div>
                </div>
                <div className="wl-opt-card-body">
                  <div className="wl-opt-card-title">하드커버</div>
                  <div className="wl-opt-card-meta">린넨 · 무광 · +₩7,000</div>
                </div>
                <span className="wl-opt-radio" />
              </label>

              <label className={`wl-opt-card ${cover === 'soft' ? 'is-selected' : ''}`}>
                <input type="radio" name="cover" checked={cover === 'soft'} onChange={() => setCover('soft')} />
                <div className="wl-opt-preview wl-opt-preview-cover">
                  <div className="wl-cover-preview wl-cover-soft">
                    <div className="wl-cover-face" />
                  </div>
                </div>
                <div className="wl-opt-card-body">
                  <div className="wl-opt-card-title">소프트커버</div>
                  <div className="wl-opt-card-meta">매트 · 가벼움</div>
                </div>
                <span className="wl-opt-radio" />
              </label>
            </div>
          </section>

          {/* Quantity */}
          <section className="wl-opt-sec">
            <div className="wl-opt-head">
              <div>
                <div className="wl-opt-eyebrow">03 · Quantity</div>
                <h3 className="wl-opt-title serif">수량</h3>
              </div>
              <span className="wl-opt-hint">최대 10권까지</span>
            </div>
            <div className="wl-qty-card">
              <div className="wl-qty-left">
                <div className="wl-qty-title">몇 권을 주문할까요?</div>
                <div className="wl-qty-hint">
                  💌 양가 부모님께 드릴 추가 앨범도 함께 주문하세요.
                </div>
              </div>
              <div className="wl-stepper-ctrl">
                <button
                  className="wl-stepper-btn"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  disabled={qty <= 1}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 7h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </button>
                <div className="wl-stepper-num serif">{qty}</div>
                <button
                  className="wl-stepper-btn"
                  onClick={() => setQty(Math.min(10, qty + 1))}
                  disabled={qty >= 10}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
            <div className="wl-qty-suggest">
              {qtySuggests.map((s) => (
                <button
                  key={s.n}
                  className={`wl-qty-chip ${qty === s.n ? 'is-active' : ''}`}
                  onClick={() => setQty(s.n)}
                >
                  <span className="serif">{s.n}권</span>
                  <span className="wl-qty-chip-label">{s.label}</span>
                </button>
              ))}
            </div>
          </section>
        </main>

        {/* Summary sidebar */}
        <aside className="wl-order-summary">
          <div className="wl-sum-card">
            <div className="wl-sum-eyebrow">Order summary</div>
            <h3 className="wl-sum-title serif">성우 &amp; 은비의 기록</h3>

            <div className="wl-sum-book-preview">
              <div className={`wl-sum-book ${format === 'a4' ? 'is-a4' : ''} ${cover === 'soft' ? 'is-soft' : ''}`}>
                <div className="wl-sum-book-spine" />
                <div className="wl-sum-book-cover">
                  <div className="wl-sum-book-eyebrow">A WEDDING LOG</div>
                  <div className="wl-sum-book-title serif">성우<br/>&amp;<br/>은비</div>
                  <div className="wl-sum-book-line" />
                  <div className="wl-sum-book-date serif">MMXXV</div>
                </div>
              </div>
            </div>

            <div className="wl-sum-rows">
              <div className="wl-sum-row">
                <span className="wl-sum-k">판형</span>
                <span className="wl-sum-v">{format === 'square' ? '정사각형 21×21' : 'A4 21×29.7'}</span>
              </div>
              <div className="wl-sum-row">
                <span className="wl-sum-k">표지</span>
                <span className="wl-sum-v">{cover === 'hard' ? '하드커버 · 린넨' : '소프트커버 · 매트'}</span>
              </div>
              <div className="wl-sum-row">
                <span className="wl-sum-k">페이지</span>
                <span className="wl-sum-v">32p · 4챕터</span>
              </div>
              <div className="wl-sum-row">
                <span className="wl-sum-k">사진</span>
                <span className="wl-sum-v">45장</span>
              </div>
              <div className="wl-sum-row">
                <span className="wl-sum-k">수량</span>
                <span className="wl-sum-v">{qty}권</span>
              </div>
            </div>

            <div className="wl-sum-price">
              <div className="wl-sum-price-line">
                <span>{fmt(unitPrice)} × {qty}권</span>
                <span>{fmt(total)}</span>
              </div>
              <div className="wl-sum-price-line wl-sum-price-dim">
                <span>첫 주문 20% 할인</span>
                <span>-{fmt(Math.round(total * 0.2))}</span>
              </div>
              <div className="wl-sum-price-line wl-sum-price-total">
                <span>합계</span>
                <span className="serif">{fmt(total - Math.round(total * 0.2))}</span>
              </div>
            </div>

            <button className="wl-btn wl-btn-primary wl-btn-lg">
              다음 단계 — 배송 정보
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div className="wl-sum-foot">주문 후 7–10일 이내 배송 · 무료 배송</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
