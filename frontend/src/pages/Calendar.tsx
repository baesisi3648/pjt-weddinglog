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

  const eventsByDay: Record<number, Event[]> = {};
  events.forEach((ev) => {
    const day = dateToDayNum(ev.date, viewYear, viewMonth);
    if (day !== null) {
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(ev);
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
    } catch {
      showToast('AI 체크리스트 생성에 실패했습니다.', 'error');
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
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
          </button>
          <h2 className="font-display-md text-display-md text-on-surface">
            {viewYear}년 {MONTH_NAMES[viewMonth]}
          </h2>
          <button
            onClick={goToNextMonth}
            aria-label="다음 달"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* AI 체크리스트 */}
          <button
            onClick={handleAIChecklist}
            disabled={aiLoading || !coupleId}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-primary hover:bg-surface-variant transition-colors border border-transparent font-body-sm text-body-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>
            {aiLoading ? '생성 중...' : 'AI로 체크리스트 자동 생성'}
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
            {aiSource === 'ai' ? 'AI 생성' : '기본 템플릿'}
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
              const dayOfWeek = i % 7;
              const isToday = d === todayNum;
              const isWedding = d === weddingDay;
              const isSelected = selectedDay === d;
              const isSunday = dayOfWeek === 0;

              const evWithPhotos = ev.filter((e) => (eventPhotosMap[e.id]?.length ?? 0) > 0);
              const evWithoutPhotos = ev.filter((e) => (eventPhotosMap[e.id]?.length ?? 0) === 0);
              const shownPhotoEvents = evWithPhotos.slice(0, 2);
              const shownLabelEvents = evWithoutPhotos.slice(0, Math.max(0, 3 - shownPhotoEvents.length));
              const totalShown = shownPhotoEvents.length + shownLabelEvents.length;
              const moreCount = ev.length - totalShown;

              return (
                <button
                  key={i}
                  className={`min-h-[96px] border-r border-b border-outline-variant p-2 flex flex-col gap-1 relative hover:bg-surface-container-low transition-colors text-left ${
                    isSelected ? 'bg-surface-container-lowest' : ''
                  }`}
                  onClick={() => {
                    setSelectedDay(d);
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

                  {/* 폴라로이드 썸네일 (사진 있는 이벤트) */}
                  {shownPhotoEvents.length > 0 && (
                    <div className="relative w-full h-12 mt-1 pl-1">
                      {shownPhotoEvents.map((e, pi) => {
                        const photos = eventPhotosMap[e.id] ?? [];
                        const coverPhoto = photos[0];
                        const extraCount = photos.length - 1;
                        return (
                          <div
                            key={e.id}
                            className={`absolute top-0 w-10 h-10 bg-white p-[2px] border border-outline-variant shadow-sm transition-transform hover:scale-110 z-${pi + 10}`}
                            style={{ left: `${pi * 12}px`, transform: `rotate(${pi % 2 === 0 ? '-3deg' : '4deg'})` }}
                            onClick={(evt) => { evt.stopPropagation(); navigate(`/events/${e.id}`); }}
                            role="img"
                            aria-label={`${e.title} 사진`}
                          >
                            {coverPhoto ? (
                              <img src={coverPhoto.file_url} alt={e.title} className="w-full h-full object-cover grayscale opacity-80" loading="lazy" />
                            ) : (
                              <div className="w-full h-full bg-surface-container flex items-center justify-center">
                                <span className="font-label-caps text-[10px] font-bold text-on-surface">
                                  {extraCount > 0 ? `+${extraCount + 1}` : '1'}
                                </span>
                              </div>
                            )}
                            {extraCount > 0 && (
                              <div className="absolute top-1 left-3 w-10 h-10 bg-white p-[2px] border border-outline-variant shadow-sm rotate-[4deg] z-20 flex items-center justify-center bg-surface-container">
                                <span className="text-[11px] font-bold text-on-surface">+{extraCount}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 이벤트 라벨 (사진 없는 이벤트) */}
                  {shownLabelEvents.length > 0 && (
                    <div className="mt-1 flex flex-col gap-1 w-full px-1">
                      {shownLabelEvents.map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center gap-1 text-[11px] leading-none text-on-surface truncate"
                          onClick={(evt) => { evt.stopPropagation(); navigate(`/events/${e.id}`); }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                            {e.category === 'CEREMONY' ? 'favorite' :
                             e.category === 'WEDDING_PHOTO' ? 'photo_camera' :
                             e.category === 'VENUE' ? 'location_on' :
                             e.category === 'GIFT' ? 'card_giftcard' :
                             'calendar_today'}
                          </span>
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
                      <span className="material-symbols-outlined text-white" style={{ fontSize: '12px', fontVariationSettings: "'wght' 600" }}>check</span>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`font-body-md text-body-md ${e.is_completed ? 'line-through text-[#B5AEA0]' : 'text-on-surface'}`}>
                      {e.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryBadge category={e.category} size="sm" />
                      <span className="font-mono-id text-mono-id text-outline">{e.date}</span>
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
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '12px', fontVariationSettings: "'wght' 600" }}>check</span>
                )}
              </button>
              <div className="flex-1 min-w-0" onClick={() => navigate(`/events/${e.id}`)}>
                <div className={`font-body-md text-body-md ${e.is_completed ? 'line-through text-[#B5AEA0]' : 'text-on-surface'} truncate`}>
                  {e.title}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <CategoryBadge category={e.category} size="sm" />
                  <span className="font-mono-id text-mono-id text-outline">{formatDate(e.date)}</span>
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
        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>add</span>
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
      {toast && <ToastMsg {...toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
