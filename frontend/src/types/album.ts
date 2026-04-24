// @TASK P5-FRONTEND - AlbumLayout 타입 정의 (백엔드 계약 동일)
// @SPEC docs/planning/06-tasks.md#Phase5

export type LayoutTemplate = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export const LAYOUT_INFO: Record<LayoutTemplate, { name: string; photoCount: number; description: string }> = {
  T1: { name: 'Full Bleed', photoCount: 1, description: '한 장 꽉 차게' },
  T2: { name: 'Half Split', photoCount: 2, description: '좌우 반반' },
  T3: { name: 'Hero + Two', photoCount: 3, description: '큰 1장 + 작은 2장' },
  T4: { name: 'Grid 2×2', photoCount: 4, description: '4장 그리드' },
  T5: { name: 'Cover', photoCount: 1, description: '챕터 표지' },
};

export interface AlbumPage {
  page_number: number;
  template: LayoutTemplate;
  photo_ids: string[];
  caption: string | null;
}

export interface AlbumChapter {
  chapter_number: number;
  title: string;
  color: 'coral' | 'lavender' | 'mint' | 'gold' | 'gray';
  pages: AlbumPage[];
}

export interface AlbumLayout {
  total_photos: number;
  total_pages: number;
  chapters: AlbumChapter[];
  generated_by: 'ai' | 'template';
}
