// @TASK P4-S2-T1~T3 - Home 페이지 실 API 연동
// @SPEC specs/screens/01_home.yaml
// @TEST src/pages/Home.test.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCouple } from '../context/CoupleContext';
import { getHomeSummary } from '../services/home_api';
import CoupleProfileCard from '../components/CoupleProfileCard';
import CategoryBadge from '../components/CategoryBadge';
import type { Event, Photo, AlbumOrderDeadline, HomeSummary } from '../types';

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

interface BottomNavProps {
  active: string;
}

/**
 * BottomNav
 */
function BottomNav({ active }: BottomNavProps) {
  const navigate = useNavigate();
  const items: { id: string; label: string; icon: React.ReactNode; to: string }[] = [
    { id: 'home', label: '홈', icon: <IconHome />, to: '/' },
    { id: 'calendar', label: '캘린더', icon: <IconCal />, to: '/calendar' },
    { id: 'timeline', label: '타임라인', icon: <IconTime />, to: '/timeline' },
    { id: 'album', label: '앨범', icon: <IconBook />, to: '/orders' },
    { id: 'settings', label: '설정', icon: <IconGear />, to: '/' },
  ];
  return (
    <nav className="wl-bottomnav">
      {items.map((i) => (
        <div
          key={i.id}
          className={`wl-nav-item ${active === i.id ? 'is-active' : ''}`}
          onClick={() => navigate(i.to)}
        >
          <div className="wl-nav-icon">{i.icon}</div>
          <div className="wl-nav-label">{i.label}</div>
        </div>
      ))}
    </nav>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [homeData, setHomeData] = useState<HomeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      {/* Status bar */}
      <div className="wl-statusbar">
        <span>9:41</span>
        <div className="wl-statusbar-right">
          <span className="wl-sb-dot" />
          <span className="wl-sb-dot" />
          <span className="wl-sb-dot" />
        </div>
      </div>

      {/* Top bar */}
      <div className="wl-topbar">
        <div className="wl-logo">
          <span className="wl-logo-mark">W<span className="wl-heart">♥</span></span>
          <span className="wl-logo-text">weddinglog</span>
        </div>
        <div className="wl-topbar-icons">
          <IconBell />
        </div>
      </div>

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
          <CoupleProfileCard couple={couple} album_order_deadline={albumDeadline} />
        ) : !loading && !error ? (
          /* couple 없으면 더미 히어로 표시 */
          <div className="wl-hero">
            <div className="wl-hero-bg" />
            <div className="wl-hero-inner">
              <div className="wl-couple-name">성우 <span className="wl-hrt-inline">♥</span> 은비</div>
              <div className="wl-dday"><span className="wl-dday-label">결혼까지</span><span className="wl-dday-num">D-?</span></div>
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

      {/* Bottom nav */}
      <BottomNav active="home" />
    </div>
  );
}

/* ---- icons ---- */
function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M10 3c-2.8 0-5 2.2-5 5v3L4 13h12l-1-2V8c0-2.8-2.2-5-5-5zM8 15a2 2 0 104 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <path d="M3 10.5L11 4l8 6.5V18a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 013 18v-7.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 19.5v-5h4v5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function IconCal() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <rect x="3.5" y="5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 9h15M7.5 3.5v3M14.5 3.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconTime() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <path d="M4 6h14M4 11h14M4 16h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="6" cy="6" r="1.3" fill="currentColor" />
      <circle cx="6" cy="11" r="1.3" fill="currentColor" />
      <circle cx="6" cy="16" r="1.3" fill="currentColor" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <path d="M4 4.5h6a2 2 0 012 2v12a1.5 1.5 0 00-1.5-1.5H4v-12.5zM18 4.5h-6a2 2 0 00-2 2v12a1.5 1.5 0 011.5-1.5H18v-12.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="2.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 2.5v2M11 17.5v2M2.5 11h2M17.5 11h2M5 5l1.5 1.5M15.5 15.5L17 17M5 17l1.5-1.5M15.5 6.5L17 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
