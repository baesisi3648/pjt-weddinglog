// @TASK STITCH-DESIGN - Calendar 페이지 이식 (Stitch calendar_desktop/code.html 기반)
// @TASK P2-S1-T1 - Calendar 페이지 API 연동
// @SPEC specs/screens/02_calendar.yaml

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCouple } from '../context/CoupleContext';
import { listEvents, createEvent, updateEvent, deleteEvent, toggleCompleteEvent } from '../services/event_api';
import { listEventPhotos } from '../services/photo_api';
import { requestChecklist } from '../services/ai_api';
import EventForm from '../components/EventForm';
import CategoryBadge from '../components/CategoryBadge';
import { CATEGORY_LABELS } from '../constants/enums';
import type { Event, Category, EventCreate, EventUpdate } from '../types';
import type { Photo } from '../types';
import { photoUrl } from '../utils/photo';

// ─── 날짜 유틸 ──────────────────────────────────────────────────────────────
function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function buildCalendarCells(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1);
  const rawDow = firstDay.getDay(); // 0=Sun
  const cells: (number | null)[] = [];
  for (let i = 0; i < rawDow; i++) cells.push(null);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function dateToDayNum(dateStr: string | undefined, year: number, month: number): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (d.getFullYear() === year && d.getMonth() === month) return d.getDate();
  return null;
}

// Multi-day 이벤트 bar 위치 타입
type BarPosition = 'single' | 'start' | 'middle' | 'end';

interface MultiDayBar {
  event: Event;
  position: BarPosition;
  showTitle: boolean; // 주 시작/이벤트 시작일에서만 제목 표시
}

function parseDateLocal(dateStr: string): Date {
  // YYYY-MM-DD 를 로컬 시간대 자정으로 파싱 (new Date("YYYY-MM-DD")는 UTC 자정).
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Multi-day bar — coral 한 가지 + 명도 단계 (영상 "2~3색 원칙")
// 카테고리는 색이 아닌 텍스트 라벨로 구분한다.
// (모든 토큰은 tailwind.config.js theme.colors 와 1:1 동기.)
const CATEGORY_BAR_CLASS: Record<Category, string> = {
  WEDDING_PHOTO: 'bg-coral text-white',
  HONEYMOON: 'bg-coral text-white',
  CEREMONY: 'bg-ink text-white',
  VENUE: 'bg-coral-soft text-on-primary-container',
  STUDIO_DRESS_MAKEUP: 'bg-coral-soft text-on-primary-container',
  GIFT: 'bg-coral-soft text-on-primary-container',
  INVITATION: 'bg-coral-soft text-on-primary-container',
  REHEARSAL: 'bg-coral-soft text-on-primary-container',
  ETC: 'bg-surface-container-highest text-on-secondary-container',
} as const;

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// ─── Toast ─────────────────────────────────────────────────────────────────
interface ToastState { message: string; type: 'info' | 'success' | 'error'; }

function ToastMsg({ message, type, onDismiss }: ToastState & { onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 3000); return () => clearTimeout(t); }, [onDismiss]);
  const styles = {
    error: { bg: '#ffdad6', color: '#93000a', border: '#ba1a1a' },
    success: { bg: '#f6eddd', color: '#1f1b12', border: '#d7c2bd' },
    info: { bg: '#ffffff', color: '#1f1b12', border: '#d7c2bd' },
  };
  const s = styles[type];
  return (
    <div role="alert" aria-live="polite" className="fixed bottom-20 right-4 z-[2000] font-body-sm text-body-sm rounded shadow-md px-4 py-2.5"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, maxWidth: 280 }}>
      {message}
    </div>
  );
}

// ─── 확인 모달 ──────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[1500] bg-on-surface/40 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog" aria-modal="true">
      <div className="bg-surface-container-lowest rounded-lg p-6 w-72 shadow-xl">
        <p className="font-body-md text-body-md text-on-surface mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded border border-outline-variant font-body-sm text-body-sm text-on-surface hover:bg-surface-container transition-colors">취소</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded bg-primary-container font-body-sm text-body-sm text-on-primary-container hover:opacity-90 transition-opacity">추가</button>
        </div>
      </div>
    </div>
  );
}

interface EventFormState {
  mode: 'create' | 'edit';
  initialData?: Pick<Event, 'id' | 'title' | 'date' | 'category' | 'memo'>;
  date?: string;
}

// ────────────────────────────────────────────────────────────────────────────
export default function Calendar() {
  const navigate = useNavigate();
  const { couple } = useCouple();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [eventPhotosMap, setEventPhotosMap] = useState<Record<string, Photo[]>>({});

  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [toast, setToast] = useState<ToastState | null>(null);
  const [eventForm, setEventForm] = useState<EventFormState | null>(null);
  const [confirmAI, setConfirmAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSource, setAiSource] = useState<string | null>(null);

  const coupleId = couple?.id;
  const monthKey = getMonthKey(viewYear, viewMonth);

  const fetchEvents = useCallback(async () => {
    if (!coupleId) return;
    setLoading(true);
    setApiError(null);
    try {
      const data = await listEvents(coupleId, monthKey);
      const evList = Array.isArray(data) ? data : [];
      setEvents(evList);
      if (evList.length > 0) {
        const results = await Promise.all(
          evList.map(async (ev) => {
            try { return { eventId: ev.id, photos: await listEventPhotos(ev.id) }; }
            catch { return { eventId: ev.id, photos: [] }; }
          })
        );
        const map: Record<string, Photo[]> = {};
        results.forEach(({ eventId, photos }) => { map[eventId] = Array.isArray(photos) ? photos : []; });
        setEventPhotosMap(map);
      } else {
        setEventPhotosMap({});
      }
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setApiError(e.response?.data?.detail ?? e.message ?? '일정을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [coupleId, monthKey]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // eventsByDay: 각 날짜(day)가 속한 이벤트들. Multi-day 이벤트는 모든 해당 일자에 등록.
  // multiDayBarsByDay: 각 날짜 셀 상단에 렌더할 bar segment 목록.
  const eventsByDay: Record<number, Event[]> = {};
  const multiDayBarsByDay: Record<number, MultiDayBar[]> = {};

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const lastOfMonth = new Date(viewYear, viewMonth + 1, 0);

  events.forEach((ev) => {
    const start = parseDateLocal(ev.date);
    const end = ev.end_date ? parseDateLocal(ev.end_date) : start;
    const isMulti = ev.end_date !== null && ev.end_date !== undefined && end.getTime() > start.getTime();

    // 이벤트가 이번 달과 겹치는 범위 계산
    const rangeStart = start < firstOfMonth ? firstOfMonth : start;
    const rangeEnd = end > lastOfMonth ? lastOfMonth : end;
    if (rangeStart > rangeEnd) return;

    for (
      let dt = new Date(rangeStart);
      dt <= rangeEnd;
      dt = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1)
    ) {
      const day = dt.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(ev);

      if (isMulti) {
        const isStartDay = sameDay(dt, start);
        const isEndDay = sameDay(dt, end);
        const isSunday = dt.getDay() === 0;
        const isFirstOfMonth = dt.getDate() === 1;

        let position: BarPosition;
        if (isStartDay && isEndDay) position = 'single';
        else if (isStartDay) position = 'start';
        else if (isEndDay) position = 'end';
        else position = 'middle';

        const showTitle = isStartDay || isSunday || isFirstOfMonth;

        if (!multiDayBarsByDay[day]) multiDayBarsByDay[day] = [];
        multiDayBarsByDay[day].push({ event: ev, position, showTitle });
      }
    }
  });

  const selDayEvents = eventsByDay[selectedDay] ?? [];

  const handleToggleComplete = async (eventId: string) => {
    if (!coupleId) return;
    try {
      await toggleCompleteEvent(coupleId, eventId);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, is_completed: !e.is_completed } : e));
    } catch {
      showToast('완료 상태 변경에 실패했습니다.', 'error');
    }
  };

  const handleEventSubmit = async (formData: EventCreate | EventUpdate) => {
    if (!coupleId) return;
    try {
      if (eventForm?.mode === 'create') {
        await createEvent(coupleId, formData as EventCreate);
        showToast('일정이 저장되었습니다.', 'success');
      } else {
        if (!eventForm?.initialData) return;
        await updateEvent(coupleId, eventForm.initialData.id, formData as EventUpdate);
        showToast('일정이 수정되었습니다.', 'success');
      }
      setEventForm(null);
      await fetchEvents();
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } } };
      showToast(e.response?.data?.detail ?? '저장에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (eventId: string) => {
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

  const handleAIChecklist = () => {
    if (events.length > 0) setConfirmAI(true);
    else doRequestChecklist();
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
    } catch (err: unknown) {
      // 409 Conflict: 이미 AI 체크리스트 생성됨 (중복 방지)
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
      if (axiosErr?.response?.status === 409) {
        showToast(
          axiosErr.response.data?.detail ??
            '체크리스트가 이미 생성되어 있습니다. 기존 일정을 삭제한 뒤 다시 시도해주세요.',
          'error',
        );
      } else {
        showToast('체크리스트 생성에 실패했습니다.', 'error');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') =>
    setToast({ message, type });

  const cells = buildCalendarCells(viewYear, viewMonth);
  const todayDate = new Date();
  const isCurrentMonth = todayDate.getFullYear() === viewYear && todayDate.getMonth() === viewMonth;
  const todayNum = isCurrentMonth ? todayDate.getDate() : -1;

  let weddingDay = -1;
  if (couple?.wedding_date) {
    const wd = new Date(couple.wedding_date);
    if (wd.getFullYear() === viewYear && wd.getMonth() === viewMonth) weddingDay = wd.getDate();
  }

  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  };
  const formatDateRange = (start: string, end: string | null): string => {
    if (!end || end === start) return formatDate(start);
    const s = new Date(start);
    const e = new Date(end);
    const sStr = `${s.getFullYear()}.${String(s.getMonth()+1).padStart(2,'0')}.${String(s.getDate()).padStart(2,'0')}`;
    // 같은 연/월이면 종료는 일만 표시 (예: "2025.12.28 ~ 30")
    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
      return `${sStr} ~ ${String(e.getDate()).padStart(2,'0')}`;
    }
    const eStr = `${e.getFullYear()}.${String(e.getMonth()+1).padStart(2,'0')}.${String(e.getDate()).padStart(2,'0')}`;
    return `${sStr} ~ ${eStr}`;
  };

  return (
    <div className="flex flex-col gap-md">
      {/* ── 헤더 ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrevMonth}
            aria-label="이전 달"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
          >
            <span aria-hidden="true" className="text-[18px] leading-none">←</span>
          </button>
          <h2 className="font-display-md text-display-md text-on-surface">
            {viewYear}년 {MONTH_NAMES[viewMonth]}
          </h2>
          <button
            onClick={goToNextMonth}
            aria-label="다음 달"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
          >
            <span aria-hidden="true" className="text-[18px] leading-none">→</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* AI 체크리스트 */}
          <button
            onClick={handleAIChecklist}
            disabled={aiLoading || !coupleId}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-primary hover:bg-surface-variant transition-colors border border-transparent font-body-sm text-body-sm disabled:opacity-50"
          >
            {aiLoading ? '생성 중…' : '체크리스트 자동 생성'}
          </button>

          {/* 뷰 토글 */}
          <div className="flex p-1 bg-surface-container rounded-lg border border-outline-variant">
            {(['month', 'list'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                className={`px-4 py-1.5 rounded font-label-caps text-label-caps transition-colors ${
                  viewMode === mode
                    ? 'bg-surface shadow-sm text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {mode === 'month' ? '월간' : '리스트'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* AI 소스 배지 */}
      {aiSource && (
        <div className="flex justify-center">
          <span
            className="font-label-caps text-label-caps px-3 py-1 rounded-full"
            style={{
              background: aiSource === 'ai' ? '#e89f8e' : '#f6eddd',
              color: aiSource === 'ai' ? '#693529' : '#524340',
            }}
          >
            {aiSource === 'ai' ? '자동 추천' : '기본 템플릿'}
          </span>
        </div>
      )}

      {/* 로딩 / 에러 */}
      {loading && (
        <div className="text-center py-8 font-body-sm text-on-surface-variant">불러오는 중…</div>
      )}
      {apiError && !loading && (
        <div className="my-2 p-3 bg-error-container text-on-error-container rounded font-body-sm text-body-sm">
          {apiError}
        </div>
      )}

      {/* ════ 월간 뷰 ════ */}
      {viewMode === 'month' && !loading && (
        <>
          {/* 요일 헤더 */}
          <div className="bg-surface border-t border-l border-outline-variant w-full grid grid-cols-7 text-center">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={`py-3 border-r border-b border-outline-variant font-label-caps text-label-caps ${
                  i === 0 ? 'text-error opacity-80' : 'text-on-surface-variant'
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="w-full grid grid-cols-7 border-l border-outline-variant bg-surface">
            {cells.map((d, i) => {
              if (d === null) {
                return (
                  <div
                    key={i}
                    className="min-h-[96px] border-r border-b border-outline-variant p-2 opacity-40 bg-surface-container-low"
                  />
                );
              }

              const ev = eventsByDay[d] ?? [];
              const bars = multiDayBarsByDay[d] ?? [];
              const dayOfWeek = i % 7;
              const isToday = d === todayNum;
              const isWedding = d === weddingDay;
              const isSelected = selectedDay === d;
              const isSunday = dayOfWeek === 0;

              // 사진 모자이크 노출 정책:
              //  · single-day 이벤트는 해당 날짜에 표시
              //  · multi-day 이벤트는 시작일 셀에만 표시 (그 외 날엔 bar만)
              //    → 같은 사진이 여러 날 중복되지 않으면서, 사진이 없는 일은 없음
              const photoableEv = ev.filter((e) => {
                if (!e.is_multi_day) return true;
                return dateToDayNum(e.date, viewYear, viewMonth) === d;
              });
              const evWithPhotos = photoableEv.filter((e) => (eventPhotosMap[e.id]?.length ?? 0) > 0);
              const evWithoutPhotos = photoableEv.filter((e) => (eventPhotosMap[e.id]?.length ?? 0) === 0);
              const shownPhotoEvents = evWithPhotos.slice(0, 2);
              const shownLabelEvents = evWithoutPhotos.slice(0, Math.max(0, 3 - shownPhotoEvents.length));
              const totalShown = shownPhotoEvents.length + shownLabelEvents.length;
              const moreCount = photoableEv.length - totalShown;

              // 셀 클릭 정책:
              //  · single-day 이벤트가 있고 빈 영역 클릭 → 일정 추가 (기존)
              //  · multi-day 만 있고 single-day 가 없으면 → 그 multi-day 이벤트 상세로 이동
              //    (사용자가 multi-day 가 깔린 날 빈 영역 클릭하면 일정 추가가 뜨던 문제 해결)
              const singleDayCount = ev.filter((e) => !e.is_multi_day).length;
              const onlyMultiDayHere = singleDayCount === 0 && bars.length > 0;
              const firstMultiDayId = bars[0]?.event.id;

              return (
                <button
                  key={i}
                  className={`min-h-[120px] md:min-h-[140px] border-r border-b border-outline-variant p-2 flex flex-col gap-1 relative hover:bg-surface-container-low transition-colors text-left ${
                    isSelected ? 'bg-surface-container-lowest' : ''
                  }`}
                  onClick={() => {
                    setSelectedDay(d);
                    if (onlyMultiDayHere && firstMultiDayId) {
                      navigate(`/events/${firstMultiDayId}`);
                      return;
                    }
                    const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                    setEventForm({ mode: 'create', date: dateStr });
                  }}
                  aria-label={`${d}일${ev.length > 0 ? `, 일정 ${ev.length}개` : ''}`}
                >
                  {/* 날짜 숫자 */}
                  {isToday ? (
                    <span className="w-6 h-6 flex items-center justify-center rounded-full border border-primary text-primary font-body-sm text-body-sm font-semibold">
                      {d}
                    </span>
                  ) : (
                    <span className={`font-body-sm text-body-sm ${isSunday ? 'text-error' : 'text-on-surface-variant'} ${isWedding ? 'text-primary font-semibold' : ''}`}>
                      {d}
                    </span>
                  )}

                  {/* Multi-day 이벤트 bar (주 단위로 끊어져서 렌더) */}
                  {bars.length > 0 && (
                    <div className="flex flex-col gap-[2px] mt-1 -mx-2">
                      {bars.map((bar, idx) => {
                        const colorClass = CATEGORY_BAR_CLASS[bar.event.category];
                        const radiusClass =
                          bar.position === 'single'
                            ? 'rounded-sm mx-1'
                            : bar.position === 'start'
                              ? 'rounded-l-sm ml-1'
                              : bar.position === 'end'
                                ? 'rounded-r-sm mr-1'
                                : '';
                        return (
                          <div
                            key={`${bar.event.id}-${idx}`}
                            role="button"
                            tabIndex={0}
                            onClick={(evt) => {
                              evt.stopPropagation();
                              navigate(`/events/${bar.event.id}`);
                            }}
                            onKeyDown={(evt) => {
                              if (evt.key === 'Enter' || evt.key === ' ') {
                                evt.stopPropagation();
                                navigate(`/events/${bar.event.id}`);
                              }
                            }}
                            className={`${colorClass} ${radiusClass} h-[18px] px-1.5 flex items-center text-[10px] font-medium truncate overflow-hidden cursor-pointer hover:opacity-90`}
                            title={`${bar.event.title} · ${bar.event.date}${bar.event.end_date ? ` ~ ${bar.event.end_date}` : ''}`}
                            aria-label={`${bar.event.title} · 다일 일정`}
                          >
                            {bar.showTitle ? (
                              <span className="truncate">
                                {bar.event.title}
                              </span>
                            ) : (
                              <span>&nbsp;</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 사진 모자이크 — 셀을 꽉 채우는 그리드 (1~4장 + "+N") */}
                  {shownPhotoEvents.length > 0 && (() => {
                    const allPhotos = shownPhotoEvents.flatMap((e) =>
                      (eventPhotosMap[e.id] ?? []).map((p) => ({ ...p, _eventId: e.id, _eventTitle: e.title }))
                    );
                    const displayed = allPhotos.slice(0, 4);
                    const moreCount = allPhotos.length - displayed.length;
                    const navigateTarget = displayed[0]?._eventId ?? shownPhotoEvents[0]?.id;
                    const count = displayed.length;

                    // 1장: 1x1 / 2장: 2x1 / 3장: 왼쪽 큰 1 + 오른쪽 세로 2 / 4장+: 2x2
                    let gridClass = 'grid gap-[2px]';
                    if (count === 1) gridClass += ' grid-cols-1 grid-rows-1';
                    else if (count === 2) gridClass += ' grid-cols-2 grid-rows-1';
                    else gridClass += ' grid-cols-2 grid-rows-2';

                    return (
                      <div
                        className={`${gridClass} flex-1 w-full mt-1 cursor-pointer rounded overflow-hidden bg-surface-container`}
                        style={{ minHeight: 0 }}
                        onClick={(evt) => { evt.stopPropagation(); if (navigateTarget) navigate(`/events/${navigateTarget}`); }}
                        role="img"
                        aria-label={`사진 ${allPhotos.length}장`}
                      >
                        {displayed.map((p, i) => {
                          const isFirstIn3 = count === 3 && i === 0;
                          return (
                            <div
                              key={p.id}
                              className={`relative bg-surface-dim overflow-hidden ${isFirstIn3 ? 'row-span-2' : ''}`}
                            >
                              <img
                                src={photoUrl(p.file_url)}
                                alt={p._eventTitle}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              {i === displayed.length - 1 && moreCount > 0 && (
                                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">+{moreCount}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* 이벤트 라벨 (사진 없는 이벤트) — 아이콘 ❌, 코랄 점 + 제목 */}
                  {shownLabelEvents.length > 0 && (
                    <div className="mt-1 flex flex-col gap-1 w-full px-1">
                      {shownLabelEvents.map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center gap-1.5 text-[11px] leading-none text-on-surface truncate"
                          onClick={(evt) => { evt.stopPropagation(); navigate(`/events/${e.id}`); }}
                        >
                          <span className="block w-1 h-1 rounded-full bg-coral shrink-0" aria-hidden="true" />
                          <span className="truncate">{e.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {moreCount > 0 && (
                    <span className="font-label-caps text-[10px] text-on-surface-variant">+{moreCount}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 선택된 날의 일정 */}
          <div className="mt-6 border-t border-outline-variant pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  {MONTH_NAMES[viewMonth]} {selectedDay}
                </div>
                <div className="font-headline-sm text-headline-sm text-on-surface">
                  {selDayEvents.length > 0 ? `${selDayEvents.length}개의 일정` : '일정이 없어요'}
                </div>
              </div>
              <button
                className="font-body-sm text-body-sm text-primary hover:underline"
                onClick={() => {
                  const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`;
                  setEventForm({ mode: 'create', date: dateStr });
                }}
              >
                + 추가
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {selDayEvents.map((e) => (
                <div
                  key={e.id}
                  className={`flex items-center gap-3 p-3 border-b border-[#E3DBC8] border-dashed cursor-pointer ${e.is_completed ? 'opacity-60' : ''}`}
                  onClick={() => navigate(`/events/${e.id}`)}
                >
                  <button
                    className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-colors ${
                      e.is_completed
                        ? 'bg-primary-container'
                        : 'border border-outline hover:border-primary-container'
                    }`}
                    onClick={(evt) => { evt.stopPropagation(); handleToggleComplete(e.id); }}
                    aria-label={e.is_completed ? '완료 해제' : '완료'}
                  >
                    {e.is_completed && (
                      <span className="text-white text-[10px] font-bold leading-none" aria-hidden="true">✓</span>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`font-body-md text-body-md ${e.is_completed ? 'line-through text-[#B5AEA0]' : 'text-on-surface'}`}>
                      {e.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryBadge category={e.category} size="sm" />
                      <span className="font-mono-id text-mono-id text-outline">
                        {formatDateRange(e.date, e.end_date)}
                      </span>
                      {e.is_multi_day && (
                        <span className="font-label-caps text-[10px] text-primary px-1.5 py-0.5 rounded bg-primary-container/60">
                          {e.duration_days}일
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={(evt) => { evt.stopPropagation(); setEventForm({ mode: 'edit', initialData: e }); }}
                      aria-label="편집"
                      className="px-3 py-1 font-label-caps text-label-caps border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                      편집
                    </button>
                    <button
                      onClick={(evt) => { evt.stopPropagation(); handleDelete(e.id); }}
                      aria-label="삭제"
                      className="px-3 py-1 font-label-caps text-label-caps border border-[#ffdad6] rounded text-error hover:bg-error-container transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
              {selDayEvents.length === 0 && (
                <div className="text-center py-8 text-on-surface-variant font-body-sm text-body-sm">
                  이 날의 첫 기록을 남겨보세요
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ════ 리스트 뷰 ════ */}
      {viewMode === 'list' && !loading && (
        <div className="flex flex-col gap-3">
          {sortedEvents.length === 0 && (
            <div className="text-center py-12 font-body-sm text-on-surface-variant">
              이 달에 일정이 없습니다
            </div>
          )}
          {sortedEvents.map((e) => (
            <div
              key={e.id}
              className={`flex items-center gap-3 p-4 bg-surface-container-lowest rounded-lg border border-outline-variant cursor-pointer hover:bg-surface-container transition-colors ${e.is_completed ? 'opacity-55' : ''}`}
            >
              <button
                onClick={() => handleToggleComplete(e.id)}
                aria-label={e.is_completed ? '완료 해제' : '완료 처리'}
                className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-colors ${
                  e.is_completed ? 'bg-primary-container' : 'border-2 border-outline-variant hover:border-primary-container'
                }`}
              >
                {e.is_completed && (
                  <span className="text-white text-[10px] font-bold leading-none" aria-hidden="true">✓</span>
                )}
              </button>
              <div className="flex-1 min-w-0" onClick={() => navigate(`/events/${e.id}`)}>
                <div className={`font-body-md text-body-md ${e.is_completed ? 'line-through text-[#B5AEA0]' : 'text-on-surface'} truncate`}>
                  {e.title}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <CategoryBadge category={e.category} size="sm" />
                  <span className="font-mono-id text-mono-id text-outline">
                    {formatDateRange(e.date, e.end_date)}
                  </span>
                  {e.is_multi_day && (
                    <span className="font-label-caps text-[10px] text-primary px-1.5 py-0.5 rounded bg-primary-container/60">
                      {e.duration_days}일
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setEventForm({ mode: 'edit', initialData: e })}
                  className="px-3 py-1 font-label-caps text-label-caps border border-outline-variant rounded text-on-surface-variant hover:bg-surface-container transition-colors"
                >편집</button>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="px-3 py-1 font-label-caps text-label-caps border border-[#ffdad6] rounded text-error hover:bg-error-container transition-colors"
                >삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-on-surface text-inverse-on-surface rounded-full shadow-[0_8px_16px_rgba(31,27,18,0.15)] flex items-center justify-center hover:scale-105 transition-transform z-50"
        aria-label="일정 추가"
        onClick={() => {
          const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`;
          setEventForm({ mode: 'create', date: dateStr });
        }}
      >
        <span aria-hidden="true" className="text-[26px] leading-none">+</span>
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
          message="기존 일정이 있습니다. 체크리스트를 추가하시겠어요?"
          onConfirm={doRequestChecklist}
          onCancel={() => setConfirmAI(false)}
        />
      )}

      {/* Toast */}
      {toast && <ToastMsg {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
