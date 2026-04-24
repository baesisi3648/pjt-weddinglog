// @TASK STITCH-DESIGN - Toast 스타일 업데이트 (surface-container-lowest + hairline)
// @SPEC specs/screens/03_event_detail.yaml#edge_cases

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error';
  onDismiss: () => void;
}

export default function Toast({ message, type = 'info', onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const styles = {
    error: { bg: '#ffdad6', color: '#93000a', border: '#ba1a1a' },
    success: { bg: '#f6eddd', color: '#1f1b12', border: '#d7c2bd' },
    info: { bg: '#ffffff', color: '#1f1b12', border: '#d7c2bd' },
  };
  const s = styles[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 80,
        right: 16,
        zIndex: 2000,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: 13,
        fontWeight: 500,
        boxShadow: '0 2px 8px rgba(31,27,18,0.08)',
        maxWidth: 280,
        fontFamily: 'Pretendard, sans-serif',
      }}
    >
      {message}
    </div>
  );
}
