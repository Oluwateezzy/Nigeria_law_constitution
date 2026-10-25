import { describe, expect, it } from 'vitest';
import { retrySend, sendProvision, validateOwnKey, type AskHttp } from './send';

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
      installId: '11111111-1111-4111-8111-111111111111',
      contentVersion: '2026-10-25.test',
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
      installId: '11111111-1111-4111-8111-111111111111',
      contentVersion: '2026-10-25.test',
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

describe('hosted request', () => {
  it('sends the section id and leaves the section text out of the body', async () => {
    let body = '';
    const http: AskHttp = async (request) => {
      body = request.body ?? '';
      return { status: 429, body: '{"code":"quota_exceeded"}' };
    };
    const result = await sendProvision({
      ownKey: null,
      proxyUrl: 'https://example.test/functions/v1/ai',
      http,
      section,
      messages: [{ role: 'user', content: 'Explain this in plain language' }],
      disclosed: true,
      online: true,
      remaining: 1,
      installId: '11111111-1111-4111-8111-111111111111',
      contentVersion: '2026-10-25.test',
    });
    expect(result.kind).toBe('quota');
    expect(body).not.toContain(section.plainText);
    expect(JSON.parse(body).sectionId).toBe(section.id);
  });

  it('counts a retry only after the provider returns an answer', async () => {
    let calls = 0;
    const http: AskHttp = async () => {
      calls += 1;
      if (calls === 1)
        return { status: 502, body: '{"code":"provider_error"}' };
      return {
        status: 200,
        body: JSON.stringify({
          message: {
            content: 'This explains the loaded text.',
            illustration: 'Illustration: a person reads the section.',
            limits: ['The loaded section is the only source.'],
            citations: [],
          },
          quota: {
            remaining: 4,
            limit: 5,
            resetsAt: '2026-10-26T00:00:00+01:00',
          },
        }),
      };
    };
    const input = {
      ownKey: null,
      proxyUrl: 'https://example.test/functions/v1/ai',
      http,
      section,
      messages: [
        { role: 'user' as const, content: 'Explain this in plain language' },
      ],
      disclosed: true,
      online: true,
      remaining: 5,
      installId: '11111111-1111-4111-8111-111111111111',
      contentVersion: '2026-10-25.test',
    };
    const failed = await sendProvision(input);
    expect(failed.kind).toBe('provider');
    const retried = await retrySend(failed, () => sendProvision(input));
    expect(retried.kind).toBe('answer');
    if (retried.kind === 'answer') expect(retried.counted).toBe(true);
    expect(calls).toBe(2);
  });
});
