// @TASK P1.5-S0-T1 - EventDetail 핸드오프 JSX 포팅
// @SPEC docs/planning/06-tasks.md#P1.5-S0-T1
// TODO: Phase 2-4에서 실제 API 연동 (useParams로 eventId 받기)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DUMMY_PHOTOS = [
  { id: 1, tone: "peach",    caption: "오전 햇살 아래, 첫 컷" },
  { id: 2, tone: "cream",    caption: "" },
  { id: 3, tone: "lavender", caption: "부케와 함께" },
  { id: 4, tone: "mint",     caption: "리허설 사이 잠깐의 쉼" },
  { id: 5, tone: "peach",    caption: "" },
  { id: 6, tone: "sky",      caption: "야외 세션 마무리" },
];

const AI_SUGGESTIONS = [
  "여름 햇살 아래, 처음으로 웨딩드레스를 입은 날",
  "서로를 바라보는 그 눈빛, 오래 기억하고 싶어요",
  "리허설이지만 이미 마음은 본식이었던 하루",
];

// TODO: Phase 2-4에서 실제 API 연동
export default function EventDetail() {
  const [done, setDone] = useState(false);
  const [memo, setMemo] = useState(
    "야외촬영은 오전에, 실내는 오후에.\n부케 2개 준비 완료! 🌿\n드레스는 A-line 2종, 머메이드 1종 체크."
  );
  const [showAISuggest, setShowAISuggest] = useState(false);
  const [activePhoto, setActivePhoto] = useState(2);
  const navigate = useNavigate();

  const photos = DUMMY_PHOTOS;
  const aiSuggestions = AI_SUGGESTIONS;

  return (
    <div className="wl-page">
      {/* Top bar */}
      <div className="wl-page-topbar">
        <button className="wl-icon-btn wl-back-btn" onClick={() => navigate('/calendar')}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>캘린더</span>
        </button>
        <div className="wl-page-crumbs">
          <span>2025. 08</span>
          <span className="wl-crumb-sep">·</span>
          <span>Fri, Aug 15</span>
        </div>
        <div className="wl-page-actions">
          <button className="wl-btn wl-btn-ghost">공유</button>
          <button className="wl-btn wl-btn-primary wl-btn-sm">저장</button>
        </div>
      </div>

      <div className="wl-page-body">
        {/* LEFT — Event info */}
        <aside className="wl-detail-left">
          <div className="wl-detail-card">
            <div className="wl-detail-head">
              <span className="wl-cat-pill wl-cat-photo">웨딩촬영</span>
              <button
                className={`wl-toggle-done ${done ? "is-on" : ""}`}
                onClick={() => setDone(!done)}
              >
                <span className={`wl-check wl-check-lg ${done ? "is-checked" : ""}`}>
                  {done && (
                    <svg viewBox="0 0 14 14" width="11" height="11">
                      <path d="M2 7.5L5.5 11L12 3.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span>{done ? "완료됨" : "완료 표시"}</span>
              </button>
            </div>

            <h1 className="wl-detail-title serif">스튜디오 본촬영</h1>

            <div className="wl-detail-meta">
              <div className="wl-meta-row">
                <div className="wl-meta-label">날짜</div>
                <div className="wl-meta-value">
                  <span className="wl-meta-strong">2025. 08. 15</span>
                  <span className="wl-meta-dim">Fri · 09:00 – 18:00</span>
                </div>
              </div>
              <div className="wl-meta-row">
                <div className="wl-meta-label">장소</div>
                <div className="wl-meta-value">
                  <span>라포레 스튜디오 · 성수</span>
                </div>
              </div>
              <div className="wl-meta-row">
                <div className="wl-meta-label">참여</div>
                <div className="wl-meta-value wl-meta-people">
                  <span className="wl-tiny-avatar" style={{background: "linear-gradient(135deg,#EBB99B,#F5D4BC)"}}>성</span>
                  <span className="wl-tiny-avatar" style={{background: "linear-gradient(135deg,#B7ABD4,#D9D2E8)"}}>은</span>
                  <span className="wl-meta-dim">우리 둘</span>
                </div>
              </div>
            </div>

            <div className="wl-detail-memo">
              <label className="wl-field-label">메모</label>
              <textarea
                className="wl-textarea"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={5}
              />
              <div className="wl-textarea-meta">
                <span>{memo.length} / 500</span>
              </div>
            </div>

            <div className="wl-detail-tags">
              <label className="wl-field-label">태그</label>
              <div className="wl-tag-list">
                <span className="wl-tag">#본촬영</span>
                <span className="wl-tag">#스튜디오</span>
                <span className="wl-tag">#드레스투어</span>
                <button className="wl-tag wl-tag-add">＋ 추가</button>
              </div>
            </div>
          </div>

          <div className="wl-detail-side-card">
            <div className="wl-side-card-eyebrow">관련 일정</div>
            <div className="wl-side-link">
              <span className="wl-cat-dot" style={{ background: "var(--wl-cat-photo)" }} />
              <div>
                <div className="wl-side-title">리허설 촬영 미팅</div>
                <div className="wl-side-meta">7월 28일</div>
              </div>
            </div>
            <div className="wl-side-link">
              <span className="wl-cat-dot" style={{ background: "var(--wl-cat-sdm)" }} />
              <div>
                <div className="wl-side-title">드레스 2차 피팅</div>
                <div className="wl-side-meta">8월 3일</div>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT — photo uploader */}
        <main className="wl-detail-right">
          <div className="wl-section-head wl-section-head-plain">
            <div>
              <div className="wl-section-eyebrow">Photos</div>
              <h2 className="wl-section-title">사진 기록</h2>
            </div>
            <div className="wl-photos-summary">
              <span className="wl-photos-count">6장</span>
              <span className="wl-dot-sep">·</span>
              <span>최근 추가 2분 전</span>
            </div>
          </div>

          {/* Upload zone */}
          <div className="wl-upload">
            <div className="wl-upload-icon">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <rect x="3" y="5" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="9" cy="11" r="1.6" stroke="currentColor" strokeWidth="1.4" />
                <path d="M3 18l6-5 4 3 4-4 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <div className="wl-upload-text">
              <div className="wl-upload-title serif">여기로 사진을 끌어 놓으세요</div>
              <div className="wl-upload-sub">JPG, PNG, HEIC · 한 번에 최대 20장</div>
            </div>
            <button className="wl-btn wl-btn-primary">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              사진 추가
            </button>
          </div>

          {/* Photo grid */}
          <div className="wl-photo-grid">
            {photos.map((p) => (
              <div
                key={p.id}
                className={`wl-photo-item ${activePhoto === p.id ? "is-active" : ""}`}
                onClick={() => setActivePhoto(p.id)}
              >
                <div className={`wl-photo-thumb wl-tone-${p.tone}`}>
                  <div className="wl-log-img-stripes" />
                  {activePhoto === p.id && (
                    <span className="wl-photo-active-badge">선택됨</span>
                  )}
                  <div className="wl-photo-actions">
                    <button className="wl-photo-action" title="대표 사진">
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M7 2l1.5 3.5L12 6l-2.5 2L10 11.5 7 10l-3 1.5L4.5 8 2 6l3.5-.5L7 2z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button className="wl-photo-action" title="삭제">
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M3 4.5h8M5.5 4.5V3h3v1.5M4 4.5l.5 7h5l.5-7" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
                {p.id === activePhoto ? (
                  <div className="wl-photo-caption-area">
                    <input
                      className="wl-caption-input"
                      placeholder="이 순간에 한마디…"
                      defaultValue={p.caption}
                    />
                    <div className="wl-caption-ai">
                      <button
                        className={`wl-ai-btn ${showAISuggest ? "is-on" : ""}`}
                        onClick={() => setShowAISuggest((v) => !v)}
                      >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <path d="M7 2l1 2.5L10.5 5.5 8 6.5 7 9 6 6.5 3.5 5.5 6 4.5 7 2z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
                          <path d="M11 9l.5 1.2L12.8 10.7l-1.3.5L11 12.5l-.5-1.3-1.3-.5 1.3-.5L11 9z" stroke="currentColor" strokeWidth="1" fill="none" strokeLinejoin="round" />
                        </svg>
                        AI 캡션 추천
                      </button>
                      {showAISuggest && (
                        <div className="wl-ai-dropdown">
                          <div className="wl-ai-dropdown-head">
                            <span>이 사진에 어울리는 문장</span>
                            <button className="wl-ai-refresh" title="새로 추천">
                              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                <path d="M11.5 4A5 5 0 103 8" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                                <path d="M11.5 2v2.5h-2.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>
                          {aiSuggestions.map((s, i) => (
                            <button key={i} className="wl-ai-option">
                              <span className="wl-ai-num serif">{String(i + 1).padStart(2, "0")}</span>
                              <span className="wl-ai-text">{s}</span>
                            </button>
                          ))}
                          <div className="wl-ai-footer">
                            <span>✧ Claude Haiku · 감성 톤</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="wl-photo-caption-plain">
                    {p.caption || <span className="wl-caption-ph">캡션 없음</span>}
                  </div>
                )}
              </div>
            ))}

            <button className="wl-photo-add">
              <div className="wl-photo-add-inner">
                <span className="wl-photo-add-icon">＋</span>
                <span>사진 추가</span>
              </div>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
