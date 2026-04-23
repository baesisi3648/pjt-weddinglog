// @TASK TS-MIGRATION - Event 타입 정의

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
  category: Category;
  memo: string | null;
  is_completed: boolean;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventCreate {
  title: string;
  date: string;
  category: Category;
  memo?: string | null;
}

export interface EventUpdate {
  title?: string;
  date?: string;
  category?: Category;
  memo?: string | null;
}
