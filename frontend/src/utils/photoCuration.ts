// 사진 큐레이션 알고리즘 — PhotoCurationModal 의 비즈니스 로직.
//
// 사용자가 60/70/80/90 프리셋 중 하나를 선택하면 추천 알고리즘이
// 베스트 컷을 자동 선별한다. 컴포넌트와 분리해 단위 테스트 가능하도록.
//
// 휴리스틱:
//   1. 이벤트별 cap (사진 수에 따라 차등)
//      - n ≤ 3:        그대로 (전부 살림)
//      - 4 ≤ n ≤ 6:    ceil(n × 0.6)
//      - 7 ≤ n:        max(4, ceil(n × 0.4))
//   2. 베스트 키워드 점수 (둘/우리/커플/이 컷/💍 등) — 동점 시 sort_order 큰 것 (마지막 = 베스트)
//   3. target 매수에 맞춰 미세 조정 (점수 낮은 것부터 제거 / 높은 것부터 추가)

import type { Chapter, TimelinePhoto } from '../types/timeline';

export const COVER_KEYWORDS = [
  '둘', '우리', '커플', '함께', '이 컷', '앨범 표지', '앨범 확정', '앨범行',
  '베스트', '하이라이트', '노을', '선셋', '🤍', '💍', '🌊', '맞대고', '손잡고',
  '키스', '포옹',
];

export const PRESETS = [60, 70, 80, 90] as const;
export type PresetTarget = (typeof PRESETS)[number];

export interface EventGroup {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  category: string;
  photos: (TimelinePhoto & { _idx: number })[];
}

export interface ChapterGroup {
  chapterTitle: string;
  events: EventGroup[];
  totalPhotos: number;
}

/**
 * 페이지 수 추정 (T1=1장, T2=2장, 챕터당 표지(T5) 1장).
 * @param selectedCount 선택된 사진 수
 * @param chapterCount 챕터 수
 */
export function estimatePages(selectedCount: number, chapterCount: number): number {
  if (selectedCount <= 0) return 0;
  // 챕터 표지 chapterCount 페이지 + 나머지 사진을 2장씩 T2 + 잔여 1=T1
  const remaining = Math.max(0, selectedCount - chapterCount);
  const t2 = Math.floor(remaining / 2);
  const t1 = remaining % 2;
  return chapterCount + t2 + t1;
}

/** D-day 계산 (event_date - wedding_date). 입력이 비어있으면 빈 문자열. */
export function calcDday(eventDate: string, weddingDate: string): string {
  if (!eventDate || !weddingDate) return '';
  const ev = new Date(eventDate);
  const wd = new Date(weddingDate);
  ev.setHours(0, 0, 0, 0);
  wd.setHours(0, 0, 0, 0);
  const diff = Math.round((ev.getTime() - wd.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'D-Day';
  if (diff < 0) return `D${diff}`;
  return `D+${diff}`;
}

/** 베스트 키워드 점수 — 캡션에서 COVER_KEYWORDS 매칭 횟수. */
export function keywordScore(caption: string | null): number {
  if (!caption) return 0;
  const lower = caption.toLowerCase();
  let score = 0;
  for (const kw of COVER_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) score += 1;
  }
  return score;
}

/** 이벤트당 보존할 사진 수 cap. */
export function capPerEvent(n: number): number {
  if (n <= 0) return 0;
  if (n <= 3) return n;
  if (n <= 6) return Math.ceil(n * 0.6);
  return Math.max(4, Math.ceil(n * 0.4));
}

/** Timeline chapters → 이벤트별 그룹핑 (날짜순). */
export function groupByEvent(chapters: Chapter[]): ChapterGroup[] {
  return chapters.map((ch) => {
    const eventMap = new Map<string, EventGroup>();
    (ch.photos ?? []).forEach((p, idx) => {
      const eid = p.event_id ?? p.event_title ?? 'unknown';
      const grp = eventMap.get(eid);
      if (grp) {
        grp.photos.push({ ...p, _idx: idx });
      } else {
        eventMap.set(eid, {
          eventId: eid,
          eventTitle: p.event_title ?? '이벤트',
          eventDate: p.event_date ?? '',
          category: p.category ?? '',
          photos: [{ ...p, _idx: idx }],
        });
      }
    });
    const events = Array.from(eventMap.values()).sort((a, b) =>
      a.eventDate.localeCompare(b.eventDate),
    );
    return {
      chapterTitle: ch.title,
      events,
      totalPhotos: events.reduce((acc, e) => acc + e.photos.length, 0),
    };
  });
}

/**
 * 추천 알고리즘 — target 매수에 맞춰 선택된 photo_id 집합 반환.
 *
 * 단계:
 *   1. 이벤트별 cap (capPerEvent) 적용 + 키워드 점수 기준 정렬
 *   2. target 과 비교해 ±조정
 *      - total > target: 점수 낮은 것부터 제거
 *      - total < target: 미선택 중 점수 높은 것부터 추가
 */
export function recommendByTarget(
  groups: ChapterGroup[],
  target: number,
): Set<string> {
  const recommended = new Set<string>();

  // 1. 이벤트별 cap 적용 + 키워드 점수 기준 선별
  for (const ch of groups) {
    for (const ev of ch.events) {
      const cap = capPerEvent(ev.photos.length);
      const sorted = [...ev.photos].sort((a, b) => {
        const sa = keywordScore(a.caption);
        const sb = keywordScore(b.caption);
        if (sa !== sb) return sb - sa; // 점수 내림차순
        return b._idx - a._idx; // 같으면 sort_order 큰 (= 마지막 = 베스트) 우선
      });
      sorted.slice(0, cap).forEach((p) => recommended.add(p.id));
    }
  }

  // 2. target 과 차이 조정
  const total = recommended.size;
  if (total > target) {
    // 제거 — 점수 낮은 것부터
    const candidates: { id: string; score: number; idx: number }[] = [];
    for (const ch of groups) {
      for (const ev of ch.events) {
        for (const p of ev.photos) {
          if (recommended.has(p.id)) {
            candidates.push({
              id: p.id,
              score: keywordScore(p.caption),
              idx: p._idx,
            });
          }
        }
      }
    }
    candidates.sort((a, b) => a.score - b.score || a.idx - b.idx);
    const toRemove = total - target;
    for (let i = 0; i < toRemove && i < candidates.length; i++) {
      recommended.delete(candidates[i].id);
    }
  } else if (total < target) {
    // 추가 — 점수 높은 미선택부터
    const candidates: { id: string; score: number; idx: number }[] = [];
    for (const ch of groups) {
      for (const ev of ch.events) {
        for (const p of ev.photos) {
          if (!recommended.has(p.id)) {
            candidates.push({
              id: p.id,
              score: keywordScore(p.caption),
              idx: p._idx,
            });
          }
        }
      }
    }
    candidates.sort((a, b) => b.score - a.score || b.idx - a.idx);
    const toAdd = target - total;
    for (let i = 0; i < toAdd && i < candidates.length; i++) {
      recommended.add(candidates[i].id);
    }
  }

  return recommended;
}
