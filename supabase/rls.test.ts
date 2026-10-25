import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

const userA = '11111111-1111-4111-8111-111111111111';
const userB = '22222222-2222-4222-8222-222222222222';
const noteA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const noteB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const threadA = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

async function database(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(`
    create schema if not exists auth;
    create or replace function auth.uid()
    returns uuid
    language sql
    stable
    as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
  `);
  const migration = readFileSync(
    new URL('./migrations/20261025160000_account.sql', import.meta.url),
    'utf8',
  );
  await db.exec(migration);
  await db.exec(`
    grant anon to current_user;
    grant authenticated to current_user;
  `);
  await db.exec(
    `insert into auth.users (id) values ('${userA}'), ('${userB}')`,
  );
  return db;
}

async function asUser<T>(
  db: PGlite,
  userId: string,
  sql: string,
): Promise<T[]> {
  await db.exec('begin');
  try {
    await db.exec(
      `select set_config('request.jwt.claim.sub', '${userId}', true)`,
    );
    await db.exec('set local role authenticated');
    const result = await db.query<T>(sql);
    await db.exec('commit');
    return result.rows;
  } catch (error) {
    await db.exec('rollback');
    throw error;
  }
}

describe('account row level security', () => {
  it('lets user A read only their own note and thread', async () => {
    const db = await database();
    await db.exec(`
      insert into public.notes (
        id, user_id, section_id, instrument_id, body, created_at, updated_at
      ) values
        ('${noteA}', '${userA}', 'cfrn-1999:s:36', 'cfrn-1999', 'A note', now(), now()),
        ('${noteB}', '${userB}', 'cfrn-1999:s:39', 'cfrn-1999', 'B note', now(), now());
      insert into public.threads (
        id, user_id, kind, title, created_at, updated_at
      ) values
        ('${threadA}', '${userA}', 'provision', 'Fair hearing', now(), now());
    `);

    const notes = await asUser<{ id: string }>(
      db,
      userA,
      'select id from public.notes order by id',
    );
    const threads = await asUser<{ id: string }>(
      db,
      userA,
      'select id from public.threads',
    );
    expect(notes.map((row) => row.id)).toEqual([noteA]);
    expect(threads.map((row) => row.id)).toEqual([threadA]);

    const hidden = await asUser<{ id: string }>(
      db,
      userB,
      `select id from public.notes where id = '${noteA}'`,
    );
    expect(hidden).toEqual([]);
  });

  it('does not grant the client insert or update on quota or entitlements', async () => {
    const db = await database();
    const grants = await db.query<{
      table_name: string;
      grantee: string;
      privilege_type: string;
    }>(`
      select table_name, grantee, privilege_type
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name in ('quota_usage', 'entitlements')
        and grantee in ('anon', 'authenticated', 'PUBLIC')
        and privilege_type in ('INSERT', 'UPDATE')
    `);
    expect(grants.rows).toEqual([]);
  });

  it('deletes only the signed-in user and still hides the other user', async () => {
    const db = await database();
    await db.exec(`
      insert into public.notes (
        id, user_id, body, created_at, updated_at
      ) values
        ('${noteA}', '${userA}', 'A note', now(), now()),
        ('${noteB}', '${userB}', 'B note', now(), now());
    `);
    await asUser(db, userA, 'select public.delete_own_account()');
    const remaining = await asUser<{ id: string }>(
      db,
      userB,
      'select id from public.notes order by id',
    );
    expect(remaining.map((row) => row.id)).toEqual([noteB]);
    const gone = await db.query<{ id: string }>(
      `select id from auth.users where id = '${userA}'`,
    );
    expect(gone.rows).toEqual([]);
  });

  it('has no key, secret, or token column on notes or threads', async () => {
    const db = await database();
    const columns = await db.query<{ table_name: string; column_name: string }>(
      `
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name in ('notes', 'threads', 'messages')
    `,
    );
    const named = columns.rows.filter((column) =>
      /key|secret|token/i.test(column.column_name),
    );
    expect(named).toEqual([]);
  });
});
