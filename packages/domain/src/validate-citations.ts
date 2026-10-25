import { NotImplemented } from './not-implemented';

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

export function validateCitations(
  citations: readonly Citation[],
  allowed: readonly AllowedSection[],
): ValidatedCitations {
  void citations;
  void allowed;
  throw new NotImplemented('validateCitations');
}
