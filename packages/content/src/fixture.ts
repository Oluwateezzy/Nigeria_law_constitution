import { derivePlainText, extractSectionMentions } from '@nigeria-law/domain';
import {
  instrumentSchema,
  type Block,
  type Instrument,
  type Section,
} from './schema';

const retrievedOn = '2026-10-25';

function section(number: string, blocks: Block[], extra?: string): Section {
  const plainText = [derivePlainText(blocks), extra ?? '']
    .filter(Boolean)
    .join(' ');
  return {
    id: `example:s:${number}`,
    number,
    heading: number === '1' ? 'Example heading' : 'Example target',
    blocks:
      extra === undefined
        ? blocks
        : [
            ...blocks,
            {
              type: 'paragraph_text',
              marker: '',
              anchor: 'text-note',
              text: extra,
            },
          ],
    plainText:
      extra === undefined
        ? plainText
        : derivePlainText([
            ...blocks,
            {
              type: 'paragraph_text',
              marker: '',
              anchor: 'text-note',
              text: extra,
            },
          ]),
  };
}

const subsection: Block = {
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
};

const table: Block = {
  type: 'table',
  marker: '',
  anchor: 'table-1',
  text: '',
  rows: [
    ['Column A', 'Column B'],
    ['One', 'Two'],
  ],
};

export function exampleInstrument(options?: {
  includeTarget?: boolean;
}): Instrument {
  const includeTarget = options?.includeTarget ?? true;
  const first = section('1', [subsection, table], 'A pointer to section 36.');
  const mentions = extractSectionMentions(first.plainText);
  const known = new Set(['1', ...(includeTarget ? ['36'] : [])]);
  first.crossReferences = mentions
    .filter((number) => known.has(number))
    .map((number) => `example:s:${number}`);
  const sections = [first];
  if (includeTarget) {
    sections.push(
      section('36', [
        {
          type: 'paragraph_text',
          marker: '',
          anchor: 'text-1',
          text: 'Example words of a target. This is not law.',
        },
      ]),
    );
  }
  return {
    content_schema_version: 1,
    id: 'example',
    kind: 'act',
    title: 'Example instrument, not law',
    shortTitle: 'Example',
    citation: 'Example instrument',
    year: 2026,
    commencement: null,
    extent: 'Nowhere. This fixture is not law.',
    versionLabel: 'Fake fixture',
    contentVersion: '2026-10-25.fixture',
    legalTextHash: 'a'.repeat(64),
    indexHash: 'b'.repeat(64),
    alterations: [],
    source: {
      name: 'Example source, not a statute',
      url: 'https://example.invalid/fixture',
      retrievedOn,
      reuseNote: 'Invented for tests. Do not display as law.',
    },
    review: { status: 'draft' },
    units: [
      {
        id: 'example:u:1',
        kind: 'chapter',
        heading: 'Example chapter',
        sections,
      },
    ],
  };
}

export function parsedExampleInstrument(): Instrument {
  return instrumentSchema.parse(exampleInstrument());
}
