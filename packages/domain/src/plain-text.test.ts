import { describe, expect, it } from 'vitest';
import { derivePlainText, type LegalBlock } from './plain-text';

const blocks: LegalBlock[] = [
  {
    type: 'subsection',
    marker: '1',
    anchor: 'sub-1',
    text: 'Example words of a subsection.',
    blocks: [
      {
        type: 'paragraph',
        marker: 'a',
        anchor: 'sub-1-a',
        text: 'Example words of a paragraph.',
      },
      {
        type: 'proviso',
        marker: '',
        anchor: 'sub-1-proviso',
        text: 'Provided that the example stops here.',
      },
    ],
  },
  {
    type: 'table',
    marker: '',
    anchor: 'table-1',
    text: '',
    rows: [
      ['Column A', 'Column B'],
      ['One', 'Two'],
    ],
  },
];

describe('derivePlainText', () => {
  it('is stable for the fake fixture, character for character', () => {
    expect(derivePlainText(blocks)).toBe(
      '(1) Example words of a subsection. (a) Example words of a paragraph. Provided that the example stops here. Column A | Column B One | Two',
    );
  });

  it('collapses internal whitespace without changing word order', () => {
    expect(
      derivePlainText([
        {
          type: 'paragraph_text',
          marker: '',
          anchor: 'text-1',
          text: 'Words   with\nbreaks',
        },
      ]),
    ).toBe('Words with breaks');
  });
});
