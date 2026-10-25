import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import wasmAsset from '@sqlite.org/sqlite-wasm/sqlite3.wasm';
import type { SqlDatabase, SqlValue } from './driver';

type SqliteHandle = {
  exec(sql: string, options?: { bind?: SqlValue[] }): unknown;
  selectObjects(sql: string, bind?: SqlValue[]): Record<string, SqlValue>[];
};

type SqliteModule = {
  oo1: { DB: new (filename: string, flags: string) => SqliteHandle };
};

function wasmHref(asset: string | { uri?: string }): string {
  if (typeof asset === 'string') return asset;
  return asset.uri ?? '';
}

let opening: Promise<SqlDatabase> | null = null;

function wrap(db: SqliteHandle): SqlDatabase {
  return {
    async exec(sql) {
      db.exec(sql);
    },
    async run(sql, params = []) {
      db.exec(sql, { bind: params });
    },
    async get(sql, params = []) {
      const [row] = db.selectObjects(sql, params);
      return row as Record<string, unknown> | undefined;
    },
    async all(sql, params = []) {
      return db.selectObjects(sql, params) as Record<string, unknown>[];
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

export function openExpoSearchDatabase(): Promise<SqlDatabase> {
  const start = sqlite3InitModule as unknown as (options?: {
    locateFile?: (file: string) => string;
  }) => Promise<SqliteModule>;
  opening ??= start({
    locateFile: (file) =>
      file.endsWith('.wasm') ? wasmHref(wasmAsset) : file,
  }).then((sqlite3) => {
    const db = new sqlite3.oo1.DB(':memory:', 'c');
    return wrap(db);
  });
  return opening;
}
