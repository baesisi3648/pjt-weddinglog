// @TASK STITCH-DESIGN - Orders 페이지 이식 (Stitch orders_desktop/code.html 기반)
// @SPEC docs/planning/06-tasks.md#P1.5-S0-T1
// TODO: Phase 2-4에서 실제 API 연동

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface OrderChapter {
  name: string;
  count: number;
}

interface OrderShipping {
  recipient: string;
  phone: string;
  addr: string;
}

interface OrderTimeline {
  id: string;
  label: string;
  date: string;
  done: boolean;
  active?: boolean;
}

interface Order {
  id: string;
  date: string;
  status: 'processing' | 'delivered' | 'cancelled' | 'pending';
  statusLabel: string;
  eta: string;
  format: string;
  cover: string;
  qty: number;
  total: number;
  chapters?: OrderChapter[];
  shipping?: OrderShipping;
  timeline?: OrderTimeline[];
}

const DUMMY_ORDERS: Order[] = [
  {
    id: 'WL-2023-089A',
    date: '2023. 10. 12',
    status: 'processing',
    statusLabel: '제작 대기',
    eta: '예상 10일 내 배송',
    format: '정사각형 21×21',
    cover: '하드커버 · 린넨',
    qty: 1,
    total: 145000,
    chapters: [
      { name: '웨딩촬영', count: 8 },
      { name: '준비의 날들', count: 12 },
      { name: '본식', count: 15 },
    ],
    shipping: {
      recipient: '김철수',
      phone: '010-1234-****',
      addr: '서울 성동구 성수이로 22, 404호',
    },
    timeline: [
      { id: 'placed', label: '주문 접수', date: '10.12', done: true },
      { id: 'process', label: '제작 대기', date: '10.13', done: true, active: true },
      { id: 'shipping', label: '배송 준비', date: '예정', done: false },
      { id: 'done', label: '배송 완료', date: '예정', done: false },
    ],
  },
  {
    id: 'WL-2023-042C',
    date: '2023. 09. 05',
    status: 'delivered',
    statusLabel: '배송 완료',
    eta: '2023. 09. 14 수령',
    format: 'A4 21×29.7',
    cover: '소프트커버 · 매트',
    qty: 1,
    total: 85000,
  },
];

// 상태별 스타일
const STATUS_STYLES = {
  processing: { dot: '#e89f8e', bg: 'transparent', border: '#85736f', text: '#1f1b12' },
  delivered: { dot: '#85736f', bg: '#ebe1d2', border: '#85736f', text: '#524340' },
  cancelled: { dot: '#ba1a1a', bg: '#ffdad6', border: '#ba1a1a', text: '#93000a' },
  pending: { dot: '#d7c2bd', bg: 'transparent', border: '#d7c2bd', text: '#85736f' },
};

export default function Orders() {
  const [expanded, setExpanded] = useState<string | null>('WL-2023-089A');
  const navigate = useNavigate();
  const orders = DUMMY_ORDERS;

  return (
    <div className="flex flex-col gap-xl">
      {/* ── 헤더 ── */}
      <header className="mb-12 border-b border-outline-variant pb-6">
        <h1
          className="font-display-md text-on-surface mb-2"
          style={{ fontSize: '28px' }}
        >
          주문 관리
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant opacity-80">
          {orders.length}개의 주문
        </p>
      </header>

      {/* ── 주문 목록 ── */}
      <div className="flex flex-col gap-4">
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-outline-variant rounded-lg bg-surface/50">
            <span className="material-symbols-outlined text-4xl text-outline-variant mb-4" style={{ fontVariationSettings: "'FILL' 0" }}>
              inventory_2
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2" style={{ fontSize: '24px' }}>
              아직 주문이 없습니다
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              진행 중인 프로젝트에서 첫 주문을 생성해보세요.
            </p>
            <button
              className="font-body-sm text-body-sm border border-on-surface text-on-surface px-6 py-2.5 rounded hover:bg-surface-dim transition-colors"
              onClick={() => navigate('/timeline')}
            >
              타임라인 보기
            </button>
          </div>
        )}

        {orders.map((o) => {
          const isOpen = expanded === o.id;
          const statusStyle = STATUS_STYLES[o.status] ?? STATUS_STYLES.pending;

          return (
            <article
              key={o.id}
              className="bg-surface border border-[#E3DBC8] rounded-lg flex flex-col gap-4"
              style={{ borderRadius: '8px' }}
            >
              {/* 헤더 행 */}
              <div
                className="p-6 flex flex-col gap-4 cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : o.id)}
              >
                {/* 상단: ID + 날짜 + 상태 */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono-id text-mono-id text-on-surface-variant tracking-wider" style={{ fontSize: '14px' }}>
                      #{o.id}
                    </span>
                    <span className="font-body-sm text-body-sm text-outline">{o.date}</span>
                  </div>
                  <div
                    className="flex items-center gap-2 border rounded-full px-3 py-1"
                    style={{
                      background: statusStyle.bg,
                      borderColor: statusStyle.border,
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: statusStyle.dot }}
                    />
                    <span
                      className="font-label-caps text-label-caps"
                      style={{ color: statusStyle.text }}
                    >
                      {o.statusLabel}
                    </span>
                  </div>
                </div>

                {/* 중간: 스펙 + 가격 */}
                <div className="flex justify-between items-end border-b border-surface-variant pb-4 pt-2">
                  <div className="flex flex-col gap-1 w-2/3">
                    <h3 className="font-body-md text-body-md font-medium">{o.format}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {o.cover} · {o.qty}권 · {o.eta}
                    </p>
                  </div>
                  <div className="w-1/3 text-right">
                    <span
                      className="font-headline-sm text-on-surface"
                      style={{ fontSize: '20px' }}
                    >
                      ₩ {o.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 하단: 액션 */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    className="font-body-sm text-body-sm text-primary flex items-center gap-1 hover:opacity-80 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                    데이터 다운로드
                  </button>
                  <div className="flex items-center gap-3">
                    {o.status === 'processing' && (
                      <button
                        className="font-body-sm text-body-sm border border-primary-container text-on-surface px-4 py-2 rounded hover:bg-primary-container/10 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        제작 시작
                      </button>
                    )}
                    {o.status === 'delivered' && (
                      <button
                        className="font-body-sm text-body-sm border border-outline-variant text-outline px-4 py-2 rounded cursor-not-allowed bg-surface-container-low"
                        disabled
                      >
                        완료됨
                      </button>
                    )}
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
                      aria-label={isOpen ? '접기' : '펼치기'}
                    >
                      <span
                        className="material-symbols-outlined text-on-surface-variant"
                        style={{
                          fontSize: '20px',
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        expand_more
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 상세 펼침 */}
              {isOpen && o.timeline && (
                <div className="px-6 pb-6 border-t border-outline-variant pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* 챕터 구성 */}
                    {o.chapters && (
                      <div>
                        <div className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-3">챕터별 구성</div>
                        <div className="flex flex-col gap-2">
                          {o.chapters.map((c, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span
                                className="font-display-md text-primary-container"
                                style={{ fontSize: '16px', fontFamily: 'Fraunces, serif', minWidth: '28px' }}
                              >
                                {String(i + 1).padStart(2, '0')}.
                              </span>
                              <span className="font-body-sm text-body-sm text-on-surface flex-1">{c.name}</span>
                              <span className="font-mono-id text-mono-id text-outline">{c.count}장</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 배송 정보 */}
                    {o.shipping && (
                      <div>
                        <div className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-3">배송 정보</div>
                        <div className="flex flex-col gap-2">
                          {[
                            { k: '받는 분', v: o.shipping.recipient },
                            { k: '연락처', v: o.shipping.phone },
                            { k: '주소', v: o.shipping.addr },
                          ].map(({ k, v }) => (
                            <div key={k} className="flex gap-3">
                              <span className="font-label-caps text-label-caps text-outline w-16 flex-shrink-0">{k}</span>
                              <span className="font-body-sm text-body-sm text-on-surface">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 진행 상태 타임라인 */}
                  <div>
                    <div className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-4">진행 상태</div>
                    <div className="flex items-center gap-0">
                      {o.timeline.map((t, i) => (
                        <React.Fragment key={t.id}>
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                                t.done && !t.active
                                  ? 'bg-on-surface border-on-surface'
                                  : t.active
                                  ? 'bg-primary-container border-on-surface'
                                  : 'bg-background border-outline-variant'
                              }`}
                            >
                              {t.done && !t.active && (
                                <span className="material-symbols-outlined text-background" style={{ fontSize: '14px' }}>check</span>
                              )}
                              {t.active && (
                                <span className="w-2.5 h-2.5 rounded-full bg-on-surface" />
                              )}
                            </div>
                            <span className="font-label-caps text-[10px] text-on-surface-variant text-center whitespace-nowrap">{t.label}</span>
                            <span className="font-mono-id text-[10px] text-outline">{t.date}</span>
                          </div>
                          {i < o.timeline!.length - 1 && (
                            <div
                              className="h-px flex-1 mx-1"
                              style={{ background: t.done ? '#1f1b12' : '#d7c2bd' }}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
