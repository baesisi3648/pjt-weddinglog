// @TASK P2-S1-T1 - Calendar 페이지 API 연동
// @TASK P2-S1-T2 - 리스트 뷰 탭
// @TASK P2-S1-T5 - AI 체크리스트 생성 UI
// @SPEC docs/planning/06-tasks.md#P2-S1-T1
// @SPEC specs/screens/02_calendar.yaml

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCouple } from '../context/CoupleContext';
import { listEvents, createEvent, updateEvent, deleteEvent, toggleCompleteEvent } from '../services/event_api';
import { requestChecklist } from '../services/ai_api';
import EventForm from '../components/EventForm';
import CategoryBadge, { CATEGORY_EMOJIS } from '../components/CategoryBadge';
import { CATEGORY_LABELS } from '../constants/enums';

// ─── 카테고리별 색상 (핸드오프 CSS 변수 기반) ───────────────────────────────
const CATEGORY_RAIL_COLORS = {
  WEDDING_PHOTO:       '#E8967C',
  STUDIO_DRESS_MAKEUP: '#B7ABD4',
  VENUE:               '#9BC2AB',
  GIFT:                '#D8B370',
  INVITATION:          '#B7ABD4',
  REHEARSAL:           '#9BC2AB',
  CEREMONY:            '#D2795E',
  HONEYMOON:           '#9BB8D4',
  ETC:                 '#BFB5AC',
};

// ─── 날짜 유틸 ──────────────────────────────────────────────────────────────
function getMonthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function getMonthLabel(year, month) {
  const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return { year, name: names[month] };
}

function buildCalendarCells(year, month) {
  const firstDay = new Date(year, month, 1);
  // 월요일 시작: 0=Mon…6=Sun
  const rawDow = firstDay.getDay(); // 0=Sun
  const firstWeekday = rawDow === 0 ? 6 : rawDow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ISO 날짜 → day number (현재 표시 월 기준)
function dateToDayNum(dateStr, year, month) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (d.getFullYear() === year && d.getMonth() === month) return d.getDate();
  return null;
}

// ─── Toast 컴포넌트 ─────────────────────────────────────────────────────────
function Toast({ message, type = 'info', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const bg = type === 'error' ? '#EF4444' : type === 'success' ? '#33FFBB' : '#2B2420';
  const color = type === 'success' ? '#2B2420' : '#fff';

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed', bottom: 80, right: 16, zIndex: 2000,
        background: bg, color,
        padding: '10px 16px', borderRadius: 10,
        fontSize: 13, fontWeight: 500,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        maxWidth: 280,
      }}
    >
      {message}
    </div>
  );
}

// ─── 확인 모달 ──────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1500,
        background: 'rgba(43,36,32,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      role="dialog" aria-modal="true"
    >
      <div style={{
        background: 'var(--wl-surface, #FDFAF5)',
        borderRadius: 16, padding: '24px 20px',
        width: 280, boxShadow: '0 8px 32px rgba(58,38,24,0.16)',
      }}>
        <p style={{ fontSize: 15, color: 'var(--wl-ink, #2B2420)', marginBottom: 20, lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--wl-line)', background: 'white', cursor: 'pointer', fontSize: 14 }}
          >취소</button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#E8967C', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
          >추가</button>
        </div>
      </div>
    </div>
  );
}

// ─── 스피너 ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div
        role="status"
        aria-label="로딩 중"
        style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '3px solid var(--wl-line, #EDE4D8)',
          borderTopColor: '#E8967C',
          animation: 'wl-spin 0.7s linear infinite',
        }}
      />
      <style>{`@keyframes wl-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
export default function Calendar() {
  const navigate = useNavigate();
  const { couple } = useCouple();

  // ── 날짜 상태 ──
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed

  // ── 뷰 모드 ──
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'list'

  // ── 이벤트 데이터 ──
  const [events, setEvents] = useState([]); // flat array from API
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // ── UI 상태 ──
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [toast, setToast] = useState(null); // { message, type }
  const [eventForm, setEventForm] = useState(null); // { mode, initialData?, date? }
  const [confirmAI, setConfirmAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSource, setAiSource] = useState(null); // 'ai' | 'template'

  // ── API: 이벤트 로드 ──────────────────────────────────────────────────────
  const coupleId = couple?.id;
  const monthKey = getMonthKey(viewYear, viewMonth);

  const fetchEvents = useCallback(async () => {
    if (!coupleId) return;
    setLoading(true);
    setApiError(null);
    try {
      const data = await listEvents(coupleId, monthKey);
      setEvents(Array.isArray(data) ? data : (data.events ?? []));
    } catch (err) {
      setApiError(err.response?.data?.detail ?? err.message ?? '일정을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [coupleId, monthKey]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ── 월 네비게이션 ─────────────────────────────────────────────────────────
  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };
  const goToToday = () => {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    setSelectedDay(t.getDate());
  };

  // ── 이벤트를 day별 map으로 변환 ──────────────────────────────────────────
  const eventsByDay = {};
  events.forEach((ev) => {
    const day = dateToDayNum(ev.date, viewYear, viewMonth);
    if (day !== null) {
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(ev);
    }
  });

  const selDayEvents = eventsByDay[selectedDay] || [];

  // ── 완료 토글 ─────────────────────────────────────────────────────────────
  const handleToggleComplete = async (eventId) => {
    if (!coupleId) return;
    try {
      await toggleCompleteEvent(coupleId, eventId);
      // 낙관적 업데이트
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, is_completed: !e.is_completed } : e));
    } catch {
      showToast('완료 상태 변경에 실패했습니다.', 'error');
    }
  };

  // ── EventForm 제출 ────────────────────────────────────────────────────────
  const handleEventSubmit = async (formData) => {
    if (!coupleId) return;
    try {
      if (eventForm?.mode === 'create') {
        await createEvent(coupleId, formData);
        showToast('일정이 저장되었습니다.', 'success');
      } else {
        await updateEvent(coupleId, eventForm.initialData.id, formData);
        showToast('일정이 수정되었습니다.', 'success');
      }
      setEventForm(null);
      await fetchEvents();
    } catch (err) {
      showToast(err.response?.data?.detail ?? '저장에 실패했습니다.', 'error');
    }
  };

  // ── 일정 삭제 ─────────────────────────────────────────────────────────────
  const handleDelete = async (eventId) => {
    if (!coupleId) return;
    if (!window.confirm('이 일정을 삭제할까요?')) return;
    try {
      await deleteEvent(coupleId, eventId);
      showToast('일정이 삭제되었습니다.', 'success');
      await fetchEvents();
    } catch {
      showToast('삭제에 실패했습니다.', 'error');
    }
  };

  // ── AI 체크리스트 ─────────────────────────────────────────────────────────
  const handleAIChecklist = () => {
    if (events.length > 0) {
      setConfirmAI(true);
    } else {
      doRequestChecklist();
    }
  };

  const doRequestChecklist = async () => {
    if (!coupleId) return;
    setConfirmAI(false);
    setAiLoading(true);
    setAiSource(null);
    try {
      const result = await requestChecklist(coupleId, couple?.wedding_date ?? null);
      setAiSource(result.source ?? 'template');
      showToast('체크리스트가 생성되었습니다!', 'success');
      await fetchEvents();
    } catch {
      showToast('AI 체크리스트 생성에 실패했습니다.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (message, type = 'info') => setToast({ message, type });
  const dismissToast = () => setToast(null);

  // ── 캘린더 셀 ─────────────────────────────────────────────────────────────
  const cells = buildCalendarCells(viewYear, viewMonth);
  const weekHeaders = ['월', '화', '수', '목', '금', '토', '일'];
  const { name: monthName } = getMonthLabel(viewYear, viewMonth);

  const todayDate = new Date();
  const isCurrentMonth = todayDate.getFullYear() === viewYear && todayDate.getMonth() === viewMonth;
  const todayNum = isCurrentMonth ? todayDate.getDate() : -1;

  // 결혼 D-Day
  let weddingDay = -1;
  if (couple?.wedding_date) {
    const wd = new Date(couple.wedding_date);
    if (wd.getFullYear() === viewYear && wd.getMonth() === viewMonth) {
      weddingDay = wd.getDate();
    }
  }

  // ── 리스트 뷰 포맷 ────────────────────────────────────────────────────────
  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  };

  // ────────────────────────────────────────────────────────────────────────
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
        <button className="wl-icon-btn" onClick={() => navigate(-1)} aria-label="뒤로">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="wl-topbar-title">캘린더</div>
        <button
          className="wl-icon-btn"
          onClick={goToToday}
          aria-label="오늘"
          style={{ fontSize: 11, fontWeight: 600, color: '#E8967C' }}
        >
          오늘
        </button>
      </div>

      <div className="wl-scroll">

        {/* ── 뷰 토글 탭 ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', margin: '0 16px 12px', gap: 0, background: 'var(--wl-line-2, #F4EDE2)', borderRadius: 10, padding: 3 }}>
          {[['month', '월간'], ['list', '리스트']].map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              style={{
                flex: 1, padding: '7px', fontSize: 13, fontWeight: viewMode === mode ? 600 : 400,
                border: 'none', borderRadius: 8,
                background: viewMode === mode ? 'white' : 'transparent',
                color: viewMode === mode ? 'var(--wl-ink, #2B2420)' : 'var(--wl-ink-3, #8B8079)',
                cursor: 'pointer',
                boxShadow: viewMode === mode ? '0 1px 4px rgba(58,38,24,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── 월 헤더 ─────────────────────────────────────────────────── */}
        <div className="wl-month-head">
          <button className="wl-month-arrow" onClick={goToPrevMonth} aria-label="이전 달">
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="wl-month-title">
            <div className="wl-month-year">{viewYear}</div>
            <div className="wl-month-name">{monthName}</div>
          </div>
          <button className="wl-month-arrow" onClick={goToNextMonth} aria-label="다음 달">
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {/* ── 로딩 / 에러 ────────────────────────────────────────────── */}
        {loading && <Spinner />}
        {apiError && !loading && (
          <div style={{ margin: '0 16px 12px', padding: '12px 14px', background: '#FFF5F2', border: '1px solid #FFCCBB', borderRadius: 10, fontSize: 13, color: '#D2795E' }}>
            {apiError}
          </div>
        )}

        {/* ════ 월간 뷰 ════════════════════════════════════════════════ */}
        {viewMode === 'month' && !loading && (
          <>
            {/* 카테고리 범례 */}
            <div className="wl-legend" style={{ flexWrap: 'wrap' }}>
              {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                <div key={cat} className="wl-legend-item">
                  <span className="wl-legend-dot" style={{ background: CATEGORY_RAIL_COLORS[cat] }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* 캘린더 그리드 */}
            <div className="wl-card wl-cal-card">
              <div className="wl-weekdays">
                {weekHeaders.map((w, i) => (
                  <div key={w} className={`wl-weekday ${i === 5 ? 'is-sat' : ''} ${i === 6 ? 'is-sun' : ''}`}>{w}</div>
                ))}
              </div>
              <div className="wl-days">
                {cells.map((d, i) => {
                  if (d === null) return <div key={i} className="wl-day wl-day-empty" />;
                  const ev = eventsByDay[d] || [];
                  const dayOfWeek = i % 7;
                  const isToday = d === todayNum;
                  const isWedding = d === weddingDay;
                  return (
                    <button
                      key={i}
                      className={`wl-day ${selectedDay === d ? 'is-selected' : ''} ${isToday ? 'is-today' : ''} ${isWedding ? 'is-wedding' : ''} ${dayOfWeek === 5 ? 'is-sat' : ''} ${dayOfWeek === 6 ? 'is-sun' : ''}`}
                      onClick={() => {
                        setSelectedDay(d);
                        // 날짜 클릭 → EventForm create 모달 (선택된 날짜로)
                        const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                        setEventForm({ mode: 'create', date: dateStr });
                      }}
                      aria-label={`${d}일${ev.length > 0 ? `, 일정 ${ev.length}개` : ''}`}
                    >
                      <span className="wl-day-num">{d}</span>
                      {isWedding && <span className="wl-day-ring">♥</span>}
                      {ev.length > 0 && (
                        <div className="wl-day-dots">
                          {ev.slice(0, 3).map((e) => (
                            <span key={e.id} className="wl-day-dot" style={{ background: CATEGORY_RAIL_COLORS[e.category] ?? '#BFB5AC' }} />
                          ))}
                          {ev.length > 3 && <span style={{ fontSize: 9, color: 'var(--wl-ink-3)' }}>+{ev.length - 3}</span>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 선택된 날의 일정 */}
            <div className="wl-day-events">
              <div className="wl-day-events-head">
                <div>
                  <div className="wl-day-events-eyebrow">{monthName} {selectedDay}</div>
                  <div className="wl-day-events-title">
                    {selDayEvents.length > 0 ? `${selDayEvents.length}개의 일정` : '일정이 없어요'}
                  </div>
                </div>
                <button
                  className="wl-link"
                  onClick={() => {
                    const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`;
                    setEventForm({ mode: 'create', date: dateStr });
                  }}
                >
                  + 추가
                </button>
              </div>

              <div className="wl-events-list">
                {selDayEvents.map((e) => (
                  <div
                    key={e.id}
                    className={`wl-event ${e.is_completed ? 'is-done' : ''}`}
                    onClick={() => navigate(`/events/${e.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="wl-event-rail" style={{ background: CATEGORY_RAIL_COLORS[e.category] ?? '#BFB5AC' }} />
                    <div className="wl-event-body">
                      <div className="wl-event-meta">
                        <CategoryBadge category={e.category} size="sm" />
                        <span className="wl-event-time">{e.date}</span>
                      </div>
                      <div className="wl-event-title">{e.title}</div>
                    </div>
                    <button
                      className={`wl-check wl-check-lg ${e.is_completed ? 'is-checked' : ''}`}
                      onClick={(ev) => { ev.stopPropagation(); handleToggleComplete(e.id); }}
                      aria-label={e.is_completed ? '완료 해제' : '완료'}
                    >
                      {e.is_completed && (
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
          </>
        )}

        {/* ════ 리스트 뷰 ══════════════════════════════════════════════ */}
        {viewMode === 'list' && !loading && (
          <div style={{ padding: '0 16px' }}>
            {sortedEvents.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--wl-ink-3, #8B8079)', fontSize: 14 }}>
                이 달에 일정이 없습니다
              </div>
            )}
            {sortedEvents.map((e) => (
              <div
                key={e.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', marginBottom: 8,
                  background: 'white', borderRadius: 12,
                  boxShadow: '0 1px 4px rgba(58,38,24,0.06)',
                  opacity: e.is_completed ? 0.55 : 1,
                }}
              >
                {/* 완료 체크박스 */}
                <button
                  onClick={() => handleToggleComplete(e.id)}
                  aria-label={e.is_completed ? '완료 해제' : '완료 처리'}
                  style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${e.is_completed ? '#E8967C' : 'var(--wl-line-2, #EDE4D8)'}`,
                    background: e.is_completed ? '#E8967C' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {e.is_completed && (
                    <svg viewBox="0 0 14 14" width="10" height="10">
                      <path d="M2 7.5L5.5 11L12 3.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  )}
                </button>

                {/* 본문 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 500,
                    color: 'var(--wl-ink, #2B2420)',
                    textDecoration: e.is_completed ? 'line-through' : 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {e.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <CategoryBadge category={e.category} size="sm" />
                    <span style={{ fontSize: 12, color: 'var(--wl-ink-3, #8B8079)' }}>{formatDate(e.date)}</span>
                    {e.memo && <span style={{ fontSize: 12, color: 'var(--wl-ink-4, #BFB5AC)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{e.memo}</span>}
                  </div>
                </div>

                {/* 편집/삭제 버튼 */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => setEventForm({ mode: 'edit', initialData: e })}
                    aria-label="편집"
                    style={{ padding: '4px 10px', fontSize: 12, borderRadius: 8, border: '1px solid var(--wl-line)', background: 'white', cursor: 'pointer', color: 'var(--wl-ink-2)' }}
                  >
                    편집
                  </button>
                  <button
                    onClick={() => handleDelete(e.id)}
                    aria-label="삭제"
                    style={{ padding: '4px 10px', fontSize: 12, borderRadius: 8, border: '1px solid #FFCCBB', background: '#FFF5F2', cursor: 'pointer', color: '#D2795E' }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── AI 체크리스트 버튼 ─────────────────────────────────────── */}
        <div style={{ padding: '16px 16px 4px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
          <button
            onClick={handleAIChecklist}
            disabled={aiLoading || !coupleId}
            aria-label="AI로 체크리스트 자동 생성"
            style={{
              padding: '13px 16px', borderRadius: 12,
              border: 'none',
              background: aiLoading ? '#BFB5AC' : '#FFD700',
              color: '#2B2420', fontWeight: 600, fontSize: 14,
              cursor: aiLoading || !coupleId ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {aiLoading ? (
              <>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(43,36,32,0.3)', borderTopColor: '#2B2420', borderRadius: '50%', animation: 'wl-spin 0.7s linear infinite' }} />
                생성 중...
              </>
            ) : (
              <>✨ AI로 체크리스트 자동 생성</>
            )}
          </button>

          {aiSource && (
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--wl-ink-3)' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 9999,
                background: aiSource === 'ai' ? '#F0E6FF' : 'var(--wl-line-2)',
                color: aiSource === 'ai' ? '#BB88FF' : 'var(--wl-ink-3)',
                fontWeight: 500,
              }}>
                {aiSource === 'ai' ? '🤖 AI 생성' : '📋 기본 템플릿'}
              </span>
            </div>
          )}
        </div>

        <div className="wl-bottom-spacer" />
      </div>

      {/* FAB */}
      <button
        className="wl-fab"
        aria-label="일정 추가"
        onClick={() => {
          const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`;
          setEventForm({ mode: 'create', date: dateStr });
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 3.5v11M3.5 9h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {/* EventForm 모달 */}
      {eventForm && (
        <EventForm
          mode={eventForm.mode}
          initialData={eventForm.initialData}
          date={eventForm.date}
          onSubmit={handleEventSubmit}
          onCancel={() => setEventForm(null)}
        />
      )}

      {/* AI 확인 모달 */}
      {confirmAI && (
        <ConfirmModal
          message="기존 일정이 있습니다. AI 체크리스트를 추가하시겠어요?"
          onConfirm={doRequestChecklist}
          onCancel={() => setConfirmAI(false)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />}
    </div>
  );
}
