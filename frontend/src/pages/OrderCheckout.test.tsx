// @TASK P1.5-V1 - OrderCheckout 스모크 테스트
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import OrderCheckout from './OrderCheckout';

function renderOrderCheckout() {
  return render(
    <MemoryRouter>
      <OrderCheckout />
    </MemoryRouter>
  );
}

describe('OrderCheckout', () => {
  it('throw 없이 마운트된다', () => {
    renderOrderCheckout();
  });

  it('앨범 주문 크럼브가 표시된다', () => {
    renderOrderCheckout();
    expect(screen.getByText('앨범 주문')).toBeInTheDocument();
  });
});
