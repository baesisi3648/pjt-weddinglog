// @TASK P2-S1-T3 - EventForm 모달 컴포넌트
// @SPEC docs/planning/06-tasks.md#P2-S1-T3
// @SPEC specs/screens/02_calendar.yaml#event_modal

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_LIST } from '../constants/enums';
import CategoryBadge from './CategoryBadge';
import type { Category, Event, EventCreate, EventUpdate } from '../types';

type EventFormInitial = Pick<Event, 'id' | 'title' | 'date' | 'category' | 'memo'> & {
  end_date?: string | null;
};

interface EventFormProps {
  mode?: 'create' | 'edit';
  initialData?: EventFormInitial | null;
  onSubmit: (data: EventCreate | EventUpdate) => Promise<void>;
  onCancel: () => void;
  date?: string | null;
}

export default function EventForm({
  mode = 'create',
  initialData = null,
  onSubmit,
  onCancel,
  date = null,
}: EventFormProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(date ?? today);
  const [endDate, setEndDate] = useState<string>('');
  const [category, setCategory] = useState<Category | ''>('');
  const [memo, setMemo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // 편집 모드: 초기 데이터 채우기
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setTitle(initialData.title ?? '');
      setEventDate(initialData.date ?? today);
      setEndDate(initialData.end_date ?? '');
      setCategory(initialData.category ?? '');
      setMemo(initialData.memo ?? '');
    }
  }, [mode, initialData]);

  // 입력 검증
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = '제목을 입력해주세요.';
    if (title.trim().length > 100) errs.title = '제목은 100자 이하여야 합니다.';
    if (!eventDate) errs.date = '날짜를 선택해주세요.';
    if (endDate && endDate < eventDate) errs.end_date = '종료일은 시작일 이후여야 합니다.';
    if (!category) errs.category = '카테고리를 선택해주세요.';
    if (category && !CATEGORY_LIST.includes(category as Category)) errs.category = '유효하지 않은 카테고리입니다.';
    if (memo.length > 500) errs.memo = '메모는 500자 이하여야 합니다.';
    return errs;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        date: eventDate,
        end_date: endDate ? endDate : null,
        category: category as Category,
        memo: memo.trim() || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 배경 클릭 시 닫기
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div
      className="wl-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-form-title"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(43, 36, 32, 0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        className="wl-modal-sheet"
        style={{
          width: '100%', maxWidth: '480px',
          background: 'var(--wl-surface, #FDFAF5)',
          borderRadius: '16px 16px 0 0',
          padding: '24px 20px 32px',
          boxShadow: '0 -4px 32px rgba(58, 38, 24, 0.12)',
        }}
      >
        {/* 드래그 핸들 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--wl-line, #EDE4D8)' }} />
        </div>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2
            id="event-form-title"
            style={{ fontSize: 18, fontWeight: 600, color: 'var(--wl-ink, #2B2420)', margin: 0 }}
          >
            {mode === 'create' ? '일정 추가' : '일정 편집'}
          </h2>
          <button
            onClick={onCancel}
            aria-label="닫기"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: 'none', background: 'var(--wl-line-2, #F4EDE2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--wl-ink-2, #5C5149)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* 제목 */}
          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="event-title"
              style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--wl-ink-2, #5C5149)', marginBottom: 6 }}
            >
              제목 <span style={{ color: 'var(--wl-coral)' }}>*</span>
            </label>
            <input
              id="event-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="일정 제목을 입력하세요"
              maxLength={100}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', fontSize: 14,
                border: `1px solid ${errors.title ? 'var(--wl-error)' : 'var(--wl-line, #EDE4D8)'}`,
                borderRadius: 8, background: 'white',
                color: 'var(--wl-ink, #2B2420)', outline: 'none',
              }}
            />
            {errors.title && (
              <span id="title-error" role="alert" style={{ fontSize: 12, color: 'var(--wl-error)', marginTop: 4, display: 'block' }}>
                {errors.title}
              </span>
            )}
          </div>

          {/* 날짜 */}
          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="event-date"
              style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--wl-ink-2, #5C5149)', marginBottom: 6 }}
            >
              시작 날짜 <span style={{ color: 'var(--wl-coral)' }}>*</span>
            </label>
            <input
              id="event-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              aria-invalid={!!errors.date}
              aria-describedby={errors.date ? 'date-error' : undefined}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', fontSize: 14,
                border: `1px solid ${errors.date ? 'var(--wl-error)' : 'var(--wl-line, #EDE4D8)'}`,
                borderRadius: 8, background: 'white',
                color: 'var(--wl-ink, #2B2420)', outline: 'none',
              }}
            />
            {errors.date && (
              <span id="date-error" role="alert" style={{ fontSize: 12, color: 'var(--wl-error)', marginTop: 4, display: 'block' }}>
                {errors.date}
              </span>
            )}
          </div>

          {/* 종료 날짜 (선택) — 여행/연속 일정용 */}
          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="event-end-date"
              style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--wl-ink-2, #5C5149)', marginBottom: 6 }}
            >
              종료 날짜 <span style={{ color: 'var(--wl-ink-4, #BFB5AC)', fontWeight: 400 }}>(여러 날이면 입력)</span>
            </label>
            <input
              id="event-end-date"
              type="date"
              value={endDate}
              min={eventDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-invalid={!!errors.end_date}
              aria-describedby={errors.end_date ? 'end-date-error' : undefined}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', fontSize: 14,
                border: `1px solid ${errors.end_date ? 'var(--wl-error)' : 'var(--wl-line, #EDE4D8)'}`,
                borderRadius: 8, background: 'white',
                color: 'var(--wl-ink, #2B2420)', outline: 'none',
              }}
            />
            {errors.end_date && (
              <span id="end-date-error" role="alert" style={{ fontSize: 12, color: 'var(--wl-error)', marginTop: 4, display: 'block' }}>
                {errors.end_date}
              </span>
            )}
          </div>

          {/* 카테고리 */}
          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="event-category"
              style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--wl-ink-2, #5C5149)', marginBottom: 6 }}
            >
              카테고리 <span style={{ color: 'var(--wl-coral)' }}>*</span>
            </label>
            <select
              id="event-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category | '')}
              aria-invalid={!!errors.category}
              aria-describedby={errors.category ? 'category-error' : undefined}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', fontSize: 14,
                border: `1px solid ${errors.category ? 'var(--wl-error)' : 'var(--wl-line, #EDE4D8)'}`,
                borderRadius: 8, background: 'white',
                color: category ? 'var(--wl-ink, #2B2420)' : 'var(--wl-ink-4, #BFB5AC)',
                outline: 'none', appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5l5 5 5-5' stroke='%238B8079' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: 36,
              }}
            >
              <option value="">카테고리 선택</option>
              {CATEGORY_LIST.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
            {errors.category && (
              <span id="category-error" role="alert" style={{ fontSize: 12, color: 'var(--wl-error)', marginTop: 4, display: 'block' }}>
                {errors.category}
              </span>
            )}
          </div>

          {/* 메모 */}
          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="event-memo"
              style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--wl-ink-2, #5C5149)', marginBottom: 6 }}
            >
              메모
            </label>
            <textarea
              id="event-memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모를 입력하세요 (선택)"
              maxLength={500}
              rows={3}
              aria-describedby={errors.memo ? 'memo-error' : undefined}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', fontSize: 14,
                border: `1px solid ${errors.memo ? 'var(--wl-error)' : 'var(--wl-line, #EDE4D8)'}`,
                borderRadius: 8, background: 'white',
                color: 'var(--wl-ink, #2B2420)', outline: 'none',
                resize: 'vertical', minHeight: 72,
              }}
            />
            {errors.memo && (
              <span id="memo-error" role="alert" style={{ fontSize: 12, color: 'var(--wl-error)', marginTop: 4, display: 'block' }}>
                {errors.memo}
              </span>
            )}
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1, padding: '12px', fontSize: 15, fontWeight: 500,
                border: '1px solid var(--wl-line, #EDE4D8)',
                borderRadius: 12, background: 'white',
                color: 'var(--wl-ink-2, #5C5149)', cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 2, padding: '12px', fontSize: 15, fontWeight: 600,
                border: 'none', borderRadius: 12,
                background: submitting ? 'var(--wl-ink-muted)' : 'var(--wl-coral)',
                color: 'white', cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? '저장 중...' : (mode === 'create' ? '저장' : '수정')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
