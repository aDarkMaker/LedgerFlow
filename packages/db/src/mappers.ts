import type { Budget, Category, Entry, Profile } from '@ledgerflow/core';

import type { BudgetRow, CategoryRow, EntryRow, ProfileRow } from './schema';

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    kind: row.kind,
    sort: row.sort,
    archivedAt: row.archivedAt,
  };
}

export function toEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    amountCents: row.amountCents,
    kind: row.kind,
    categoryId: row.categoryId,
    note: row.note,
    occurredOn: row.occurredOn,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

export function toBudget(row: BudgetRow): Budget {
  return { id: row.id, period: row.period, amountCents: row.amountCents };
}

export function toProfile(row: ProfileRow): Profile {
  return {
    currency: row.currency,
    monthBudgetCents: 0,
    email: row.email,
    displayName: row.displayName,
    avatarFileName: row.avatarFileName,
    wallpaperFileName: row.wallpaperFileName,
  };
}
