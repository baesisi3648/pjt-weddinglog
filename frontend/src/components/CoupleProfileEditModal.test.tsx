// @TASK UX-FIXES-C4 - CoupleProfileEditModal 테스트
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../services/couple_api', () => ({
  updateCouple: vi.fn(),
}));

import CoupleProfileEditModal from './CoupleProfileEditModal';
import { updateCouple } from '../services/couple_api';
import type { Couple } from '../types';

const MOCK_COUPLE: Couple = {
  id: 'cpl_001',
  groom_name: '철수',
  bride_name: '영희',
  wedding_date: '2025-11-15',
  profile_photo_path: null,
  tagline: '우리만의 이야기',
};

function renderModal(overrides?: Partial<Parameters<typeof CoupleProfileEditModal>[0]>) {
  const defaultProps = {
    couple: MOCK_COUPLE,
    isOpen: true,
    onClose: vi.fn(),
    onSaved: vi.fn(),
  };
  return render(<CoupleProfileEditModal {...defaultProps} {...overrides} />);
}

describe('CoupleProfileEditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isOpen=false이면 렌더링되지 않는다', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('isOpen=true이면 모달이 표시된다', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('프로필 편집')).toBeInTheDocument();
  });

  it('기존 couple 데이터로 폼이 프리필된다', () => {
    renderModal();
    expect(screen.getByDisplayValue('철수')).toBeInTheDocument();
    expect(screen.getByDisplayValue('영희')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2025-11-15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('우리만의 이야기')).toBeInTheDocument();
  });

  it('신랑 이름 비우고 저장 → 에러 메시지', async () => {
    renderModal();
    const groomInput = screen.getByLabelText(/신랑 이름/);
    fireEvent.change(groomInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(screen.getByText(/신랑 이름은 2자 이상/)).toBeInTheDocument();
    });
    expect(updateCouple).not.toHaveBeenCalled();
  });

  it('신부 이름 1자 입력 → 에러 메시지', async () => {
    renderModal();
    const brideInput = screen.getByLabelText(/신부 이름/);
    fireEvent.change(brideInput, { target: { value: '희' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(screen.getByText(/신부 이름은 2자 이상/)).toBeInTheDocument();
    });
    expect(updateCouple).not.toHaveBeenCalled();
  });

  it('결혼 예정일 비우고 저장 → 에러 메시지', async () => {
    renderModal();
    const dateInput = screen.getByLabelText(/결혼 예정일/);
    fireEvent.change(dateInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(screen.getByText(/결혼 예정일을 입력/)).toBeInTheDocument();
    });
    expect(updateCouple).not.toHaveBeenCalled();
  });

  it('정상 저장 → updateCouple API 호출 + onSaved 콜백', async () => {
    const updatedCouple: Couple = {
      ...MOCK_COUPLE,
      groom_name: '민준',
      bride_name: '서연',
    };
    (updateCouple as ReturnType<typeof vi.fn>).mockResolvedValue(updatedCouple);

    const onSaved = vi.fn();
    const onClose = vi.fn();
    renderModal({ onSaved, onClose });

    fireEvent.change(screen.getByLabelText(/신랑 이름/), { target: { value: '민준' } });
    fireEvent.change(screen.getByLabelText(/신부 이름/), { target: { value: '서연' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(updateCouple).toHaveBeenCalledWith('cpl_001', expect.objectContaining({
        groom_name: '민준',
        bride_name: '서연',
      }));
      expect(onSaved).toHaveBeenCalledWith(updatedCouple);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('API 에러 시 폼 내부에 인라인 에러 표시', async () => {
    (updateCouple as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('서버 오류'));

    renderModal();
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('취소 버튼 클릭 → onClose 호출', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('오버레이 클릭 → onClose 호출', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('ESC 키 → onClose 호출', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
