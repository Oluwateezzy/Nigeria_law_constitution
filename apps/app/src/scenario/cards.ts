import type { Block } from '@nigeria-law/content';
import {
  normaliseLegalWhitespace,
  validateCitations,
} from '@nigeria-law/domain';
import { readerHref } from '../reader/linking';

export type CardSection = {
  id: string;
  instrumentId: string;
  shortTitle: string;
  number: string;
  heading: string;
  plainText: string;
  blocks: readonly Block[];
};

export function anchorForQuote(
  blocks: readonly Block[],
  quote: string,
): string | null {
  const needle = normaliseLegalWhitespace(quote);
  let found: string | null = null;
  const walk = (items: readonly Block[]) => {
    for (const block of items) {
      const text = normaliseLegalWhitespace(block.text);
      if (!found && text.length > 0 && needle.startsWith(text)) {
        found = block.anchor;
      }
      if (block.blocks) walk(block.blocks);
    }
  };
  walk(blocks);
  return found;
}

export function citationCardRoute(
  citation: { sectionId: string; quote: string },
  section: CardSection | null,
): string | null {
  if (!section || section.id !== citation.sectionId) return null;
  const checked = validateCitations(
    [citation],
    [{ sectionId: section.id, plainText: section.plainText }],
  );
  if (checked.citations.length === 0) return null;
  return readerHref(
    section.instrumentId,
    section.number,
    anchorForQuote(section.blocks, citation.quote),
  );
}
