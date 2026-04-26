// @TASK P2-S1-T3 - EventForm 테스트
// @SPEC docs/planning/06-tasks.md#P2-S1-T3

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventForm from './EventForm';

const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

function renderForm(props: Partial<Parameters<typeof EventForm>[0]> = {}) {
  return render(
    <EventForm
      mode="create"
      onSubmit={mockOnSubmit}
      onCancel={mockOnCancel}
      date="2026-04-23"
      {...props}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EventForm', () => {
  it('모달이 렌더링된다', () => {
    renderForm();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('create 모드에서 "일정 추가" 타이틀이 표시된다', () => {
    renderForm({ mode: 'create' });
    expect(screen.getByText('일정 추가')).toBeInTheDocument();
  });

  it('edit 모드에서 "일정 편집" 타이틀이 표시된다', () => {
    renderForm({ mode: 'edit', initialData: { id: '1', title: '테스트', date: '2026-04-23', category: 'VENUE', memo: '' } });
    expect(screen.getByText('일정 편집')).toBeInTheDocument();
  });

  it('edit 모드에서 initialData가 폼에 채워진다', () => {
    renderForm({
      mode: 'edit',
      initialData: { id: '1', title: '예식장 답사', date: '2026-04-23', category: 'VENUE', memo: '강남 예식장' },
    });
    expect(screen.getByDisplayValue('예식장 답사')).toBeInTheDocument();
    expect(screen.getByDisplayValue('강남 예식장')).toBeInTheDocument();
  });

  describe('검증: 필수 필드 미입력 시 에러', () => {
    it('제목 없이 제출 시 제목 에러가 표시된다', async () => {
      renderForm();
      fireEvent.click(screen.getByRole('button', { name: '저장' }));
      await waitFor(() => {
        expect(screen.getByText('제목을 입력해주세요.')).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('카테고리 미선택 시 카테고리 에러가 표시된다', async () => {
      renderForm();
      await userEvent.type(screen.getByLabelText(/제목/), '테스트 일정');
      fireEvent.click(screen.getByRole('button', { name: '저장' }));
      await waitFor(() => {
        expect(screen.getByText('카테고리를 선택해주세요.')).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('날짜 없이 제출 시 날짜 에러가 표시된다', async () => {
      renderForm({ date: null });
      await userEvent.type(screen.getByLabelText(/제목/), '테스트');
      // 시작 날짜 필드 비우기 (종료 날짜는 선택이므로 별도 label 로 구분)
      const dateInput = screen.getByLabelText(/시작 날짜/);
      fireEvent.change(dateInput, { target: { value: '' } });
      fireEvent.click(screen.getByRole('button', { name: '저장' }));
      await waitFor(() => {
        expect(screen.getByText('날짜를 선택해주세요.')).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('성공 제출', () => {
    it('전체 입력 후 onSubmit이 올바른 데이터로 호출된다', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);
      renderForm();

      await userEvent.type(screen.getByLabelText(/제목/), '예식장 답사');

      const dateInput = screen.getByLabelText(/시작 날짜/);
      fireEvent.change(dateInput, { target: { value: '2026-04-23' } });

      const catSelect = screen.getByLabelText(/카테고리/);
      fireEvent.change(catSelect, { target: { value: 'VENUE' } });

      await userEvent.type(screen.getByLabelText(/메모/), '강남 예식장 2층');

      fireEvent.click(screen.getByRole('button', { name: '저장' }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: '예식장 답사',
          date: '2026-04-23',
          end_date: null,
          category: 'VENUE',
          memo: '강남 예식장 2층',
        });
      });
    });

    it('메모 없이도 제출이 가능하다 (memo: null)', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);
      renderForm();

      await userEvent.type(screen.getByLabelText(/제목/), '결혼식');
      const catSelect = screen.getByLabelText(/카테고리/);
      fireEvent.change(catSelect, { target: { value: 'CEREMONY' } });
      fireEvent.click(screen.getByRole('button', { name: '저장' }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '결혼식',
            category: 'CEREMONY',
            memo: null,
            end_date: null,
          })
        );
      });
    });
  });

  it('취소 버튼 클릭 시 onCancel이 호출된다', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('닫기 버튼(X) 클릭 시 onCancel이 호출된다', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('9개 카테고리 옵션이 모두 표시된다', () => {
    renderForm();
    const catSelect = screen.getByLabelText(/카테고리/);
    const options = Array.from(catSelect.querySelectorAll('option'));
    // 첫 번째는 placeholder "카테고리 선택"
    expect(options.length).toBe(10);
  });
});
