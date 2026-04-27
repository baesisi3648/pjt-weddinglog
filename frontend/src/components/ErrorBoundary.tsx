// 앱 전체 React 렌더 에러 캐치.
// axios 에러는 인터셉터가, lifecycle 에러는 ErrorBoundary 가 책임.
import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 프로덕션에서는 Sentry 등으로 전송. 현재는 콘솔만.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = (): void => {
    this.setState({ hasError: false, message: null });
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-6 py-12">
        <div className="max-w-md text-center">
          <div className="font-mono text-[10px] tracking-[0.3em] text-coral mb-6">
            UNEXPECTED ERROR
          </div>
          <h1
            className="font-display-md text-[24px] text-ink mb-4 leading-relaxed"
            style={{ fontFamily: 'Fraunces, serif' }}
          >
            잠시 길을 잃었어요.
          </h1>
          <p className="text-[14px] text-ink-muted mb-8 leading-relaxed">
            화면을 다시 불러오면 대부분 해결됩니다.
            <br />
            계속 같은 화면이 보이면 잠시 후 다시 시도해주세요.
          </p>
          {this.state.message && (
            <p className="text-[11px] text-ink-muted/70 font-mono mb-8 break-all">
              {this.state.message}
            </p>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            className="px-6 py-3 rounded-full bg-coral text-white text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            다시 불러오기
          </button>
        </div>
      </div>
    );
  }
}
