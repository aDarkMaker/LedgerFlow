import { describe, expect, it } from 'vitest';

import {
  addDays,
  dateRange,
  daysLeftInMonth,
  isIsoDate,
  lastNDates,
  monthBounds,
  monthKey,
  monthProgress,
  todayIso,
} from '../src/dates';

describe('dates', () => {
  it('formats local dates without timezone drift', () => {
    expect(todayIso(new Date(2026, 9, 19))).toBe('2026-10-19');
  });

  it('validates iso date strings', () => {
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('19-10-2026')).toBe(false);
  });

  it('moves across month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(dateRange('2026-02-27', '2026-03-01')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
    ]);
    expect(lastNDates('2026-10-19', 3)).toEqual(['2026-10-17', '2026-10-18', '2026-10-19']);
  });

  it('derives month metadata', () => {
    expect(monthKey('2026-10-19')).toBe('2026-10');
    expect(monthBounds('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    expect(daysLeftInMonth('2026-10-19', '2026-10')).toBe(13);
    expect(daysLeftInMonth('2026-11-02', '2026-10')).toBe(0);
    expect(monthProgress('2026-10-10', '2026-10')).toBeCloseTo(10 / 31, 5);
  });
});
