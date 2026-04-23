// Orders management screen

function OrdersScreen() {
  const [expanded, setExpanded] = React.useState("WL-20251103-001");

  const orders = [
    {
      id: "WL-20251103-001",
      date: "2025. 11. 03",
      status: "processing",
      statusLabel: "제작 중",
      eta: "2025. 11. 13 도착 예정",
      format: "정사각형 21×21",
      cover: "하드커버 · 린넨",
      qty: 3,
      total: 84000,
      thumbs: ["peach", "lavender", "mint", "cream"],
      chapters: [
        { name: "웨딩촬영", count: 8 },
        { name: "준비의 날들", count: 12 },
        { name: "그 날 — 본식", count: 15 },
        { name: "첫 여행", count: 10 },
      ],
      shipping: {
        recipient: "김성우",
        phone: "010-1234-****",
        addr: "서울 성동구 성수이로 22, 404호 (04783)",
      },
      timeline: [
        { id: "placed",   label: "주문 접수",   date: "11.03 14:22", done: true  },
        { id: "process",  label: "제작 중",     date: "11.04 09:10", done: true, active: true },
        { id: "shipping", label: "배송 준비",   date: "예정",        done: false },
        { id: "done",     label: "배송 완료",   date: "예정",        done: false },
      ],
    },
    {
      id: "WL-20251015-018",
      date: "2025. 10. 15",
      status: "delivered",
      statusLabel: "배송 완료",
      eta: "2025. 10. 24 수령",
      format: "A4 21×29.7",
      cover: "소프트커버 · 매트",
      qty: 1,
      total: 28000,
      thumbs: ["cream", "peach", "lavender", "sky"],
    },
  ];

  const statusClass = (s) => `wl-status wl-status-${s}`;

  return (
    <div className="wl-page">
      <div className="wl-page-topbar">
        <div className="wl-page-brand">
          <div className="wl-logo-mark">W<span className="wl-heart">♥</span></div>
          <span className="wl-logo-text">weddinglog</span>
        </div>
        <nav className="wl-page-nav">
          <span>홈</span>
          <span>캘린더</span>
          <span>타임라인</span>
          <span className="is-active">주문 · 앨범</span>
        </nav>
        <div className="wl-page-actions">
          <div className="wl-page-avatar-pair">
            <span className="wl-tiny-avatar" style={{background: "linear-gradient(135deg,#EBB99B,#F5D4BC)"}}>성</span>
            <span className="wl-tiny-avatar" style={{background: "linear-gradient(135deg,#B7ABD4,#D9D2E8)"}}>은</span>
          </div>
        </div>
      </div>

      <div className="wl-orders-wrap">
        <header className="wl-orders-hero">
          <div>
            <div className="wl-tl-eyebrow">ORDERS</div>
            <h1 className="wl-orders-title serif">주문 관리</h1>
            <p className="wl-orders-sub">
              지금까지 만든 앨범과 진행 상황을 한곳에서 확인하세요.
            </p>
          </div>
          <div className="wl-orders-stats">
            <div className="wl-orders-stat">
              <div className="wl-orders-stat-num serif">2</div>
              <div className="wl-orders-stat-label">총 주문</div>
            </div>
            <div className="wl-stat-sep" />
            <div className="wl-orders-stat">
              <div className="wl-orders-stat-num serif">4</div>
              <div className="wl-orders-stat-label">앨범 권수</div>
            </div>
            <div className="wl-stat-sep" />
            <div className="wl-orders-stat">
              <div className="wl-orders-stat-num serif">1</div>
              <div className="wl-orders-stat-label">진행 중</div>
            </div>
          </div>
        </header>

        <div className="wl-orders-filters">
          <button className="wl-filter is-active">전체</button>
          <button className="wl-filter">진행 중</button>
          <button className="wl-filter">배송 완료</button>
          <button className="wl-filter">취소</button>
          <div className="wl-filter-spacer" />
          <button className="wl-btn wl-btn-ghost">+ 새 주문</button>
        </div>

        <div className="wl-orders-list">
          {orders.map((o) => {
            const isOpen = expanded === o.id;
            return (
              <article key={o.id} className={`wl-order-card ${isOpen ? "is-open" : ""}`}>
                <header
                  className="wl-order-card-head"
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                >
                  <div className="wl-order-id-col">
                    <div className="wl-order-id-eyebrow">주문번호</div>
                    <div className="wl-order-id serif">#{o.id}</div>
                    <div className="wl-order-date">주문일 · {o.date}</div>
                  </div>

                  <div className="wl-order-config-col">
                    <div className="wl-order-config-row">
                      <span className={statusClass(o.status)}>
                        <span className="wl-status-dot" />
                        {o.statusLabel}
                      </span>
                      <span className="wl-order-eta">· {o.eta}</span>
                    </div>
                    <div className="wl-order-config-line">
                      <span>{o.format}</span>
                      <span className="wl-dot-sep">·</span>
                      <span>{o.cover}</span>
                      <span className="wl-dot-sep">·</span>
                      <span>{o.qty}권</span>
                    </div>
                  </div>

                  <div className="wl-order-thumbs">
                    {o.thumbs.map((t, i) => (
                      <div key={i} className={`wl-order-thumb wl-tone-${t}`}>
                        <div className="wl-log-img-stripes" />
                      </div>
                    ))}
                    <div className="wl-order-thumb wl-order-thumb-more">+41</div>
                  </div>

                  <div className="wl-order-price-col">
                    <div className="wl-order-price-val serif">₩ {o.total.toLocaleString()}</div>
                    <button className="wl-order-expand">
                      <svg width="14" height="14" viewBox="0 0 14 14" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s ease" }}>
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </header>

                {isOpen && o.timeline && (
                  <div className="wl-order-detail">
                    <div className="wl-order-detail-grid">
                      {/* Chapter summary */}
                      <div className="wl-od-block">
                        <div className="wl-od-eyebrow">챕터별 구성</div>
                        <div className="wl-od-chapters">
                          {o.chapters.map((c, i) => (
                            <div key={i} className="wl-od-chapter">
                              <span className="wl-od-ch-num serif">{String(i + 1).padStart(2, "0")}</span>
                              <span className="wl-od-ch-name">{c.name}</span>
                              <span className="wl-od-ch-dots">
                                {Array.from({ length: Math.min(c.count, 12) }).map((_, k) => (
                                  <span key={k} className="wl-od-ch-dot" />
                                ))}
                                {c.count > 12 && <span className="wl-od-ch-more">+{c.count - 12}</span>}
                              </span>
                              <span className="wl-od-ch-count">{c.count}장</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping */}
                      <div className="wl-od-block">
                        <div className="wl-od-eyebrow">배송 정보</div>
                        <div className="wl-od-ship">
                          <div className="wl-od-ship-row">
                            <span className="wl-od-ship-k">받는 분</span>
                            <span className="wl-od-ship-v">{o.shipping.recipient}</span>
                          </div>
                          <div className="wl-od-ship-row">
                            <span className="wl-od-ship-k">연락처</span>
                            <span className="wl-od-ship-v">{o.shipping.phone}</span>
                          </div>
                          <div className="wl-od-ship-row">
                            <span className="wl-od-ship-k">주소</span>
                            <span className="wl-od-ship-v">{o.shipping.addr}</span>
                          </div>
                          <button className="wl-link-strong wl-od-ship-edit">배송지 수정 →</button>
                        </div>
                      </div>
                    </div>

                    {/* Status timeline */}
                    <div className="wl-od-block wl-od-block-timeline">
                      <div className="wl-od-eyebrow">진행 상태</div>
                      <div className="wl-od-timeline">
                        {o.timeline.map((t, i) => (
                          <React.Fragment key={t.id}>
                            <div className={`wl-od-tl-step ${t.done ? "is-done" : ""} ${t.active ? "is-active" : ""}`}>
                              <div className="wl-od-tl-dot">
                                {t.done && !t.active && (
                                  <svg viewBox="0 0 14 14" width="8" height="8"><path d="M2 7.5L5.5 11L12 3.5" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                )}
                                {t.active && <span className="wl-od-tl-pulse" />}
                              </div>
                              <div className="wl-od-tl-label">{t.label}</div>
                              <div className="wl-od-tl-date">{t.date}</div>
                            </div>
                            {i < o.timeline.length - 1 && (
                              <div className={`wl-od-tl-rail ${t.done ? "is-done" : ""}`} />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <footer className="wl-od-foot">
                      <button className="wl-btn wl-btn-ghost">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M7 2v8M3 7l4 4 4-4M2 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        데이터 다운로드 (ZIP)
                      </button>
                      <button className="wl-btn wl-btn-ghost">미리보기 PDF</button>
                      <button className="wl-btn wl-btn-ghost">문의하기</button>
                      <div style={{ flex: 1 }} />
                      <button className="wl-btn wl-btn-primary wl-btn-sm">배송 추적</button>
                    </footer>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.OrdersScreen = OrdersScreen;
