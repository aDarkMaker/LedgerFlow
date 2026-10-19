import { describe, expect, it } from 'vitest';

import {
  budgetStatus,
  categoryBreakdown,
  dailyTotals,
  entriesForDate,
  entriesForPeriod,
  expenseMoney,
  liveEntries,
  streakSummary,
  totalForDate,
} from '../src/aggregates';
import { DEFAULT_CATEGORIES } from '../src/categories';

import type { Category, Entry } from '../src/entities';

const categories: Category[] = DEFAULT_CATEGORIES.map((category) => ({
  ...category,
  archivedAt: null,
}));

function entry(
  overrides: Partial<Entry> & Pick<Entry, 'id' | 'amountCents' | 'occurredOn'>,
): Entry {
  return {
    kind: 'expense',
    categoryId: 'cat-food',
    note: '',
    createdAt: `${overrides.occurredOn}T10:00:00.000Z`,
    updatedAt: `${overrides.occurredOn}T10:00:00.000Z`,
    deletedAt: null,
    ...overrides,
  };
}

const entries: Entry[] = [
  entry({ id: 'e1', amountCents: 3200, occurredOn: '2026-10-18' }),
  entry({
    id: 'e2',
    amountCents: 1800,
    occurredOn: '2026-10-19',
    createdAt: '2026-10-19T10:00:00.000Z',
  }),
  entry({
    id: 'e3',
    amountCents: 500,
    occurredOn: '2026-10-19',
    categoryId: 'cat-coffee',
    createdAt: '2026-10-19T11:00:00.000Z',
  }),
  entry({
    id: 'e4',
    amountCents: 9000,
    occurredOn: '2026-10-19',
    kind: 'income',
    createdAt: '2026-10-19T12:00:00.000Z',
  }),
  entry({
    id: 'e5',
    amountCents: 700,
    occurredOn: '2026-10-17',
    deletedAt: '2026-10-17T11:00:00Z',
  }),
  entry({ id: 'e6', amountCents: 4000, occurredOn: '2026-09-30' }),
];

describe('aggregates', () => {
  it('excludes soft-deleted rows', () => {
    expect(liveEntries(entries).map((item) => item.id)).not.toContain('e5');
  });

  it('totals a single day by direction', () => {
    expect(totalForDate(entries, '2026-10-19')).toEqual({
      expenseCents: 2300,
      incomeCents: 9000,
      netCents: 6700,
    });
  });

  it('sorts the daily timeline newest first', () => {
    expect(entriesForDate(entries, '2026-10-19').map((item) => item.id)).toEqual([
      'e4',
      'e3',
      'e2',
    ]);
  });

  it('scopes entries to a month', () => {
    expect(entriesForPeriod(entries, '2026-10').map((item) => item.id)).toEqual([
      'e1',
      'e2',
      'e3',
      'e4',
    ]);
  });

  it('fills zero buckets for missing days', () => {
    expect(dailyTotals(entries, ['2026-10-17', '2026-10-18', '2026-10-19'])).toEqual([
      { date: '2026-10-17', totalCents: 0 },
      { date: '2026-10-18', totalCents: 3200 },
      { date: '2026-10-19', totalCents: 2300 },
    ]);
  });

  it('ranks categories by spend', () => {
    const breakdown = categoryBreakdown(entriesForPeriod(entries, '2026-10'), categories);
    expect(breakdown.map((item) => item.categoryId)).toEqual(['cat-food', 'cat-coffee']);
    expect(breakdown[0]?.share).toBeCloseTo(5000 / 5500, 5);
    expect(breakdown[1]?.entryCount).toBe(1);
  });

  it('spreads the remaining budget across remaining days', () => {
    const status = budgetStatus(entries, '2026-10-19', '2026-10', 100000);
    expect(status.spentCents).toBe(5500);
    expect(status.remainingCents).toBe(94500);
    expect(status.dailyAllowanceCents).toBe(Math.floor(94500 / 13));
    expect(status.usedRatio).toBeCloseTo(0.055, 5);
    expect(status.projectedCents).toBeGreaterThan(0);
  });

  it('keeps the streak alive when active yesterday', () => {
    expect(streakSummary(entries, '2026-10-19')).toMatchObject({
      current: 2,
      activeToday: true,
      lastActiveDate: '2026-10-19',
    });
    expect(streakSummary(entries, '2026-10-20').current).toBe(2);
    expect(streakSummary(entries, '2026-10-25').current).toBe(0);
  });

  it('returns expense money for a scoped date', () => {
    expect(expenseMoney(entries, '2026-10-19').amountCents).toBe(2300);
    expect(expenseMoney(entries).amountCents).toBe(9500);
  });
});
