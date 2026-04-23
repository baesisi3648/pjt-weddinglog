// @TASK P3-S1-T2 - PhotoUpload 컴포넌트
// @SPEC specs/screens/03_event_detail.yaml#photo_upload_zone
// @TEST src/components/PhotoUpload.test.tsx

import { useState, useRef, useCallback } from 'react';
import type { DragEvent } from 'react';
import Toast from './Toast';
import { uploadPhoto } from '../services/photo_api';
import type { Photo } from '../types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PHOTOS = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

interface PhotoUploadProps {
  eventId: string;
  onUploadSuccess: (photo: Photo) => void;
  currentCount?: number;
}

interface ToastState {
  message: string;
  type: 'info' | 'success' | 'error';
}

export default function PhotoUpload({ eventId, onUploadSuccess, currentCount = 0 }: PhotoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'error') => {
    setToast({ message, type });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  // 파일 검증 — 에러 메시지 반환, 없으면 null
  function validate(files: File[]): string | null {
    const remaining = MAX_PHOTOS - currentCount;

    if (files.length > remaining) {
      return `이 일정에는 최대 ${MAX_PHOTOS}장까지만 업로드 가능합니다 (현재 ${currentCount}장, ${remaining}장 더 가능).`;
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return `지원하지 않는 이미지 형식입니다 (JPG, PNG만 가능): ${file.name}`;
      }
      if (file.size > MAX_FILE_SIZE) {
        return `파일이 너무 큽니다 (최대 5MB): ${file.name}`;
      }
    }

    return null;
  }

  async function processFiles(files: FileList | null) {
    if (!files) return;
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    const errorMsg = validate(fileArray);
    if (errorMsg) {
      showToast(errorMsg, 'error');
      return;
    }

    // 순차 업로드
    for (const file of fileArray) {
      setProgress(0);
      try {
        const photo = await uploadPhoto(eventId, file, (pct) => setProgress(pct));
        onUploadSuccess(photo);
        showToast('사진이 업로드되었습니다.', 'success');
      } catch (err) {
        const e = err as { response?: { data?: { detail?: string } }; message?: string };
        const msg = e.response?.data?.detail ?? e.message ?? '업로드 중 오류가 발생했습니다.';
        showToast(msg, 'error');
      } finally {
        setProgress(null);
      }
    }
  }

  // Drag events
  function handleDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const { files } = e.dataTransfer;
    processFiles(files);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    processFiles(e.target.files);
    // 같은 파일 재선택 허용
    e.target.value = '';
  }

  return (
    <>
      <div
        data-testid="dropzone"
        className={`wl-upload${isDragOver ? ' is-drag-over' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />

        <div className="wl-upload-icon">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="9" cy="11" r="1.6" stroke="currentColor" strokeWidth="1.4" />
            <path d="M3 18l6-5 4 3 4-4 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
          </svg>
        </div>

        <div className="wl-upload-text">
          <div className="wl-upload-title serif">
            {isDragOver ? '여기에 놓으세요' : '여기로 사진을 끌어 놓으세요'}
          </div>
          <div className="wl-upload-sub">JPG, PNG · 최대 5MB · 이벤트당 최대 10장</div>
        </div>

        <button
          className="wl-btn wl-btn-primary"
          type="button"
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          사진 추가
        </button>
      </div>

      {/* 업로드 진행도 */}
      {progress !== null && (
        <div
          style={{
            margin: '8px 0',
            height: 4,
            background: 'var(--wl-line)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="업로드 진행도"
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'var(--wl-coral)',
              borderRadius: 2,
              transition: 'width 0.2s ease',
            }}
          />
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={dismissToast}
        />
      )}
    </>
  );
}
