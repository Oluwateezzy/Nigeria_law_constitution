import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { SqlDatabase, SqlValue } from './driver';

function wrap(db: SQLiteDatabase): SqlDatabase {
  return {
    async exec(sql) {
      await db.execAsync(sql);
    },
    async run(sql, params = []) {
      await db.runAsync(sql, ...(params as SqlValue[]));
    },
    async get(sql, params = []) {
      const row = await db.getFirstAsync<Record<string, unknown>>(
        sql,
        ...(params as SqlValue[]),
      );
      return row ?? undefined;
    },
    async all(sql, params = []) {
      return db.getAllAsync<Record<string, unknown>>(
        sql,
        ...(params as SqlValue[]),
      );
    },
    async transaction(task) {
      await db.withTransactionAsync(task);
    },
  };
}

export async function openExpoSearchDatabase(): Promise<SqlDatabase> {
  return wrap(await openDatabaseAsync('search.db'));
}
