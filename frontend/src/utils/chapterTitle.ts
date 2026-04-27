// 챕터 제목 사용자 편집 — 클라이언트 오버라이드 (localStorage).
// 백엔드 CHAPTER_MAPPING (timeline_service.py) 은 고정이므로
// 사용자가 Timeline 에서 바꾼 제목을 localStorage 에 보관하고,
// Timeline / 앨범 미리보기 모두에서 동일하게 표시한다.

const LS_CHAPTER_TITLES = 'weddinglog_chapter_titles';

// 백엔드 CHAPTER_MAPPING 의 canonical title → key 매핑.
// ⚠️ backend/app/services/timeline_service.py 의 CHAPTER_MAPPING 과 반드시 동기화.
const CANONICAL_TITLE_TO_KEY: Record<string, string> = {
  '함께 쌓아온 날들': 'dating',
  '둘이 함께 준비한 시간': 'preparation',
  '카메라 앞에서, 우리': 'wedding_photo',
  '그 날 — 결혼식': 'ceremony',
  '첫 여행 — 신혼여행': 'honeymoon',
};

export function loadChapterTitleOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_CHAPTER_TITLES);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function saveChapterTitleOverrides(overrides: Record<string, string>): void {
  try {
    localStorage.setItem(LS_CHAPTER_TITLES, JSON.stringify(overrides));
  } catch {
    /* quota or unavailable — silently ignore */
  }
}

/** 단일 오버라이드 갱신 — 캡슐화된 헬퍼. */
export function setChapterTitleOverride(chapterKey: string, newTitle: string): Record<string, string> {
  const next = { ...loadChapterTitleOverrides(), [chapterKey]: newTitle };
  saveChapterTitleOverrides(next);
  return next;
}

/**
 * canonical title 로 오버라이드 적용 (앨범 layout 등 chapter key 가 없는 데이터 용).
 * 매칭 실패 시 원본 제목 반환.
 */
export function applyOverrideByCanonicalTitle(
  canonicalTitle: string,
  overrides?: Record<string, string>,
): string {
  const map = overrides ?? loadChapterTitleOverrides();
  const key = CANONICAL_TITLE_TO_KEY[canonicalTitle];
  return key && map[key] !== undefined ? map[key] : canonicalTitle;
}
