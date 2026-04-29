// @TASK UX-FIXES-C1 - 커플 프로필 편집 모달
import React, { useState, useEffect, useCallback } from 'react';
import { updateCouple } from '../services/couple_api';
import type { Couple, CoupleUpdate } from '../types';

interface Props {
  couple: Couple;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: Couple) => void;
}

interface FormState {
  groom_name: string;
  bride_name: string;
  wedding_date: string;
  tagline: string;
}

interface FormErrors {
  groom_name?: string;
  bride_name?: string;
  wedding_date?: string;
  tagline?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.groom_name.trim() || form.groom_name.trim().length < 2) {
    errors.groom_name = '신랑 이름은 2자 이상이어야 합니다.';
  }
  if (!form.bride_name.trim() || form.bride_name.trim().length < 2) {
    errors.bride_name = '신부 이름은 2자 이상이어야 합니다.';
  }
  if (!form.wedding_date) {
    errors.wedding_date = '결혼 예정일을 입력해주세요.';
  }
  if (form.tagline.length > 100) {
    errors.tagline = '한 줄 소개는 100자 이내여야 합니다.';
  }
  return errors;
}

export default function CoupleProfileEditModal({ couple, isOpen, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>({
    groom_name: couple.groom_name,
    bride_name: couple.bride_name,
    wedding_date: couple.wedding_date ?? '',
    tagline: couple.tagline ?? '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // couple prop이 바뀌면 폼 초기화
  useEffect(() => {
    setForm({
      groom_name: couple.groom_name,
      bride_name: couple.bride_name,
      wedding_date: couple.wedding_date ?? '',
      tagline: couple.tagline ?? '',
    });
    setErrors({});
    setApiError(null);
  }, [couple, isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setApiError(null);
    try {
      const payload: CoupleUpdate = {
        groom_name: form.groom_name.trim(),
        bride_name: form.bride_name.trim(),
        wedding_date: form.wedding_date || undefined,
        tagline: form.tagline.trim() || null,
      };
      const updated = await updateCouple(couple.id, payload);
      onSaved(updated);
      onClose();
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setApiError(e.response?.data?.detail ?? e.message ?? '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      data-testid="modal-overlay"
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="couple-edit-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full mx-4">
        {/* 헤더 */}
        <div
          style={{
            padding: '20px 20px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            id="couple-edit-modal-title"
            style={{ fontSize: '18px', fontWeight: 700, color: 'var(--wl-ink)' }}
          >
            프로필 편집
          </h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--wl-ink-muted)',
              lineHeight: 1,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} noValidate style={{ padding: '20px' }}>
          {apiError && (
            <div
              role="alert"
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                background: 'var(--wl-error-container)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--wl-error)',
              }}
            >
              {apiError}
            </div>
          )}

          {/* 신랑 이름 */}
          <div style={{ marginBottom: '14px' }}>
            <label
              htmlFor="groom-name"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--wl-ink)', marginBottom: '6px' }}
            >
              신랑 이름 <span style={{ color: 'var(--wl-error)' }}>*</span>
            </label>
            <input
              id="groom-name"
              type="text"
              value={form.groom_name}
              onChange={(e) => handleChange('groom_name', e.target.value)}
              aria-invalid={!!errors.groom_name}
              aria-describedby={errors.groom_name ? 'groom-name-error' : undefined}
              placeholder="신랑 이름"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${errors.groom_name ? 'var(--wl-error)' : 'var(--wl-line)'}`,
                fontSize: '14px',
                color: 'var(--wl-ink)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.groom_name && (
              <span
                id="groom-name-error"
                role="alert"
                style={{ fontSize: '12px', color: 'var(--wl-error)', marginTop: '4px', display: 'block' }}
              >
                {errors.groom_name}
              </span>
            )}
          </div>

          {/* 신부 이름 */}
          <div style={{ marginBottom: '14px' }}>
            <label
              htmlFor="bride-name"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--wl-ink)', marginBottom: '6px' }}
            >
              신부 이름 <span style={{ color: 'var(--wl-error)' }}>*</span>
            </label>
            <input
              id="bride-name"
              type="text"
              value={form.bride_name}
              onChange={(e) => handleChange('bride_name', e.target.value)}
              aria-invalid={!!errors.bride_name}
              aria-describedby={errors.bride_name ? 'bride-name-error' : undefined}
              placeholder="신부 이름"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${errors.bride_name ? 'var(--wl-error)' : 'var(--wl-line)'}`,
                fontSize: '14px',
                color: 'var(--wl-ink)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.bride_name && (
              <span
                id="bride-name-error"
                role="alert"
                style={{ fontSize: '12px', color: 'var(--wl-error)', marginTop: '4px', display: 'block' }}
              >
                {errors.bride_name}
              </span>
            )}
          </div>

          {/* 결혼 예정일 */}
          <div style={{ marginBottom: '14px' }}>
            <label
              htmlFor="wedding-date"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--wl-ink)', marginBottom: '6px' }}
            >
              결혼 예정일 <span style={{ color: 'var(--wl-error)' }}>*</span>
            </label>
            <input
              id="wedding-date"
              type="date"
              value={form.wedding_date}
              onChange={(e) => handleChange('wedding_date', e.target.value)}
              aria-invalid={!!errors.wedding_date}
              aria-describedby={errors.wedding_date ? 'wedding-date-error' : undefined}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${errors.wedding_date ? 'var(--wl-error)' : 'var(--wl-line)'}`,
                fontSize: '14px',
                color: 'var(--wl-ink)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.wedding_date && (
              <span
                id="wedding-date-error"
                role="alert"
                style={{ fontSize: '12px', color: 'var(--wl-error)', marginTop: '4px', display: 'block' }}
              >
                {errors.wedding_date}
              </span>
            )}
          </div>

          {/* 한 줄 소개 */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="tagline"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--wl-ink)', marginBottom: '6px' }}
            >
              한 줄 소개 <span style={{ color: 'var(--wl-ink-4)', fontWeight: 400 }}>(선택)</span>
            </label>
            <input
              id="tagline"
              type="text"
              value={form.tagline}
              onChange={(e) => handleChange('tagline', e.target.value)}
              aria-invalid={!!errors.tagline}
              aria-describedby={errors.tagline ? 'tagline-error' : undefined}
              placeholder="우리만의 이야기 (100자 이내)"
              maxLength={100}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${errors.tagline ? 'var(--wl-error)' : 'var(--wl-line)'}`,
                fontSize: '14px',
                color: 'var(--wl-ink)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                fontSize: '11px',
                color: form.tagline.length > 90 ? 'var(--wl-warn)' : 'var(--wl-ink-4)',
                marginTop: '4px',
                textAlign: 'right',
              }}
            >
              {form.tagline.length} / 100
            </div>
            {errors.tagline && (
              <span
                id="tagline-error"
                role="alert"
                style={{ fontSize: '12px', color: 'var(--wl-error)', display: 'block' }}
              >
                {errors.tagline}
              </span>
            )}
          </div>

          {/* 버튼 영역 */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--wl-line)',
                color: 'var(--wl-ink)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 2,
                padding: '11px',
                borderRadius: '10px',
                border: 'none',
                background: saving ? 'rgba(196, 106, 83, 0.6)' : 'var(--wl-coral)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '14px',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {saving ? (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'wl-spin 0.7s linear infinite',
                    }}
                  />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
