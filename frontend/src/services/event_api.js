// @TASK P2-S1 - Event API 서비스
// @SPEC docs/planning/06-tasks.md#P2-S1

import api from './api';

/**
 * 단일 일정 조회
 * GET /api/couples/{couple_id}/events/{event_id}
 */
export async function getEvent(coupleId, eventId) {
  const res = await api.get(`/couples/${coupleId}/events/${eventId}`);
  return res.data;
}

/**
 * 월별 일정 목록 조회
 * GET /api/couples/{couple_id}/events?month=YYYY-MM
 */
export async function listEvents(coupleId, month) {
  const res = await api.get(`/couples/${coupleId}/events`, { params: { month } });
  return res.data;
}

/**
 * 일정 생성
 * POST /api/couples/{couple_id}/events
 */
export async function createEvent(coupleId, data) {
  const res = await api.post(`/couples/${coupleId}/events`, data);
  return res.data;
}

/**
 * 일정 수정
 * PUT /api/couples/{couple_id}/events/{event_id}
 */
export async function updateEvent(coupleId, eventId, data) {
  const res = await api.put(`/couples/${coupleId}/events/${eventId}`, data);
  return res.data;
}

/**
 * 일정 삭제
 * DELETE /api/couples/{couple_id}/events/{event_id}
 */
export async function deleteEvent(coupleId, eventId) {
  const res = await api.delete(`/couples/${coupleId}/events/${eventId}`);
  return res.data;
}

/**
 * 일정 완료 토글
 * PATCH /api/couples/{couple_id}/events/{event_id}/complete
 */
export async function toggleCompleteEvent(coupleId, eventId) {
  const res = await api.patch(`/couples/${coupleId}/events/${eventId}/complete`);
  return res.data;
}
