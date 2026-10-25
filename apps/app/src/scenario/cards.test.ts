import { describe, expect, it } from 'vitest';
import { citationCardRoute, type CardSection } from './cards';

const section: CardSection = {
  id: 'cfrn-1999:s:36',
  instrumentId: 'cfrn-1999',
  shortTitle: 'Constitution',
  number: '36',
  heading: 'Right to fair hearing',
  plainText: 'a person shall be entitled to a fair hearing',
  blocks: [
    {
      type: 'subsection',
      marker: '1',
      anchor: 'sub-1',
      text: 'a person shall be entitled to a fair hearing',
    },
  ],
};

describe('citation cards', () => {
  it('maps a valid citation to the reader route and an invalid one to no route', () => {
    expect(
      citationCardRoute(
        {
          sectionId: section.id,
          quote: 'a person shall be entitled to a fair hearing',
        },
        section,
      ),
    ).toBe('/read/cfrn-1999/s/36?anchor=sub-1#sub-1');
    expect(
      citationCardRoute(
        { sectionId: 'missing', quote: 'a person shall be entitled' },
        null,
      ),
    ).toBeNull();
    expect(
      citationCardRoute(
        { sectionId: section.id, quote: 'this quote was invented' },
        section,
      ),
    ).toBeNull();
  });
});
