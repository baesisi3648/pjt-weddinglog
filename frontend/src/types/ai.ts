// @TASK TS-MIGRATION - AI 응답 타입 정의

import type { Event } from './event';

export type AiSource = 'ai' | 'template';

export interface ChecklistResponse {
  source: AiSource;
  events: Event[];
}

export interface CaptionResponse {
  source: AiSource;
  captions: [string, string, string];
  photo_id?: string;
}
