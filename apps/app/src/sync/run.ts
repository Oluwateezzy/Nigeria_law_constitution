import { noteShouldSync, type UploadChoice } from '../account/upload';
import { listAllNotes, replaceNote, type Note } from '../notes/repository';
import type { SqlDatabase } from '../search/driver';
import { mergeSyncedNotes, notesToPush } from './apply';
import type {
  RemoteMessage,
  RemotePosition,
  RemoteThread,
  SyncGateway,
} from './gateway';
import { mergeRows } from './plan';

export async function runSync(
  db: SqlDatabase,
  gateway: SyncGateway,
  input: {
    choice: UploadChoice;
    choiceAt: string;
    position: RemotePosition | null;
  },
): Promise<RemotePosition | null> {
  const local = await listAllNotes(db);
  const outgoing = notesToPush(local, input.choice, input.choiceAt);
  if (outgoing.length > 0) await gateway.upsertNotes(outgoing);
  const remote = await gateway.listNotes();
  const merged = mergeSyncedNotes(
    local,
    remote,
    new Set(outgoing.map((note) => note.id)),
  );
  for (const note of merged) await replaceNote(db, note);

  const localThreads = await listThreads(db);
  const localMessages = await listMessages(db);
  const outgoingThreads = localThreads.filter(
    (thread) =>
      noteShouldSync(thread.updatedAt, input.choice, input.choiceAt) ||
      localMessages.some(
        (message) =>
          message.threadId === thread.id &&
          noteShouldSync(message.createdAt, input.choice, input.choiceAt),
      ),
  );
  if (outgoingThreads.length > 0) await gateway.upsertThreads(outgoingThreads);
  const remoteThreads = await gateway.listThreads();
  const pushedThreads = new Set(outgoingThreads.map((thread) => thread.id));
  const mergedThreads = mergeRows(localThreads, remoteThreads);
  for (const thread of mergedThreads) {
    await writeThread(
      db,
      thread,
      rowSyncState(thread, localThreads, remoteThreads, pushedThreads),
    );
  }

  const remoteThreadIds = new Set(remoteThreads.map((thread) => thread.id));
  const outgoingMessages = localMessages.filter(
    (message) =>
      noteShouldSync(message.createdAt, input.choice, input.choiceAt) &&
      (pushedThreads.has(message.threadId) ||
        remoteThreadIds.has(message.threadId)),
  );
  if (outgoingMessages.length > 0) {
    await gateway.upsertMessages(outgoingMessages);
  }
  const remoteMessages = await gateway.listMessages();
  const localMessageIds = new Set(localMessages.map((message) => message.id));
  for (const message of remoteMessages) {
    if (localMessageIds.has(message.id)) continue;
    await insertMessage(db, message);
  }

  if (
    input.position &&
    (input.choice === 'upload' || input.position.updatedAt > input.choiceAt)
  ) {
    await gateway.upsertPosition(input.position);
  }
  const remotePosition = await gateway.listPosition();
  if (
    remotePosition &&
    (!input.position || remotePosition.updatedAt > input.position.updatedAt)
  ) {
    return remotePosition;
  }
  return input.position;
}

type LocalThread = RemoteThread & { syncState: string };

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

async function listThreads(db: SqlDatabase): Promise<LocalThread[]> {
  const rows = await db.all(
    `SELECT id, kind, section_id, title, created_at, updated_at, deleted_at, sync_state
     FROM threads`,
  );
  return rows.map((row) => ({
    id: text(row.id),
    kind: text(row.kind),
    sectionId: textOrNull(row.section_id),
    title: text(row.title),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
    deletedAt: textOrNull(row.deleted_at),
    syncState: text(row.sync_state) || 'local',
  }));
}

async function listMessages(db: SqlDatabase): Promise<RemoteMessage[]> {
  const rows = await db.all(
    `SELECT id, thread_id, role, content, citations, created_at FROM messages`,
  );
  return rows.map((row) => ({
    id: text(row.id),
    threadId: text(row.thread_id),
    role: text(row.role),
    content: text(row.content),
    citations: textOrNull(row.citations),
    createdAt: text(row.created_at),
  }));
}

function rowSyncState(
  row: { id: string; updatedAt: string; deletedAt: string | null },
  local: readonly { id: string; syncState: string }[],
  remote: readonly {
    id: string;
    updatedAt: string;
    deletedAt: string | null;
  }[],
  pushed: ReadonlySet<string>,
): string {
  if (pushed.has(row.id)) return 'synced';
  const fromServer = remote.find((item) => item.id === row.id);
  if (
    fromServer &&
    fromServer.updatedAt === row.updatedAt &&
    fromServer.deletedAt === row.deletedAt
  ) {
    return 'synced';
  }
  return local.find((item) => item.id === row.id)?.syncState ?? 'synced';
}

async function writeThread(
  db: SqlDatabase,
  thread: RemoteThread,
  syncState: string,
): Promise<void> {
  await db.run(
    `INSERT INTO threads (
      id, kind, section_id, title, created_at, updated_at, deleted_at, sync_state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      kind = excluded.kind,
      section_id = excluded.section_id,
      title = excluded.title,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at,
      sync_state = excluded.sync_state
    WHERE excluded.updated_at >= threads.updated_at`,
    [
      thread.id,
      thread.kind,
      thread.sectionId,
      thread.title,
      thread.createdAt,
      thread.updatedAt,
      thread.deletedAt,
      syncState,
    ],
  );
}

async function insertMessage(
  db: SqlDatabase,
  message: RemoteMessage,
): Promise<void> {
  await db.run(
    `INSERT OR IGNORE INTO messages (
      id, thread_id, role, content, citations, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      message.id,
      message.threadId,
      message.role,
      message.content,
      message.citations,
      message.createdAt,
    ],
  );
}

export function syncedNote(note: Note): Note {
  return { ...note, syncState: 'synced' };
}
