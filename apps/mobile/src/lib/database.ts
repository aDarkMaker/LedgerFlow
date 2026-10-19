import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

import {
  migrationBundle,
  openLedgerDatabase,
  seedDefaultCategories,
  type LedgerDatabase,
} from '@ledgerflow/db';

let handle: LedgerDatabase | null = null;

/** Lazily opens the store so the splash screen stays the first frame. */
export function getDatabase(): LedgerDatabase {
  if (handle === null) {
    handle = openLedgerDatabase();
  }
  return handle;
}

export async function prepareDatabase(): Promise<LedgerDatabase> {
  const database = getDatabase();
  await migrate(database.db, migrationBundle);
  await seedDefaultCategories(database.db);
  return database;
}

export function closeDatabase(): void {
  handle?.close();
  handle = null;
}
