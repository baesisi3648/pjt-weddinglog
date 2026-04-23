// @TASK P2-S1-T5 - AI 체크리스트 API 서비스
// @SPEC docs/planning/06-tasks.md#P2-S1-T5

import api from './api';
import type { CaptionResponse, ChecklistResponse } from '../types';

/**
 * AI 캡션 생성 요청
 * POST /api/ai/caption
 */
export async function requestCaption(
  eventId: string,
  photoId: string,
  memo: string
): Promise<CaptionResponse> {
  const res = await api.post<CaptionResponse>('/ai/caption', {
    event_id: eventId,
    photo_id: photoId,
    memo: memo ?? '',
  });
  return res.data;
}

/**
 * AI 체크리스트 자동 생성 요청
 * POST /api/ai/checklist
 */
export async function requestChecklist(
  coupleId: string,
  weddingDate: string | null = null
): Promise<ChecklistResponse> {
  const body: { couple_id: string; wedding_date?: string } = { couple_id: coupleId };
  if (weddingDate) body.wedding_date = weddingDate;
  const res = await api.post<ChecklistResponse>('/ai/checklist', body);
  return res.data;
}
