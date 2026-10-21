import {
  drizzle,
  type AsyncRemoteCallback,
  type SqliteRemoteDatabase,
} from 'drizzle-orm/sqlite-proxy';
import { openDatabaseAsync, type SQLiteBindValue, type SQLiteDatabase } from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'ledgerflow.db';

export type LedgerDb = SqliteRemoteDatabase<typeof schema>;

export type LedgerDatabase = {
  readonly db: LedgerDb;
  readonly raw: SQLiteDatabase;
  close: () => Promise<void>;
};

/** Structural subset shared by the root client and transaction handles. */
export type DbExecutor = Pick<LedgerDb, 'select' | 'insert' | 'update' | 'delete'>;

type ProxyMethod = 'run' | 'all' | 'values' | 'get';
type ProxyResult = Awaited<ReturnType<AsyncRemoteCallback>>;

/** Routes drizzle through expo-sqlite async APIs so web never hits prepareSync. */
async function proxyQuery(
  raw: SQLiteDatabase,
  query: string,
  params: unknown[],
  method: ProxyMethod,
): Promise<ProxyResult> {
  const binds = params as SQLiteBindValue[];

  if (method === 'run') {
    await raw.runAsync(query, binds);
    return { rows: [] };
  }

  const statement = await raw.prepareAsync(query);
  try {
    const result = await statement.executeForRawResultAsync(binds);
    if (method === 'get') {
      // sqlite-proxy treats `rows` as the row itself for get (not a list of rows).
      const row = await result.getFirstAsync();
      return { rows: row as ProxyResult['rows'] };
    }
    return { rows: (await result.getAllAsync()) as ProxyResult['rows'] };
  } finally {
    await statement.finalizeAsync();
  }
}

/** Opens the local store and enables WAL so reads never block a write. */
export async function openLedgerDatabase(name: string = DATABASE_NAME): Promise<LedgerDatabase> {
  const raw = await openDatabaseAsync(name, { enableChangeListener: true });
  await raw.execAsync('PRAGMA journal_mode = WAL;');
  await raw.execAsync('PRAGMA foreign_keys = ON;');

  const db = drizzle(async (query, params, method) => proxyQuery(raw, query, params, method), {
    schema,
  });

  return {
    db,
    raw,
    close: () => raw.closeAsync(),
  };
}
