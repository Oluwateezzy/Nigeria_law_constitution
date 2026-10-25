import { exampleInstrument } from '@nigeria-law/content';
import type { Block } from '@nigeria-law/content';
import { describe, expect, it } from 'vitest';
import { provisionLines } from './provision-lines';

describe('provision lines', () => {
  it('renders the fixture marker (1) before paragraph (a)', () => {
    const section = exampleInstrument().units[0]?.sections?.[0];
    const lines = provisionLines(section?.blocks ?? []);
    const markers = lines.map((line) => line.marker).filter(Boolean);
    expect(markers.indexOf('(1)')).toBeGreaterThanOrEqual(0);
    expect(markers.indexOf('(1)')).toBeLessThan(markers.indexOf('(a)'));
    expect(
      lines.some((line) => line.kind === 'proviso' && line.marker === ''),
    ).toBe(true);
    expect(
      lines
        .find((line) => line.kind === 'proviso')
        ?.text.startsWith('Provided that'),
    ).toBe(true);
    expect(lines.some((line) => line.kind === 'table')).toBe(true);
  });

  it('keeps a subparagraph after its paragraph', () => {
    const blocks: Block[] = [
      {
        type: 'subsection',
        marker: '1',
        anchor: 'sub-1',
        text: 'Parent.',
        blocks: [
          {
            type: 'paragraph',
            marker: 'a',
            anchor: 'sub-1-a',
            text: 'Paragraph.',
            blocks: [
              {
                type: 'subparagraph',
                marker: 'i',
                anchor: 'sub-1-a-i',
                text: 'Item.',
              },
            ],
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
    expect(provisionLines(blocks).map((line) => line.kind)).toEqual([
      'subsection',
      'paragraph',
      'subparagraph',
      'proviso',
      'table',
    ]);
  });
});
