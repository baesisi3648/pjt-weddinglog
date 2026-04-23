// @TASK P1.5-V1 - Orders 스모크 테스트
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Orders from './Orders';

function renderOrders() {
  return render(
    <MemoryRouter>
      <Orders />
    </MemoryRouter>
  );
}

describe('Orders', () => {
  it('throw 없이 마운트된다', () => {
    renderOrders();
  });

  it('주문 관리 타이틀이 표시된다', () => {
    renderOrders();
    expect(screen.getByText('주문 관리')).toBeInTheDocument();
  });
});
