/** Calendar dates are stored as plain local dates to avoid timezone drift. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayIso(now: Date = new Date()): string {
  return toIsoDate(now);
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function addDays(value: string, days: number): string {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** Returns every date from start to end inclusive, ordered ascending. */
export function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = start;
  let guard = 0;
  while (cursor <= end && guard < 7_000) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return dates;
}

export function monthKey(value: string): string {
  return value.slice(0, 7);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

export function monthBounds(period: string): { start: string; end: string } {
  const [year, month] = period.split('-').map(Number);
  const start = new Date(year ?? 1970, (month ?? 1) - 1, 1);
  const end = new Date(year ?? 1970, month ?? 1, 0);
  return { start: toIsoDate(start), end: toIsoDate(end) };
}

export function lastNDates(end: string, days: number): string[] {
  return dateRange(addDays(end, -(days - 1)), end);
}

/** Fraction of the month already elapsed, clamped to (0, 1]. */
export function monthProgress(today: string, period: string): number {
  const { start, end } = monthBounds(period);
  const totalDays = dateRange(start, end).length;
  const elapsed = dateRange(start, today > end ? end : today).length;
  return Math.min(1, Math.max(0, elapsed / totalDays));
}

export function daysLeftInMonth(today: string, period: string): number {
  const { end } = monthBounds(period);
  if (today > end) {
    return 0;
  }
  return dateRange(today, end).length;
}
