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

  it('shows Landing page on "/" route', () => {
    renderApp();
    // 랜딩 페이지의 GNB 로고 노출 확인 (텍스트 로고 = WeddingLog)
    expect(screen.getAllByText(/WeddingLog/i).length).toBeGreaterThan(0);
  });

  it('shows Home (Layout) on "/home" route', () => {
    renderApp(['/home']);
    expect(screen.getAllByText(/WeddingLog/i).length).toBeGreaterThan(0);
  });
});
