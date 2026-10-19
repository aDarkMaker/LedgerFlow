import { describe, expect, it } from 'vitest';

import { toBudget, toCategory, toEntry } from '../src/mappers';
import { newEntryRow } from '../src/repositories/entries';

describe('row mappers', () => {
  it('maps a category row', () => {
    expect(
      toCategory({
        id: 'cat-food',
        name: 'Food',
        emoji: '🍜',
        color: '#FF7F50',
        kind: 'expense',
        sort: 0,
        archivedAt: null,
        createdAt: '2026-10-19T00:00:00.000Z',
        updatedAt: '2026-10-19T00:00:00.000Z',
        deletedAt: null,
      }),
    ).toEqual({
      id: 'cat-food',
      name: 'Food',
      emoji: '🍜',
      color: '#FF7F50',
      kind: 'expense',
      sort: 0,
      archivedAt: null,
    });
  });

  it('maps an entry row and preserves tombstones', () => {
    const entry = toEntry({
      id: 'e1',
      amountCents: 1234,
      kind: 'expense',
      categoryId: 'cat-food',
      note: '',
      occurredOn: '2026-10-19',
      createdAt: '2026-10-19T10:00:00.000Z',
      updatedAt: '2026-10-19T10:00:00.000Z',
      deletedAt: '2026-10-19T11:00:00.000Z',
    });
    expect(entry.deletedAt).toBe('2026-10-19T11:00:00.000Z');
    expect(entry.amountCents).toBe(1234);
  });

  it('maps a budget row', () => {
    expect(
      toBudget({
        id: '2026-10',
        period: '2026-10',
        amountCents: 300000,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
        deletedAt: null,
      }),
    ).toEqual({ id: '2026-10', period: '2026-10', amountCents: 300000 });
  });
});

describe('newEntryRow', () => {
  it('defaults the note and stamps timestamps', () => {
    const row = newEntryRow(
      {
        amountCents: 990,
        kind: 'expense',
        categoryId: 'cat-coffee',
        occurredOn: '2026-10-19',
      },
      'entry-1',
      '2026-10-19T10:00:00.000Z',
    );

    expect(row).toEqual({
      id: 'entry-1',
      amountCents: 990,
      kind: 'expense',
      categoryId: 'cat-coffee',
      note: '',
      occurredOn: '2026-10-19',
      createdAt: '2026-10-19T10:00:00.000Z',
      updatedAt: '2026-10-19T10:00:00.000Z',
      deletedAt: null,
    });
  });
});
