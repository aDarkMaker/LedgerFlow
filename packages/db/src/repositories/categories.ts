import { and, asc, eq, isNull } from 'drizzle-orm';

import { DEFAULT_CATEGORIES } from '@ledgerflow/core';

import { categories } from '../schema';

import type { DbExecutor } from '../client';

export async function listCategories(db: DbExecutor, kind?: 'expense' | 'income') {
  const filters = [isNull(categories.archivedAt)];
  if (kind !== undefined) {
    filters.push(eq(categories.kind, kind));
  }
  return db
    .select()
    .from(categories)
    .where(and(...filters))
    .orderBy(asc(categories.sort));
}

export async function insertCategory(db: DbExecutor, category: typeof categories.$inferInsert) {
  await db.insert(categories).values(category);
}

export async function archiveCategory(db: DbExecutor, id: string, now: string) {
  await db.update(categories).set({ archivedAt: now, updatedAt: now }).where(eq(categories.id, id));
}

/** Seeds defaults once; ids are stable so re-running is harmless. */
export async function seedDefaultCategories(db: DbExecutor): Promise<void> {
  const existing = await db.select({ id: categories.id }).from(categories).limit(1);
  if (existing.length > 0) {
    return;
  }
  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map((category) => ({
      id: category.id,
      name: category.name,
      emoji: category.emoji,
      color: category.color,
      kind: category.kind,
      sort: category.sort,
    })),
  );
}
