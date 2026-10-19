import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  deletedAt: text('deleted_at'),
};

export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    emoji: text('emoji').notNull(),
    color: text('color').notNull(),
    kind: text('kind', { enum: ['expense', 'income'] }).notNull(),
    sort: integer('sort').notNull().default(0),
    archivedAt: text('archived_at'),
    ...timestamps,
  },
  (table) => [index('categories_kind_sort_idx').on(table.kind, table.sort)],
);

export const entries = sqliteTable(
  'entries',
  {
    id: text('id').primaryKey(),
    amountCents: integer('amount_cents').notNull(),
    kind: text('kind', { enum: ['expense', 'income'] }).notNull(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    note: text('note').notNull().default(''),
    occurredOn: text('occurred_on').notNull(),
    ...timestamps,
  },
  (table) => [
    index('entries_occurred_on_idx').on(table.occurredOn),
    index('entries_category_idx').on(table.categoryId),
  ],
);

export const budgets = sqliteTable(
  'budgets',
  {
    id: text('id').primaryKey(),
    period: text('period').notNull(),
    amountCents: integer('amount_cents').notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex('budgets_period_idx').on(table.period)],
);

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey().default('me'),
  currency: text('currency', { enum: ['CNY', 'USD', 'EUR', 'JPY'] })
    .notNull()
    .default('CNY'),
  userId: text('user_id'),
  email: text('email'),
  ...timestamps,
});

/** Local write-ahead queue that keeps the UI usable while offline. */
export const outbox = sqliteTable(
  'outbox',
  {
    id: text('id').primaryKey(),
    entity: text('entity', { enum: ['categories', 'entries', 'budgets', 'profiles'] }).notNull(),
    entityId: text('entity_id').notNull(),
    operation: text('operation', { enum: ['upsert', 'delete'] }).notNull(),
    payload: text('payload').notNull(),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  (table) => [index('outbox_created_at_idx').on(table.createdAt)],
);

export type CategoryRow = typeof categories.$inferSelect;
export type EntryRow = typeof entries.$inferSelect;
export type BudgetRow = typeof budgets.$inferSelect;
export type ProfileRow = typeof profiles.$inferSelect;
export type OutboxRow = typeof outbox.$inferSelect;
