// @TASK P1.5-V1 - EventDetail 스모크 테스트
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import EventDetail from './EventDetail';

function renderEventDetail() {
  return render(
    <MemoryRouter>
      <EventDetail />
    </MemoryRouter>
  );
}

describe('EventDetail', () => {
  it('throw 없이 마운트된다', () => {
    renderEventDetail();
  });

  it('사진 기록 섹션이 표시된다', () => {
    renderEventDetail();
    expect(screen.getByText('사진 기록')).toBeInTheDocument();
  });
});
