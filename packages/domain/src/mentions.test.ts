import { describe, expect, it } from 'vitest';
import { extractSectionMentions } from './mentions';

describe('extractSectionMentions', () => {
  it('reads a single section and an integer range', () => {
    expect(
      extractSectionMentions('See section 36 and sections 33 to 36.'),
    ).toEqual(['36', '33', '34', '35']);
  });

  it('leaves a lettered or oversized range out', () => {
    expect(
      extractSectionMentions('sections 16A to 18 and sections 1 to 80.'),
    ).toEqual([]);
  });

  it('reads a comma list', () => {
    expect(extractSectionMentions('sections 251, 257 and 272')).toEqual([
      '251',
      '257',
      '272',
    ]);
  });
});
