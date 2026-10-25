import aliasFile from './aliases.json';
import relevanceFile from './relevance.json';

export type Alias = {
  phrase: string;
  sectionId: string;
};

export type RelevanceQuery = {
  query: string;
  sectionId: string | null;
  anchor?: string;
};

export function aliasList(): Alias[] {
  return aliasFile.aliases;
}

export function relevanceQueries(): RelevanceQuery[] {
  return relevanceFile.queries;
}

export function missingAliasTargets(
  aliases: readonly Alias[],
  sectionIds: ReadonlySet<string>,
): Alias[] {
  return aliases.filter((alias) => !sectionIds.has(alias.sectionId));
}
