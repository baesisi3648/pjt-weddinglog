// @TASK P3-S1-T5 - Toast 컴포넌트 (Calendar에서 승격)
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

  const bg = type === 'error' ? '#EF4444' : type === 'success' ? '#33FFBB' : '#2B2420';
  const color = type === 'success' ? '#2B2420' : '#fff';

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed', bottom: 80, right: 16, zIndex: 2000,
        background: bg, color,
        padding: '10px 16px', borderRadius: 10,
        fontSize: 13, fontWeight: 500,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        maxWidth: 280,
      }}
    >
      {message}
    </div>
  );
}
