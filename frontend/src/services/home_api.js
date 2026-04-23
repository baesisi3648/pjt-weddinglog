// @TASK P4-S2-T1 - Home API 서비스
// @SPEC specs/screens/01_home.yaml#data_requirements

import api from './api';

/**
 * 홈 요약 정보 조회
 * GET /api/couples/{couple_id}/home
 * @param {string} coupleId
 * @returns {{
 *   couple: object,
 *   upcoming_events: Array,
 *   recent_photos: Array,
 *   photo_counts: { total: number, selected: number },
 *   album_order_deadline: { date: string, days_remaining: number, urgency: string }
 * }}
 */
export async function getHomeSummary(coupleId) {
  const res = await api.get(`/couples/${coupleId}/home`);
  return res.data;
}
