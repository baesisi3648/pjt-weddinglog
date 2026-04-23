// @TASK P4-S2-T1 - Home API 서비스
// @SPEC specs/screens/01_home.yaml#data_requirements

import api from './api';
import type { HomeSummary } from '../types';

/**
 * 홈 요약 정보 조회
 * GET /api/couples/{couple_id}/home
 */
export async function getHomeSummary(coupleId: string): Promise<HomeSummary> {
  const res = await api.get<HomeSummary>(`/couples/${coupleId}/home`);
  return res.data;
}
