import { describe, expect, it } from 'vitest';
import {
  assemblePrompt,
  mergeByUpdatedAt,
  parseQuery,
  validateCitations,
} from './index';

const row = { id: '1', updatedAt: '2026-10-25T00:00:00.000Z', deletedAt: null };

describe('domain seams', () => {
  it('parses a query and keeps the later seams closed', () => {
    expect(parseQuery('section 1')).toMatchObject({
      kind: 'section',
      number: '1',
    });
    expect(validateCitations([], []).citations).toEqual([]);
    expect(
      assemblePrompt({
        kind: 'scenario',
        messages: [{ role: 'user', content: 'A short situation.' }],
        retrieved: [],
      }).system,
    ).toContain('No section text was supplied.');
    expect(
      mergeByUpdatedAt(row, {
        ...row,
        updatedAt: '2026-10-25T01:00:00.000Z',
      }).updatedAt,
    ).toBe('2026-10-25T01:00:00.000Z');
  });
});
