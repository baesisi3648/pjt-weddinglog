// @TASK P1.5-S0-T1 - Home 핸드오프 JSX 포팅
// @SPEC docs/planning/06-tasks.md#P1.5-S0-T1
// TODO: Phase 2-4에서 실제 API 연동
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCouple } from '../context/CoupleContext';

const DUMMY_TASKS = [
  { id: 1, label: "스드메 2차 미팅", date: "9/15", done: false, cat: "sdm" },
  { id: 2, label: "청첩장 시안 확인", date: "9/12", done: true, cat: "invite" },
  { id: 3, label: "예물 최종 결정", date: "9/18", done: false, cat: "jewel" },
];

const DUMMY_RECENT_LOGS = [
  { id: 1, tone: "peach", caption: "드레스 투어 2차", date: "9.08" },
  { id: 2, tone: "lavender", caption: "본식장 답사", date: "9.05" },
  { id: 3, tone: "mint", caption: "청첩장 미팅", date: "9.02" },
  { id: 4, tone: "cream", caption: "예물 상담", date: "8.30" },
];

function BottomNav({ active }) {
  const navigate = useNavigate();
  const items = [
    { id: "home", label: "홈", icon: <IconHome />, to: "/" },
    { id: "calendar", label: "캘린더", icon: <IconCal />, to: "/calendar" },
    { id: "timeline", label: "타임라인", icon: <IconTime />, to: "/timeline" },
    { id: "album", label: "앨범", icon: <IconBook />, to: "/orders" },
    { id: "settings", label: "설정", icon: <IconGear />, to: "/" },
  ];
  return (
    <nav className="wl-bottomnav">
      {items.map((i) => (
        <div
          key={i.id}
          className={`wl-nav-item ${active === i.id ? "is-active" : ""}`}
          onClick={() => navigate(i.to)}
        >
          <div className="wl-nav-icon">{i.icon}</div>
          <div className="wl-nav-label">{i.label}</div>
        </div>
      ))}
    </nav>
  );
}

export default function Home() {
  const [tasks, setTasks] = useState(DUMMY_TASKS);
  // TODO: Phase 2-4에서 실제 API 연동
  const { couple } = useCouple();

  const toggleTask = (id) =>
    setTasks((t) => t.map((x) => x.id === id ? { ...x, done: !x.done } : x));

  const recentLogs = DUMMY_RECENT_LOGS;

  // D-day 계산 (커플 데이터 있으면 활용, 없으면 더미 유지)
  const dDayNum = couple?.wedding_date
    ? Math.ceil((new Date(couple.wedding_date) - new Date()) / (1000 * 60 * 60 * 24))
    : 42;
  const coupleName = couple
    ? `${couple.groom_name} ♥ ${couple.bride_name}`
    : "성우 ♥ 은비";
  const weddingDateStr = couple?.wedding_date ?? "2025. 10. 25 · SAT";

  return (
    <div className="wl-screen wl-home">
      {/* Status bar */}
      <div className="wl-statusbar">
        <span>9:41</span>
        <div className="wl-statusbar-right">
          <span className="wl-sb-dot" />
          <span className="wl-sb-dot" />
          <span className="wl-sb-dot" />
        </div>
      </div>

      {/* Top bar */}
      <div className="wl-topbar">
        <div className="wl-logo">
          <span className="wl-logo-mark">W<span className="wl-heart">♥</span></span>
          <span className="wl-logo-text">weddinglog</span>
        </div>
        <div className="wl-topbar-icons">
          <IconBell />
        </div>
      </div>

      <div className="wl-scroll">
        {/* Couple hero card */}
        <div className="wl-hero">
          <div className="wl-hero-bg" />
          <div className="wl-hero-inner">
            <div className="wl-avatars">
              <div className="wl-avatar wl-avatar-a">
                <div className="wl-avatar-ph">성우</div>
              </div>
              <div className="wl-avatars-heart">♥</div>
              <div className="wl-avatar wl-avatar-b">
                <div className="wl-avatar-ph">은비</div>
              </div>
            </div>
            <div className="wl-couple-name">
              성우 <span className="wl-hrt-inline">♥</span> 은비
            </div>
            <div className="wl-dday">
              <span className="wl-dday-label">결혼까지</span>
              <span className="wl-dday-num">D-{dDayNum}</span>
            </div>
            <div className="wl-wedding-date">{weddingDateStr}</div>

            <div className="wl-progress">
              <div className="wl-progress-row">
                <span>준비 진행률</span>
                <span className="wl-progress-pct">68%</span>
              </div>
              <div className="wl-progress-bar">
                <div className="wl-progress-fill" style={{ width: "68%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* This week's tasks */}
        <section className="wl-section">
          <header className="wl-section-head">
            <div>
              <div className="wl-section-eyebrow">This week</div>
              <h2 className="wl-section-title">이번 주 할 일</h2>
            </div>
            <button className="wl-link">모두 보기 →</button>
          </header>

          <div className="wl-card wl-tasks">
            {tasks.map((t) => (
              <button
                key={t.id}
                className={`wl-task ${t.done ? "is-done" : ""}`}
                onClick={() => toggleTask(t.id)}
              >
                <span className={`wl-check ${t.done ? "is-checked" : ""}`}>
                  {t.done && (
                    <svg viewBox="0 0 14 14" width="10" height="10">
                      <path d="M2 7.5L5.5 11L12 3.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <div className="wl-task-body">
                  <div className="wl-task-label">{t.label}</div>
                  <div className="wl-task-meta">
                    <span className={`wl-cat-pill wl-cat-${t.cat}`}>
                      {t.cat === "sdm" ? "스드메" : t.cat === "invite" ? "청첩장" : "예물"}
                    </span>
                    <span className="wl-task-date">{t.date}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent logs */}
        <section className="wl-section">
          <header className="wl-section-head">
            <div>
              <div className="wl-section-eyebrow">Recent</div>
              <h2 className="wl-section-title">최근 기록</h2>
            </div>
            <button className="wl-link">전체 →</button>
          </header>

          <div className="wl-logs">
            {recentLogs.map((l) => (
              <div key={l.id} className="wl-log-card">
                <div className={`wl-log-img wl-tone-${l.tone}`}>
                  <div className="wl-log-img-stripes" />
                  <div className="wl-log-date">{l.date}</div>
                </div>
                <div className="wl-log-caption">{l.caption}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Album CTA */}
        <section className="wl-section">
          <div className="wl-album-cta">
            <div className="wl-album-book">
              <div className="wl-book-spine" />
              <div className="wl-book-cover">
                <div className="wl-book-eyebrow">OUR STORY</div>
                <div className="wl-book-title">성우 &amp; 은비</div>
                <div className="wl-book-line" />
                <div className="wl-book-sub">2024 — 2025</div>
              </div>
            </div>
            <div className="wl-album-copy">
              <div className="wl-album-eyebrow">Album</div>
              <div className="wl-album-title">
                우리의 기록을<br />한 권의 책으로
              </div>
              <div className="wl-album-desc">
                지금까지 쌓인 <b>128장</b>의 순간을 담을 수 있어요
              </div>
              {/* TODO: Phase 2-4에서 실제 API 연동 */}
              <Link to="/order-checkout" className="wl-btn wl-btn-primary" style={{ textDecoration: 'none' }}>
                앨범 만들기
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        <div className="wl-bottom-spacer" />
      </div>

      {/* Bottom nav */}
      <BottomNav active="home" />
    </div>
  );
}

/* ---- icons (line, minimal) ---- */
function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M10 3c-2.8 0-5 2.2-5 5v3L4 13h12l-1-2V8c0-2.8-2.2-5-5-5zM8 15a2 2 0 104 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <path d="M3 10.5L11 4l8 6.5V18a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 013 18v-7.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 19.5v-5h4v5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function IconCal() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <rect x="3.5" y="5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 9h15M7.5 3.5v3M14.5 3.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconTime() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <path d="M4 6h14M4 11h14M4 16h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="6" cy="6" r="1.3" fill="currentColor" />
      <circle cx="6" cy="11" r="1.3" fill="currentColor" />
      <circle cx="6" cy="16" r="1.3" fill="currentColor" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <path d="M4 4.5h6a2 2 0 012 2v12a1.5 1.5 0 00-1.5-1.5H4v-12.5zM18 4.5h-6a2 2 0 00-2 2v12a1.5 1.5 0 011.5-1.5H18v-12.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="2.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 2.5v2M11 17.5v2M2.5 11h2M17.5 11h2M5 5l1.5 1.5M15.5 15.5L17 17M5 17l1.5-1.5M15.5 6.5L17 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
