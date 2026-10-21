import {
  applyMigrations,
  migrationBundle,
  openLedgerDatabase,
  seedDefaultCategories,
  type LedgerDatabase,
} from '@ledgerflow/db';

let handle: LedgerDatabase | null = null;

/** Lazily opens the store so the splash screen stays the first frame. */
export function getDatabase(): LedgerDatabase {
  if (handle === null) {
    throw new Error('Database is not ready. Call prepareDatabase() first.');
  }
  return handle;
}

export async function prepareDatabase(): Promise<LedgerDatabase> {
  handle ??= await openLedgerDatabase();
  await applyMigrations(handle.raw, migrationBundle);
  await seedDefaultCategories(handle.db);
  return handle;
}

export async function closeDatabase(): Promise<void> {
  await handle?.close();
  handle = null;
}
