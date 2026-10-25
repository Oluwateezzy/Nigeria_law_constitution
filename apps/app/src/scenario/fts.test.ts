import { exampleInstrument } from '@nigeria-law/content';
import { describe, expect, it } from 'vitest';
import { openNodeDatabase } from '../search/node';
import { ensureIndex } from '../search/repository';
import { searchRows } from '../search/rows';
import { ensureNotesTable } from '../notes/repository';
import { ensureSyncTables } from '../sync/schema';
import { retrieveFromIndex } from './fts';
import {
  appendScenarioMessage,
  listScenarioThreads,
  readScenarioMessages,
} from './repository';

describe('scenario index', () => {
  it('returns the section whose distinctive words are in the fixture', async () => {
    const db = openNodeDatabase();
    await ensureIndex(
      db,
      searchRows([exampleInstrument()], []),
      'scenario-fixture',
    );
    const result = await retrieveFromIndex(db, 'Example words of a target');
    expect(result.kind).toBe('sections');
    if (result.kind === 'sections') {
      expect(result.sections.map((section) => section.sectionId)).toContain(
        'example:s:36',
      );
      expect(result.sections.length).toBeLessThanOrEqual(8);
      expect(result.sections[0]?.extent).toBe(
        'Nowhere. This fixture is not law.',
      );
    }
  });
});

describe('saved scenarios', () => {
  it('keeps a scenario thread and its citation', async () => {
    const db = openNodeDatabase();
    await ensureNotesTable(db);
    await ensureSyncTables(db);
    const saved = await appendScenarioMessage(db, {
      threadId: null,
      title: 'The police held him overnight.',
      role: 'assistant',
      content: 'This explains the loaded text.',
      citations: [{ sectionId: 'cfrn-1999:s:35', quote: 'personal liberty' }],
      illustration: null,
      limits: ['Other laws may not be loaded.'],
      now: '2026-10-25T12:00:00.000Z',
    });
    const threads = await listScenarioThreads(db);
    const messages = await readScenarioMessages(db, saved.threadId);
    expect(threads[0]?.title).toBe('The police held him overnight.');
    expect(messages[0]?.citations).toEqual([
      { sectionId: 'cfrn-1999:s:35', quote: 'personal liberty' },
    ]);
  });
});
