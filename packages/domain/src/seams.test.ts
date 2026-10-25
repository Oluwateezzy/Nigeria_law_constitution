import { describe, expect, it } from 'vitest';
import {
  assemblePrompt,
  mergeByUpdatedAt,
  NotImplemented,
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
    expect(() => validateCitations([], [])).toThrow(NotImplemented);
    expect(() => assemblePrompt({ kind: 'provision', messages: [] })).toThrow(
      NotImplemented,
    );
    expect(
      mergeByUpdatedAt(row, {
        ...row,
        updatedAt: '2026-10-25T01:00:00.000Z',
      }).updatedAt,
    ).toBe('2026-10-25T01:00:00.000Z');
  });
});
