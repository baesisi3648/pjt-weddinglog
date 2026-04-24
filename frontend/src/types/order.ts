// @TASK P5-FRONTEND - Order 타입 정의
// @SPEC docs/planning/06-tasks.md#Phase5

import type { AlbumLayout } from './album';

export type OrderFormat = 'SQUARE' | 'A4';
export type OrderCoverType = 'HARD' | 'SOFT';
export type OrderStatus = 'pending' | 'processing' | 'completed';

export interface Order {
  id: string;
  couple_id: string;
  format: OrderFormat;
  cover_type: OrderCoverType;
  quantity: number;
  chapters_selected: Record<string, string[]>;
  album_layout: AlbumLayout | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  // computed
  total_price: number;
  total_pages_estimated: number;
  base_price: number;
  cover_surcharge: number;
}
