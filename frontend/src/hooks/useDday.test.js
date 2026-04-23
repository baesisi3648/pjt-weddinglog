// @TASK P1-S0-T2 - useDday 훅 테스트
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import useDday from './useDday';

describe('useDday', () => {
  const FAKE_TODAY = new Date('2026-04-23');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FAKE_TODAY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('미래 결혼일이면 dDay가 음수이고 "D-N" 라벨을 반환한다', () => {
    const { result } = renderHook(() => useDday('2026-05-23'));
    expect(result.current.dDay).toBe(-30);
    expect(result.current.label).toBe('D-30');
  });

  it('과거 결혼일이면 dDay가 양수이고 "D+N" 라벨을 반환한다', () => {
    const { result } = renderHook(() => useDday('2026-04-09'));
    expect(result.current.dDay).toBe(14);
    expect(result.current.label).toBe('D+14');
  });

  it('오늘이 결혼일이면 dDay가 0이고 "D-Day" 라벨을 반환한다', () => {
    const { result } = renderHook(() => useDday('2026-04-23'));
    expect(result.current.dDay).toBe(0);
    expect(result.current.label).toBe('D-Day');
  });

  it('Date 객체를 인수로 받아도 동작한다', () => {
    const { result } = renderHook(() => useDday(new Date('2026-06-01')));
    expect(result.current.dDay).toBe(-39);
    expect(result.current.label).toBe('D-39');
  });
});
