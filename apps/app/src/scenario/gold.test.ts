import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  aliasList,
  exampleInstrument,
  shippingInstrument,
} from '@nigeria-law/content';
import { describe, expect, it } from 'vitest';
import { openNodeDatabase } from '../search/node';
import { ensureIndex } from '../search/repository';
import { searchRows } from '../search/rows';
import { retrieveFromIndex } from './fts';

type GoldCase = {
  id: string;
  facts: string;
  requiredIds: string[];
  expectWeak?: boolean;
  notNationwide?: string[];
};

const gold = JSON.parse(
  readFileSync(
    path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../../packages/content/eval/scenario.json',
    ),
    'utf8',
  ),
) as GoldCase[];

describe('scenario gold retrieval', () => {
  it('puts every required section in the top 8 for at least 12 cases', async () => {
    expect(gold.length).toBeGreaterThanOrEqual(15);
    const db = openNodeDatabase();
    await ensureIndex(
      db,
      searchRows([shippingInstrument(), exampleInstrument()], aliasList()),
      'scenario-gold',
    );
    const misses: string[] = [];
    for (const item of gold) {
      const result = await retrieveFromIndex(db, item.facts);
      if (item.expectWeak) {
        if (result.kind !== 'weak') misses.push(item.id);
        continue;
      }
      const ids =
        result.kind === 'sections'
          ? result.sections.map((section) => section.sectionId)
          : [];
      const missing = item.requiredIds.filter((id) => !ids.includes(id));
      if (missing.length > 0) misses.push(`${item.id}:${missing.join(',')}`);
      for (const id of item.notNationwide ?? []) {
        const hit =
          result.kind === 'sections'
            ? result.sections.find((section) => section.sectionId === id)
            : undefined;
        expect(hit?.extent).toBe('Nowhere. This fixture is not law.');
      }
    }
    expect(gold.length - misses.length).toBeGreaterThanOrEqual(12);
    expect(misses).toEqual([]);
  });
});
