// @TASK P1-S0-T2 - useDday 훅
// @SPEC docs/planning/06-tasks.md#P1-S0-T2

/**
 * 결혼일까지의 D-day를 계산한다.
 *
 * @param weddingDate - 결혼 예정일 (string | Date | null | undefined)
 * @returns { dDay: number, label: string }
 *   dDay: 미래=음수(D-N), 과거=양수(D+N), 당일=0
 *   label: "D-30" | "D+14" | "D-Day"
 */
export default function useDday(
  weddingDate: string | Date | null | undefined
): { dDay: number; label: string } {
  const today = new Date();
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const target = new Date(weddingDate as string | Date);
  const targetMidnight = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  // 미래면 음수, 과거면 양수
  const dDay = Math.round(
    (todayMidnight.getTime() - targetMidnight.getTime()) / MS_PER_DAY
  );

  let label: string;
  if (dDay === 0) {
    label = 'D-Day';
  } else if (dDay < 0) {
    label = `D${dDay}`; // dDay는 이미 음수 → "D-30"
  } else {
    label = `D+${dDay}`;
  }

  return { dDay, label };
}
