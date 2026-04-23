// @TASK TS-MIGRATION - Couple 타입 정의

export interface Couple {
  id: string;
  groom_name: string;
  bride_name: string;
  wedding_date: string | null; // ISO date, null if not set
  profile_photo_path: string | null;
  tagline: string | null;
  created_at?: string;
  d_day?: number; // computed_field
}

export interface CoupleUpdate {
  groom_name?: string;
  bride_name?: string;
  wedding_date?: string;
  profile_photo_path?: string | null;
  tagline?: string | null;
}
