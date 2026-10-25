import { describe, expect, it } from 'vitest';
import { validateCitations } from './validate-citations';

const allowed = [
  {
    sectionId: 'fixture:s:1',
    plainText: 'alpha words only belong to this section',
  },
  {
    sectionId: 'fixture:s:2',
    plainText: 'beta neighbour words stay next door',
  },
];

describe('validateCitations', () => {
  it('keeps an exact quote and a quote whose internal whitespace differs', () => {
    const exact = validateCitations(
      [{ sectionId: 'fixture:s:1', quote: 'alpha words only' }],
      allowed,
    );
    expect(exact.removed).toBe(false);
    expect(exact.citations).toEqual([
      { sectionId: 'fixture:s:1', quote: 'alpha words only' },
    ]);
    const spaced = validateCitations(
      [{ sectionId: 'fixture:s:1', quote: 'alpha   words\nonly' }],
      allowed,
    );
    expect(spaced.removed).toBe(false);
    expect(spaced.citations).toHaveLength(1);
  });

  it('drops a missing word, an unknown id, and a quote from outside the allowed set', () => {
    const missingWord = validateCitations(
      [{ sectionId: 'fixture:s:1', quote: 'alpha missing words' }],
      allowed,
    );
    expect(missingWord.citations).toEqual([]);
    expect(missingWord.removed).toBe(true);
    const unknown = validateCitations(
      [{ sectionId: 'missing', quote: 'alpha words only' }],
      allowed,
    );
    expect(unknown.citations).toEqual([]);
    expect(unknown.removed).toBe(true);
    const elsewhere = validateCitations(
      [{ sectionId: 'fixture:s:1', quote: 'beta neighbour words' }],
      [allowed[0]!],
    );
    expect(elsewhere.citations).toEqual([]);
    expect(elsewhere.removed).toBe(true);
  });
});
