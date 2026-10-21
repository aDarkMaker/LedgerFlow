import type { MigrationBundle } from './migrations.types';
import type { SQLiteDatabase } from 'expo-sqlite';

const MIGRATIONS_TABLE = '__drizzle_migrations';

/**
 * Applies the SQL migration journal with expo-sqlite async APIs.
 * Drizzle's expo migrator still routes through prepareSync and trips the web warning.
 */
export async function applyMigrations(raw: SQLiteDatabase, bundle: MigrationBundle): Promise<void> {
  await raw.execAsync(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash text NOT NULL,
      created_at numeric
    )
  `);

  const last = await raw.getFirstAsync<{ created_at: number | string }>(
    `SELECT created_at FROM ${MIGRATIONS_TABLE} ORDER BY created_at DESC LIMIT 1`,
  );
  const lastAt = last === null ? -1 : Number(last.created_at);

  await raw.withTransactionAsync(async () => {
    for (const entry of bundle.journal.entries) {
      if (entry.when <= lastAt) {
        continue;
      }
      const key = `m${String(entry.idx).padStart(4, '0')}`;
      const sql = bundle.migrations[key];
      if (sql === undefined) {
        throw new Error(`Missing migration: ${entry.tag}`);
      }
      for (const statement of sql.split('--> statement-breakpoint')) {
        const trimmed = statement.trim();
        if (trimmed.length === 0) {
          continue;
        }
        await raw.execAsync(trimmed);
      }
      await raw.runAsync(
        `INSERT INTO ${MIGRATIONS_TABLE} ("hash", "created_at") VALUES (?, ?)`,
        '',
        entry.when,
      );
    }
  });
}
