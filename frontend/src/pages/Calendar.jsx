// @TASK P1.5-S0-T1 - Calendar 핸드오프 JSX 포팅
// @SPEC docs/planning/06-tasks.md#P1.5-S0-T1
// TODO: Phase 2-4에서 실제 API 연동
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WL_CATS = {
  photo:   { label: "웨딩촬영", color: "var(--wl-cat-photo)"   },
  sdm:     { label: "스드메",   color: "var(--wl-cat-sdm)"     },
  venue:   { label: "예식장",   color: "var(--wl-cat-venue)"   },
  jewel:   { label: "예물",     color: "var(--wl-cat-jewel)"   },
  wedding: { label: "본식",     color: "var(--wl-cat-wedding)" },
  honey:   { label: "신혼여행", color: "var(--wl-cat-honey)"   },
};

// Sep 2025 — Mon-first week
const DUMMY_EVENTS = {
  3:  [{ id: 1, cat: "photo", title: "본식 촬영 컨셉 회의", time: "14:00", done: true  }],
  8:  [{ id: 2, cat: "venue", title: "예식장 답사 — 더채플", time: "11:00", done: true, photo: "lavender" }],
  12: [{ id: 3, cat: "sdm",   title: "청첩장 시안 확인",    time: "18:30", done: true  }],
  15: [
    { id: 4, cat: "sdm",   title: "스드메 2차 미팅",     time: "15:00", done: false },
    { id: 5, cat: "jewel", title: "예물샵 방문",         time: "19:00", done: false },
  ],
  18: [{ id: 6, cat: "jewel", title: "예물 최종 결정",      time: "17:00", done: false, photo: "peach" }],
  22: [{ id: 7, cat: "photo", title: "본식 스냅 미팅",      time: "13:00", done: false }],
  25: [{ id: 8, cat: "wedding", title: "청첩장 발송",       time: "전일",  done: false }],
  27: [{ id: 9, cat: "honey", title: "신혼여행 항공권 발권", time: "10:00", done: false }],
  30: [{ id:10, cat: "venue", title: "하객 좌석 배치 확정",  time: "16:00", done: false, photo: "mint" }],
};

// TODO: Phase 2-4에서 실제 API 연동
export default function Calendar() {
  const [selected, setSelected] = useState(15);
  const [events, setEvents] = useState(DUMMY_EVENTS);
  const navigate = useNavigate();

  const toggleDone = (day, id) => {
    setEvents((e) => ({
      ...e,
      [day]: e[day].map((x) => (x.id === id ? { ...x, done: !x.done } : x)),
    }));
  };

  // Sep 1, 2025 is Monday → weekday index 0 (Mon-first)
  const firstWeekday = 0;
  const daysInMonth = 30;
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weekHeaders = ["월", "화", "수", "목", "금", "토", "일"];
  const selDayEvents = events[selected] || [];

  return (
    <div className="wl-screen wl-cal">
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
        <button className="wl-icon-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="wl-topbar-title">캘린더</div>
        <button className="wl-icon-btn">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="4" cy="9" r="1.2" fill="currentColor" />
            <circle cx="9" cy="9" r="1.2" fill="currentColor" />
            <circle cx="14" cy="9" r="1.2" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div className="wl-scroll">
        {/* Month header */}
        <div className="wl-month-head">
          <button className="wl-month-arrow">
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="wl-month-title">
            <div className="wl-month-year">2025</div>
            <div className="wl-month-name">September</div>
          </div>
          <button className="wl-month-arrow">
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {/* Category legend */}
        <div className="wl-legend">
          {Object.entries(WL_CATS).map(([k, v]) => (
            <div key={k} className="wl-legend-item">
              <span className="wl-legend-dot" style={{ background: v.color }} />
              <span>{v.label}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="wl-card wl-cal-card">
          <div className="wl-weekdays">
            {weekHeaders.map((w, i) => (
              <div key={w} className={`wl-weekday ${i === 5 ? "is-sat" : ""} ${i === 6 ? "is-sun" : ""}`}>{w}</div>
            ))}
          </div>

          <div className="wl-days">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} className="wl-day wl-day-empty" />;
              const ev = events[d] || [];
              const dayOfWeek = i % 7;
              const isToday = d === 12;
              const isWeddingDay = d === 25;
              return (
                <button
                  key={i}
                  className={`wl-day ${selected === d ? "is-selected" : ""} ${isToday ? "is-today" : ""} ${isWeddingDay ? "is-wedding" : ""} ${dayOfWeek === 5 ? "is-sat" : ""} ${dayOfWeek === 6 ? "is-sun" : ""}`}
                  onClick={() => setSelected(d)}
                >
                  <span className="wl-day-num">{d}</span>
                  {isWeddingDay && <span className="wl-day-ring">♥</span>}
                  {ev.length > 0 && (
                    <div className="wl-day-dots">
                      {ev.slice(0, 3).map((e) => (
                        <span key={e.id} className="wl-day-dot" style={{ background: WL_CATS[e.cat].color }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day events */}
        <div className="wl-day-events">
          <div className="wl-day-events-head">
            <div>
              <div className="wl-day-events-eyebrow">Sep {selected}, Mon</div>
              <div className="wl-day-events-title">
                {selDayEvents.length > 0 ? `${selDayEvents.length}개의 일정` : "일정이 없어요"}
              </div>
            </div>
            <button className="wl-link">편집</button>
          </div>

          <div className="wl-events-list">
            {selDayEvents.map((e) => (
              <div
                key={e.id}
                className={`wl-event ${e.done ? "is-done" : ""}`}
                onClick={() => navigate(`/events/${e.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="wl-event-rail" style={{ background: WL_CATS[e.cat].color }} />
                <div className="wl-event-body">
                  <div className="wl-event-meta">
                    <span className={`wl-cat-pill wl-cat-${e.cat}`}>{WL_CATS[e.cat].label}</span>
                    <span className="wl-event-time">{e.time}</span>
                  </div>
                  <div className="wl-event-title">{e.title}</div>
                </div>
                {e.photo && (
                  <div className={`wl-event-photo wl-tone-${e.photo}`}>
                    <div className="wl-log-img-stripes" />
                  </div>
                )}
                <button
                  className={`wl-check wl-check-lg ${e.done ? "is-checked" : ""}`}
                  onClick={(ev) => { ev.stopPropagation(); toggleDone(selected, e.id); }}
                >
                  {e.done && (
                    <svg viewBox="0 0 14 14" width="11" height="11">
                      <path d="M2 7.5L5.5 11L12 3.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
            {selDayEvents.length === 0 && (
              <div className="wl-empty">
                <div className="wl-empty-icon">＋</div>
                <div>이 날의 첫 기록을 남겨보세요</div>
              </div>
            )}
          </div>
        </div>

        <div className="wl-bottom-spacer" />
      </div>

      {/* FAB */}
      <button className="wl-fab" aria-label="일정 추가">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 3.5v11M3.5 9h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
