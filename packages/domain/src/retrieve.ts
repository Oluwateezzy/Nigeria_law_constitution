export const scenarioRetrievalCap = 8;
export const scenarioSectionWindow = 6000;
export const scenarioFactLimit = 4000;
export const scenarioConfidenceThreshold = 0;
export const scenarioMinimumTokens = 2;

const scenarioStopWords = new Set([
  'the',
  'and',
  'for',
  'that',
  'this',
  'with',
  'from',
  'what',
  'when',
  'does',
  'about',
  'into',
  'have',
  'been',
  'were',
  'was',
  'are',
  'his',
  'her',
  'their',
  'not',
]);

export type ScenarioCandidate = {
  sectionId: string;
  score: number;
  path: string;
  extent: string;
  plainText: string;
  heading: string;
  number: string;
  shortTitle: string;
  citation: string;
};

export type ScenarioRetrieval =
  | { kind: 'weak'; sections: [] }
  | { kind: 'sections'; sections: ScenarioCandidate[] };

export function scenarioMatchTokens(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 2 && !scenarioStopWords.has(token));
  return [...new Set(tokens)].slice(0, 12);
}

export function retrieveScenario(
  text: string,
  hits: readonly ScenarioCandidate[],
): ScenarioRetrieval {
  const trimmed = text.trim();
  if (trimmed.length < scenarioMinimumTokens) {
    return { kind: 'weak', sections: [] };
  }
  if (scenarioMatchTokens(trimmed).length < scenarioMinimumTokens) {
    return { kind: 'weak', sections: [] };
  }
  const ranked = [...hits]
    .filter((hit) => hit.score > scenarioConfidenceThreshold)
    .sort((left, right) => right.score - left.score)
    .slice(0, scenarioRetrievalCap);
  if (ranked.length === 0) return { kind: 'weak', sections: [] };
  return { kind: 'sections', sections: ranked };
}

export function windowSectionText(
  plainText: string,
  facts: string,
  heading: string,
): string {
  const text = plainText.replace(/\s+/g, ' ').trim();
  if (text.length <= scenarioSectionWindow) return text;
  const probe = facts.trim().toLowerCase().slice(0, 48);
  const at = probe ? text.toLowerCase().indexOf(probe) : -1;
  const start = at > 40 ? at - 40 : 0;
  const window = text.slice(start, start + scenarioSectionWindow);
  return `${heading} ${window}`.trim();
}
