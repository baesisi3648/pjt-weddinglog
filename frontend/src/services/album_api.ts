// @TASK P5-FRONTEND - Album API 서비스
// @SPEC docs/planning/06-tasks.md#Phase5

import api from './api';
import type { AlbumLayout } from '../types/album';

export interface ComposeAlbumResponse {
  album_layout: AlbumLayout;
  source: 'ai' | 'template';
}

/**
 * AI 앨범 구성 요청
 * POST /api/couples/{couple_id}/album/compose
 */
export async function composeAlbum(
  coupleId: string,
  selectedPhotoIds: string[]
): Promise<ComposeAlbumResponse> {
  const res = await api.post<ComposeAlbumResponse>(
    `/couples/${coupleId}/album/compose`,
    { selected_photo_ids: selectedPhotoIds }
  );
  return res.data;
}
