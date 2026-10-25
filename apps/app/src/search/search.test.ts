import {
  aliasList,
  exampleInstrument,
  locateSections,
  relevanceQueries,
  shippingInstrument,
} from '@nigeria-law/content';
import { describe, expect, it } from 'vitest';
import { openNodeDatabase } from './node';
import {
  ensureIndex,
  resetSearchTimings,
  reviewBadge,
  search,
  searchTimings,
} from './repository';
import { bundledIndexKey, searchRows } from './rows';

async function indexOf(
  instruments: ReturnType<typeof shippingInstrument>[],
  hash: string,
  rows = searchRows(instruments, aliasList()),
) {
  const db = openNodeDatabase();
  await ensureIndex(db, rows, hash);
  return db;
}

describe('search index', () => {
  it('ranks a unique heading word from the fake instrument first', async () => {
    const constitution = shippingInstrument();
    const slice = searchRows([constitution, exampleInstrument()], []).filter(
      (row) =>
        row.instrumentId === 'example' ||
        row.number === '1' ||
        row.number === '36',
    );
    const db = openNodeDatabase();
    await ensureIndex(db, slice, 'slice');
    const hits = await search(db, 'target');
    expect(hits[0]?.sectionId).toBe('example:s:36');
    expect(hits[0]?.heading).toBe('Example target');
  });

  it('rebuilds when the bundled index hash changes and keeps a matching hash', async () => {
    const rows = searchRows([exampleInstrument()], []);
    const db = openNodeDatabase();
    await ensureIndex(db, rows, 'hash-a');
    expect((await search(db, 'target'))[0]?.sectionId).toBe('example:s:36');
    await ensureIndex(db, [], 'hash-a');
    expect((await search(db, 'target'))[0]?.sectionId).toBe('example:s:36');
    await ensureIndex(db, [], 'hash-b');
    expect(await search(db, 'target')).toEqual([]);
  });

  it('prefers the Constitution for a bare section number and keeps the anchor', async () => {
    const constitution = shippingInstrument();
    const hearing = locateSections(constitution).find(
      (item) => item.section.heading === 'Right to fair hearing',
    );
    expect(hearing).toBeTruthy();
    const number = hearing?.section.number ?? '';
    const text = `${hearing?.section.heading ?? ''}\n${hearing?.section.plainText ?? ''}`;
    expect(text.toLowerCase()).toContain('fair hearing');
    const rows = searchRows(
      [constitution, exampleInstrument()],
      aliasList(),
    ).filter(
      (row) =>
        row.instrumentId === 'example' ||
        row.id === hearing?.section.id ||
        row.number === '1',
    );
    const db = openNodeDatabase();
    await ensureIndex(db, rows, 'query-shapes');
    expect((await search(db, `s.${number}`))[0]?.sectionId).toBe(
      hearing?.section.id,
    );
    expect((await search(db, `section ${number}`))[0]?.sectionId).toBe(
      hearing?.section.id,
    );
    const anchored = await search(db, `${number}(1)`);
    expect(anchored[0]?.sectionId).toBe(hearing?.section.id);
    expect(anchored[0]?.anchor).toBe('sub-1');
    const phrase = await search(db, '"fair hearing"');
    expect(phrase.slice(0, 3).map((hit) => hit.sectionId)).toContain(
      hearing?.section.id,
    );
    expect(await search(db, 'zzzz-no-such-provision')).toEqual([]);
    const numbered = await search(db, number);
    expect(numbered[0]?.instrumentId).toBe('cfrn-1999');
    expect(numbered[0]?.sectionId).toBe(`cfrn-1999:s:${number}`);
  });

  it('limits results to one instrument when the chip is on', async () => {
    const constitution = shippingInstrument();
    const rows = searchRows([constitution, exampleInstrument()], []).filter(
      (row) => row.instrumentId === 'example' || row.number === '1',
    );
    const db = openNodeDatabase();
    await ensureIndex(db, rows, 'chip');
    const open = await search(db, 'supreme');
    expect(open.some((hit) => hit.instrumentId === 'cfrn-1999')).toBe(true);
    const limited = await search(db, 'supreme', { instrumentId: 'example' });
    expect(limited.every((hit) => hit.instrumentId === 'example')).toBe(true);
    expect(limited).toEqual([]);
    const exampleOnly = await search(db, 'target', { instrumentId: 'example' });
    expect(exampleOnly[0]?.sectionId).toBe('example:s:36');
    expect(await search(db, 'target', { instrumentId: 'cfrn-1999' })).toEqual(
      [],
    );
  });

  it('returns a named Act section before the Constitution', async () => {
    const rows = searchRows([shippingInstrument(), exampleInstrument()], []);
    const db = openNodeDatabase();
    await ensureIndex(db, rows, 'named-act');
    const named = await search(db, 'Example section 36');
    expect(named[0]?.sectionId).toBe('example:s:36');
    expect(named[0]?.instrumentId).toBe('example');
    const bare = await search(db, '36');
    expect(bare[0]?.instrumentId).toBe('cfrn-1999');
    expect(bare[0]?.sectionId).toBe('cfrn-1999:s:36');
  });

  it('marks an unreviewed instrument and leaves the Constitution unmarked', async () => {
    const rows = searchRows(
      [shippingInstrument(), exampleInstrument()],
      [],
    ).filter((row) => row.number === '1');
    const db = openNodeDatabase();
    await ensureIndex(db, rows, 'badge');
    const hits = await search(db, '1');
    const constitution = hits.find((hit) => hit.instrumentId === 'cfrn-1999');
    const example = hits.find((hit) => hit.instrumentId === 'example');
    expect(reviewBadge(constitution?.reviewStatus ?? 'reviewed')).toBeNull();
    expect(reviewBadge(example?.reviewStatus ?? 'reviewed')).toBe(
      'Not yet reviewed',
    );
  });

  it('places each relevance query in the top three of a fresh Constitution index', async () => {
    const instrument = shippingInstrument();
    const queries = relevanceQueries();
    expect(queries.length).toBeGreaterThanOrEqual(25);
    const db = await indexOf(
      [instrument],
      bundledIndexKey([instrument], aliasList()),
    );
    for (const item of queries) {
      const hits = await search(db, item.query);
      if (item.sectionId === null) {
        expect(hits, item.query).toEqual([]);
        continue;
      }
      expect(
        hits.slice(0, 3).map((hit) => hit.sectionId),
        item.query,
      ).toContain(item.sectionId);
      if (item.anchor) {
        const match = hits.find((hit) => hit.sectionId === item.sectionId);
        expect(match?.anchor, item.query).toBe(item.anchor);
      }
    }
  });

  it('returns Constitution searches within 100 ms', async () => {
    const instrument = shippingInstrument();
    const db = await indexOf([instrument], 'bench');
    const queries = ['a', '36', 'section 1', 'fair hearing', 'life'];
    for (const query of queries) await search(db, query);
    resetSearchTimings();
    for (const query of queries) await search(db, query);
    const recorded = searchTimings();
    expect(recorded).toHaveLength(queries.length);
    for (const timing of recorded) {
      expect(timing.ms, timing.query).toBeLessThan(100);
    }
  });
});
