// @TASK TS-MIGRATION - Event 타입 정의
// Multi-day 지원: end_date 필드 + is_multi_day/duration_days computed.

export type Category =
  | 'WEDDING_PHOTO'
  | 'STUDIO_DRESS_MAKEUP'
  | 'VENUE'
  | 'GIFT'
  | 'INVITATION'
  | 'REHEARSAL'
  | 'CEREMONY'
  | 'HONEYMOON'
  | 'ETC';

export interface Event {
  id: string;
  couple_id: string;
  title: string;
  date: string;
  end_date: string | null;
  category: Category;
  memo: string | null;
  is_completed: boolean;
  is_ai_generated: boolean;
  is_multi_day: boolean;
  duration_days: number;
  created_at: string;
  updated_at: string;
}

export interface EventCreate {
  title: string;
  date: string;
  end_date?: string | null;
  category: Category;
  memo?: string | null;
}

export interface EventUpdate {
  title?: string;
  date?: string;
  end_date?: string | null;
  category?: Category;
  memo?: string | null;
}
