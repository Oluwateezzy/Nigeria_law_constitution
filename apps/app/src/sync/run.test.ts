import { describe, expect, it } from 'vitest';
import {
  createNote,
  ensureNotesTable,
  listAllNotes,
} from '../notes/repository';
import { openNodeDatabase } from '../search/node';
import { ensureSyncTables } from './schema';
import type { SyncGateway } from './gateway';
import { runSync } from './run';

describe('sync run', () => {
  it('pushes a newer local note and keeps an older tombstone from winning', async () => {
    const db = openNodeDatabase();
    await ensureNotesTable(db);
    await ensureSyncTables(db);
    const local = await createNote(db, {
      id: '11111111-1111-4111-8111-111111111111',
      sectionId: 'cfrn-1999:s:36',
      instrumentId: 'cfrn-1999',
      body: 'edited on this device',
      now: '2026-10-25T12:00:00.000Z',
    });
    const sent: string[] = [];
    const gateway: SyncGateway = {
      async upsertNotes(notes) {
        sent.push(...notes.map((note) => note.body));
      },
      async listNotes() {
        return [
          {
            ...local,
            body: 'old server',
            updatedAt: '2026-10-25T09:00:00.000Z',
            deletedAt: '2026-10-25T09:00:00.000Z',
            syncState: 'synced',
          },
        ];
      },
      async upsertThreads() {},
      async listThreads() {
        return [];
      },
      async upsertMessages() {},
      async listMessages() {
        return [];
      },
      async upsertPosition() {},
      async listPosition() {
        return null;
      },
      async deleteAccount() {},
    };
    await runSync(db, gateway, {
      choice: 'upload',
      choiceAt: '2026-10-25T11:00:00.000Z',
      position: null,
    });
    expect(sent).toEqual(['edited on this device']);
    const stored = await listAllNotes(db);
    expect(stored[0]?.body).toBe('edited on this device');
    expect(stored[0]?.deletedAt).toBeNull();
    expect(stored[0]?.syncState).toBe('synced');
  });

  it('uploads a later thread and message, and keeps an older thread local', async () => {
    const db = openNodeDatabase();
    await ensureNotesTable(db);
    await ensureSyncTables(db);
    await db.run(
      `INSERT INTO threads (
        id, kind, section_id, title, created_at, updated_at, deleted_at, sync_state
      ) VALUES (?, 'section', NULL, ?, ?, ?, NULL, 'local')`,
      [
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        'kept on this device',
        '2026-10-25T08:00:00.000Z',
        '2026-10-25T08:00:00.000Z',
      ],
    );
    await db.run(
      `INSERT INTO threads (
        id, kind, section_id, title, created_at, updated_at, deleted_at, sync_state
      ) VALUES (?, 'section', 'cfrn-1999:s:36', ?, ?, ?, NULL, 'local')`,
      [
        'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        'edited on this device',
        '2026-10-25T12:00:00.000Z',
        '2026-10-25T12:00:00.000Z',
      ],
    );
    await db.run(
      `INSERT INTO messages (id, thread_id, role, content, citations, created_at)
       VALUES (?, ?, 'user', ?, NULL, ?)`,
      [
        'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        'question from this device',
        '2026-10-25T12:05:00.000Z',
      ],
    );
    const sentThreads: string[] = [];
    const sentMessages: string[] = [];
    const gateway: SyncGateway = {
      async upsertNotes() {},
      async listNotes() {
        return [];
      },
      async upsertThreads(threads) {
        sentThreads.push(...threads.map((thread) => thread.id));
      },
      async listThreads() {
        return [
          {
            id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            kind: 'section',
            sectionId: 'cfrn-1999:s:36',
            title: 'old server',
            createdAt: '2026-10-25T09:00:00.000Z',
            updatedAt: '2026-10-25T09:00:00.000Z',
            deletedAt: '2026-10-25T09:00:00.000Z',
          },
        ];
      },
      async upsertMessages(messages) {
        sentMessages.push(...messages.map((message) => message.id));
      },
      async listMessages() {
        return [
          {
            id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
            threadId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            role: 'assistant',
            content: 'from the other device',
            citations: null,
            createdAt: '2026-10-25T12:06:00.000Z',
          },
        ];
      },
      async upsertPosition() {},
      async listPosition() {
        return null;
      },
      async deleteAccount() {},
    };
    await runSync(db, gateway, {
      choice: 'keep',
      choiceAt: '2026-10-25T11:00:00.000Z',
      position: null,
    });
    expect(sentThreads).toEqual(['dddddddd-dddd-4ddd-8ddd-dddddddddddd']);
    expect(sentMessages).toEqual(['eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee']);
    const threads = await db.all(
      'SELECT id, title, deleted_at, sync_state FROM threads ORDER BY updated_at',
    );
    expect(threads[0]).toMatchObject({
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      title: 'kept on this device',
      sync_state: 'local',
    });
    expect(threads[1]).toMatchObject({
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      title: 'edited on this device',
      deleted_at: null,
      sync_state: 'synced',
    });
    const messages = await db.all(
      'SELECT id, content FROM messages ORDER BY created_at',
    );
    expect(messages.map((row) => row.content)).toEqual([
      'question from this device',
      'from the other device',
    ]);
  });

  it('syncs note title field with last-write-wins merge', async () => {
    const db = openNodeDatabase();
    await ensureNotesTable(db);
    await ensureSyncTables(db);

    // 1. Create a note locally with a custom title
    const local = await createNote(db, {
      id: '22222222-2222-4222-8222-222222222222',
      sectionId: 'cfrn-1999:s:36',
      instrumentId: 'cfrn-1999',
      title: 'Local Title',
      body: 'Local body',
      now: '2026-10-25T14:00:00.000Z',
    });

    let sentTitle: string | null = null;
    const gateway: SyncGateway = {
      async upsertNotes(notes) {
        sentTitle = notes[0]?.title ?? null;
      },
      async listNotes() {
        return [
          // Remote has an updated note from another device with a later timestamp
          {
            id: local.id,
            sectionId: local.sectionId,
            instrumentId: local.instrumentId,
            title: 'Remote Newer Title',
            body: 'Remote newer body',
            createdAt: local.createdAt,
            updatedAt: '2026-10-25T15:00:00.000Z',
            deletedAt: null,
            syncState: 'synced',
          },
          // And a new note created on another device
          {
            id: '33333333-3333-4333-8333-333333333333',
            sectionId: null,
            instrumentId: null,
            title: 'Created on other phone',
            body: 'Body from other phone',
            createdAt: '2026-10-25T15:05:00.000Z',
            updatedAt: '2026-10-25T15:05:00.000Z',
            deletedAt: null,
            syncState: 'synced',
          },
        ];
      },
      async upsertThreads() {},
      async listThreads() {
        return [];
      },
      async upsertMessages() {},
      async listMessages() {
        return [];
      },
      async upsertPosition() {},
      async listPosition() {
        return null;
      },
      async deleteAccount() {},
    };

    await runSync(db, gateway, {
      choice: 'upload',
      choiceAt: '2026-10-25T13:00:00.000Z',
      position: null,
    });

    // Pushed note included local title
    expect(sentTitle).toBe('Local Title');

    // Local DB now has merged notes with remote title winning because of later timestamp
    const all = await listAllNotes(db);
    const updatedLocal = all.find((n) => n.id === local.id);
    expect(updatedLocal?.title).toBe('Remote Newer Title');
    expect(updatedLocal?.body).toBe('Remote newer body');

    // Note from other phone is stored with its title
    const fromOtherPhone = all.find(
      (n) => n.id === '33333333-3333-4333-8333-333333333333',
    );
    expect(fromOtherPhone?.title).toBe('Created on other phone');
    expect(fromOtherPhone?.body).toBe('Body from other phone');
  });
});

