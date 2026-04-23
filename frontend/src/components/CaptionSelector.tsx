// @TASK P3-S1-T4 - CaptionSelector 컴포넌트
// @SPEC specs/screens/03_event_detail.yaml#caption_selector
// @SPEC docs/planning/council-report.md#M4 (AI/템플릿 투명성 배지)
// @TEST src/components/CaptionSelector.test.tsx

import { useState } from 'react';
import { requestCaption } from '../services/ai_api';
import { updateCaption } from '../services/photo_api';
import type { Photo, Event, CaptionSource, AiSource } from '../types';

interface CaptionSelectorProps {
  photo: Photo;
  event: Event;
  onApply: (caption: string, source: CaptionSource) => void;
  onClose: () => void;
}

interface SuggestionsState {
  captions: string[];
  source: AiSource;
}

export default function CaptionSelector({ photo, event, onApply, onClose }: CaptionSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionsState | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestAI() {
    setLoading(true);
    setError(null);
    setSuggestions(null);
    setSelected(null);
    setUseCustom(false);
    try {
      const data = await requestCaption(event.id, photo.id, event.memo ?? '');
      setSuggestions(data);
      if (data.captions?.length) setSelected(data.captions[0]);
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail ?? 'AI 캡션 요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    const caption = useCustom ? customInput.trim() : (selected ?? '');
    if (!caption) return;

    setApplying(true);
    try {
      await updateCaption(photo.id, caption);
      onApply(caption, useCustom ? 'manual' : (suggestions?.source ?? 'ai'));
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail ?? '캡션 저장에 실패했습니다.');
    } finally {
      setApplying(false);
    }
  }

  // source 배지
  function SourceBadge({ source }: { source: AiSource }) {
    if (source === 'ai') {
      return (
        <span
          style={{
            fontSize: 11, fontWeight: 600,
            background: 'var(--wl-coral)', color: '#fff',
            padding: '2px 7px', borderRadius: 20,
            letterSpacing: '0.02em',
          }}
        >
          AI 생성
        </span>
      );
    }
    return (
      <span
        style={{
          fontSize: 11, fontWeight: 600,
          background: 'var(--wl-ink-4)', color: 'var(--wl-ink)',
          padding: '2px 7px', borderRadius: 20,
          letterSpacing: '0.02em',
        }}
      >
        기본 템플릿
      </span>
    );
  }

  return (
    <div
      style={{
        background: 'var(--wl-card)',
        border: '1px solid var(--wl-line)',
        borderRadius: 12,
        padding: '16px',
        marginTop: 8,
      }}
      role="dialog"
      aria-label="캡션 선택"
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--wl-ink)' }}>캡션 설정</span>
        <button
          aria-label="닫기"
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--wl-ink-3)', padding: 4,
            fontSize: 16, lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* AI 캡션 추천 버튼 */}
      <button
        className="wl-ai-btn"
        type="button"
        onClick={handleRequestAI}
        disabled={loading}
        style={{ marginBottom: 12 }}
      >
        {loading ? (
          <>
            <span
              role="status"
              aria-label="로딩 중"
              style={{
                display: 'inline-block',
                width: 10, height: 10,
                border: '2px solid currentColor',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                marginRight: 6,
              }}
            />
            추천 중...
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 2l1 2.5L10.5 5.5 8 6.5 7 9 6 6.5 3.5 5.5 6 4.5 7 2z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
            </svg>
            AI 캡션 추천
          </>
        )}
      </button>

      {error && (
        <p style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>{error}</p>
      )}

      {/* AI 결과 */}
      {suggestions && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--wl-ink-3)' }}>추천 캡션</span>
            <SourceBadge source={suggestions.source} />
          </div>

          {suggestions.captions.map((caption, i) => (
            <label
              key={i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                background: selected === caption && !useCustom ? 'var(--wl-card-soft)' : 'transparent',
                border: selected === caption && !useCustom ? '1px solid var(--wl-peach-2)' : '1px solid transparent',
                marginBottom: 6,
                fontSize: 13,
                color: 'var(--wl-ink)',
                lineHeight: 1.5,
              }}
            >
              <input
                type="radio"
                name={`caption-${photo.id}`}
                value={caption}
                checked={selected === caption && !useCustom}
                onChange={() => { setSelected(caption); setUseCustom(false); }}
                style={{ marginTop: 2, accentColor: 'var(--wl-coral)' }}
              />
              <span>
                <span
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    color: 'var(--wl-ink-3)',
                    marginRight: 6,
                    fontSize: 11,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                {caption}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* 직접 입력 */}
      <div style={{ marginTop: suggestions ? 8 : 0 }}>
        <label
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, color: 'var(--wl-ink)',
            cursor: 'pointer', marginBottom: 6,
          }}
        >
          <input
            type="radio"
            name={`caption-${photo.id}`}
            checked={useCustom}
            onChange={() => setUseCustom(true)}
            style={{ accentColor: 'var(--wl-coral)' }}
          />
          직접 입력
        </label>
        {useCustom && (
          <input
            className="wl-caption-input"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="이 순간에 한마디…"
            autoFocus
            style={{ width: '100%', marginBottom: 8 }}
          />
        )}
      </div>

      {/* 적용 버튼 */}
      <button
        className="wl-btn wl-btn-primary wl-btn-sm"
        type="button"
        onClick={handleApply}
        disabled={applying || (!useCustom && !selected) || (useCustom && !customInput.trim())}
        style={{ width: '100%', marginTop: 8 }}
      >
        {applying ? '저장 중...' : '적용'}
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
