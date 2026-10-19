import { asc, sql } from 'drizzle-orm';

import { outbox } from '../schema';

import type { DbExecutor } from '../client';

export type OutboxEntity = typeof outbox.$inferInsert.entity;
export type OutboxOperation = typeof outbox.$inferInsert.operation;

export async function enqueueChange(
  db: DbExecutor,
  change: {
    id: string;
    entity: OutboxEntity;
    entityId: string;
    operation: OutboxOperation;
    payload: unknown;
  },
) {
  await db.insert(outbox).values({
    id: change.id,
    entity: change.entity,
    entityId: change.entityId,
    operation: change.operation,
    payload: JSON.stringify(change.payload),
    attempts: 0,
  });
}

export async function pendingChanges(db: DbExecutor, limit = 100) {
  return db.select().from(outbox).orderBy(asc(outbox.createdAt)).limit(limit);
}

export async function countPendingChanges(db: DbExecutor): Promise<number> {
  const rows = await db.select({ total: sql<number>`count(*)` }).from(outbox);
  return rows[0]?.total ?? 0;
}

export async function acknowledgeChanges(db: DbExecutor, ids: readonly string[]) {
  for (const id of ids) {
    await db.delete(outbox).where(sql`${outbox.id} = ${id}`);
  }
}

export async function recordFailure(db: DbExecutor, id: string, error: string) {
  await db
    .update(outbox)
    .set({ attempts: sql`${outbox.attempts} + 1`, lastError: error })
    .where(sql`${outbox.id} = ${id}`);
}
