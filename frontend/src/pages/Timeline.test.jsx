// @TASK P1.5-V1 - Timeline 스모크 테스트
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Timeline from './Timeline';

function renderTimeline() {
  return render(
    <MemoryRouter>
      <Timeline />
    </MemoryRouter>
  );
}

describe('Timeline', () => {
  it('throw 없이 마운트된다', () => {
    renderTimeline();
  });

  it('타임라인 본문이 렌더링된다', () => {
    renderTimeline();
    // "타임라인" 키워드 — 페이지 내 고유 텍스트
    const items = screen.getAllByText(/타임라인/);
    expect(items.length).toBeGreaterThan(0);
  });
});
