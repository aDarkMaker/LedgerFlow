import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'ledgerflow.db';

export type LedgerDb = ReturnType<typeof drizzle<typeof schema>>;

export type LedgerDatabase = {
  readonly db: LedgerDb;
  readonly raw: SQLiteDatabase;
  close: () => void;
};

/** Structural subset shared by the root client and transaction handles. */
export type DbExecutor = Pick<LedgerDb, 'select' | 'insert' | 'update' | 'delete'>;

/** Opens the local store and enables WAL so reads never block a write. */
export function openLedgerDatabase(name: string = DATABASE_NAME): LedgerDatabase {
  const raw = openDatabaseSync(name, { enableChangeListener: true });
  raw.execSync('PRAGMA journal_mode = WAL;');
  raw.execSync('PRAGMA foreign_keys = ON;');
  return {
    db: drizzle(raw, { schema }),
    raw,
    close: () => raw.closeSync(),
  };
}
