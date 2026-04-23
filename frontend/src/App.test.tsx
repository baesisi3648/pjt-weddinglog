// @TASK P0-T3 - App 스모크 렌더링 테스트
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// CoupleContext를 mock해서 비동기 API 호출 없이 스모크 테스트 수행
vi.mock('./context/CoupleContext', () => ({
  CoupleProvider: ({ children }: { children: React.ReactNode }) => children,
  useCouple: () => ({ couple: null, loading: false, error: null }),
}));

import App from './App';

function renderApp(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );
}

describe('App', () => {
  it('renders root without crashing', () => {
    renderApp();
    // 렌더링이 에러 없이 완료되면 통과
  });

  it('shows Home page on "/" route', () => {
    renderApp();
    // Home 핸드오프 포팅 후: weddinglog 로고 텍스트 확인
    expect(screen.getByText('weddinglog')).toBeInTheDocument();
  });
});
