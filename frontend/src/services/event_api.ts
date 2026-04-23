// @TASK P2-S1 - Event API 서비스
// @SPEC docs/planning/06-tasks.md#P2-S1

import api from './api';
import type { Event, EventCreate, EventUpdate } from '../types';

/**
 * 단일 일정 조회
 * GET /api/couples/{couple_id}/events/{event_id}
 */
export async function getEvent(coupleId: string, eventId: string): Promise<Event> {
  const res = await api.get<Event>(`/couples/${coupleId}/events/${eventId}`);
  return res.data;
}

/**
 * 월별 일정 목록 조회
 * GET /api/couples/{couple_id}/events?month=YYYY-MM
 */
export async function listEvents(coupleId: string, month?: string): Promise<Event[]> {
  const res = await api.get<Event[]>(`/couples/${coupleId}/events`, { params: { month } });
  return res.data;
}

/**
 * 일정 생성
 * POST /api/couples/{couple_id}/events
 */
export async function createEvent(coupleId: string, data: EventCreate): Promise<Event> {
  const res = await api.post<Event>(`/couples/${coupleId}/events`, data);
  return res.data;
}

/**
 * 일정 수정
 * PUT /api/couples/{couple_id}/events/{event_id}
 */
export async function updateEvent(coupleId: string, eventId: string, data: EventUpdate): Promise<Event> {
  const res = await api.put<Event>(`/couples/${coupleId}/events/${eventId}`, data);
  return res.data;
}

/**
 * 일정 삭제
 * DELETE /api/couples/{couple_id}/events/{event_id}
 */
export async function deleteEvent(coupleId: string, eventId: string): Promise<unknown> {
  const res = await api.delete(`/couples/${coupleId}/events/${eventId}`);
  return res.data;
}

/**
 * 일정 완료 토글
 * PATCH /api/couples/{couple_id}/events/{event_id}/complete
 */
export async function toggleCompleteEvent(coupleId: string, eventId: string): Promise<Event> {
  const res = await api.patch<Event>(`/couples/${coupleId}/events/${eventId}/complete`);
  return res.data;
}
