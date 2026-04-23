// @TASK TS-MIGRATION - Photo 타입 정의

export type CaptionSource = 'ai' | 'template' | 'manual' | null;

export interface Photo {
  id: string;
  event_id: string;
  file_url: string;
  caption: string | null;
  caption_source: CaptionSource;
  is_selected: boolean;
  sort_order: number;
  created_at: string;
}
