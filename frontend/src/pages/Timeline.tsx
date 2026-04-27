// @TASK STITCH-DESIGN - Timeline 페이지 이식 (Stitch timeline_desktop/code.html 기반)
// @SPEC specs/screens/04_timeline.yaml

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { getTimeline } from '../services/timeline_api';
import { useCouple } from '../context/CoupleContext';
import TimelineChapter from '../components/TimelineChapter';
import Toast from '../components/Toast';
import PhotoCurationModal from '../components/PhotoCurationModal';
import type { TimelineResponse, Chapter } from '../types';

const COUPLE_ID = 'cpl_sample_001';
const LS_SELECTED_KEY = 'weddinglog_selected_photos';
// 챕터 제목 사용자 편집 — { [chapterId]: customTitle }.
// 백엔드 CHAPTER_MAPPING 은 고정이라 localStorage 로 클라이언트 오버라이드.
const LS_CHAPTER_TITLES = 'weddinglog_chapter_titles';

function loadChapterTitleOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_CHAPTER_TITLES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function calcPages(selectedCount: number): number {
  if (!selectedCount) return 0;
  return Math.ceil(selectedCount / 2.5);
}

export default function Timeline() {
  const navigate = useNavigate();
  const { couple } = useCouple();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  // 앨범 만들기 클릭 시 사진 정리 모달 노출
  const [curationOpen, setCurationOpen] = useState(false);
  // 사용자 편집한 챕터 제목 오버라이드 — id → 새 제목.
  const [titleOverrides, setTitleOverrides] = useState<Record<string, string>>(() => loadChapterTitleOverrides());

  function handleTitleChange(chapterId: string | number, newTitle: string) {
    setTitleOverrides((prev) => {
      const next = { ...prev, [String(chapterId)]: newTitle };
      try { localStorage.setItem(LS_CHAPTER_TITLES, JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  }

  // ?curate=1 query 진입 시 자동으로 정리 모달 오픈 (헤더의 "앨범 주문" 버튼).
  // 데이터 로딩 후 한 번만 처리한 뒤 query 삭제 (history 깨끗하게).
  useEffect(() => {
    if (!data) return;
    if (searchParams.get('curate') === '1') {
      setCurationOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('curate');
      setSearchParams(next, { replace: true });
    }
  }, [data, searchParams, setSearchParams]);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTimeline(COUPLE_ID);
      setData(result);
      setSelectedCount(result.selected_photos ?? 0);
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
  // 백엔드 챕터 + localStorage 제목 오버라이드 적용.
  const chapters: Chapter[] = (data?.chapters ?? []).map((c) => {
    const override = titleOverrides[String(c.id)];
    return override !== undefined ? { ...c, title: override } : c;
  });
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
        <div className="py-24 border-t border-line">
          <h2 className="font-display-md text-[28px] text-ink mb-3">아직 사진이 없어요.</h2>
          <p className="text-[15px] text-ink-muted mb-8 max-w-[420px]">
            캘린더에 일정을 추가하고 사진을 올리면 자동으로 챕터가 묶입니다.
          </p>
          <Link
            to="/calendar"
            className="inline-block px-6 py-3 rounded-full bg-coral text-white text-[14px] font-medium hover:opacity-90 transition-opacity"
            style={{ textDecoration: 'none' }}
          >
            캘린더로 가기
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
              onTitleChange={handleTitleChange}
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

      {/* Toast */}
      {toast && (
        <Toast message={toast} type="info" onDismiss={() => setToast(null)} />
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
            onClick={() => {
              if (!isAlbumEnabled) return;
              setCurationOpen(true);
            }}
          >
            {isAlbumEnabled
              ? `앨범으로 만들기 (${selectedCount}장 선택됨)`
              : `앨범으로 만들기 (사진을 1장 이상 선택해주세요)`}
          </button>
        </div>
      </div>

      {/* 사진 정리 모달 — 앨범 만들기 직전 단계 */}
      {curationOpen && (
        <PhotoCurationModal
          chapters={chapters}
          weddingDate={couple?.wedding_date ?? null}
          onClose={() => setCurationOpen(false)}
          onConfirm={(selectedIds) => {
            if (selectedIds.length === 0) {
              setToast('사진을 1장 이상 선택해주세요.');
              return;
            }
            localStorage.setItem(LS_SELECTED_KEY, JSON.stringify(selectedIds));
            setCurationOpen(false);
            navigate('/order-checkout');
          }}
        />
      )}
    </div>
  );
}
