import { describe, expect, it } from 'vitest';
import { sendProvision, validateOwnKey, type AskHttp } from './send';

const section = {
  id: 'fixture:s:1',
  plainText: 'alpha words only belong to this section',
  path: 'Fixture / 1',
  citation: 'Fixture Act',
  extent: 'The Federal Republic of Nigeria.',
};

const answer = JSON.stringify({
  explanation: 'This explains the loaded text.',
  illustration: 'Illustration: a person reads the section.',
  limits: ['The loaded section is the only source.'],
  citations: [{ sectionId: section.id, quote: 'alpha words only' }],
});

describe('ask send', () => {
  it('does not send until the disclosure has been continued', async () => {
    const http: AskHttp = async () => {
      throw new Error('should not send');
    };
    const result = await sendProvision({
      ownKey: null,
      proxyUrl: 'https://example.test/functions/v1/ai',
      http,
      section,
      messages: [{ role: 'user', content: 'Explain this in plain language' }],
      disclosed: false,
      online: true,
      remaining: 5,
    });
    expect(result.kind).toBe('disclosure');
  });
});

describe('own key lane', () => {
  it('does not call the proxy and does not count against the free lane', async () => {
    const urls: string[] = [];
    const http: AskHttp = async (request) => {
      urls.push(request.url);
      return {
        status: 200,
        body: JSON.stringify({
          choices: [{ message: { content: answer } }],
        }),
      };
    };
    const result = await sendProvision({
      ownKey: { provider: 'openai', secret: 'sk-test' },
      proxyUrl: 'https://pmgvgwscoypcpqhtcivv.supabase.co/functions/v1/ai',
      http,
      section,
      messages: [{ role: 'user', content: 'Explain this in plain language' }],
      disclosed: true,
      online: true,
      remaining: 2,
    });
    expect(result.kind).toBe('answer');
    if (result.kind === 'answer') expect(result.counted).toBe(false);
    expect(urls.some((url) => url.includes('supabase.co'))).toBe(false);
    expect(urls[0]).toContain('api.openai.com');
  });

  it('does not store a key that fails validation', async () => {
    const http: AskHttp = async () => ({ status: 401, body: '' });
    let stored = false;
    const accepted = await validateOwnKey('openai', 'sk-bad', http);
    if (accepted) stored = true;
    expect(accepted).toBe(false);
    expect(stored).toBe(false);
  });
});
