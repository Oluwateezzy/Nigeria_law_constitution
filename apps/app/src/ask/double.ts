import type { PromptSection, ScenarioCandidate } from '@nigeria-law/domain';
import type { AskAnswer } from './send';

export function aiDoubleEnabled(): boolean {
  return process.env.EXPO_PUBLIC_AI_DOUBLE === '1';
}

export function scriptedProvision(section: PromptSection): AskAnswer {
  return {
    content: 'This is a test explanation of the loaded section.',
    illustration: 'A labeled illustration for the test double.',
    limits: ['The loaded section is the only source.'],
    citations: [{ sectionId: section.id, quote: quoteFrom(section.plainText) }],
  };
}

export function scriptedScenario(section: ScenarioCandidate): AskAnswer {
  return {
    content: 'This is a test explanation of the loaded section.',
    illustration: null,
    limits: ['The loaded section is the only source.'],
    citations: [
      { sectionId: section.sectionId, quote: quoteFrom(section.plainText) },
    ],
  };
}

function quoteFrom(plainText: string): string {
  const trimmed = plainText.trim();
  return trimmed.slice(0, Math.min(80, trimmed.length));
}
