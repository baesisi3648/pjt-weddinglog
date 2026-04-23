// @TASK UX-FIXES-C2 - Couple API 서비스
import api from './api';
import type { Couple, CoupleUpdate } from '../types';

export const getCouple = (id: string): Promise<Couple> =>
  api.get<Couple>(`/couples/${id}`).then((r) => r.data);

export const updateCouple = (id: string, data: CoupleUpdate): Promise<Couple> =>
  api.put<Couple>(`/couples/${id}`, data).then((r) => r.data);
