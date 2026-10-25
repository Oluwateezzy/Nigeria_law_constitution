import { describe, expect, it } from 'vitest';
import { assemblePrompt, provisionStarters } from './assemble-prompt';
import { parseModelPayload } from './model-payload';

const section = {
  id: 'fixture:s:1',
  plainText: 'alpha words only belong to this section',
  path: 'Fixture / 1',
  citation: 'Fixture Act',
  extent: 'The Federal Republic of Nigeria.',
};

describe('provision prompt', () => {
  it('includes this section and leaves the neighbour out', () => {
    const prompt = assemblePrompt({
      kind: 'provision',
      section,
      messages: [{ role: 'user', content: provisionStarters.explain }],
    });
    expect(prompt.system).toContain('alpha words only belong to this section');
    expect(prompt.system).toContain('Fixture Act');
    expect(prompt.system).not.toContain('beta neighbour words');
    expect(prompt.illustrationRequired).toBe(true);
  });

  it('omits a seventh historical turn', () => {
    const messages = Array.from({ length: 7 }, (_, index) => ({
      role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `turn-${index}`,
    }));
    const prompt = assemblePrompt({ kind: 'provision', section, messages });
    expect(prompt.messages.map((message) => message.content)).toEqual([
      'turn-1',
      'turn-2',
      'turn-3',
      'turn-4',
      'turn-5',
      'turn-6',
    ]);
  });

  it('parses a minimal answer and rejects a payload that is not the schema', () => {
    expect(
      parseModelPayload({
        explanation: 'A short explanation.',
        illustration: null,
        limits: [],
        citations: [],
      }),
    ).toMatchObject({ explanation: 'A short explanation.', illustration: null });
    expect(() => parseModelPayload('not json')).toThrow(/not json/);
    expect(() => parseModelPayload({ explanation: 1 })).toThrow(/explanation/);
  });
});
