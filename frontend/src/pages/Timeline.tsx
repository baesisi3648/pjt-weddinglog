// @TASK STITCH-DESIGN - Timeline 페이지 이식 (Stitch timeline_desktop/code.html 기반)
// @SPEC specs/screens/04_timeline.yaml

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getTimeline } from '../services/timeline_api';
import TimelineChapter from '../components/TimelineChapter';
import type { TimelineResponse, Chapter } from '../types';

const COUPLE_ID = 'cpl_sample_001';

function calcPages(selectedCount: number): number {
  if (!selectedCount) return 0;
  return Math.ceil(selectedCount / 2.5);
}

export default function Timeline() {
  const navigate = useNavigate();
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTimeline(COUPLE_ID);
      setData(result);
      setSelectedCount(result.total_selected ?? 0);
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message ?? '타임라인을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

  function handleSelectionChange(_photoId: string, newIsSelected: boolean) {
    setSelectedCount((prev) => newIsSelected ? prev + 1 : Math.max(0, prev - 1));
  }

  const totalPhotos = data?.total_photos ?? 0;
  const pagesEstimated = calcPages(selectedCount);
  const chapters: Chapter[] = data?.chapters ?? [];
  const isAlbumEnabled = selectedCount >= 1;

  return (
    <div className="flex flex-col gap-xl">
      {/* ── 헤더 ── */}
      <div className="flex justify-between items-end mb-16 border-b border-[#E3DBC8] pb-4">
        <h1 className="font-display-md text-display-md text-on-surface">Timeline Draft</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {loading ? '—' : `총 ${totalPhotos}장 · ${pagesEstimated > 0 ? `${pagesEstimated}페이지 예상` : '—'}`}
        </p>
      </div>

      {/* ── 로딩 ── */}
      {loading && (
        <div className="text-center py-16 font-body-md text-on-surface-variant">불러오는 중…</div>
      )}

      {/* ── 에러 ── */}
      {!loading && error && (
        <div className="text-center py-12 bg-error-container text-on-error-container rounded-lg p-md">
          <div className="font-body-md font-medium mb-2">타임라인을 불러오지 못했습니다.</div>
          <div className="font-body-sm text-sm opacity-70 mb-4">{error}</div>
          <button
            className="px-6 py-2.5 font-body-sm text-body-sm border border-on-error-container rounded hover:opacity-80 transition-opacity"
            onClick={fetchTimeline}
          >
            다시 시도
          </button>
        </div>
      )}

      {/* ── 빈 상태 ── */}
      {!loading && !error && chapters.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-outline-variant rounded-lg">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-4" style={{ fontVariationSettings: "'FILL' 0" }}>
            photo_library
          </span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">아직 사진이 없습니다</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6">
            일정을 만들고 사진을 추가해보세요.
          </p>
          <Link
            to="/calendar"
            className="px-6 py-2.5 font-body-sm text-body-sm border border-on-surface text-on-surface rounded hover:bg-surface-dim transition-colors"
            style={{ textDecoration: 'none' }}
          >
            캘린더로 이동
          </Link>
        </div>
      )}

      {/* ── 챕터 네비게이션 스트립 ── */}
      {!loading && !error && chapters.length > 0 && (
        <nav className="flex gap-4 overflow-x-auto pb-2 border-b border-outline-variant" aria-label="챕터 네비게이션">
          {chapters.map((c) => (
            <button
              key={c.id}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant hover:bg-surface-container transition-colors whitespace-nowrap font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface"
              onClick={() => {
                const el = document.getElementById(`chapter-${c.id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <span className="font-display-md text-primary-container" style={{ fontSize: '14px' }}>
                {String(c.chapter_number ?? c.id).padStart(2, '0')}.
              </span>
              <span>{c.title}</span>
              <span className="font-mono-id text-mono-id text-outline">
                {c.photo_count ?? c.photos?.length ?? 0}장
              </span>
            </button>
          ))}
        </nav>
      )}

      {/* ── 챕터 본문 ── */}
      {!loading && !error && chapters.length > 0 && (
        <div>
          {chapters.map((chapter) => (
            <TimelineChapter
              key={chapter.id}
              chapter={chapter}
              onSelectionChange={handleSelectionChange}
            />
          ))}

          {/* 종료 마크 */}
          <div className="flex flex-col items-center py-12 gap-2">
            <div className="w-px h-8 bg-outline-variant" />
            <span className="font-display-md italic text-on-surface-variant" style={{ fontSize: '16px' }}>
              To be continued…
            </span>
          </div>
        </div>
      )}

      {/* ── 앨범 주문 CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#fff8f1] via-[#fff8f1] to-transparent z-40">
        <div className="max-w-container-max mx-auto">
          <button
            className="w-full h-14 font-body-md text-body-md font-medium rounded flex items-center justify-center shadow-[0_4px_12px_rgba(232,159,142,0.3)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isAlbumEnabled ? '#e89f8e' : '#d7c2bd',
              color: isAlbumEnabled ? '#ffffff' : '#85736f',
            }}
            disabled={!isAlbumEnabled}
            onClick={() => isAlbumEnabled && navigate('/order-checkout')}
          >
            {isAlbumEnabled
              ? `앨범으로 만들기 (${selectedCount}장 선택됨)`
              : `앨범으로 만들기 (사진을 1장 이상 선택해주세요)`}
          </button>
        </div>
      </div>
    </div>
  );
}
