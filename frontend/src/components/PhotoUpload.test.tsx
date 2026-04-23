// @TASK P3-S1-T2 - PhotoUpload 컴포넌트 테스트
// @SPEC specs/screens/03_event_detail.yaml#photo_upload_zone

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PhotoUpload from './PhotoUpload';

// photo_api mock
vi.mock('../services/photo_api', () => ({
  uploadPhoto: vi.fn(),
}));

import { uploadPhoto } from '../services/photo_api';

function createFile(name: string, size: number, type: string): File {
  const content = new Array(size).fill('a').join('');
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('PhotoUpload', () => {
  const defaultProps = {
    eventId: 'evt_001',
    onUploadSuccess: vi.fn(),
    currentCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('드롭존이 렌더링된다', () => {
    render(<PhotoUpload {...defaultProps} />);
    expect(screen.getByText(/끌어 놓으세요/)).toBeInTheDocument();
  });

  it('파일 input이 accept image/jpeg,image/png로 설정된다', () => {
    render(<PhotoUpload {...defaultProps} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.accept).toContain('image/jpeg');
    expect(input.accept).toContain('image/png');
  });

  it('5MB 초과 파일 → 에러 토스트 표시', async () => {
    render(<PhotoUpload {...defaultProps} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const oversized = createFile('big.jpg', 6 * 1024 * 1024, 'image/jpeg');

    await act(async () => {
      fireEvent.change(input, { target: { files: [oversized] } });
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toMatch(/5MB/);
    });
    expect(uploadPhoto).not.toHaveBeenCalled();
  });

  it('10장 초과 파일 → 에러 토스트 표시', async () => {
    render(<PhotoUpload {...defaultProps} currentCount={9} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const f1 = createFile('a.jpg', 100, 'image/jpeg');
    const f2 = createFile('b.jpg', 100, 'image/jpeg');

    await act(async () => {
      fireEvent.change(input, { target: { files: [f1, f2] } });
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toMatch(/10장/);
    });
    expect(uploadPhoto).not.toHaveBeenCalled();
  });

  it('정상 업로드 → onUploadSuccess 콜백 호출', async () => {
    const mockPhoto = { id: 'ph_001', caption: '', is_selected: false };
    (uploadPhoto as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockPhoto);

    const onSuccess = vi.fn();
    render(<PhotoUpload {...defaultProps} onUploadSuccess={onSuccess} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = createFile('photo.jpg', 1024, 'image/jpeg');

    await act(async () => {
      fireEvent.change(input, { target: { files: [validFile] } });
    });

    await waitFor(() => {
      expect(uploadPhoto).toHaveBeenCalledWith('evt_001', validFile, expect.any(Function));
      expect(onSuccess).toHaveBeenCalledWith(mockPhoto);
    });
  });

  it('드래그 오버 시 드롭존 활성 클래스 적용', () => {
    render(<PhotoUpload {...defaultProps} />);
    const dropzone = screen.getByTestId('dropzone');

    fireEvent.dragEnter(dropzone);
    expect(dropzone.classList.contains('is-drag-over')).toBe(true);

    fireEvent.dragLeave(dropzone);
    expect(dropzone.classList.contains('is-drag-over')).toBe(false);
  });

  it('드롭 시 파일 업로드 시작', async () => {
    const mockPhoto = { id: 'ph_002', caption: '' };
    (uploadPhoto as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockPhoto);
    const onSuccess = vi.fn();

    render(<PhotoUpload {...defaultProps} onUploadSuccess={onSuccess} />);
    const dropzone = screen.getByTestId('dropzone');
    const validFile = createFile('drop.png', 500, 'image/png');

    await act(async () => {
      fireEvent.drop(dropzone, {
        dataTransfer: { files: [validFile] },
      });
    });

    await waitFor(() => {
      expect(uploadPhoto).toHaveBeenCalledWith('evt_001', validFile, expect.any(Function));
    });
  });
});
