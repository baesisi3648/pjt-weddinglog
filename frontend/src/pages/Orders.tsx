// @TASK P5-FRONTEND, P6-LV3 - Orders 페이지 실 API 연동 + 상태 전이 + ZIP 다운로드
// @SPEC docs/planning/06-tasks.md#Phase5
// @SPEC docs/planning/05-architecture.md#sequence-4-데이터-익스포트-lv3

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listOrders, updateOrderStatus, getExportUrl } from '../services/order_api';
import Toast from '../components/Toast';
import type { Order, OrderStatus } from '../types/order';

const COUPLE_ID = 'cpl_sample_001';

type FilterTab = 'all' | OrderStatus;

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'pending', label: '대기 중' },
  { id: 'processing', label: '제작 중' },
  { id: 'completed', label: '완료' },
];

const STATUS_STYLES: Record<OrderStatus, { dot: string; bg: string; border: string; text: string; label: string }> = {
  pending:    { dot: '#d7c2bd', bg: 'transparent', border: '#d7c2bd',  text: '#85736f', label: '대기 중' },
  processing: { dot: '#e89f8e', bg: 'transparent', border: '#85736f',  text: '#1f1b12', label: '제작 중' },
  completed:  { dot: '#85736f', bg: '#ebe1d2',     border: '#85736f',  text: '#524340', label: '완료' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
}

function formatSpec(order: Order): string {
  const fmtMap = { SQUARE: '정사각형', A4: 'A4 비율' };
  const coverMap = { HARD: '하드커버', SOFT: '소프트커버' };
  return `${fmtMap[order.format]} · ${coverMap[order.cover_type]} · ${order.quantity}권`;
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [patchingId, setPatchingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listOrders(COUPLE_ID);
      setOrders(data);
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message ?? '주문 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleStatusTransition(orderId: string, targetStatus: OrderStatus) {
    setPatchingId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, targetStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      const e = err as { response?: { status?: number }; message?: string };
      const code = e.response?.status;
      const msg = code === 409
        ? '이미 해당 상태로 전환되었습니다.'
        : code === 400
        ? '잘못된 상태 전환 요청입니다.'
        : (e.message ?? '상태 변경에 실패했습니다.');
      setToast({ message: msg, type: 'error' });
    } finally {
      setPatchingId(null);
    }
  }

  const filtered = activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab);

  return (
    <div className="flex flex-col gap-xl">
      {/* 헤더 */}
      <header className="mb-4 border-b border-outline-variant pb-6">
        <h1
          className="font-display-md text-on-surface mb-2"
          style={{ fontSize: '28px' }}
        >
          주문 관리
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant opacity-80">
          {loading ? '—' : `${orders.length}개의 주문`}
        </p>
      </header>

      {/* 필터 탭 */}
      <div className="flex gap-2 border-b border-outline-variant pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-container text-on-surface border border-primary'
                : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {/* 에러 */}
      {!loading && error && (
        <div className="text-center py-12 bg-error-container text-on-error-container rounded-lg p-md">
          <p className="font-body-md font-medium mb-4">{error}</p>
          <button
            className="px-5 py-2.5 border border-on-error-container rounded font-body-sm text-body-sm"
            onClick={fetchOrders}
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && !error && filtered.length === 0 && (
        <div className="py-24 border-t border-line">
          <h2 className="font-display-md text-[28px] text-ink mb-3">
            {activeTab === 'all' ? '아직 주문이 없어요.' : `${TABS.find((t) => t.id === activeTab)?.label} 주문이 없어요.`}
          </h2>
          {activeTab === 'all' && (
            <>
              <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                진행 중인 프로젝트에서 첫 주문을 생성해보세요.
              </p>
              <button
                className="font-body-sm text-body-sm border border-on-surface text-on-surface px-6 py-2.5 rounded hover:bg-surface-dim transition-colors"
                onClick={() => navigate('/timeline')}
              >
                타임라인 보기
              </button>
            </>
          )}
        </div>
      )}

      {/* 주문 목록 */}
      {!loading && !error && filtered.length > 0 && (
        <div className="flex flex-col gap-4">
          {filtered.map((order) => {
            const statusStyle = STATUS_STYLES[order.status];
            const isPatching = patchingId === order.id;

            return (
              <article
                key={order.id}
                className="bg-surface border border-[#E3DBC8] rounded-lg flex flex-col"
              >
                <div className="p-6 flex flex-col gap-4">
                  {/* ID + 날짜 + 상태 */}
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span
                        className="text-on-surface-variant tracking-wider"
                        style={{ fontFamily: 'monospace', fontSize: '14px' }}
                      >
                        #{order.id}
                      </span>
                      <span className="font-body-sm text-body-sm text-outline">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 border rounded-full px-3 py-1"
                      style={{ background: statusStyle.bg, borderColor: statusStyle.border }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.dot }} />
                      <span
                        className="font-label-caps text-label-caps"
                        style={{ color: statusStyle.text }}
                      >
                        {statusStyle.label}
                      </span>
                    </div>
                  </div>

                  {/* 스펙 + 가격 */}
                  <div className="flex justify-between items-end border-b border-surface-variant pb-4">
                    <div className="flex flex-col gap-1">
                      <p className="font-body-md text-body-md font-medium">{formatSpec(order)}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {order.total_pages_estimated}페이지 예상
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-on-surface"
                        style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 400 }}
                      >
                        {order.total_price.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* 액션 */}
                  <div className="flex justify-between items-center pt-2">
                    {/* 데이터 다운로드 (Lv3 — 파트너 인계용 ZIP) */}
                    <a
                      href={getExportUrl(order.id)}
                      download={`${order.id}.zip`}
                      className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 hover:text-on-surface hover:underline transition-colors"
                      title="주문 콘텐츠·메타데이터 ZIP 다운로드 (파트너 인계용)"
                      data-testid={`download-${order.id}`}
                    >
                      <span aria-hidden="true">↓</span>
                      <span>데이터 다운로드</span>
                    </a>

                    {/* 상태 전이 버튼 */}
                    <div className="flex items-center gap-3">
                      {order.status === 'pending' && (
                        <button
                          className="font-body-sm text-body-sm border border-primary-container text-on-surface px-4 py-2 rounded hover:bg-primary-container/10 transition-colors disabled:opacity-50"
                          disabled={isPatching}
                          onClick={() => handleStatusTransition(order.id, 'processing')}
                        >
                          {isPatching ? '처리 중...' : '제작 시작'}
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button
                          className="font-body-sm text-body-sm border border-primary text-primary px-4 py-2 rounded hover:bg-primary-container/10 transition-colors disabled:opacity-50"
                          disabled={isPatching}
                          onClick={() => handleStatusTransition(order.id, 'completed')}
                        >
                          {isPatching ? '처리 중...' : '완료로 변경'}
                        </button>
                      )}
                      {order.status === 'completed' && (
                        <button
                          className="font-body-sm text-body-sm border border-outline-variant text-outline px-4 py-2 rounded cursor-not-allowed bg-surface-container-low"
                          disabled
                        >
                          완료
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
