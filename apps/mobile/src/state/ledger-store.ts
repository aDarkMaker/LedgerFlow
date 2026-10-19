import { create } from 'zustand';

import {
  budgetStatus,
  categoryBreakdown,
  entriesForDate,
  entriesForPeriod,
  monthKey,
  streakSummary,
  todayIso,
  type BudgetStatus,
  type Category,
  type CategoryTotal,
  type Entry,
  type NewEntryInput,
  type StreakSummary,
} from '@ledgerflow/core';
import {
  acknowledgeChanges,
  countPendingChanges,
  enqueueChange,
  getBudget,
  insertEntry,
  listCategories,
  listEntriesForMonth,
  pendingChanges,
  softDeleteEntry,
  upsertBudget,
  type EntryRow,
} from '@ledgerflow/db';
import {
  createRemoteGateway,
  createSyncEngine,
  isSupabaseConfigured,
  supabase,
} from '@ledgerflow/sync';

import { getDatabase } from '@/lib/database';
import { createId, nowIso } from '@/lib/id';

type LedgerState = {
  readonly ready: boolean;
  readonly selectedDate: string;
  readonly period: string;
  readonly entries: readonly Entry[];
  readonly categories: readonly Category[];
  readonly budgetCents: number;
  readonly pendingCount: number;
  readonly error: string | null;
  bootstrap: () => Promise<void>;
  selectDate: (date: string) => Promise<void>;
  reload: () => Promise<void>;
  addEntry: (input: NewEntryInput) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  saveBudget: (amountCents: number) => Promise<void>;
  refreshPending: () => Promise<void>;
  flushOutbox: () => Promise<void>;
};

export const useLedgerStore = create<LedgerState>((set, get) => ({
  ready: false,
  selectedDate: todayIso(),
  period: monthKey(todayIso()),
  entries: [],
  categories: [],
  budgetCents: 0,
  pendingCount: 0,
  error: null,

  async bootstrap() {
    const { db } = getDatabase();
    const period = monthKey(todayIso());
    const [categoryRows, entryRows, budgetRow] = await Promise.all([
      listCategories(db),
      listEntriesForMonth(db, period),
      getBudget(db, period),
    ]);
    await get().refreshPending();
    set({
      ready: true,
      period,
      categories: categoryRows.map(toCategoryEntity),
      entries: entryRows.map(toEntryEntity),
      budgetCents: budgetRow?.amountCents ?? 0,
    });
  },

  async selectDate(date) {
    const period = monthKey(date);
    set({ selectedDate: date, period });
    await get().reload();
  },

  async reload() {
    const { db } = getDatabase();
    const period = get().period;
    const [categoryRows, entryRows, budgetRow] = await Promise.all([
      listCategories(db),
      listEntriesForMonth(db, period),
      getBudget(db, period),
    ]);
    set({
      categories: categoryRows.map(toCategoryEntity),
      entries: entryRows.map(toEntryEntity),
      budgetCents: budgetRow?.amountCents ?? 0,
    });
  },

  async addEntry(input) {
    const { db } = getDatabase();
    const id = createId();
    const now = nowIso();
    const row: EntryRow = {
      id,
      amountCents: input.amountCents,
      kind: input.kind,
      categoryId: input.categoryId,
      note: input.note ?? '',
      occurredOn: input.occurredOn,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.transaction(async (tx) => {
      await insertEntry(tx, row);
      await enqueueChange(tx, {
        id: createId(),
        entity: 'entries',
        entityId: id,
        operation: 'upsert',
        payload: row,
      });
    });

    set((state) => ({
      entries: [toEntryEntity(row), ...state.entries],
      selectedDate: input.occurredOn,
      period: monthKey(input.occurredOn),
    }));
    await get().refreshPending();
  },

  async removeEntry(id) {
    const { db } = getDatabase();
    const now = nowIso();
    await db.transaction(async (tx) => {
      await softDeleteEntry(tx, id, now);
      await enqueueChange(tx, {
        id: createId(),
        entity: 'entries',
        entityId: id,
        operation: 'delete',
        payload: { id },
      });
    });

    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.id === id ? { ...entry, deletedAt: now, updatedAt: now } : entry,
      ),
    }));
    await get().refreshPending();
  },

  async saveBudget(amountCents) {
    const { db } = getDatabase();
    const period = get().period;
    const now = nowIso();
    await db.transaction(async (tx) => {
      await upsertBudget(tx, period, amountCents, now);
      await enqueueChange(tx, {
        id: createId(),
        entity: 'budgets',
        entityId: period,
        operation: 'upsert',
        payload: { id: period, period, amount_cents: amountCents, updated_at: now },
      });
    });
    set({ budgetCents: amountCents });
    await get().refreshPending();
  },

  async refreshPending() {
    const { db } = getDatabase();
    const pendingCount = await countPendingChanges(db);
    set({ pendingCount });
  },

  async flushOutbox() {
    if (!isSupabaseConfigured) {
      return;
    }
    const { db } = getDatabase();
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id ?? null;
    if (userId === null) {
      return;
    }

    const engine = createSyncEngine({
      outbox: {
        pending: async (limit) => pendingChanges(db, limit),
        ack: async (ids) => acknowledgeChanges(db, ids),
        fail: (_id, message) => {
          set({ error: message });
          return Promise.resolve();
        },
      },
      remote: createRemoteGateway({ client: supabase, userId: () => userId }),
    });

    try {
      await engine.run();
      await get().refreshPending();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Sync failed' });
    }
  },
}));

export type LedgerView = {
  readonly dayEntries: readonly Entry[];
  readonly monthEntries: readonly Entry[];
  readonly dayExpenseCents: number;
  readonly monthExpenseCents: number;
  readonly breakdown: readonly CategoryTotal[];
  readonly budget: BudgetStatus;
  readonly streak: StreakSummary;
};

/** Single selector keeps derived data memoised for the screens. */
let cachedView: LedgerView | null = null;
let cachedInputs: readonly unknown[] = [];

export function selectLedgerView(state: LedgerState): LedgerView {
  const inputs = [
    state.entries,
    state.selectedDate,
    state.period,
    state.categories,
    state.budgetCents,
  ];
  if (cachedView !== null && inputs.every((value, index) => value === cachedInputs[index])) {
    return cachedView;
  }

  const dayEntries = entriesForDate(state.entries, state.selectedDate);
  const monthEntries = entriesForPeriod(state.entries, state.period);
  const dayExpenseCents = dayEntries
    .filter((entry) => entry.kind === 'expense')
    .reduce((sum, entry) => sum + entry.amountCents, 0);
  const monthExpenseCents = monthEntries
    .filter((entry) => entry.kind === 'expense')
    .reduce((sum, entry) => sum + entry.amountCents, 0);

  cachedInputs = inputs;
  cachedView = {
    dayEntries,
    monthEntries,
    dayExpenseCents,
    monthExpenseCents,
    breakdown: categoryBreakdown(monthEntries, state.categories),
    budget: budgetStatus(state.entries, state.selectedDate, state.period, state.budgetCents),
    streak: streakSummary(state.entries, todayIso()),
  };
  return cachedView;
}

function toCategoryEntity(row: Awaited<ReturnType<typeof listCategories>>[number]): Category {
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

function toEntryEntity(row: EntryRow): Entry {
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
