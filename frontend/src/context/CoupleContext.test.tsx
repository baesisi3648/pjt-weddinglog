// @TASK P1-S0-T2 - CoupleContext 테스트
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CoupleProvider, useCouple } from './CoupleContext';

// axios mock
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from '../services/api';

const MOCK_COUPLE = {
  id: 'cpl_sample_001',
  groom_name: '김철수',
  bride_name: '이영희',
  wedding_date: '2026-05-23',
  tagline: '우리의 특별한 날',
};

function ConsumerComponent() {
  const { couple, loading, error } = useCouple();
  if (loading) return <div data-testid="loading">로딩 중...</div>;
  if (error) return <div data-testid="error">{error}</div>;
  if (!couple) return <div data-testid="no-data">데이터 없음</div>;
  return (
    <div data-testid="couple-data">
      {couple.groom_name} ♥ {couple.bride_name}
    </div>
  );
}

describe('CoupleContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Provider 내부에서 useCouple이 커플 데이터를 반환한다', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: MOCK_COUPLE });

    render(
      <CoupleProvider>
        <ConsumerComponent />
      </CoupleProvider>
    );

    // 초기 로딩 상태
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // 데이터 로드 완료
    await waitFor(() => {
      expect(screen.getByTestId('couple-data')).toBeInTheDocument();
    });
    expect(screen.getByTestId('couple-data').textContent).toContain('김철수');
    expect(screen.getByTestId('couple-data').textContent).toContain('이영희');
  });

  it('API 오류 시 error 상태를 반환한다', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network Error'));

    render(
      <CoupleProvider>
        <ConsumerComponent />
      </CoupleProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
  });

  it('Provider 외부에서 useCouple 사용 시 에러를 던진다', () => {
    function OutsideConsumer() {
      useCouple();
      return null;
    }

    // 에러 바운더리 없이 렌더링하면 throw됨
    expect(() => {
      render(<OutsideConsumer />);
    }).toThrow('useCouple must be used within a CoupleProvider');
  });
});
