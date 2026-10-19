import { desc, eq } from 'drizzle-orm';

import { budgets, profiles } from '../schema';

import type { DbExecutor } from '../client';

export async function getBudget(db: DbExecutor, period: string) {
  const rows = await db.select().from(budgets).where(eq(budgets.period, period)).limit(1);
  return rows[0] ?? null;
}

export async function upsertBudget(
  db: DbExecutor,
  period: string,
  amountCents: number,
  now: string,
) {
  await db
    .insert(budgets)
    .values({ id: period, period, amountCents, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: budgets.period,
      set: { amountCents, updatedAt: now },
    });
}

export async function listRecentBudgets(db: DbExecutor, limit = 12) {
  return db.select().from(budgets).orderBy(desc(budgets.period)).limit(limit);
}

export async function getProfile(db: DbExecutor) {
  const rows = await db.select().from(profiles).where(eq(profiles.id, 'me')).limit(1);
  return rows[0] ?? null;
}

export async function upsertProfile(
  db: DbExecutor,
  patch: Partial<typeof profiles.$inferInsert>,
  now: string,
) {
  const existing = await getProfile(db);
  if (existing === null) {
    await db.insert(profiles).values({ id: 'me', ...patch, createdAt: now, updatedAt: now });
    return;
  }
  await db
    .update(profiles)
    .set({ ...patch, updatedAt: now })
    .where(eq(profiles.id, 'me'));
}
