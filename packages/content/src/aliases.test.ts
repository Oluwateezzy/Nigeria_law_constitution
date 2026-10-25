import { describe, expect, it } from 'vitest';
import { shippingInstrument } from './load';
import { locateSections } from './walk';
import {
  aliasList,
  missingAliasTargets,
  relevanceQueries,
} from './aliases';

describe('alias list', () => {
  it('points every phrase at a section that exists', () => {
    const ids = new Set(
      locateSections(shippingInstrument()).map((item) => item.section.id),
    );
    expect(missingAliasTargets(aliasList(), ids)).toEqual([]);
    expect(aliasList().length).toBeGreaterThanOrEqual(5);
  });

  it('reports an alias whose section is missing', () => {
    const missing = missingAliasTargets(
      [{ phrase: 'missing', sectionId: 'cfrn-1999:s:missing' }],
      new Set(['cfrn-1999:s:36']),
    );
    expect(missing).toEqual([
      { phrase: 'missing', sectionId: 'cfrn-1999:s:missing' },
    ]);
  });

  it('keeps at least 25 relevance queries, including a miss', () => {
    const queries = relevanceQueries();
    expect(queries.length).toBeGreaterThanOrEqual(25);
    expect(queries.some((item) => item.sectionId === null)).toBe(true);
  });
});
