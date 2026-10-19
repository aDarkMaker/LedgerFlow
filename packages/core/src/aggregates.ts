import { monthBounds, daysLeftInMonth } from './dates';
import { money, type Money } from './money';

import type { Category, DailyTotal, Entry } from './entities';
export type LedgerTotals = {
  readonly expenseCents: number;
  readonly incomeCents: number;
  readonly netCents: number;
};

/** Soft-deleted entries never participate in aggregates. */
export function liveEntries(entries: readonly Entry[]): Entry[] {
  return entries.filter((entry) => entry.deletedAt === null);
}

export function totalForDate(entries: readonly Entry[], date: string): LedgerTotals {
  let expenseCents = 0;
  let incomeCents = 0;
  for (const entry of liveEntries(entries)) {
    if (entry.occurredOn !== date) {
      continue;
    }
    if (entry.kind === 'expense') {
      expenseCents += entry.amountCents;
    } else {
      incomeCents += entry.amountCents;
    }
  }
  return { expenseCents, incomeCents, netCents: incomeCents - expenseCents };
}

export function entriesForDate(entries: readonly Entry[], date: string): Entry[] {
  return liveEntries(entries)
    .filter((entry) => entry.occurredOn === date)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function entriesForPeriod(entries: readonly Entry[], period: string): Entry[] {
  const { start, end } = monthBounds(period);
  return liveEntries(entries).filter(
    (entry) => entry.occurredOn >= start && entry.occurredOn <= end,
  );
}

export function dailyTotals(entries: readonly Entry[], dates: readonly string[]): DailyTotal[] {
  const buckets = new Map<string, number>(dates.map((date) => [date, 0]));
  for (const entry of liveEntries(entries)) {
    if (entry.kind === 'expense' && buckets.has(entry.occurredOn)) {
      buckets.set(entry.occurredOn, (buckets.get(entry.occurredOn) ?? 0) + entry.amountCents);
    }
  }
  return dates.map((date) => ({ date, totalCents: buckets.get(date) ?? 0 }));
}

export type CategoryTotal = {
  readonly categoryId: string;
  readonly name: string;
  readonly emoji: string;
  readonly color: string;
  readonly totalCents: number;
  readonly share: number;
  readonly entryCount: number;
};

/** Groups expenses by category, sorted by spend so the top item leads the list. */
export function categoryBreakdown(
  entries: readonly Entry[],
  categories: readonly Category[],
): CategoryTotal[] {
  const lookup = new Map(categories.map((category) => [category.id, category]));
  const totals = new Map<string, { totalCents: number; entryCount: number }>();

  for (const entry of liveEntries(entries)) {
    if (entry.kind !== 'expense') {
      continue;
    }
    const current = totals.get(entry.categoryId) ?? { totalCents: 0, entryCount: 0 };
    totals.set(entry.categoryId, {
      totalCents: current.totalCents + entry.amountCents,
      entryCount: current.entryCount + 1,
    });
  }

  const grandTotal = [...totals.values()].reduce((sum, item) => sum + item.totalCents, 0);

  return [...totals.entries()]
    .map(([categoryId, item]) => {
      const category = lookup.get(categoryId);
      return {
        categoryId,
        name: category?.name ?? 'Uncategorised',
        emoji: category?.emoji ?? '🧾',
        color: category?.color ?? '#8A7361',
        totalCents: item.totalCents,
        share: grandTotal === 0 ? 0 : item.totalCents / grandTotal,
        entryCount: item.entryCount,
      };
    })
    .sort((a, b) => b.totalCents - a.totalCents);
}

export type BudgetStatus = {
  readonly budgetCents: number;
  readonly spentCents: number;
  readonly remainingCents: number;
  readonly usedRatio: number;
  readonly dailyAllowanceCents: number;
  readonly projectedCents: number;
};

/** Spreads the remaining budget across the remaining days of the month. */
export function budgetStatus(
  entries: readonly Entry[],
  today: string,
  period: string,
  budgetCents: number,
): BudgetStatus {
  const spentCents = entriesForPeriod(entries, period)
    .filter((entry) => entry.kind === 'expense')
    .reduce((sum, entry) => sum + entry.amountCents, 0);
  const remainingCents = budgetCents - spentCents;
  const daysLeft = Math.max(1, daysLeftInMonth(today, period));
  const { start } = monthBounds(period);
  const elapsedDays = Math.max(1, Number(today.slice(8, 10)) - Number(start.slice(8, 10)) + 1);

  return {
    budgetCents,
    spentCents,
    remainingCents,
    usedRatio: budgetCents === 0 ? 0 : Math.min(1, spentCents / budgetCents),
    dailyAllowanceCents: Math.max(0, Math.floor(remainingCents / daysLeft)),
    projectedCents: Math.round((spentCents / elapsedDays) * (elapsedDays + daysLeft)),
  };
}

export type StreakSummary = {
  readonly current: number;
  readonly longest: number;
  readonly activeToday: boolean;
  readonly lastActiveDate: string | null;
};

/** A streak stays alive if the user logged today or the previous day. */
export function streakSummary(entries: readonly Entry[], today: string): StreakSummary {
  const dates = [...new Set(liveEntries(entries).map((entry) => entry.occurredOn))].sort();
  const active = new Set(dates);
  const activeToday = active.has(today);

  let current = 0;
  let cursor = activeToday ? today : shiftDate(today, -1);
  while (active.has(cursor)) {
    current += 1;
    cursor = shiftDate(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of dates) {
    run = previous !== null && shiftDate(previous, 1) === date ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }

  return {
    current,
    longest,
    activeToday,
    lastActiveDate: dates.length === 0 ? null : (dates[dates.length - 1] ?? null),
  };
}

export function expenseMoney(entries: readonly Entry[], date?: string): Money {
  const scoped = date === undefined ? liveEntries(entries) : entriesForDate(entries, date);
  return money(
    scoped.filter((entry) => entry.kind === 'expense').reduce((sum, e) => sum + e.amountCents, 0),
  );
}

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
