// @TASK PhotoCurationModal — 앨범 만들기 직전 사진 정리
//   · 이벤트별 그룹핑 (Timeline 응답을 펼쳐서)
//   · 60/70/80/90 프리셋으로 AI 추천 일괄 적용
//   · 개별 토글 / 이벤트 일괄 토글
//   · 클릭 시 큰 미리보기
//   · 캡션 옆 D-day 표시
//
// 휴리스틱 (recommendByTarget):
//   1. 이벤트별 cap (사진 수에 따라 차등)
//      - n<=3: 그대로
//      - 4<=n<=6: ceil(n*0.6)
//      - 7<=n: max(4, ceil(n*0.4))
//   2. 베스트 키워드(이 컷, 노을, 둘, 우리, 커플, 💍, 🌊…) 점수 → 동점 시 sort_order 큰 것
//   3. target 매수에 맞춰 미세 조정 (전체 비율로 ±조정)
import React, { useEffect, useMemo, useState } from 'react';
import type { Chapter, TimelinePhoto } from '../types/timeline';
import { photoUrl } from '../utils/photo';

const COVER_KEYWORDS = [
  '둘', '우리', '커플', '함께', '이 컷', '앨범 표지', '앨범 확정', '앨범行',
  '베스트', '하이라이트', '노을', '선셋', '🤍', '💍', '🌊', '맞대고', '손잡고',
  '키스', '포옹',
];

const PRESETS = [60, 70, 80, 90] as const;
type PresetTarget = (typeof PRESETS)[number];

// 페이지 수 추정 (T1=1, T2=2 위주, 챕터당 표지 1)
function estimatePages(selectedCount: number, chapterCount: number): number {
  if (selectedCount <= 0) return 0;
  // 챕터 표지(T5) chapterCount 페이지 + 나머지 사진을 2장씩 T2 + 잔여 1=T1
  const remaining = Math.max(0, selectedCount - chapterCount);
  const t2 = Math.floor(remaining / 2);
  const t1 = remaining % 2;
  return chapterCount + t2 + t1;
}

interface EventGroup {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  category: string;
  photos: (TimelinePhoto & { _idx: number })[];
}

interface ChapterGroup {
  chapterTitle: string;
  events: EventGroup[];
  totalPhotos: number;
}

// Timeline chapters → 이벤트별 그룹핑
function groupByEvent(chapters: Chapter[]): ChapterGroup[] {
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

// D-day 계산 (event_date - wedding_date)
function calcDday(eventDate: string, weddingDate: string): string {
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

// 베스트 키워드 점수
function keywordScore(caption: string | null): number {
  if (!caption) return 0;
  const lower = caption.toLowerCase();
  let score = 0;
  for (const kw of COVER_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) score += 1;
  }
  return score;
}

// 이벤트당 cap
function capPerEvent(n: number): number {
  if (n <= 3) return n;
  if (n <= 6) return Math.ceil(n * 0.6);
  return Math.max(4, Math.ceil(n * 0.4));
}

// 추천 알고리즘 — target 매수에 맞춰 selected set 반환
function recommendByTarget(
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

// ─────────────────────────────────────────────────────────────────────────
interface Props {
  chapters: Chapter[];
  weddingDate: string | null;
  onConfirm: (selectedIds: string[]) => void;
  onClose: () => void;
}

export default function PhotoCurationModal({
  chapters,
  weddingDate,
  onConfirm,
  onClose,
}: Props) {
  const groups = useMemo(() => groupByEvent(chapters), [chapters]);
  const totalAll = useMemo(
    () => groups.reduce((acc, g) => acc + g.totalPhotos, 0),
    [groups],
  );

  const [target, setTarget] = useState<PresetTarget>(70);
  const [selected, setSelected] = useState<Set<string>>(() =>
    recommendByTarget(groups, 70),
  );
  const [zoom, setZoom] = useState<TimelinePhoto | null>(null);

  // target 바뀌면 자동 재추천 (사용자 토글은 유지하지 않음 — 단순함을 위해)
  useEffect(() => {
    setSelected(recommendByTarget(groups, target));
  }, [target, groups]);

  const togglePhoto = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEvent = (ev: EventGroup) => {
    const allSelected = ev.photos.every((p) => selected.has(p.id));
    setSelected((prev) => {
      const next = new Set(prev);
      ev.photos.forEach((p) => {
        if (allSelected) next.delete(p.id);
        else next.add(p.id);
      });
      return next;
    });
  };

  const selectAll = () => {
    const next = new Set<string>();
    groups.forEach((g) => g.events.forEach((e) => e.photos.forEach((p) => next.add(p.id))));
    setSelected(next);
  };

  const selectNone = () => setSelected(new Set());

  const reapplyAi = () => setSelected(recommendByTarget(groups, target));

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
  };

  const selectedCount = selected.size;
  const chapterWithSelected = groups.filter((ch) =>
    ch.events.some((e) => e.photos.some((p) => selected.has(p.id))),
  ).length;
  const estimated = estimatePages(selectedCount, chapterWithSelected);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사진 정리"
      className="fixed inset-0 z-[1500] bg-ink/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-bg w-full max-w-[1080px] max-h-[92vh] flex flex-col rounded">
        {/* 헤더 */}
        <div className="flex items-baseline justify-between px-6 py-4 border-b border-line">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-coral mb-1">
              CURATION
            </p>
            <h3 className="font-display-md text-[20px] text-ink">
              앨범에 담을 사진 정리
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="text-ink-muted hover:text-ink text-[20px] leading-none px-2"
          >
            ×
          </button>
        </div>

        {/* 컨트롤바 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 px-6 py-4 border-b border-line bg-bg-soft">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-ink-muted whitespace-nowrap">
              추천 매수
            </span>
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setTarget(p)}
                className={`px-3 py-1 text-[12px] rounded-full border transition-colors ${
                  target === p
                    ? 'bg-coral text-white border-coral'
                    : 'bg-bg text-ink-muted border-line hover:border-coral hover:text-coral'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button
              onClick={reapplyAi}
              className="px-3 py-1.5 text-[12px] text-ink-muted hover:text-coral underline-offset-4 hover:underline"
            >
              자동 추천 다시 적용
            </button>
            <button
              onClick={selectAll}
              className="px-3 py-1.5 text-[12px] text-ink-muted hover:text-ink"
            >
              전체 선택
            </button>
            <button
              onClick={selectNone}
              className="px-3 py-1.5 text-[12px] text-ink-muted hover:text-ink"
            >
              전체 해제
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {groups.map((ch) => (
            <section key={ch.chapterTitle} className="mb-8">
              <div className="flex items-baseline gap-3 border-b border-line pb-2 mb-4">
                <h4 className="font-display-md text-[16px] text-ink">
                  {ch.chapterTitle}
                </h4>
                <span className="text-[11px] text-ink-muted">
                  {ch.events.reduce(
                    (a, e) => a + e.photos.filter((p) => selected.has(p.id)).length,
                    0,
                  )}
                  /{ch.totalPhotos}장
                </span>
              </div>

              {ch.events.map((ev) => {
                const evSelected = ev.photos.filter((p) => selected.has(p.id)).length;
                const allChecked = evSelected === ev.photos.length;
                const someChecked = evSelected > 0 && !allChecked;
                const dday = weddingDate ? calcDday(ev.eventDate, weddingDate) : '';

                return (
                  <div key={ev.eventId} className="mb-5">
                    <div className="flex items-baseline justify-between mb-2">
                      <button
                        onClick={() => toggleEvent(ev)}
                        className="flex items-baseline gap-2 group"
                      >
                        <span
                          aria-hidden="true"
                          className={`inline-block w-3.5 h-3.5 rounded-sm border align-middle ${
                            allChecked
                              ? 'bg-coral border-coral'
                              : someChecked
                                ? 'bg-coral/40 border-coral'
                                : 'bg-bg border-outline'
                          }`}
                        />
                        <span className="text-[13px] font-medium text-ink group-hover:text-coral transition-colors">
                          {ev.eventTitle}
                        </span>
                        {dday && (
                          <span className="text-[10px] text-ink-muted font-mono">
                            {dday}
                          </span>
                        )}
                      </button>
                      <span className="text-[11px] text-ink-muted">
                        {evSelected}/{ev.photos.length}장
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {ev.photos.map((p) => {
                        const isOn = selected.has(p.id);
                        return (
                          <div key={p.id} className="relative group">
                            <button
                              type="button"
                              onClick={() => togglePhoto(p.id)}
                              className={`block w-full aspect-square overflow-hidden bg-bg-soft transition-opacity ${
                                isOn ? '' : 'opacity-40'
                              }`}
                              aria-pressed={isOn}
                              aria-label={p.caption || '사진'}
                            >
                              <img
                                src={photoUrl(p.file_url)}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              <span
                                aria-hidden="true"
                                className={`absolute top-1.5 left-1.5 w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold border ${
                                  isOn
                                    ? 'bg-coral border-coral text-white'
                                    : 'bg-bg/70 border-outline text-transparent'
                                }`}
                              >
                                ✓
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setZoom(p)}
                              className="absolute bottom-1 right-1 w-5 h-5 rounded-sm bg-bg/85 text-ink-muted hover:bg-coral hover:text-white text-[10px] leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="확대"
                              title="확대해 보기"
                            >
                              ⤢
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
        </div>

        {/* 푸터 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-4 border-t border-line bg-bg-soft">
          <div className="text-[13px] text-ink-muted">
            <span className="text-ink font-medium">{selectedCount}</span>장 선택됨{' '}
            <span className="text-line mx-1">·</span> 약{' '}
            <span className="text-ink font-medium">{estimated}</span>페이지 예상
            <span className="text-line mx-1">·</span> 총 {totalAll}장 중
          </div>
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className="px-6 py-2.5 rounded-full bg-coral text-white text-[14px] font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            이 사진들로 앨범 만들기 →
          </button>
        </div>
      </div>

      {/* 확대 미리보기 */}
      {zoom && (
        <div
          className="fixed inset-0 z-[1700] bg-ink/90 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setZoom(null)}
        >
          <button
            onClick={() => setZoom(null)}
            aria-label="닫기"
            className="absolute top-4 right-4 text-white/80 hover:text-white text-[24px] leading-none"
          >
            ×
          </button>
          <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-4">
            <img
              src={photoUrl(zoom.file_url)}
              alt={zoom.caption || ''}
              className="max-w-full max-h-[80vh] object-contain"
            />
            {zoom.caption && (
              <p className="text-white/90 text-[14px] text-center max-w-[600px]">
                {zoom.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
