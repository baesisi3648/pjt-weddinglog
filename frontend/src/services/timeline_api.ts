// @TASK P4-S1-T1 - Timeline API 서비스
// @SPEC specs/screens/04_timeline.yaml#data_requirements

import api from './api';
import { toggleSelection as toggleSelectionBase } from './photo_api';
import type { TimelineResponse } from '../types';

/**
 * 타임라인 챕터 목록 조회
 * GET /api/couples/{couple_id}/timeline
 */
export async function getTimeline(
  coupleId: string,
  { onlySelected }: { onlySelected?: boolean } = {}
): Promise<TimelineResponse> {
  const params: Record<string, boolean> = {};
  if (onlySelected !== undefined) params.only_selected = onlySelected;
  const res = await api.get<TimelineResponse>(`/couples/${coupleId}/timeline`, { params });
  return res.data;
}

/**
 * 사진 선택 상태 토글 (photo_api 재사용)
 * PATCH /api/photos/{photo_id}/selection
 */
export { toggleSelectionBase as toggleSelection };
