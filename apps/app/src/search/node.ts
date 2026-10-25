import { DatabaseSync } from 'node:sqlite';
import type { SqlDatabase, SqlValue } from './driver';

export function openNodeDatabase(path = ':memory:'): SqlDatabase {
  const db = new DatabaseSync(path);
  return {
    async exec(sql) {
      db.exec(sql);
    },
    async run(sql, params = []) {
      db.prepare(sql).run(...(params as SqlValue[]));
    },
    async get(sql, params = []) {
      const row = db.prepare(sql).get(...(params as SqlValue[]));
      if (!row || typeof row !== 'object') return undefined;
      return row as Record<string, unknown>;
    },
    async all(sql, params = []) {
      return db
        .prepare(sql)
        .all(...(params as SqlValue[])) as Record<string, unknown>[];
    },
    async transaction(task) {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
