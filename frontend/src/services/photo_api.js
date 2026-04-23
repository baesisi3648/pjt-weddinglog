// @TASK P3-S1-T2 - Photo API 서비스
// @SPEC specs/screens/03_event_detail.yaml#photo_upload_zone

import api from './api';

/**
 * 이벤트 사진 목록 조회
 * GET /api/events/{event_id}/photos
 */
export async function listPhotos(eventId) {
  const res = await api.get(`/events/${eventId}/photos`);
  return res.data;
}

/**
 * 사진 업로드
 * POST /api/events/{event_id}/photos  (multipart/form-data)
 * @param {string} eventId
 * @param {File} file
 * @param {Function} onProgress - (percent: number) => void
 */
export async function uploadPhoto(eventId, file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post(`/events/${eventId}/photos`, formData, {
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
export async function deletePhoto(photoId) {
  const res = await api.delete(`/photos/${photoId}`);
  return res.data;
}

/**
 * 캡션 수정
 * PUT /api/photos/{photo_id}/caption
 */
export async function updateCaption(photoId, caption) {
  const res = await api.put(`/photos/${photoId}/caption`, { caption });
  return res.data;
}

/**
 * 선택 상태 토글
 * PATCH /api/photos/{photo_id}/selection
 */
export async function toggleSelection(photoId) {
  const res = await api.patch(`/photos/${photoId}/selection`);
  return res.data;
}
