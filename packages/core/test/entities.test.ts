import { describe, expect, it } from 'vitest';

import { validateEntry } from '../src/entities';

describe('entry validation', () => {
  const base = {
    amountCents: 1000,
    kind: 'expense',
    categoryId: 'cat-food',
    occurredOn: '2026-10-19',
  } as const;

  it('accepts a well formed entry', () => {
    expect(validateEntry(base)).toEqual({ ok: true });
  });

  it('requires a positive integer amount', () => {
    expect(validateEntry({ ...base, amountCents: 0 })).toEqual({
      ok: false,
      errors: ['amount-required'],
    });
    expect(validateEntry({ ...base, amountCents: -5 })).toEqual({
      ok: false,
      errors: ['amount-not-positive'],
    });
    expect(validateEntry({ ...base, amountCents: 10_000_000_01 })).toEqual({
      ok: false,
      errors: ['amount-too-large'],
    });
  });

  it('rejects blank categories and bad dates', () => {
    expect(validateEntry({ ...base, categoryId: '  ', occurredOn: '2026-13-01' })).toEqual({
      ok: false,
      errors: ['category-required', 'date-invalid'],
    });
  });
});
