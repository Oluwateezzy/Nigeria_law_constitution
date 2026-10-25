import {
  scenarioFactLimit,
  scenarioRetrievalCap,
  windowSectionText,
} from './retrieve';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type PromptSection = {
  id: string;
  plainText: string;
  path: string;
  citation: string;
  extent: string;
};

export type AssemblePromptInput = {
  kind: 'provision' | 'scenario';
  messages: readonly ChatMessage[];
  section?: PromptSection;
  retrieved?: readonly PromptSection[];
};

export type AssembledPrompt = {
  system: string;
  messages: ChatMessage[];
  illustrationRequired: boolean;
};

export const provisionHistoryLimit = 6;

export const provisionStarters = {
  explain: 'Explain this in plain language',
  illustration: 'Give an illustration',
  limits: 'What are the limits of this section?',
} as const;

export function illustrationRequired(text: string): boolean {
  return (
    text === provisionStarters.explain ||
    text === provisionStarters.illustration
  );
}

export function assemblePrompt(input: AssemblePromptInput): AssembledPrompt {
  if (input.kind === 'scenario') return assembleScenario(input);
  const section = input.section;
  if (!section) {
    throw new Error('provision prompt needs a section');
  }
  const messages = input.messages.slice(-provisionHistoryLimit);
  const latest = [...messages]
    .reverse()
    .find((message) => message.role === 'user');
  const needsIllustration = latest
    ? illustrationRequired(latest.content)
    : false;
  return {
    illustrationRequired: needsIllustration,
    messages: messages.map((message) => ({ ...message })),
    system: [
      'Explain the supplied legislative text in plain language.',
      'Stay inside the supplied text. When the question needs a provision that was not supplied, say that the other text was not supplied, and do not invent its words.',
      'Quote the supplied text exactly when relying on it.',
      'Use section ids from the supplied set only.',
      'Do not cite case law. The corpus has no judgments.',
      'When an instrument has a limited extent, say so.',
      'State that the answer is an explanation of loaded text, not legal advice, in the limits field.',
      'When the text is silent, say it is silent.',
      'Use short sentences. Do not add a preamble.',
      needsIllustration
        ? 'The illustration field is required. It is one hypothetical situation, labeled as an illustration, and it is not a real case, a real person, or a decided Nigerian case.'
        : 'The illustration field may be null for this question.',
      'Return JSON with explanation, illustration, limits, and citations. Each citation has sectionId and quote.',
      `Section id: ${section.id}`,
      `Path: ${section.path}`,
      `Citation: ${section.citation}`,
      `Extent: ${section.extent}`,
      'Supplied text:',
      section.plainText,
    ].join('\n'),
  };
}

function assembleScenario(input: AssemblePromptInput): AssembledPrompt {
  const retrieved = (input.retrieved ?? []).slice(0, scenarioRetrievalCap);
  const facts = input.messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join('\n');
  const messages = input.messages
    .slice(-provisionHistoryLimit)
    .map((message) => ({
      role: message.role,
      content:
        message.content.length > scenarioFactLimit
          ? message.content.slice(0, scenarioFactLimit)
          : message.content,
    }));
  const blocks = retrieved.map((section) =>
    [
      `Section id: ${section.id}`,
      `Path: ${section.path}`,
      `Citation: ${section.citation}`,
      `Extent: ${section.extent}`,
      'Supplied text:',
      windowSectionText(section.plainText, facts, section.path),
    ].join('\n'),
  );
  return {
    illustrationRequired: false,
    messages,
    system: [
      'Explain the supplied legislative text in plain language.',
      'Stay inside the supplied text. When the question needs a provision that was not supplied, say that the other text was not supplied, and do not invent its words.',
      'Quote the supplied text exactly when relying on it.',
      'Use section ids from the supplied set only.',
      'Do not cite case law. The corpus has no judgments.',
      'When an instrument has a limited extent, say so.',
      'When the text is silent, say it is silent.',
      'If the situation needs a law that was not supplied, say in the limits that other laws may not be loaded.',
      'State that the answer is an explanation of loaded text, not legal advice, in the limits field.',
      'Use short sentences. Do not add a preamble.',
      'The illustration field may be null. When present, it is one hypothetical situation, labeled as an illustration, and it is not a real case, a real person, or a decided Nigerian case.',
      'Return JSON with explanation, illustration, limits, and citations. Each citation has sectionId and quote.',
      blocks.length > 0 ? blocks.join('\n\n') : 'No section text was supplied.',
    ].join('\n'),
  };
}
