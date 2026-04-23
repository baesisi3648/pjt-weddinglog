// @TASK TS-MIGRATION - Timeline 타입 정의

export type TimelinePhotoSource = 'AI' | 'template' | null;

export interface TimelinePhoto {
  id: string;
  file_url: string;
  caption: string | null;
  is_selected: boolean;
  source?: TimelinePhotoSource;
}

export interface Chapter {
  id: string | number;
  chapter_number?: number;
  title: string;
  subtitle?: string;
  category?: string;
  date_range?: string;
  photo_count?: number;
  photos?: TimelinePhoto[];
}

export interface TimelineResponse {
  total_photos: number;
  total_selected: number;
  total_pages_estimated: number;
  chapters: Chapter[];
}
