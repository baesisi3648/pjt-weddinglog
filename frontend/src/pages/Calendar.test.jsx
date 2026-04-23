// @TASK P1.5-V1 - Calendar 스모크 테스트
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Calendar from './Calendar';

function renderCalendar() {
  return render(
    <MemoryRouter>
      <Calendar />
    </MemoryRouter>
  );
}

describe('Calendar', () => {
  it('throw 없이 마운트된다', () => {
    renderCalendar();
  });

  it('캘린더 타이틀이 표시된다', () => {
    renderCalendar();
    expect(screen.getByText('캘린더')).toBeInTheDocument();
  });
});
