export type EntryKind = 'expense' | 'income';

import { isIsoDate } from './dates';

export type EntryId = string;
export type CategoryId = string;

export type Category = {
  readonly id: CategoryId;
  readonly name: string;
  readonly emoji: string;
  readonly color: string;
  readonly kind: EntryKind;
  readonly sort: number;
  readonly archivedAt: string | null;
};

export type Entry = {
  readonly id: EntryId;
  readonly amountCents: number;
  readonly kind: EntryKind;
  readonly categoryId: CategoryId;
  readonly note: string;
  readonly occurredOn: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
};

export type Budget = {
  readonly id: string;
  readonly period: string;
  readonly amountCents: number;
};

export type Profile = {
  readonly currency: 'CNY' | 'USD' | 'EUR' | 'JPY';
  readonly monthBudgetCents: number;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly avatarFileName: string | null;
  readonly wallpaperFileName: string | null;
};

export type CategoryGroup = {
  readonly categoryId: CategoryId;
  readonly name: string;
  readonly emoji: string;
  readonly color: string;
  readonly totalCents: number;
  readonly share: number;
  readonly entryCount: number;
};

export type DailyTotal = {
  readonly date: string;
  readonly totalCents: number;
};

export type NewEntryInput = {
  readonly amountCents: number;
  readonly kind: EntryKind;
  readonly categoryId: CategoryId;
  readonly note?: string;
  readonly occurredOn: string;
};

export type EntryValidationError =
  | 'amount-required'
  | 'amount-not-positive'
  | 'amount-too-large'
  | 'category-required'
  | 'date-invalid';

export type EntryValidationResult =
  { readonly ok: true } | { readonly ok: false; readonly errors: readonly EntryValidationError[] };

const MAX_ENTRY_CENTS = 10_000_000_00;

export function validateEntry(input: NewEntryInput): EntryValidationResult {
  const errors: EntryValidationError[] = [];

  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    errors.push(input.amountCents === 0 ? 'amount-required' : 'amount-not-positive');
  }
  if (input.amountCents > MAX_ENTRY_CENTS) {
    errors.push('amount-too-large');
  }
  if (input.categoryId.trim() === '') {
    errors.push('category-required');
  }
  if (!isIsoDate(input.occurredOn)) {
    errors.push('date-invalid');
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
