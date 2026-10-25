import type { Alias, Block, Instrument } from '@nigeria-law/content';
import { locateSections } from '@nigeria-law/content';
import { sha256 } from '@nigeria-law/domain';

export type SearchRow = {
  id: string;
  instrumentId: string;
  kind: 'constitution' | 'act';
  number: string;
  heading: string;
  path: string;
  plainText: string;
  aliases: string;
  extent: string;
  reviewStatus: 'draft' | 'reviewed';
  shortTitle: string;
  anchors: string;
};

function anchorsOf(blocks: readonly Block[]): string[] {
  const anchors: string[] = [];
  const walk = (items: readonly Block[]) => {
    for (const block of items) {
      if (block.anchor) anchors.push(block.anchor);
      if (block.blocks) walk(block.blocks);
    }
  };
  walk(blocks);
  return anchors;
}

export function searchRows(
  instruments: readonly Instrument[],
  aliases: readonly Alias[],
): SearchRow[] {
  const extra = new Map<string, string[]>();
  for (const alias of aliases) {
    const list = extra.get(alias.sectionId) ?? [];
    list.push(alias.phrase);
    extra.set(alias.sectionId, list);
  }
  const rows: SearchRow[] = [];
  for (const instrument of instruments) {
    for (const located of locateSections(instrument)) {
      const section = located.section;
      const phrases = [
        ...(section.aliases ?? []),
        ...(extra.get(section.id) ?? []),
      ];
      rows.push({
        id: section.id,
        instrumentId: instrument.id,
        kind: instrument.kind,
        number: section.number,
        heading: section.heading ?? '',
        path: located.trail.join(' · '),
        plainText: section.plainText,
        aliases: [...new Set(phrases)].join('\n'),
        extent: instrument.extent,
        reviewStatus: instrument.review.status,
        shortTitle: instrument.shortTitle,
        anchors: anchorsOf(section.blocks).join(' '),
      });
    }
  }
  return rows;
}

export function bundledIndexKey(
  instruments: readonly Instrument[],
  aliases: readonly Alias[],
): string {
  const lines = [
    ...instruments.map(
      (instrument) => `${instrument.id}\t${instrument.indexHash}`,
    ),
    ...aliases.map((alias) => `${alias.sectionId}\t${alias.phrase}`),
  ];
  return sha256(lines.join('\n'));
}
