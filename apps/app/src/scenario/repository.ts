import { listThreadMessages, type ThreadMessage } from '../ask/repository';
import { createNoteId } from '../notes/repository';
import type { SqlDatabase } from '../search/driver';

export type ScenarioThread = {
  id: string;
  title: string;
  updatedAt: string;
};

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export async function listScenarioThreads(
  db: SqlDatabase,
): Promise<ScenarioThread[]> {
  const rows = await db.all(
    `SELECT id, title, updated_at FROM threads
     WHERE kind = 'scenario' AND deleted_at IS NULL
     ORDER BY updated_at DESC`,
  );
  return rows.map((row) => ({
    id: text(row.id),
    title: text(row.title),
    updatedAt: text(row.updated_at),
  }));
}

export async function readScenarioMessages(
  db: SqlDatabase,
  threadId: string,
): Promise<ThreadMessage[]> {
  return listThreadMessages(db, threadId);
}

export async function appendScenarioMessage(
  db: SqlDatabase,
  input: {
    threadId: string | null;
    title: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: ThreadMessage['citations'];
    illustration?: string | null;
    limits?: string[];
    now: string;
  },
): Promise<{ threadId: string; message: ThreadMessage }> {
  let threadId = input.threadId;
  if (!threadId) {
    threadId = createNoteId();
    await db.run(
      `INSERT INTO threads (
        id, kind, section_id, title, created_at, updated_at, deleted_at, sync_state
      ) VALUES (?, 'scenario', NULL, ?, ?, ?, NULL, 'local')`,
      [threadId, input.title, input.now, input.now],
    );
  } else {
    await db.run(
      `UPDATE threads SET updated_at = ?, sync_state = 'local' WHERE id = ?`,
      [input.now, threadId],
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
    [id, threadId, input.role, input.content, payload, input.now],
  );
  return {
    threadId,
    message: {
      id,
      threadId,
      role: input.role,
      content: input.content,
      citations: input.citations ?? null,
      illustration: input.illustration ?? null,
      limits: input.limits ?? [],
      createdAt: input.now,
    },
  };
}

export function scenarioTitle(facts: string): string {
  const line = facts.split('\n')[0]?.trim() ?? '';
  return line.slice(0, 80) || 'Scenario';
}
