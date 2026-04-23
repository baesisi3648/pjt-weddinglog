// @TASK TS-MIGRATION - Home 타입 정의

import type { Couple } from './couple';
import type { Event } from './event';
import type { Photo } from './photo';

export type DeadlineUrgency = 'normal' | 'warning' | 'urgent' | 'expired';

export interface AlbumOrderDeadline {
  recommended_date?: string;
  days_remaining: number;
  urgency: DeadlineUrgency;
}

export interface HomeSummary {
  couple: Couple;
  upcoming_events: Event[];
  recent_photos: Photo[];
  photo_counts: {
    total: number;
    selected: number;
  };
  album_order_deadline: AlbumOrderDeadline;
}
