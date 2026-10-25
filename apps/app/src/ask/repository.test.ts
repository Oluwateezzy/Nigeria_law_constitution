import { describe, expect, it } from 'vitest';
import { ensureNotesTable } from '../notes/repository';
import { openNodeDatabase } from '../search/node';
import { ensureSyncTables } from '../sync/schema';
import { appendThreadMessage, listThreadMessages, livingThread } from './repository';

describe('provision threads', () => {
  it('round-trips a message and its citation', async () => {
    const db = openNodeDatabase();
    await ensureNotesTable(db);
    await ensureSyncTables(db);
    const saved = await appendThreadMessage(db, {
      sectionId: 'cfrn-1999:s:36',
      title: 'Right to fair hearing',
      role: 'assistant',
      content: 'This explains the loaded text.',
      citations: [{ sectionId: 'cfrn-1999:s:36', quote: 'fair hearing' }],
      illustration: 'Illustration: a person waits for a hearing.',
      now: '2026-10-25T12:00:00.000Z',
    });
    const thread = await livingThread(db, 'cfrn-1999:s:36');
    const messages = await listThreadMessages(db, saved.threadId);
    expect(thread?.id).toBe(saved.threadId);
    expect(messages[0]?.citations).toEqual([
      { sectionId: 'cfrn-1999:s:36', quote: 'fair hearing' },
    ]);
    expect(messages[0]?.illustration).toMatch(/Illustration/);
  });
});
