// @TASK P1.5-V1 - Home 스모크 테스트
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../context/CoupleContext', () => ({
  CoupleProvider: ({ children }) => children,
  useCouple: () => ({ couple: null, loading: false, error: null }),
}));

import Home from './Home';

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

describe('Home', () => {
  it('throw 없이 마운트된다', () => {
    renderHome();
  });

  it('weddinglog 로고 텍스트가 표시된다', () => {
    renderHome();
    expect(screen.getByText('weddinglog')).toBeInTheDocument();
  });
});
