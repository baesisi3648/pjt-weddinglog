// @TASK P1-S0-T1 - Layout + Header 테스트
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';

// Outlet mock
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet-content">outlet</div>,
  };
});

function renderWithRouter(ui, { initialEntries = ['/'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
  );
}

describe('Layout', () => {
  it('Header를 렌더링한다', () => {
    renderWithRouter(<Layout />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('로고 텍스트 "WeddingLog"가 존재한다', () => {
    renderWithRouter(<Layout />);
    expect(screen.getByText('WeddingLog')).toBeInTheDocument();
  });

  it('네비게이션 링크 4개가 존재한다', () => {
    renderWithRouter(<Layout />);
    const navLinks = screen.getAllByRole('link');
    // 로고 링크 + 4개 nav 링크
    const navLinkTexts = ['Home', 'Calendar', 'Timeline', 'Orders'];
    navLinkTexts.forEach((text) => {
      expect(screen.getByRole('link', { name: text })).toBeInTheDocument();
    });
  });

  it('Outlet이 렌더링된다', () => {
    renderWithRouter(<Layout />);
    expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
  });
});
