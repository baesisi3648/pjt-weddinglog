// @TASK P5-FRONTEND - Order API 서비스
// @SPEC docs/planning/06-tasks.md#Phase5

import api from './api';
import type { Order, OrderFormat, OrderCoverType, OrderStatus } from '../types/order';
import type { AlbumLayout } from '../types/album';

export interface CreateOrderBody {
  format: OrderFormat;
  cover_type: OrderCoverType;
  quantity: number;
  chapters_selected: Record<string, string[]>;
  album_layout: AlbumLayout | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
}

/**
 * 주문 생성
 * POST /api/couples/{couple_id}/orders
 */
export async function createOrder(coupleId: string, body: CreateOrderBody): Promise<Order> {
  const res = await api.post<Order>(`/couples/${coupleId}/orders`, body);
  return res.data;
}

/**
 * 주문 목록 조회
 * GET /api/couples/{couple_id}/orders
 */
export async function listOrders(coupleId: string): Promise<Order[]> {
  const res = await api.get<Order[]>(`/couples/${coupleId}/orders`);
  return res.data;
}

/**
 * 주문 상세 조회
 * GET /api/orders/{order_id}
 */
export async function getOrder(orderId: string): Promise<Order> {
  const res = await api.get<Order>(`/orders/${orderId}`);
  return res.data;
}

/**
 * 주문 상태 변경
 * PATCH /api/orders/{order_id}/status
 */
export async function updateOrderStatus(
  orderId: string,
  targetStatus: OrderStatus
): Promise<Order> {
  const res = await api.patch<Order>(`/orders/${orderId}/status`, {
    target_status: targetStatus,
  });
  return res.data;
}
