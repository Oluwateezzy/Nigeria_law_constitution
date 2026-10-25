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
  it('keeps parseQuery, validateCitations, assemblePrompt, and mergeByUpdatedAt', () => {
    expect(() => parseQuery('section 1')).toThrow(NotImplemented);
    expect(() => validateCitations([], [])).toThrow(NotImplemented);
    expect(() => assemblePrompt({ kind: 'provision', messages: [] })).toThrow(
      NotImplemented,
    );
    expect(() => mergeByUpdatedAt(row, row)).toThrow(NotImplemented);
  });
});
