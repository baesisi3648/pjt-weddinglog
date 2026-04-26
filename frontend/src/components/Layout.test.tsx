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

function renderWithRouter(ui: React.ReactElement, { initialEntries = ['/'] } = {}) {
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
    // 데스크톱 + 모바일 양쪽에 같은 텍스트가 있을 수 있어 getAllByText.
    expect(screen.getAllByText('WeddingLog').length).toBeGreaterThan(0);
  });

  it('네비게이션 링크 4개 (데스크톱+모바일)가 존재한다', () => {
    renderWithRouter(<Layout />);
    const navLinkTexts = ['Home', 'Calendar', 'Timeline', 'Orders'];
    navLinkTexts.forEach((text) => {
      // 데스크톱 + 모바일 두 군데에 동일 라벨 존재 → getAllByRole로 ≥1 확인.
      expect(screen.getAllByRole('link', { name: text }).length).toBeGreaterThan(0);
    });
  });

  it('Outlet이 렌더링된다', () => {
    renderWithRouter(<Layout />);
    expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
  });
});
