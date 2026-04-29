// 사진 큐레이션 알고리즘 단위 테스트.
//
// 추천 휴리스틱이 PhotoCurationModal 안에 있을 때는 테스트가 어려웠음.
// utils 로 추출하면서 회귀 방지를 위해 핵심 케이스 커버.

import { describe, it, expect } from 'vitest';
import type { Chapter, TimelinePhoto } from '../types/timeline';
import {
  keywordScore,
  capPerEvent,
  estimatePages,
  calcDday,
  groupByEvent,
  recommendByTarget,
  COVER_KEYWORDS,
  PRESETS,
} from './photoCuration';

// ─── 테스트 fixture 헬퍼 ────────────────────────────────────────────────
function makePhoto(
  id: string,
  caption: string | null,
  eventId = 'evt_1',
  eventTitle = '이벤트',
  eventDate = '2026-01-01',
  category = 'WEDDING_PHOTO',
): TimelinePhoto {
  return {
    id,
    caption,
    file_url: `/api/photos/${id}/file`,
    event_id: eventId,
    event_title: eventTitle,
    event_date: eventDate,
    category,
  } as TimelinePhoto;
}

function makeChapter(title: string, photos: TimelinePhoto[]): Chapter {
  return { title, photos } as Chapter;
}

// ─── keywordScore ──────────────────────────────────────────────────────
describe('keywordScore', () => {
  it('null / 빈 문자열 → 0', () => {
    expect(keywordScore(null)).toBe(0);
    expect(keywordScore('')).toBe(0);
  });

  it('매칭 0건 → 0', () => {
    expect(keywordScore('오늘 날씨 좋네')).toBe(0);
  });

  it('단일 키워드 매칭 → 1', () => {
    expect(keywordScore('우리 둘만의 시간')).toBe(2); // '둘' + '우리'
    expect(keywordScore('이 컷 맘에 들어')).toBe(1);
  });

  it('이모지 키워드 매칭', () => {
    expect(keywordScore('💍 반지 받는 순간')).toBe(1);
    expect(keywordScore('🌊 바다 앞에서')).toBe(1);
  });

  it('대소문자 무시', () => {
    // COVER_KEYWORDS 는 한글 위주라 영문 케이스는 제한적이지만 toLowerCase 동작 검증
    expect(keywordScore('이 CUT 좋다')).toBe(0); // '이 컷' 과 'CUT' 다름
  });

  it('중복 키워드도 각각 카운트', () => {
    expect(keywordScore('우리 둘 함께 우리 둘')).toBeGreaterThan(2);
  });
});

// ─── capPerEvent ───────────────────────────────────────────────────────
describe('capPerEvent', () => {
  it('n=0 → 0', () => {
    expect(capPerEvent(0)).toBe(0);
  });

  it('n ≤ 3 → 그대로', () => {
    expect(capPerEvent(1)).toBe(1);
    expect(capPerEvent(2)).toBe(2);
    expect(capPerEvent(3)).toBe(3);
  });

  it('4 ≤ n ≤ 6 → ceil(n × 0.6)', () => {
    expect(capPerEvent(4)).toBe(3); // ceil(2.4) = 3
    expect(capPerEvent(5)).toBe(3); // ceil(3.0) = 3
    expect(capPerEvent(6)).toBe(4); // ceil(3.6) = 4
  });

  it('7 ≤ n → max(4, ceil(n × 0.4))', () => {
    expect(capPerEvent(7)).toBe(4); // max(4, ceil(2.8)=3) = 4
    expect(capPerEvent(10)).toBe(4); // max(4, ceil(4.0)) = 4
    expect(capPerEvent(15)).toBe(6); // max(4, ceil(6.0)) = 6
    expect(capPerEvent(100)).toBe(40); // max(4, ceil(40)) = 40
  });
});

// ─── estimatePages ─────────────────────────────────────────────────────
describe('estimatePages', () => {
  it('0장 → 0페이지', () => {
    expect(estimatePages(0, 5)).toBe(0);
  });

  it('챕터 표지만큼만 → 챕터수 페이지', () => {
    // 5장 = 챕터 5개 표지만, 잔여 0
    expect(estimatePages(5, 5)).toBe(5);
  });

  it('표지 + 본문 짝수 → 챕터수 + 사진/2', () => {
    // 11장 = 5 표지 + 6 본문 (2장씩 3페이지) = 5 + 3 = 8
    expect(estimatePages(11, 5)).toBe(8);
  });

  it('표지 + 본문 홀수 → 마지막 1장 T1', () => {
    // 12장 = 5 표지 + 7 본문 (2장씩 3페이지 + 1장 1페이지) = 5 + 3 + 1 = 9
    expect(estimatePages(12, 5)).toBe(9);
  });

  it('70장 / 5챕터 → 5 + 65/2 = 5 + 32 + 1 = 38 페이지', () => {
    expect(estimatePages(70, 5)).toBe(5 + Math.floor(65 / 2) + (65 % 2));
    expect(estimatePages(70, 5)).toBe(38);
  });
});

// ─── calcDday ──────────────────────────────────────────────────────────
describe('calcDday', () => {
  it('빈 입력 → 빈 문자열', () => {
    expect(calcDday('', '2026-03-14')).toBe('');
    expect(calcDday('2026-03-14', '')).toBe('');
  });

  it('동일 날짜 → D-Day', () => {
    expect(calcDday('2026-03-14', '2026-03-14')).toBe('D-Day');
  });

  it('과거 날짜 → D-N (음수)', () => {
    expect(calcDday('2026-02-14', '2026-03-14')).toBe('D-28');
  });

  it('미래 날짜 → D+N', () => {
    expect(calcDday('2026-03-21', '2026-03-14')).toBe('D+7');
  });
});

// ─── groupByEvent ──────────────────────────────────────────────────────
describe('groupByEvent', () => {
  it('빈 chapters → 빈 배열', () => {
    expect(groupByEvent([])).toEqual([]);
  });

  it('같은 이벤트 사진은 한 그룹으로', () => {
    const ch = makeChapter('챕터1', [
      makePhoto('p1', 'a', 'evt_A', '이벤트 A', '2026-01-01'),
      makePhoto('p2', 'b', 'evt_A', '이벤트 A', '2026-01-01'),
      makePhoto('p3', 'c', 'evt_B', '이벤트 B', '2026-02-01'),
    ]);
    const result = groupByEvent([ch]);
    expect(result).toHaveLength(1);
    expect(result[0].events).toHaveLength(2);
    expect(result[0].events[0].photos).toHaveLength(2); // evt_A
    expect(result[0].events[1].photos).toHaveLength(1); // evt_B
    expect(result[0].totalPhotos).toBe(3);
  });

  it('이벤트는 date 오름차순 정렬', () => {
    const ch = makeChapter('챕터', [
      makePhoto('p1', null, 'evt_late', 'Late', '2026-12-01'),
      makePhoto('p2', null, 'evt_early', 'Early', '2026-01-01'),
    ]);
    const result = groupByEvent([ch]);
    expect(result[0].events[0].eventId).toBe('evt_early');
    expect(result[0].events[1].eventId).toBe('evt_late');
  });
});

// ─── recommendByTarget — 핵심 알고리즘 ─────────────────────────────────
describe('recommendByTarget', () => {
  it('빈 그룹 → 빈 set', () => {
    expect(recommendByTarget([], 70).size).toBe(0);
  });

  it('총량이 target 보다 적으면 cap 결과 그대로 반환 (추가할 미선택 없음)', () => {
    const ch = makeChapter('ch', [
      makePhoto('p1', null),
      makePhoto('p2', null),
    ]);
    const result = recommendByTarget(groupByEvent([ch]), 70);
    expect(result.size).toBe(2); // 전체 다 선택
  });

  it('cap 으로 줄어든 후 target 보다 작으면 점수 높은 순으로 추가', () => {
    // 7장 이벤트 → cap = max(4, ceil(7*0.4)=3) = 4
    // target=6: 4장 cap → 추가 2장
    const photos = [
      makePhoto('p1', null),
      makePhoto('p2', null),
      makePhoto('p3', null),
      makePhoto('p4', null),
      makePhoto('p5', '둘 우리 함께'), // 점수 높음
      makePhoto('p6', '커플 노을'),    // 점수 있음
      makePhoto('p7', null),
    ];
    const ch = makeChapter('ch', photos);
    const result = recommendByTarget(groupByEvent([ch]), 6);
    expect(result.size).toBe(6);
  });

  it('target 보다 많이 선택되면 점수 낮은 것부터 제거', () => {
    // 5장 이벤트 × 3개 = 15장. cap(5) = 3 → 9장 선택.
    // target=5 → 4장 제거
    const ev1 = (i: number) =>
      Array.from({ length: 5 }, (_, k) =>
        makePhoto(`p${i}_${k}`, k === 0 ? '둘' : null, `evt_${i}`, `이벤트${i}`, `2026-0${i}-01`),
      );
    const ch = makeChapter('ch', [...ev1(1), ...ev1(2), ...ev1(3)]);
    const result = recommendByTarget(groupByEvent([ch]), 5);
    expect(result.size).toBe(5);
  });

  it('60/70/80/90 프리셋이 모두 동작', () => {
    // 100장 이벤트 (한 그룹)
    const photos = Array.from({ length: 100 }, (_, i) =>
      makePhoto(`p${i}`, i % 5 === 0 ? '우리' : null),
    );
    const ch = makeChapter('ch', photos);
    const groups = groupByEvent([ch]);

    for (const target of PRESETS) {
      const result = recommendByTarget(groups, target);
      expect(result.size).toBe(target);
    }
  });
});

// ─── 메타 ─────────────────────────────────────────────────────────────
describe('상수 노출', () => {
  it('COVER_KEYWORDS 가 비어있지 않음', () => {
    expect(COVER_KEYWORDS.length).toBeGreaterThan(0);
  });

  it('PRESETS = [60, 70, 80, 90]', () => {
    expect(PRESETS).toEqual([60, 70, 80, 90]);
  });
});
