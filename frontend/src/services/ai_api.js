// @TASK P2-S1-T5 - AI 체크리스트 API 서비스
// @SPEC docs/planning/06-tasks.md#P2-S1-T5

import api from './api';

/**
 * AI 캡션 생성 요청
 * POST /api/ai/caption
 * @param {string} eventId
 * @param {string} photoId
 * @param {string} memo
 * @returns {{ captions: string[], source: 'ai'|'template' }}
 */
export async function requestCaption(eventId, photoId, memo) {
  const res = await api.post('/ai/caption', {
    event_id: eventId,
    photo_id: photoId,
    memo: memo ?? '',
  });
  return res.data;
}

/**
 * AI 체크리스트 자동 생성 요청
 * POST /api/ai/checklist
 * @param {string} coupleId
 * @param {string|null} weddingDate - 'YYYY-MM-DD' (선택)
 * @returns {{ events: Array, source: 'ai'|'template' }}
 */
export async function requestChecklist(coupleId, weddingDate = null) {
  const body = { couple_id: coupleId };
  if (weddingDate) body.wedding_date = weddingDate;
  const res = await api.post('/ai/checklist', body);
  return res.data;
}
