import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  indexHash,
  legalTextHash,
  makeContentVersion,
} from './content-version';
import { sha256 } from './sha256';

describe('content version hashes', () => {
  it('matches SHA-256', () => {
    expect(sha256('abc')).toBe(
      createHash('sha256').update('abc').digest('hex'),
    );
  });

  it('changes when a section string changes and stays put when only an alias changes', () => {
    const base = [{ id: 'example:s:1', plainText: 'One', aliases: ['a'] }];
    const textChanged = [
      { id: 'example:s:1', plainText: 'Two', aliases: ['a'] },
    ];
    const aliasChanged = [
      { id: 'example:s:1', plainText: 'One', aliases: ['b'] },
    ];

    expect(legalTextHash(textChanged)).not.toBe(legalTextHash(base));
    expect(legalTextHash(aliasChanged)).toBe(legalTextHash(base));
    expect(indexHash(aliasChanged)).not.toBe(indexHash(base));
    expect(indexHash(textChanged)).toBe(indexHash(base));
    expect(
      makeContentVersion('2026-10-25', legalTextHash(textChanged)),
    ).not.toBe(makeContentVersion('2026-10-25', legalTextHash(base)));
  });
});
