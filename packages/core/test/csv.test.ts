import { describe, expect, it } from 'vitest';

import { DEFAULT_CATEGORIES } from '../src/categories';
import { csvFileName, entriesToCsv } from '../src/csv';

import type { Category, Entry } from '../src/entities';

const categories: Category[] = DEFAULT_CATEGORIES.map((category) => ({
  ...category,
  archivedAt: null,
}));

const entries: Entry[] = [
  {
    id: 'e1',
    amountCents: 1234,
    kind: 'expense',
    categoryId: 'cat-food',
    note: 'noodles, extra egg',
    occurredOn: '2026-10-19',
    createdAt: '2026-10-19T10:00:00Z',
    updatedAt: '2026-10-19T10:00:00Z',
    deletedAt: null,
  },
  {
    id: 'e2',
    amountCents: 5000,
    kind: 'income',
    categoryId: 'cat-salary',
    note: 'said "thanks"',
    occurredOn: '2026-10-18',
    createdAt: '2026-10-18T10:00:00Z',
    updatedAt: '2026-10-18T10:00:00Z',
    deletedAt: null,
  },
];

describe('csv export', () => {
  it('emits an ordered header and escapes reserved characters', () => {
    const csv = entriesToCsv(entries, categories);
    expect(csv.split('\n')[0]).toBe('date,kind,amount,category,note');
    expect(csv).toContain('2026-10-19,expense,12.34,Food,"noodles, extra egg"');
    expect(csv).toContain('2026-10-18,income,50.00,Salary,"said ""thanks"""');
  });

  it('names the file after the period', () => {
    expect(csvFileName('2026-10')).toBe('ledgerflow-2026-10.csv');
  });
});
