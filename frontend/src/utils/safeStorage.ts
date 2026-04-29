// localStorage 안전 헬퍼.
//
// 다음 환경에서 localStorage 가 throw 한다:
//   - Safari Private Browsing (setItem → QuotaExceededError)
//   - 일부 앱 내장 브라우저 (window.localStorage 자체가 undefined)
//   - 디스크 가득 참 / 정책 차단
//
// 모든 호출을 try/catch 로 감싸 *조용히 실패* 하도록 한다.
// 실패는 throw 하지 않아, 호출 측이 "저장 안 되면 임시 메모리만 사용"
// 흐름을 자연스럽게 유지할 수 있다.
//
// 가용성 검사는 매 호출마다 수행 — 테스트가 window.localStorage 를 교체하는
// 시나리오에서도 정확히 동작하도록 하기 위함.

function ls(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export const safeStorage = {
  /** 값을 반환하거나, 키가 없거나 접근 실패 시 null. */
  get(key: string): string | null {
    const s = ls();
    if (!s) return null;
    try {
      return s.getItem(key);
    } catch {
      return null;
    }
  },

  /** 저장 성공 시 true, 실패 시 false (throw 하지 않음). */
  set(key: string, value: string): boolean {
    const s = ls();
    if (!s) return false;
    try {
      s.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  remove(key: string): void {
    const s = ls();
    if (!s) return;
    try {
      s.removeItem(key);
    } catch {
      /* ignore */
    }
  },

  /** JSON 파싱까지 한 번에. 파싱 실패는 fallback. */
  getJson<T>(key: string, fallback: T): T {
    const raw = this.get(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  /** JSON 직렬화 후 저장. 직렬화 실패까지 안전. */
  setJson(key: string, value: unknown): boolean {
    try {
      return this.set(key, JSON.stringify(value));
    } catch {
      return false;
    }
  },
};
