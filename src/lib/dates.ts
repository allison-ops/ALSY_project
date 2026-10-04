const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function addDays(s: string, n: number): string {
  const d = parseDateStr(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

/** 本週以週一為起點，回傳週日 */
export function endOfWeek(s: string): string {
  const day = parseDateStr(s).getDay();
  return addDays(s, (7 - day) % 7);
}

export function nextMonday(s: string): string {
  const day = parseDateStr(s).getDay();
  return addDays(s, ((8 - day) % 7) || 7);
}

export function weekdayLabel(s: string): string {
  return `週${WEEKDAYS[parseDateStr(s).getDay()]}`;
}

export function shortDate(s: string, today: string): string {
  const d = parseDateStr(s);
  const md = `${d.getMonth() + 1}/${d.getDate()}`;
  return s.slice(0, 4) === today.slice(0, 4) ? md : `${d.getFullYear()}/${md}`;
}

export type DueTone = "overdue" | "today" | "soon" | "normal";

export function describeDue(
  due: string,
  today: string,
): { label: string; tone: DueTone } {
  if (due < today) return { label: `逾期 · ${shortDate(due, today)}`, tone: "overdue" };
  if (due === today) return { label: "今天", tone: "today" };
  if (due === addDays(today, 1)) return { label: "明天", tone: "soon" };
  return { label: `${shortDate(due, today)}（${weekdayLabel(due)}）`, tone: "normal" };
}

export function timestampToDateStr(ts: number): string {
  return toDateStr(new Date(ts));
}
