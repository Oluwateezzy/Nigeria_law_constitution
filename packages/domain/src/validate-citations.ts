import { normaliseLegalWhitespace } from './plain-text';

export type Citation = {
  sectionId: string;
  quote: string;
};

export type AllowedSection = {
  sectionId: string;
  plainText: string;
};

export type ValidatedCitations = {
  citations: Citation[];
  removed: boolean;
};

export const citationRemovedLimit =
  'A citation was removed because it was not in the loaded text.';

export function validateCitations(
  citations: readonly Citation[],
  allowed: readonly AllowedSection[],
): ValidatedCitations {
  const texts = new Map(
    allowed.map((section) => [
      section.sectionId,
      normaliseLegalWhitespace(section.plainText),
    ]),
  );
  const kept: Citation[] = [];
  let removed = false;
  for (const citation of citations) {
    const text = texts.get(citation.sectionId);
    const quote = normaliseLegalWhitespace(citation.quote);
    if (!text || quote.length === 0 || !text.includes(quote)) {
      removed = true;
      continue;
    }
    kept.push({ sectionId: citation.sectionId, quote: citation.quote });
  }
  return { citations: kept, removed };
}
