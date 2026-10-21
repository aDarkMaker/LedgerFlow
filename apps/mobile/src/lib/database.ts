import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseAsync } from 'expo-sqlite';
import { Platform } from 'react-native';

import {
  DATABASE_NAME,
  migrationBundle,
  openLedgerDatabase,
  seedDefaultCategories,
  type LedgerDatabase,
} from '@ledgerflow/db';

let handle: LedgerDatabase | null = null;
let warmUp: Promise<void> | null = null;

/**
 * The web driver boots its worker and wasm lazily, so the first synchronous
 * call spins on a fixed budget and throws before the worker is ready.
 */
function warmUpWebDriver(): Promise<void> {
  if (Platform.OS !== 'web') {
    return Promise.resolve();
  }
  warmUp ??= (async () => {
    const probe = await openDatabaseAsync(DATABASE_NAME);
    await probe.closeAsync();
  })();
  return warmUp;
}

/** Lazily opens the store so the splash screen stays the first frame. */
export function getDatabase(): LedgerDatabase {
  if (handle === null) {
    handle = openLedgerDatabase();
  }
  return handle;
}

export async function prepareDatabase(): Promise<LedgerDatabase> {
  await warmUpWebDriver();
  const database = getDatabase();
  await migrate(database.db, migrationBundle);
  await seedDefaultCategories(database.db);
  return database;
}

export function closeDatabase(): void {
  handle?.close();
  handle = null;
  warmUp = null;
}
