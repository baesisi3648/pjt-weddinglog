// @TASK STITCH-DESIGN - Home 페이지 이식 (Stitch home_desktop/code.html 기반)
// @SPEC specs/screens/01_home.yaml
// @TEST src/pages/Home.test.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCouple } from '../context/CoupleContext';
import { getHomeSummary } from '../services/home_api';
import CoupleProfileCard from '../components/CoupleProfileCard';
import CoupleProfileEditModal from '../components/CoupleProfileEditModal';
import type { Couple, Event, Photo, HomeSummary } from '../types';
import { photoUrl } from '../utils/photo';

const COUPLE_ID = 'cpl_sample_001';

// D-N 계산용 헬퍼
function calcDaysFromToday(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

// D-N 레이블
function dLabel(dateStr: string): string {
  const diff = calcDaysFromToday(dateStr);
  if (diff === 0) return 'D-Day';
  if (diff < 0) return `D${diff}`; // D-N (미래)
  return `D+${diff}`; // D+N (과거)
}

// ─── 이번 주 할 일 (체크리스트 스타일) ─────────────────────────────────────
interface UpcomingTasksWidgetProps {
  events: Event[];
  onToggle?: (eventId: string) => void;
}

function UpcomingTasksWidget({ events, onToggle }: UpcomingTasksWidgetProps) {
  if (!events || events.length === 0) {
    return (
      <p className="py-6 text-ink-muted text-[14px]">
        진행 중인 일정이 없습니다.
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {events.slice(0, 4).map((ev) => (
        <li
          key={ev.id}
          className={`flex items-center justify-between py-4 border-b border-line group cursor-pointer ${
            ev.is_completed ? 'opacity-50' : ''
          }`}
          onClick={() => onToggle?.(ev.id)}
        >
          <div className="flex items-baseline gap-4 min-w-0 flex-1">
            <span className="font-mono-id text-[12px] text-ink-muted shrink-0 w-12">
              {dLabel(ev.date)}
            </span>
            <span
              className={`text-[15px] truncate ${
                ev.is_completed
                  ? 'text-ink-muted line-through'
                  : 'text-ink group-hover:text-coral transition-colors'
              }`}
            >
              {ev.title}
            </span>
          </div>
          {ev.is_completed && (
            <span className="text-coral text-[14px] ml-3 shrink-0">완료</span>
          )}
        </li>
      ))}
    </ul>
  );
}

// ─── 최근 사진 (Polaroid 그리드) ────────────────────────────────────────────
interface RecentPhotosWidgetProps {
  photos: Photo[];
}

function RecentPhotosWidget({ photos }: RecentPhotosWidgetProps) {
  if (!photos || photos.length === 0) {
    return (
      <p className="py-6 text-ink-muted text-[14px]">
        첫 사진을 올려보세요.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {photos.slice(0, 6).map((photo) => (
        <Link
          key={photo.id}
          to={`/events/${photo.event_id}`}
          className="group block no-underline"
          style={{ textDecoration: 'none' }}
        >
          <div className="aspect-square overflow-hidden bg-bg-soft">
            <img
              src={photoUrl(photo.file_url)}
              alt={photo.caption || '사진'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
          {photo.caption && (
            <p className="mt-2 text-[13px] text-ink-muted leading-snug line-clamp-1">
              {photo.caption}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

// ─── Home ────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const { refetch: refetchCouple } = useCouple();
  const [homeData, setHomeData] = useState<HomeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchHome = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHomeSummary(COUPLE_ID);
      setHomeData(result);
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message ?? '홈 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHome(); }, [fetchHome]);

  function handleProfileSaved(updated: Couple) {
    setHomeData((prev) => prev ? { ...prev, couple: updated } : prev);
    refetchCouple();
  }

  const couple = homeData?.couple ?? null;
  const upcomingEvents = homeData?.upcoming_events ?? [];
  const recentPhotos = homeData?.recent_photos ?? [];
  const photoCounts = homeData?.photo_counts ?? { total: 0, selected: 0 };
  const isAlbumEnabled = photoCounts.selected >= 1;
  const isPast = couple?.wedding_date ? calcDaysFromToday(couple.wedding_date) > 0 : false;

  // ── 로딩 ──
  if (loading) {
    return (
      <div className="flex flex-col gap-xl py-lg">
        <div className="flex flex-col items-center gap-md border-b border-surface-dim pb-lg animate-pulse">
          <div className="h-12 w-48 bg-surface-container rounded" />
          <div className="h-20 w-32 bg-surface-container rounded" />
        </div>
        <div className="text-center font-body-sm text-on-surface-variant">불러오는 중…</div>
      </div>
    );
  }

  // ── 에러 ──
  if (error) {
    return (
      <div className="my-md p-md bg-error-container border border-error rounded text-on-error-container text-center font-body-sm text-body-sm">
        <div className="font-medium mb-1">홈을 불러오지 못했습니다.</div>
        <div className="text-sm opacity-70">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16 pb-24">
      {/* ── Hero: 커플 이름 + D-day ── */}
      {couple ? (
        <div className="relative">
          <CoupleProfileCard couple={couple} />
          <button
            onClick={() => setIsEditModalOpen(true)}
            aria-label="프로필 편집"
            className="absolute top-0 right-0 text-[12px] tracking-tight text-ink-muted hover:text-coral transition-colors"
          >
            편집
          </button>
        </div>
      ) : (
        <p className="text-[14px] text-ink-muted">커플 정보를 불러올 수 없습니다.</p>
      )}

      {/* ── 결혼 후 안내 (인라인, 박스 ❌) ── */}
      {isPast && (
        <p className="text-[14px] text-ink-muted">
          결혼식이 끝났어요.{' '}
          <Link to="/timeline" className="text-coral hover:underline underline-offset-4">
            타임라인 정리하러 가기 →
          </Link>
        </p>
      )}

      {/* ── 다가오는 일정 ── */}
      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display-md text-[24px] text-ink">다가오는 일정</h2>
          <button
            className="text-[13px] text-ink-muted hover:text-coral transition-colors"
            onClick={() => navigate('/calendar')}
          >
            전체 보기
          </button>
        </div>
        <UpcomingTasksWidget events={upcomingEvents} />
      </section>

      {/* ── 최근 기록 ── */}
      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display-md text-[24px] text-ink">최근 기록</h2>
          <button
            className="text-[13px] text-ink-muted hover:text-coral transition-colors"
            onClick={() => navigate('/timeline')}
          >
            전체 보기
          </button>
        </div>
        <RecentPhotosWidget photos={recentPhotos} />
      </section>

      {/* ── CTA — 코랄 1색만 강조 ── */}
      <section className="flex flex-col sm:flex-row gap-3 border-t border-line pt-10">
        <button
          className="flex-1 py-3.5 px-6 rounded-full bg-coral text-white text-[15px] font-medium hover:opacity-90 transition-opacity"
          onClick={() => navigate('/calendar')}
        >
          캘린더 열기
        </button>
        <button
          className="flex-1 py-3.5 px-6 rounded-full border border-ink text-ink text-[15px] font-medium hover:bg-ink hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={!isAlbumEnabled}
          onClick={() => isAlbumEnabled && navigate('/timeline')}
        >
          앨범 만들기
        </button>
      </section>

      {/* 커플 편집 모달 */}
      {couple && (
        <CoupleProfileEditModal
          couple={couple}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
}
