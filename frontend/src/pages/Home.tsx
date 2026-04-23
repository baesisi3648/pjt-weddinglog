// @TASK P4-S2-T1~T3 - Home 페이지 실 API 연동
// @SPEC specs/screens/01_home.yaml
// @TEST src/pages/Home.test.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCouple } from '../context/CoupleContext';
import { getHomeSummary } from '../services/home_api';
import CoupleProfileCard from '../components/CoupleProfileCard';
import CoupleProfileEditModal from '../components/CoupleProfileEditModal';
import CategoryBadge from '../components/CategoryBadge';
import type { Couple, Event, Photo, AlbumOrderDeadline, HomeSummary } from '../types';

const COUPLE_ID = 'cpl_sample_001';

// D+N 계산용 헬퍼
function calcDaysFromToday(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

interface UpcomingTasksWidgetProps {
  events: Event[];
}

/**
 * UpcomingTasksWidget — 최대 3개 upcoming_events 표시
 */
function UpcomingTasksWidget({ events }: UpcomingTasksWidgetProps) {
  if (!events || events.length === 0) {
    return (
      <div className="wl-card" style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
        진행 중인 일정이 없습니다
      </div>
    );
  }

  return (
    <div className="wl-card wl-tasks">
      {events.slice(0, 3).map((ev) => {
        const diff = calcDaysFromToday(ev.date);
        const dLabel = diff === 0 ? 'D-Day' : diff < 0 ? `D${diff}` : `D+${diff}`;
        return (
          <div key={ev.id} className={`wl-task ${ev.is_completed ? 'is-done' : ''}`}>
            <div className="wl-task-body">
              <div className="wl-task-label">{ev.title}</div>
              <div className="wl-task-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <CategoryBadge category={ev.category} size="sm" />
                <span className="wl-task-date" style={{ fontSize: '12px', color: '#9CA3AF' }}>{dLabel}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface RecentPhotosWidgetProps {
  photos: Photo[];
}

/**
 * RecentPhotosWidget — 최근 6장 썸네일 3x2 그리드
 */
function RecentPhotosWidget({ photos }: RecentPhotosWidgetProps) {
  if (!photos || photos.length === 0) {
    return (
      <div className="wl-logs" style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
        첫 사진을 올려보세요
      </div>
    );
  }

  return (
    <div
      className="wl-logs"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
      }}
    >
      {photos.slice(0, 6).map((photo) => (
        <Link key={photo.id} to={`/event/${photo.event_id}`} style={{ textDecoration: 'none' }}>
          <div className="wl-log-card" style={{ textDecoration: 'none' }}>
            <div className="wl-log-img" style={{ position: 'relative', aspectRatio: '1/1' }}>
              <img
                src={photo.file_url}
                alt={photo.caption || '사진'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
              />
            </div>
            {photo.caption && (
              <div className="wl-log-caption" style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {photo.caption}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}


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

  useEffect(() => {
    fetchHome();
  }, [fetchHome]);

  function handleProfileSaved(updated: Couple) {
    // homeData 내 couple 즉시 갱신 + CoupleContext도 리프레시
    setHomeData((prev) => prev ? { ...prev, couple: updated } : prev);
    refetchCouple();
  }

  const couple = homeData?.couple ?? null;
  const upcomingEvents = homeData?.upcoming_events ?? [];
  const recentPhotos = homeData?.recent_photos ?? [];
  const photoCounts = homeData?.photo_counts ?? { total: 0, selected: 0 };
  const albumDeadline: AlbumOrderDeadline | null = homeData?.album_order_deadline ?? null;

  // D+ 상태 감지
  const isPast = couple?.wedding_date
    ? calcDaysFromToday(couple.wedding_date) > 0
    : false;

  // 앨범 주문 CTA 활성화 조건: selected >= 1
  const isAlbumEnabled = photoCounts.selected >= 1;

  return (
    <div className="wl-screen wl-home">
      <div className="wl-scroll">
        {/* 에러 상태 */}
        {!loading && error && (
          <div
            style={{
              margin: '16px',
              padding: '16px',
              background: '#FEF2F2',
              borderRadius: '12px',
              color: '#EF4444',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>홈을 불러오지 못했습니다.</div>
            <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{error}</div>
          </div>
        )}

        {/* 커플 프로필 카드 */}
        {!loading && !error && couple ? (
          <div style={{ position: 'relative' }}>
            <CoupleProfileCard couple={couple} album_order_deadline={albumDeadline} />
            <button
              onClick={() => setIsEditModalOpen(true)}
              aria-label="프로필 편집"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '12px',
                color: '#6B7280',
                cursor: 'pointer',
                fontWeight: 500,
                backdropFilter: 'blur(4px)',
              }}
            >
              편집
            </button>
          </div>
        ) : !loading && !error && !couple ? (
          <div className="wl-hero">
            <div className="wl-hero-inner" style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '8px' }}>커플 정보를 불러올 수 없습니다</div>
              <div style={{ fontSize: '12px', color: '#D1D5DB' }}>백엔드 API 상태를 확인해주세요</div>
            </div>
          </div>
        ) : null}

        {/* 로딩 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>불러오는 중…</div>
        )}

        {/* D+ 상태 메시지 */}
        {!loading && isPast && (
          <section className="wl-section" style={{ padding: '0 16px 16px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                fontSize: '14px',
                color: '#92400E',
              }}
            >
              결혼 후 타임라인 정리를 마무리하세요 🎊
              <div style={{ marginTop: '8px' }}>
                <Link to="/timeline" style={{ color: '#D97706', fontWeight: 600, textDecoration: 'none' }}>
                  타임라인 보기 →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 이번 주 할 일 (UpcomingTasksWidget) */}
        {!loading && (
          <section className="wl-section">
            <header className="wl-section-head">
              <div>
                <div className="wl-section-eyebrow">This week</div>
                <h2 className="wl-section-title">이번 주 할 일</h2>
              </div>
              <button className="wl-link" onClick={() => navigate('/calendar')}>모두 보기 →</button>
            </header>
            <UpcomingTasksWidget events={upcomingEvents} />
          </section>
        )}

        {/* 최근 사진 (RecentPhotosWidget) */}
        {!loading && (
          <section className="wl-section">
            <header className="wl-section-head">
              <div>
                <div className="wl-section-eyebrow">Recent</div>
                <h2 className="wl-section-title">최근 기록</h2>
              </div>
              <button className="wl-link" onClick={() => navigate('/timeline')}>전체 →</button>
            </header>
            <RecentPhotosWidget photos={recentPhotos} />
          </section>
        )}

        {/* CTA 버튼 그룹 */}
        {!loading && (
          <section className="wl-section">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '0 0 8px' }}>
              {/* 캘린더로 이동 (primary) */}
              <button
                className="wl-btn wl-btn-primary"
                onClick={() => navigate('/calendar')}
                style={{ width: '100%' }}
              >
                캘린더로 이동
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* 앨범 주문하기 (gold accent, photo_counts.selected >= 1일 때만 활성화) */}
              <button
                className="wl-btn"
                disabled={!isAlbumEnabled}
                onClick={() => isAlbumEnabled && navigate('/timeline')}
                style={{
                  width: '100%',
                  background: isAlbumEnabled ? '#D4A017' : '#E5E7EB',
                  color: isAlbumEnabled ? '#fff' : '#9CA3AF',
                  cursor: isAlbumEnabled ? 'pointer' : 'not-allowed',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
              >
                앨범 주문하기
                {isAlbumEnabled && (
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              {!isAlbumEnabled && (
                <div style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center' }}>
                  사진을 선택하면 앨범 주문이 가능합니다
                </div>
              )}
            </div>
          </section>
        )}

        <div className="wl-bottom-spacer" />
      </div>

      {/* 커플 프로필 편집 모달 */}
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

