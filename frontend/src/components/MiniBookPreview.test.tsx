// @TASK P5-FRONTEND - MiniBookPreview 테스트
// @SPEC docs/planning/06-tasks.md#Phase5

import { render, screen } from '@testing-library/react';
import MiniBookPreview from './MiniBookPreview';
import type { AlbumLayout } from '../types/album';
import type { Photo } from '../types/photo';

const MOCK_PHOTOS: Photo[] = [
  { id: 'p1', event_id: 'e1', file_url: 'https://example.com/1.jpg', caption: null, caption_source: null, is_selected: true, sort_order: 1, created_at: '2024-01-01' },
  { id: 'p2', event_id: 'e1', file_url: 'https://example.com/2.jpg', caption: null, caption_source: null, is_selected: true, sort_order: 2, created_at: '2024-01-01' },
  { id: 'p3', event_id: 'e1', file_url: 'https://example.com/3.jpg', caption: null, caption_source: null, is_selected: true, sort_order: 3, created_at: '2024-01-01' },
  { id: 'p4', event_id: 'e1', file_url: 'https://example.com/4.jpg', caption: null, caption_source: null, is_selected: true, sort_order: 4, created_at: '2024-01-01' },
];

function makeLayout(template: 'T1' | 'T2' | 'T3' | 'T4' | 'T5', photoIds: string[]): AlbumLayout {
  return {
    total_photos: photoIds.length,
    total_pages: 1,
    generated_by: 'ai',
    chapters: [
      {
        chapter_number: 1,
        title: '첫번째 챕터',
        color: 'coral',
        pages: [
          {
            page_number: 1,
            template,
            photo_ids: photoIds,
            caption: null,
          },
        ],
      },
    ],
  };
}

describe('MiniBookPreview', () => {
  it('T1 Full Bleed - throw 없이 렌더링', () => {
    const layout = makeLayout('T1', ['p1']);
    render(<MiniBookPreview layout={layout} photos={MOCK_PHOTOS} />);
    expect(screen.getByText('첫번째 챕터')).toBeInTheDocument();
  });

  it('T2 Half Split - throw 없이 렌더링', () => {
    const layout = makeLayout('T2', ['p1', 'p2']);
    render(<MiniBookPreview layout={layout} photos={MOCK_PHOTOS} />);
    expect(screen.getByText('첫번째 챕터')).toBeInTheDocument();
  });

  it('T3 Hero + Two - throw 없이 렌더링', () => {
    const layout = makeLayout('T3', ['p1', 'p2', 'p3']);
    render(<MiniBookPreview layout={layout} photos={MOCK_PHOTOS} />);
    expect(screen.getByText('첫번째 챕터')).toBeInTheDocument();
  });

  it('T4 Grid 2×2 - throw 없이 렌더링', () => {
    const layout = makeLayout('T4', ['p1', 'p2', 'p3', 'p4']);
    render(<MiniBookPreview layout={layout} photos={MOCK_PHOTOS} />);
    expect(screen.getByText('첫번째 챕터')).toBeInTheDocument();
  });

  it('T5 Cover - 챕터 제목 표시', () => {
    const layout = makeLayout('T5', ['p1']);
    render(<MiniBookPreview layout={layout} photos={MOCK_PHOTOS} />);
    expect(screen.getByText('첫번째 챕터')).toBeInTheDocument();
  });

  it('페이지 번호 및 템플릿명 표시', () => {
    const layout = makeLayout('T1', ['p1']);
    render(<MiniBookPreview layout={layout} photos={MOCK_PHOTOS} />);
    expect(screen.getByText(/Page 1/)).toBeInTheDocument();
    expect(screen.getByText(/Full Bleed/)).toBeInTheDocument();
  });

  it('챕터 색상 배지 렌더링', () => {
    const layout = makeLayout('T1', ['p1']);
    render(<MiniBookPreview layout={layout} photos={MOCK_PHOTOS} />);
    // 챕터 타이틀 띠 렌더링 확인
    expect(screen.getByText('첫번째 챕터')).toBeInTheDocument();
  });

  it('빈 photo_ids일 때 crash 없음', () => {
    const layout = makeLayout('T1', []);
    expect(() => render(<MiniBookPreview layout={layout} photos={MOCK_PHOTOS} />)).not.toThrow();
  });
});
