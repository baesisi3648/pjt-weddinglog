// @TASK P4-S1-T1~T3 - Timeline 페이지 실 API 연동
// @SPEC specs/screens/04_timeline.yaml
// @TEST src/pages/Timeline.test.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getTimeline } from '../services/timeline_api';
import TimelineChapter from '../components/TimelineChapter';

const COUPLE_ID = 'cpl_sample_001';

// 예상 페이지 수 계산 (선택 사진 수 기준 ceil(n / 2.5))
function calcPages(selectedCount) {
  if (!selectedCount) return 0;
  return Math.ceil(selectedCount / 2.5);
}

export default function Timeline() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 선택 사진 수 로컬 추적 (optimistic UI 반영)
  const [selectedCount, setSelectedCount] = useState(0);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTimeline(COUPLE_ID);
      setData(result);
      setSelectedCount(result.total_selected ?? 0);
    } catch (err) {
      setError(err.message ?? '타임라인을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // 체크박스 토글 후 선택 수 갱신
  function handleSelectionChange(photoId, newIsSelected) {
    setSelectedCount((prev) => newIsSelected ? prev + 1 : Math.max(0, prev - 1));
  }

  const totalPhotos = data?.total_photos ?? 0;
  const pagesEstimated = calcPages(selectedCount);
  const chapters = data?.chapters ?? [];
  const isAlbumEnabled = selectedCount >= 1;

  return (
    <div className="wl-page wl-page-timeline">
      {/* Top bar */}
      <div className="wl-page-topbar">
        <div className="wl-page-brand">
          <div className="wl-logo-mark">W<span className="wl-heart">♥</span></div>
          <span className="wl-logo-text">weddinglog</span>
        </div>
        <nav className="wl-page-nav">
          <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>홈</span>
          <span onClick={() => navigate('/calendar')} style={{ cursor: 'pointer' }}>캘린더</span>
          <span className="is-active">타임라인</span>
          <span onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>앨범</span>
        </nav>
        <div className="wl-page-actions">
          <div className="wl-page-avatar-pair">
            <span className="wl-tiny-avatar" style={{ background: 'linear-gradient(135deg,#EBB99B,#F5D4BC)' }}>성</span>
            <span className="wl-tiny-avatar" style={{ background: 'linear-gradient(135deg,#B7ABD4,#D9D2E8)' }}>은</span>
          </div>
        </div>
      </div>

      <div className="wl-timeline-wrap">
        {/* Book preview header */}
        <header className="wl-tl-hero">
          <div className="wl-tl-hero-left">
            <div className="wl-tl-eyebrow">OUR BOOK · PREVIEW</div>
            <h1 className="wl-tl-title serif">
              지금까지의 <em>우리 이야기</em>
            </h1>
            <p className="wl-tl-sub">
              시간 순이 아닌 기억의 결을 따라 묶었어요. 이대로 앨범을 주문하면<br />
              아래 구성대로 한 권의 책이 됩니다.
            </p>

            {/* 실시간 통계 — 총 사진 수 + 예상 페이지 */}
            <div className="wl-tl-stats">
              <div className="wl-stat">
                <div className="wl-stat-num serif">
                  {loading ? '—' : `${totalPhotos}장`}
                </div>
                <div className="wl-stat-label">총 사진</div>
              </div>
              <div className="wl-stat-sep" />
              <div className="wl-stat">
                <div className="wl-stat-num serif">
                  {loading ? '—' : String(chapters.length).padStart(2, '0')}
                </div>
                <div className="wl-stat-label">챕터</div>
              </div>
              <div className="wl-stat-sep" />
              <div className="wl-stat">
                <div className="wl-stat-num serif">
                  {loading ? '—' : `${pagesEstimated}p`}
                </div>
                <div className="wl-stat-label">예상 페이지</div>
              </div>
            </div>

            {/* 인라인 요약 문구 */}
            {!loading && !error && (
              <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '8px' }}>
                {`총 ${totalPhotos}장 · ${pagesEstimated}페이지 예상`}
              </div>
            )}
          </div>

          <div className="wl-tl-hero-book">
            <div className="wl-book-big">
              <div className="wl-book-big-spine" />
              <div className="wl-book-big-cover">
                <div className="wl-book-big-eyebrow">A WEDDING LOG</div>
                <div className="wl-book-big-title serif">
                  성우<br /><span className="wl-book-big-amp">&amp;</span><br />은비
                </div>
                <div className="wl-book-big-line" />
                <div className="wl-book-big-date serif">MMXXV</div>
              </div>
              <div className="wl-book-big-pages" />
            </div>
          </div>
        </header>

        {/* 로딩 상태 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF', fontSize: '15px' }}>
            불러오는 중…
          </div>
        )}

        {/* 에러 상태 */}
        {!loading && error && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: '#EF4444',
              background: '#FEF2F2',
              borderRadius: '12px',
              margin: '24px 0',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>
              타임라인을 불러오지 못했습니다.
            </div>
            <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>{error}</div>
            <button
              className="wl-btn wl-btn-ghost"
              onClick={fetchTimeline}
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && !error && chapters.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              color: '#6B7280',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📷</div>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
              아직 사진이 없습니다.
            </div>
            <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '24px' }}>
              일정을 만들고 사진을 추가해보세요.
            </div>
            <Link
              to="/calendar"
              className="wl-btn wl-btn-primary"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              캘린더로 이동
            </Link>
          </div>
        )}

        {/* 챕터 스트립 네비게이션 */}
        {!loading && !error && chapters.length > 0 && (
          <nav className="wl-chapter-nav">
            {chapters.map((c) => (
              <button
                key={c.id}
                className="wl-chapter-tab"
                onClick={() => {
                  const el = document.getElementById(`chapter-${c.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <span className="wl-chapter-tab-num serif">{String(c.chapter_number ?? c.id).padStart(2, '0')}</span>
                <span className="wl-chapter-tab-title">{c.title}</span>
                <span className="wl-chapter-tab-count">{c.photo_count ?? c.photos?.length ?? 0}</span>
              </button>
            ))}
          </nav>
        )}

        {/* 타임라인 본문 */}
        {!loading && !error && chapters.length > 0 && (
          <div className="wl-tl-body">
            <div className="wl-tl-rail" />

            {chapters.map((chapter) => (
              <div key={chapter.id} id={`chapter-${chapter.id}`}>
                <TimelineChapter
                  chapter={chapter}
                  onSelectionChange={handleSelectionChange}
                />
              </div>
            ))}

            <div className="wl-tl-end">
              <span className="wl-tl-end-dot" />
              <span className="wl-tl-end-label serif">To be continued…</span>
            </div>
          </div>
        )}

        {/* 앨범 주문 CTA 섹션 */}
        <section className="wl-order-cta">
          <div className="wl-order-left">
            <div className="wl-order-eyebrow">ORDER</div>
            <h2 className="wl-order-title serif">이 기록을 한 권의 책으로</h2>
            <p className="wl-order-desc">
              하드커버 · {pagesEstimated || '—'}페이지 · 아트지 · 무광 라미네이팅. 인쇄 전 미리보기를 열어
              순서와 캡션을 한번 더 확인할 수 있어요.
            </p>
            <div className="wl-order-specs">
              <div className="wl-order-spec">
                <span className="wl-spec-k">사이즈</span>
                <span className="wl-spec-v">22 × 28 cm</span>
              </div>
              <div className="wl-order-spec">
                <span className="wl-spec-k">사진</span>
                <span className="wl-spec-v">{selectedCount}장 선택됨</span>
              </div>
              <div className="wl-order-spec">
                <span className="wl-spec-k">페이지</span>
                <span className="wl-spec-v">{pagesEstimated}p 예상</span>
              </div>
              <div className="wl-order-spec">
                <span className="wl-spec-k">배송</span>
                <span className="wl-spec-v">주문 후 7–10일</span>
              </div>
            </div>
          </div>

          <div className="wl-order-right">
            <div className="wl-order-price">
              <div className="wl-order-price-eyebrow">예상 가격</div>
              <div className="wl-order-price-num serif">₩ 89,000</div>
              <div className="wl-order-price-sub">커플 첫 주문 · 20% 할인 적용</div>
            </div>

            {/* 앨범으로 만들기 CTA — selected >= 1 일 때만 활성화 */}
            <button
              className="wl-btn wl-btn-primary wl-btn-lg"
              disabled={!isAlbumEnabled}
              onClick={() => isAlbumEnabled && navigate('/order-checkout')}
              style={{
                background: isAlbumEnabled ? '#D4A017' : '#E5E7EB',
                color: isAlbumEnabled ? '#fff' : '#9CA3AF',
                cursor: isAlbumEnabled ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              앨범으로 만들기
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {!isAlbumEnabled && (
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '6px', textAlign: 'center' }}>
                사진을 1장 이상 선택해주세요
              </div>
            )}

            <button className="wl-btn wl-btn-ghost" style={{ marginTop: '8px' }}>전체 미리보기</button>
          </div>
        </section>
      </div>
    </div>
  );
}
