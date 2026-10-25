import { describe, expect, it } from 'vitest';
import { openNodeDatabase } from '../search/node';
import {
  groupLivingNotes,
  noteRowTitle,
  notesMarkdown,
  unattachedGroupId,
} from './present';
import {
  createNote,
  createNoteId,
  dismissDraft,
  ensureNotesTable,
  listBySection,
  listLiving,
  readNote,
  readerNote,
  saveDraft,
  shouldAutosave,
  tombstoneNote,
  updateNote,
} from './repository';

const section = {
  id: 'cfrn-1999:s:36',
  number: '36',
  heading: 'Right to fair hearing',
  instrumentId: 'cfrn-1999',
  instrumentTitle: 'Constitution',
};

const laterSection = {
  id: 'cfrn-1999:s:39',
  number: '39',
  heading: 'Right to freedom of expression and the press',
  instrumentId: 'cfrn-1999',
  instrumentTitle: 'Constitution',
};

describe('notes', () => {
  it('creates an id without a crypto global', () => {
    expect(createNoteId(null)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('creates, updates, tombstones, and lists a note', async () => {
    const db = openNodeDatabase();
    await ensureNotesTable(db);
    const created = await createNote(db, {
      id: 'note-1',
      sectionId: section.id,
      instrumentId: section.instrumentId,
      body: 'Fair hearing',
      now: '2026-10-25T10:00:00.000Z',
    });
    expect(created.id).toBe('note-1');

    const updated = await updateNote(
      db,
      created.id,
      'Fair hearing, with counsel',
      '2026-10-25T10:05:00.000Z',
    );
    expect(updated.id).toBe(created.id);
    expect(updated.body).toBe('Fair hearing, with counsel');
    expect(updated.updatedAt > created.updatedAt).toBe(true);

    await tombstoneNote(db, created.id, '2026-10-25T10:06:00.000Z');
    expect(await listLiving(db)).toEqual([]);
    const raw = await readNote(db, created.id);
    expect(raw?.deletedAt).toBe('2026-10-25T10:06:00.000Z');
  });

  it('keeps two living notes on one section and opens the latest', async () => {
    const db = openNodeDatabase();
    await ensureNotesTable(db);
    const older = await createNote(db, {
      id: 'older',
      sectionId: section.id,
      instrumentId: section.instrumentId,
      body: 'First thought',
      now: '2026-10-25T10:00:00.000Z',
    });
    const newer = await createNote(db, {
      id: 'newer',
      sectionId: section.id,
      instrumentId: section.instrumentId,
      body: 'Second thought',
      now: '2026-10-25T11:00:00.000Z',
    });
    const living = await listBySection(db, section.id);
    expect(living.map((note) => note.id)).toEqual(['newer', 'older']);
    expect(readerNote(living, section.id)?.id).toBe(newer.id);
    const groups = groupLivingNotes(living, [section]);
    expect(groups[0]?.items.map((item) => item.id)).toEqual([
      newer.id,
      older.id,
    ]);
    expect(noteRowTitle('\n', '36')).toBe('Note on section 36');
  });

  it('lists a note with no section in its own group', async () => {
    const db = openNodeDatabase();
    await ensureNotesTable(db);
    const alone = await createNote(db, {
      id: 'alone',
      sectionId: null,
      instrumentId: null,
      body: 'A thought with no section',
      now: '2026-10-25T12:00:00.000Z',
    });
    const attached = await createNote(db, {
      id: 'attached',
      sectionId: section.id,
      instrumentId: section.instrumentId,
      body: 'On the section',
      now: '2026-10-25T12:01:00.000Z',
    });
    const living = await listLiving(db);
    expect(readerNote(living, section.id)?.id).toBe(attached.id);
    expect(readerNote(living, 'missing')).toBeNull();
    const groups = groupLivingNotes(living, [section]);
    const own = groups.find((group) => group.id === unattachedGroupId);
    expect(own?.items.map((item) => item.id)).toEqual([alone.id]);
    expect(groups[0]?.items.map((item) => item.id)).toEqual([attached.id]);
  });

  it('autosaves onto the same id after the interval', async () => {
    const db = openNodeDatabase();
    await ensureNotesTable(db);
    let now = 1_000;
    let id: string | null = null;
    let lastWriteAt = now;
    expect(shouldAutosave(lastWriteAt, now + 2999)).toBe(false);
    now += 3000;
    expect(shouldAutosave(lastWriteAt, now)).toBe(true);
    const first = await saveDraft(db, {
      id,
      sectionId: section.id,
      instrumentId: section.instrumentId,
      body: 'Counsel',
      now: new Date(now).toISOString(),
    });
    expect(first).not.toBeNull();
    id = first!.id;
    lastWriteAt = now;
    now += 3000;
    expect(shouldAutosave(lastWriteAt, now)).toBe(true);
    const second = await saveDraft(db, {
      id,
      sectionId: section.id,
      instrumentId: section.instrumentId,
      body: 'Counsel present',
      now: new Date(now).toISOString(),
    });
    expect(second?.id).toBe(id);
    expect(second!.updatedAt > first!.updatedAt).toBe(true);
    expect(await listLiving(db)).toHaveLength(1);
  });

  it('does not store an empty dismiss', async () => {
    const db = openNodeDatabase();
    await ensureNotesTable(db);
    await dismissDraft(db, {
      id: null,
      sectionId: section.id,
      instrumentId: section.instrumentId,
      body: '   ',
      now: '2026-10-25T13:00:00.000Z',
    });
    expect(await listLiving(db)).toEqual([]);
  });

  it('exports living notes and leaves out a tombstone', async () => {
    const db = openNodeDatabase();
    await ensureNotesTable(db);
    const living = await createNote(db, {
      id: 'kept',
      sectionId: laterSection.id,
      instrumentId: laterSection.instrumentId,
      body: 'Still here',
      now: '2026-10-25T14:00:00.000Z',
    });
    const gone = await createNote(db, {
      id: 'gone',
      sectionId: section.id,
      instrumentId: section.instrumentId,
      body: 'Removed',
      now: '2026-10-25T14:01:00.000Z',
    });
    await tombstoneNote(db, gone.id, '2026-10-25T14:02:00.000Z');
    const markdown = notesMarkdown(await listLiving(db), [
      section,
      laterSection,
    ]);
    expect(markdown).toContain('Still here');
    expect(markdown).toContain(
      '39. Right to freedom of expression and the press',
    );
    expect(markdown).not.toContain('Removed');
    expect(living.id).toBe('kept');
  });
});
