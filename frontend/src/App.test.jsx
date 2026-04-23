// @TASK P0-T3 - App 스모크 렌더링 테스트
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

describe('App', () => {
  it('renders root without crashing', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    // 렌더링이 에러 없이 완료되면 통과
  });

  it('shows Home placeholder on "/" route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
  });
});
