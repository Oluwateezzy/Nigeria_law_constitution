import type { SqlDatabase } from '@/search/driver';

export type Note = {
  id: string;
  sectionId: string | null;
  instrumentId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncState: 'local' | 'pending' | 'synced';
};

export const autosaveIntervalMs = 3000;

const notesSchema = `
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  section_id TEXT,
  instrument_id TEXT,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_state TEXT NOT NULL
);
`;

function readRandomUUID(): (() => string) | null {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi || typeof cryptoApi.randomUUID !== 'function') return null;
  return () => cryptoApi.randomUUID();
}

export function createNoteId(
  randomUUID: (() => string) | null = readRandomUUID(),
): string {
  if (randomUUID) return randomUUID();
  const bytes = new Uint8Array(16);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
  const sixth = bytes[6] ?? 0;
  const eighth = bytes[8] ?? 0;
  bytes[6] = (sixth & 0x0f) | 0x40;
  bytes[8] = (eighth & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function shouldAutosave(
  lastWriteAt: number,
  now: number,
  interval = autosaveIntervalMs,
): boolean {
  return now - lastWriteAt >= interval;
}

export async function ensureNotesTable(db: SqlDatabase): Promise<void> {
  await db.exec(notesSchema);
}

function read(row: Record<string, unknown> | undefined): Note | null {
  if (!row || typeof row.id !== 'string') return null;
  const sync = row.sync_state;
  return {
    id: row.id,
    sectionId: typeof row.section_id === 'string' ? row.section_id : null,
    instrumentId:
      typeof row.instrument_id === 'string' ? row.instrument_id : null,
    body: typeof row.body === 'string' ? row.body : '',
    createdAt: typeof row.created_at === 'string' ? row.created_at : '',
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : '',
    deletedAt: typeof row.deleted_at === 'string' ? row.deleted_at : null,
    syncState: sync === 'pending' || sync === 'synced' ? sync : 'local',
  };
}

export async function readNote(
  db: SqlDatabase,
  id: string,
): Promise<Note | null> {
  const row = await db.get(`SELECT * FROM notes WHERE id = ?`, [id]);
  return read(row);
}

export async function createNote(
  db: SqlDatabase,
  input: {
    sectionId: string | null;
    instrumentId: string | null;
    body: string;
    now: string;
    id?: string;
  },
): Promise<Note> {
  const id = input.id ?? createNoteId();
  await db.run(
    `INSERT INTO notes (
      id, section_id, instrument_id, body, created_at, updated_at, deleted_at, sync_state
    ) VALUES (?, ?, ?, ?, ?, ?, NULL, 'local')`,
    [id, input.sectionId, input.instrumentId, input.body, input.now, input.now],
  );
  const note = await readNote(db, id);
  if (!note) throw new Error('The note was not stored.');
  return note;
}

export async function updateNote(
  db: SqlDatabase,
  id: string,
  body: string,
  now: string,
): Promise<Note> {
  await db.run(
    `UPDATE notes SET body = ?, updated_at = ?, sync_state = 'local' WHERE id = ?`,
    [body, now, id],
  );
  const note = await readNote(db, id);
  if (!note) throw new Error('The note was not stored.');
  return note;
}

export async function tombstoneNote(
  db: SqlDatabase,
  id: string,
  now: string,
): Promise<void> {
  await db.run(
    `UPDATE notes SET deleted_at = ?, updated_at = ?, sync_state = 'local' WHERE id = ?`,
    [now, now, id],
  );
}

export async function listLiving(db: SqlDatabase): Promise<Note[]> {
  const rows = await db.all(
    `SELECT * FROM notes WHERE deleted_at IS NULL ORDER BY updated_at DESC`,
  );
  return rows
    .map((row) => read(row))
    .filter((note): note is Note => note !== null);
}

export async function listBySection(
  db: SqlDatabase,
  sectionId: string,
): Promise<Note[]> {
  const rows = await db.all(
    `SELECT * FROM notes
     WHERE section_id = ? AND deleted_at IS NULL
     ORDER BY updated_at DESC`,
    [sectionId],
  );
  return rows
    .map((row) => read(row))
    .filter((note): note is Note => note !== null);
}

export function readerNote(
  notes: readonly Note[],
  sectionId: string,
): Note | null {
  const living = notes.filter(
    (note) => note.sectionId === sectionId && note.deletedAt === null,
  );
  living.sort((left, right) => (left.updatedAt < right.updatedAt ? 1 : -1));
  return living[0] ?? null;
}

export async function saveDraft(
  db: SqlDatabase,
  input: {
    id: string | null;
    sectionId: string | null;
    instrumentId: string | null;
    body: string;
    now: string;
  },
): Promise<Note | null> {
  if (input.body.trim().length === 0) return null;
  const note = input.id
    ? await updateNote(db, input.id, input.body, input.now)
    : await createNote(db, {
        sectionId: input.sectionId,
        instrumentId: input.instrumentId,
        body: input.body,
        now: input.now,
      });
  console.info(`note-save ${note.id}`);
  return note;
}

export async function listAllNotes(db: SqlDatabase): Promise<Note[]> {
  const rows = await db.all(`SELECT * FROM notes ORDER BY updated_at DESC`);
  return rows
    .map((row) => read(row))
    .filter((note): note is Note => note !== null);
}

export async function replaceNote(db: SqlDatabase, note: Note): Promise<void> {
  await db.run(
    `INSERT INTO notes (
      id, section_id, instrument_id, body, created_at, updated_at, deleted_at, sync_state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      section_id = excluded.section_id,
      instrument_id = excluded.instrument_id,
      body = excluded.body,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at,
      sync_state = excluded.sync_state`,
    [
      note.id,
      note.sectionId,
      note.instrumentId,
      note.body,
      note.createdAt,
      note.updatedAt,
      note.deletedAt,
      note.syncState,
    ],
  );
}

export async function deleteAllNotes(db: SqlDatabase): Promise<void> {
  await db.exec('DELETE FROM notes');
}

export async function dismissDraft(
  db: SqlDatabase,
  input: {
    id: string | null;
    sectionId: string | null;
    instrumentId: string | null;
    body: string;
    now: string;
  },
): Promise<void> {
  if (input.body.trim().length === 0) {
    if (input.id) await tombstoneNote(db, input.id, input.now);
    return;
  }
  await saveDraft(db, input);
}
