import { createNoteId } from '../notes/repository';
import type { SqlDatabase } from '../search/driver';

export type ThreadMessage = {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  citations: { sectionId: string; quote: string }[] | null;
  illustration: string | null;
  limits: string[];
  createdAt: string;
};

type ThreadRow = {
  id: string;
  sectionId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export async function livingThread(
  db: SqlDatabase,
  sectionId: string,
): Promise<ThreadRow | null> {
  const row = await db.get(
    `SELECT id, section_id, title, created_at, updated_at, deleted_at
     FROM threads
     WHERE kind = 'provision' AND section_id = ? AND deleted_at IS NULL
     ORDER BY updated_at DESC
     LIMIT 1`,
    [sectionId],
  );
  if (!row) return null;
  return {
    id: text(row.id),
    sectionId: text(row.section_id),
    title: text(row.title),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
    deletedAt: null,
  };
}

export async function listThreadMessages(
  db: SqlDatabase,
  threadId: string,
): Promise<ThreadMessage[]> {
  const rows = await db.all(
    `SELECT id, thread_id, role, content, citations, created_at
     FROM messages WHERE thread_id = ? ORDER BY created_at`,
    [threadId],
  );
  return rows.map((row) => {
    const raw = text(row.citations);
    let citations: ThreadMessage['citations'] = null;
    let illustration: string | null = null;
    let limits: string[] = [];
    if (raw) {
      const parsed = JSON.parse(raw) as {
        citations?: ThreadMessage['citations'];
        illustration?: string | null;
        limits?: string[];
      };
      citations = parsed.citations ?? null;
      illustration = parsed.illustration ?? null;
      limits = parsed.limits ?? [];
    }
    return {
      id: text(row.id),
      threadId: text(row.thread_id),
      role: text(row.role) === 'assistant' ? 'assistant' : 'user',
      content: text(row.content),
      citations,
      illustration,
      limits,
      createdAt: text(row.created_at),
    };
  });
}

export async function appendThreadMessage(
  db: SqlDatabase,
  input: {
    sectionId: string;
    title: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: ThreadMessage['citations'];
    illustration?: string | null;
    limits?: string[];
    now: string;
  },
): Promise<ThreadMessage> {
  let thread = await livingThread(db, input.sectionId);
  if (!thread) {
    const id = createNoteId();
    await db.run(
      `INSERT INTO threads (
        id, kind, section_id, title, created_at, updated_at, deleted_at, sync_state
      ) VALUES (?, 'provision', ?, ?, ?, ?, NULL, 'local')`,
      [id, input.sectionId, input.title, input.now, input.now],
    );
    thread = {
      id,
      sectionId: input.sectionId,
      title: input.title,
      createdAt: input.now,
      updatedAt: input.now,
      deletedAt: null,
    };
  } else {
    await db.run(
      `UPDATE threads SET updated_at = ?, sync_state = 'local' WHERE id = ?`,
      [input.now, thread.id],
    );
  }
  const id = createNoteId();
  const payload = JSON.stringify({
    citations: input.citations ?? null,
    illustration: input.illustration ?? null,
    limits: input.limits ?? [],
  });
  await db.run(
    `INSERT INTO messages (id, thread_id, role, content, citations, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, thread.id, input.role, input.content, payload, input.now],
  );
  return {
    id,
    threadId: thread.id,
    role: input.role,
    content: input.content,
    citations: input.citations ?? null,
    illustration: input.illustration ?? null,
    limits: input.limits ?? [],
    createdAt: input.now,
  };
}

export async function clearThread(
  db: SqlDatabase,
  sectionId: string,
  now: string,
): Promise<void> {
  const thread = await livingThread(db, sectionId);
  if (!thread) return;
  await db.run(
    `UPDATE threads
     SET deleted_at = ?, updated_at = ?, sync_state = 'local'
     WHERE id = ?`,
    [now, now, thread.id],
  );
}
