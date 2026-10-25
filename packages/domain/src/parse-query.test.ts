import { describe, expect, it } from 'vitest';
import { parseQuery } from './parse-query';

describe('parseQuery', () => {
  it('classifies section numbers, anchors, and quoted phrases', () => {
    expect(parseQuery('36')).toEqual({
      kind: 'section',
      number: '36',
      anchor: null,
      raw: '36',
    });
    expect(parseQuery('s 36')).toMatchObject({ kind: 'section', number: '36' });
    expect(parseQuery('s.36')).toMatchObject({ kind: 'section', number: '36' });
    expect(parseQuery('section 36')).toMatchObject({
      kind: 'section',
      number: '36',
      anchor: null,
    });
    expect(parseQuery('36(1)')).toEqual({
      kind: 'section',
      number: '36',
      anchor: 'sub-1',
      raw: '36(1)',
    });
    expect(parseQuery('36 (1)')).toMatchObject({
      kind: 'section',
      number: '36',
      anchor: 'sub-1',
    });
    expect(parseQuery('"fair hearing"')).toEqual({
      kind: 'phrase',
      phrase: 'fair hearing',
      raw: '"fair hearing"',
    });
    expect(parseQuery('fair hearing')).toEqual({
      kind: 'text',
      text: 'fair hearing',
      raw: 'fair hearing',
    });
  });
});
