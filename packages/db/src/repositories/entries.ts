import { and, desc, eq, gte, isNull, lte } from 'drizzle-orm';

import { monthBounds, type Entry, type NewEntryInput } from '@ledgerflow/core';

import { entries } from '../schema';

import type { DbExecutor } from '../client';

export function newEntryRow(input: NewEntryInput, id: string, now: string) {
  return {
    id,
    amountCents: input.amountCents,
    kind: input.kind,
    categoryId: input.categoryId,
    note: input.note ?? '',
    occurredOn: input.occurredOn,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  } satisfies typeof entries.$inferInsert;
}

export async function listEntriesForMonth(db: DbExecutor, period: string) {
  const { start, end } = monthBounds(period);
  return db
    .select()
    .from(entries)
    .where(
      and(isNull(entries.deletedAt), gte(entries.occurredOn, start), lte(entries.occurredOn, end)),
    )
    .orderBy(desc(entries.occurredOn), desc(entries.createdAt));
}

export async function listEntriesForDate(db: DbExecutor, date: string) {
  return db
    .select()
    .from(entries)
    .where(and(isNull(entries.deletedAt), eq(entries.occurredOn, date)))
    .orderBy(desc(entries.createdAt));
}

export async function insertEntry(db: DbExecutor, row: typeof entries.$inferInsert) {
  await db.insert(entries).values(row);
}

export async function updateEntry(
  db: DbExecutor,
  id: string,
  patch: Partial<Pick<Entry, 'amountCents' | 'categoryId' | 'note' | 'occurredOn'>>,
  now: string,
) {
  const values: Partial<typeof entries.$inferInsert> = { updatedAt: now };
  if (patch.amountCents !== undefined) values.amountCents = patch.amountCents;
  if (patch.categoryId !== undefined) values.categoryId = patch.categoryId;
  if (patch.note !== undefined) values.note = patch.note;
  if (patch.occurredOn !== undefined) values.occurredOn = patch.occurredOn;
  await db.update(entries).set(values).where(eq(entries.id, id));
}

/** Soft delete keeps tombstones available for the sync engine. */
export async function softDeleteEntry(db: DbExecutor, id: string, now: string) {
  await db.update(entries).set({ deletedAt: now, updatedAt: now }).where(eq(entries.id, id));
}
