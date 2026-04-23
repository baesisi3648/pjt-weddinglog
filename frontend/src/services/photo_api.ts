// @TASK P3-S1-T2 - Photo API 서비스
// @SPEC specs/screens/03_event_detail.yaml#photo_upload_zone

import api from './api';
import type { Photo } from '../types';

/**
 * 이벤트 사진 목록 조회
 * GET /api/events/{event_id}/photos
 */
export async function listPhotos(eventId: string): Promise<Photo[]> {
  const res = await api.get<Photo[]>(`/events/${eventId}/photos`);
  return res.data;
}

/**
 * 사진 업로드
 * POST /api/events/{event_id}/photos  (multipart/form-data)
 */
export async function uploadPhoto(
  eventId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<Photo> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post<Photo>(`/events/${eventId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return res.data;
}

/**
 * 사진 삭제
 * DELETE /api/photos/{photo_id}
 */
export async function deletePhoto(photoId: string): Promise<unknown> {
  const res = await api.delete(`/photos/${photoId}`);
  return res.data;
}

/**
 * 캡션 수정
 * PUT /api/photos/{photo_id}/caption
 */
export async function updateCaption(photoId: string, caption: string): Promise<Photo> {
  const res = await api.put<Photo>(`/photos/${photoId}/caption`, { caption });
  return res.data;
}

/**
 * 선택 상태 토글
 * PATCH /api/photos/{photo_id}/selection
 */
export async function toggleSelection(photoId: string): Promise<Photo> {
  const res = await api.patch<Photo>(`/photos/${photoId}/selection`);
  return res.data;
}
