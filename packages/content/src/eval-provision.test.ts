import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseModelPayload, validateCitations } from '@nigeria-law/domain';
import { findSection, shippingInstrument } from './index';

type EvalCase = {
  id: string;
  sectionId: string;
  userText: string;
  checks: {
    illustration: boolean;
    currentSectionOnly: boolean;
    noCourt: boolean;
    outOfScope?: boolean;
  };
};

function scripted(item: EvalCase, plainText: string): string {
  const quote = plainText.replace(/\s+/g, ' ').trim().slice(0, 48);
  if (item.checks.outOfScope) {
    return JSON.stringify({
      explanation: 'The other text was not supplied.',
      illustration: null,
      limits: ['This is not legal advice.'],
      citations: [],
    });
  }
  return JSON.stringify({
    explanation: 'This explains the loaded text.',
    illustration: item.checks.illustration
      ? 'Illustration: a person reads this section and nothing more.'
      : null,
    limits: ['This is not legal advice.'],
    citations: [{ sectionId: item.sectionId, quote }],
  });
}

describe('provision eval fixtures', () => {
  const cases = JSON.parse(
    readFileSync(new URL('../eval/provision.json', import.meta.url), 'utf8'),
  ) as EvalCase[];

  it('covers definition, rights, proviso, schedule, and an unanswered question', () => {
    expect(cases.length).toBeGreaterThanOrEqual(12);
    expect(cases.some((item) => item.sectionId === 'cfrn-1999:s:161')).toBe(true);
    expect(cases.some((item) => item.sectionId === 'cfrn-1999:s:36')).toBe(true);
    expect(cases.some((item) => item.sectionId === 'cfrn-1999:s:5')).toBe(true);
    expect(cases.some((item) => item.sectionId.startsWith('cfrn-1999:s:sch'))).toBe(
      true,
    );
    expect(cases.some((item) => item.checks.outOfScope)).toBe(true);
  });

  it('passes citation and illustration checks against the scripted provider', () => {
    const instrument = shippingInstrument();
    for (const item of cases) {
      const located = findSection(instrument, item.sectionId);
      expect(located, item.id).toBeTruthy();
      const plainText = located?.section.plainText ?? '';
      const answer = parseModelPayload(scripted(item, plainText));
      const checked = validateCitations(answer.citations, [
        { sectionId: item.sectionId, plainText },
      ]);
      expect(checked.removed, item.id).toBe(false);
      if (item.checks.currentSectionOnly) {
        expect(
          answer.citations.every((citation) => citation.sectionId === item.sectionId),
          item.id,
        ).toBe(true);
      }
      if (item.checks.illustration) {
        expect(answer.illustration, item.id).toMatch(/illustration/i);
      }
      if (item.checks.outOfScope) {
        expect(answer.explanation, item.id).toMatch(/not supplied/i);
      }
      if (item.checks.noCourt) {
        const prose = `${answer.explanation} ${answer.illustration ?? ''}`;
        expect(prose, item.id).not.toMatch(/Supreme Court|Court of Appeal/);
      }
      const fightsLimits =
        /this is legal advice/i.test(answer.explanation) &&
        answer.limits.some((line) => /not legal advice/i.test(line));
      expect(fightsLimits, item.id).toBe(false);
    }
  });
});
