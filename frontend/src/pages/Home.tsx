// @TASK STITCH-DESIGN - Home 페이지 이식 (Stitch home_desktop/code.html 기반)
// @SPEC specs/screens/01_home.yaml
// @TEST src/pages/Home.test.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCouple } from '../context/CoupleContext';
import { getHomeSummary } from '../services/home_api';
import CoupleProfileCard from '../components/CoupleProfileCard';
import CoupleProfileEditModal from '../components/CoupleProfileEditModal';
import type { Couple, Event, Photo, AlbumOrderDeadline, HomeSummary } from '../types';

const COUPLE_ID = 'cpl_sample_001';

// D-N 계산용 헬퍼
function calcDaysFromToday(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

// 날짜 포맷: MM.DD
function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
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
      <div className="text-center py-8 text-on-surface-variant font-body-sm text-body-sm">
        진행 중인 일정이 없습니다
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {events.slice(0, 3).map((ev) => (
        <label
          key={ev.id}
          className="flex items-center justify-between group cursor-pointer border-b border-[#E3DBC8] pb-3 border-dashed"
          style={{ opacity: ev.is_completed ? 0.6 : 1 }}
        >
          <div className="flex items-center gap-4">
            {/* 체크 원 */}
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                ev.is_completed
                  ? 'bg-primary-container'
                  : 'border border-outline group-hover:border-primary-container'
              }`}
              onClick={() => onToggle?.(ev.id)}
            >
              {ev.is_completed && (
                <span
                  className="material-symbols-outlined text-white"
                  style={{ fontSize: '14px', fontVariationSettings: "'wght' 600" }}
                >
                  check
                </span>
              )}
            </div>
            <span
              className={`font-body-md text-body-md transition-colors ${
                ev.is_completed
                  ? 'text-[#B5AEA0] line-through'
                  : 'text-on-surface group-hover:text-primary-container'
              }`}
            >
              {ev.title}
            </span>
          </div>
          <span className="font-mono-id text-mono-id text-outline">
            {dLabel(ev.date)}
          </span>
        </label>
      ))}
    </div>
  );
}

// ─── 최근 사진 (Polaroid 그리드) ────────────────────────────────────────────
interface RecentPhotosWidgetProps {
  photos: Photo[];
}

function RecentPhotosWidget({ photos }: RecentPhotosWidgetProps) {
  if (!photos || photos.length === 0) {
    return (
      <div className="text-center py-8 text-on-surface-variant font-body-sm text-body-sm">
        첫 사진을 올려보세요
      </div>
    );
  }

  const rotations = ['-rotate-2', 'rotate-1', '-rotate-1'];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {photos.slice(0, 6).map((photo, idx) => {
        const rot = rotations[idx % rotations.length] ?? '';
        // 3번째 카드(idx=2)는 sm에서 col-span-2
        const spanClass = idx === 2 ? 'sm:col-span-2 lg:col-span-1' : '';

        return (
          <Link
            key={photo.id}
            to={`/events/${photo.event_id}`}
            className={`bg-white p-3 pb-8 rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.05),_0_8px_16px_rgba(0,0,0,0.03)] transform ${rot} hover:rotate-0 transition-transform duration-300 no-underline ${spanClass}`}
            style={{ textDecoration: 'none' }}
          >
            <img
              src={photo.file_url}
              alt={photo.caption || '사진'}
              className={`w-full aspect-square object-cover bg-surface-dim ${idx === 2 ? 'lg:aspect-square sm:aspect-[2/1]' : ''}`}
            />
            <div className="mt-4 flex justify-between items-center px-1">
              <span className="font-body-sm text-body-sm text-on-surface">
                {photo.caption || '기록'}
              </span>
              <span className="font-mono-id text-mono-id text-outline">
                {formatDateShort(photo.created_at ?? '')}
              </span>
            </div>
          </Link>
        );
      })}
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
  const albumDeadline: AlbumOrderDeadline | null = homeData?.album_order_deadline ?? null;
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
    <div className="flex flex-col gap-xl">
      {/* ── Hero: 커플 이름 + D-day ── */}
      {couple ? (
        <div className="relative">
          <CoupleProfileCard couple={couple} album_order_deadline={albumDeadline} />
          <button
            onClick={() => setIsEditModalOpen(true)}
            aria-label="프로필 편집"
            className="absolute top-0 right-0 border border-outline-variant rounded px-3 py-1.5 font-label-caps text-label-caps text-on-surface-variant bg-surface-container-lowest hover:bg-surface-container transition-colors"
          >
            편집
          </button>
        </div>
      ) : (
        <section className="flex flex-col items-center text-center gap-md border-b border-surface-dim pb-lg">
          <p className="font-body-sm text-body-sm text-on-surface-variant">커플 정보를 불러올 수 없습니다</p>
        </section>
      )}

      {/* ── D+ 결혼 후 메시지 ── */}
      {isPast && (
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-md text-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">
            결혼을 축하합니다! 타임라인 정리를 마무리하세요.
          </p>
          <Link to="/timeline" className="font-body-sm text-body-sm text-primary hover:underline">
            타임라인 보기 →
          </Link>
        </div>
      )}

      {/* ── 이번 주 할 일 ── */}
      <section className="flex flex-col gap-md">
        <div className="flex items-end justify-between border-b border-[#E3DBC8] pb-2">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">이번 주 할 일</h2>
          <button
            className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
            onClick={() => navigate('/calendar')}
          >
            모두 보기 →
          </button>
        </div>
        <UpcomingTasksWidget events={upcomingEvents} />
      </section>

      {/* ── 최근 기록 (Polaroid 그리드) ── */}
      <section className="flex flex-col gap-md">
        <div className="flex items-end justify-between border-b border-[#E3DBC8] pb-2">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">최근 기록</h2>
          <button
            className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
            onClick={() => navigate('/timeline')}
          >
            전체 →
          </button>
        </div>
        <RecentPhotosWidget photos={recentPhotos} />
      </section>

      {/* ── CTA 버튼 ── */}
      <section className="flex flex-col sm:flex-row gap-4 border-t border-surface-dim pt-lg pb-xl">
        <button
          className="flex-1 bg-on-surface text-inverse-on-surface font-body-md text-body-md py-3 px-6 rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          onClick={() => navigate('/calendar')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_month</span>
          캘린더로 이동
        </button>
        <button
          className="flex-1 border font-body-md text-body-md py-3 px-6 rounded flex items-center justify-center gap-2 transition-colors"
          style={{
            borderColor: isAlbumEnabled ? '#e89f8e' : '#d7c2bd',
            color: isAlbumEnabled ? '#693529' : '#85736f',
            background: isAlbumEnabled ? 'transparent' : 'transparent',
            cursor: isAlbumEnabled ? 'pointer' : 'default',
          }}
          disabled={!isAlbumEnabled}
          onClick={() => isAlbumEnabled && navigate('/timeline')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>photo_album</span>
          앨범 주문하기
        </button>
      </section>

      {/* FAB */}
      <button
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-primary-container text-on-primary rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(232,159,142,0.4)] hover:scale-105 transition-transform z-50"
        aria-label="새 일정 추가"
        onClick={() => navigate('/calendar')}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>edit</span>
      </button>

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
