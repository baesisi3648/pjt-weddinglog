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
 *
 * 타임아웃: 60초 (OpenAI 호출 포함, 글로벌 10초 오버라이드).
 * 키 없으면 즉시 폴백이라 보통 100ms 미만이지만,
 * OpenAI 사용 시 30~40초까지 걸릴 수 있어 여유 60초.
 */
export async function composeAlbum(
  coupleId: string,
  selectedPhotoIds: string[]
): Promise<ComposeAlbumResponse> {
  const res = await api.post<ComposeAlbumResponse>(
    `/couples/${coupleId}/album/compose`,
    { selected_photo_ids: selectedPhotoIds },
    { timeout: 60000 },
  );
  return res.data;
}
