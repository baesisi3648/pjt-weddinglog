// @TASK P3-S1-T4 - CaptionSelector 컴포넌트 테스트
// @SPEC specs/screens/03_event_detail.yaml#caption_selector
// @SPEC docs/planning/council-report.md#M4

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CaptionSelector from './CaptionSelector';

vi.mock('../services/photo_api', () => ({
  updateCaption: vi.fn(),
}));
import { updateCaption } from '../services/photo_api';

vi.mock('../services/ai_api', () => ({
  requestCaption: vi.fn(),
}));
import { requestCaption } from '../services/ai_api';

const mockPhoto = { id: 'ph_001', caption: '기존 캡션' };
const mockEvent = { id: 'evt_001', category: 'WEDDING_PHOTO', date: '2025-08-15', memo: '테스트 메모' };

describe('CaptionSelector', () => {
  const defaultProps = {
    photo: mockPhoto as Parameters<typeof CaptionSelector>[0]['photo'],
    event: mockEvent as Parameters<typeof CaptionSelector>[0]['event'],
    onApply: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('렌더링된다', () => {
    render(<CaptionSelector {...defaultProps} />);
    expect(screen.getByText('캡션 추천')).toBeInTheDocument();
  });

  it('"캡션 추천" 클릭 → requestCaption API 호출', async () => {
    (requestCaption as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      captions: ['캡션1', '캡션2', '캡션3'],
      source: 'ai',
    });

    render(<CaptionSelector {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByText('캡션 추천'));
    });

    await waitFor(() => {
      expect(requestCaption).toHaveBeenCalledWith('evt_001', 'ph_001', '테스트 메모');
    });
  });

  it('AI 캡션 3개 옵션이 렌더링된다', async () => {
    (requestCaption as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      captions: ['여름 햇살', '서로의 눈빛', '리허설 하루'],
      source: 'ai',
    });

    render(<CaptionSelector {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText('캡션 추천'));
    });

    await waitFor(() => {
      expect(screen.getByText('여름 햇살')).toBeInTheDocument();
      expect(screen.getByText('서로의 눈빛')).toBeInTheDocument();
      expect(screen.getByText('리허설 하루')).toBeInTheDocument();
    });
  });

  it('source=ai → "자동 추천" 배지 표시', async () => {
    (requestCaption as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      captions: ['캡션1', '캡션2', '캡션3'],
      source: 'ai',
    });

    render(<CaptionSelector {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText('캡션 추천'));
    });

    await waitFor(() => {
      expect(screen.getByText('자동 추천')).toBeInTheDocument();
    });
  });

  it('source=template → "기본 템플릿" 배지 표시', async () => {
    (requestCaption as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      captions: ['템플릿1', '템플릿2', '템플릿3'],
      source: 'template',
    });

    render(<CaptionSelector {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText('캡션 추천'));
    });

    await waitFor(() => {
      expect(screen.getByText('기본 템플릿')).toBeInTheDocument();
    });
  });

  it('"직접 입력" 옵션이 있다', () => {
    render(<CaptionSelector {...defaultProps} />);
    expect(screen.getByText('직접 입력')).toBeInTheDocument();
  });

  it('"적용" 클릭 → updateCaption 호출 + onApply 콜백', async () => {
    (requestCaption as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      captions: ['캡션1', '캡션2', '캡션3'],
      source: 'ai',
    });
    (updateCaption as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'ph_001', caption: '캡션1' });
    const onApply = vi.fn();

    render(<CaptionSelector {...defaultProps} onApply={onApply} />);
    await act(async () => {
      fireEvent.click(screen.getByText('캡션 추천'));
    });

    await waitFor(() => screen.getByText('캡션1'));

    // 첫 번째 옵션 선택
    const radios = screen.getAllByRole('radio');
    await act(async () => {
      fireEvent.click(radios[0]);
    });

    await act(async () => {
      fireEvent.click(screen.getByText('적용'));
    });

    await waitFor(() => {
      expect(updateCaption).toHaveBeenCalledWith('ph_001', '캡션1');
      expect(onApply).toHaveBeenCalledWith('캡션1', 'ai');
    });
  });

  it('"닫기" 클릭 → onClose 콜백', () => {
    const onClose = vi.fn();
    render(<CaptionSelector {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('닫기'));
    expect(onClose).toHaveBeenCalled();
  });
});
