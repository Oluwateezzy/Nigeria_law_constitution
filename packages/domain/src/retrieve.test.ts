import { describe, expect, it } from 'vitest';
import {
  retrieveScenario,
  scenarioRetrievalCap,
  type ScenarioCandidate,
} from './retrieve';

function hit(
  id: string,
  score: number,
  plainText = `words for ${id}`,
): ScenarioCandidate {
  return {
    sectionId: id,
    score,
    path: `Path / ${id}`,
    extent: 'The Federal Republic of Nigeria.',
    plainText,
    heading: id,
    number: id,
    shortTitle: 'Constitution',
    citation: 'Constitution of the Federal Republic of Nigeria 1999',
  };
}

describe('scenario retrieval', () => {
  it('returns a known section when its words are in the hits', () => {
    const result = retrieveScenario('alpha words only in the section', [
      hit('neighbour', 1, 'beta neighbour words'),
      hit('fixture:s:1', 9, 'alpha words only belong to this section'),
    ]);
    expect(result.kind).toBe('sections');
    if (result.kind === 'sections') {
      expect(result.sections.map((section) => section.sectionId)).toContain(
        'fixture:s:1',
      );
      expect(result.sections.length).toBeLessThanOrEqual(scenarioRetrievalCap);
    }
  });

  it('returns weak retrieval for a blank and a one-character string', () => {
    expect(retrieveScenario('', [hit('fixture:s:1', 9)]).kind).toBe('weak');
    expect(retrieveScenario('a', [hit('fixture:s:1', 9)]).kind).toBe('weak');
    expect(retrieveScenario(' ', [])).toEqual({ kind: 'weak', sections: [] });
  });

  it('keeps at most 8 sections', () => {
    const hits = Array.from({ length: 10 }, (_, index) =>
      hit(`s:${index}`, 10 - index),
    );
    const result = retrieveScenario('alpha words in the loaded text', hits);
    expect(result.kind).toBe('sections');
    if (result.kind === 'sections') {
      expect(result.sections).toHaveLength(scenarioRetrievalCap);
      expect(
        result.sections.some((section) => section.sectionId === 's:9'),
      ).toBe(false);
    }
  });

  it('does not call a provider when retrieval is weak', async () => {
    let calls = 0;
    const retrieval = retrieveScenario('law', [hit('s:1', 4)]);
    if (retrieval.kind === 'sections') {
      calls += 1;
    }
    expect(retrieval.kind).toBe('weak');
    expect(calls).toBe(0);
  });
});
