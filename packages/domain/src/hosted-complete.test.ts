import { describe, expect, it } from 'vitest';
import {
  completeHostedProvision,
  retryHostedProvision,
  type ModelProvider,
} from './hosted-complete';
import { countsAsRequest, QuotaBook } from './quota';
import { citationRemovedLimit } from './validate-citations';

const now = new Date('2026-10-25T12:00:00.000Z');
const section = {
  id: 'fixture:s:1',
  plainText: 'alpha words only belong to this section',
  path: 'Fixture / 1',
  citation: 'Fixture Act',
  extent: 'The Federal Republic of Nigeria.',
  contentVersion: '2026-10-25.test',
};

function validBody(quote = 'alpha words only') {
  return JSON.stringify({
    explanation: 'This explains the loaded text.',
    illustration: 'A person reads the section.',
    limits: ['This is not legal advice.'],
    citations: [{ sectionId: section.id, quote }],
  });
}

function provider(text: string, calls: string[]): ModelProvider {
  return {
    async complete(prompt) {
      calls.push(prompt.system);
      return { text, tokens: 12 };
    },
  };
}

function request(
  messages = [
    { role: 'user' as const, content: 'Explain this in plain language' },
  ],
) {
  return {
    kind: 'provision' as const,
    installId: 'install-1',
    userId: null,
    ip: '203.0.113.8',
    lane: 'free' as const,
    contentVersion: section.contentVersion,
    sectionId: section.id,
    messages,
    now,
  };
}

describe('hosted provision', () => {
  it('calls the provider for a known section and skips an unknown id', async () => {
    const calls: string[] = [];
    const logs: { status: number; tokens: number }[] = [];
    const known = await completeHostedProvision(request(), {
      loadSection: (id) => (id === section.id ? section : null),
      provider: provider(validBody(), calls),
      book: new QuotaBook(),
      logs,
    });
    expect(known.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('alpha words only belong to this section');
    expect(calls[0]).not.toContain('smuggled passage');
    const unknown = await completeHostedProvision(
      { ...request(), sectionId: 'missing' },
      {
        loadSection: () => null,
        provider: provider(validBody(), calls),
        book: new QuotaBook(),
        logs,
      },
    );
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) expect(unknown.code).toBe('content_unknown_section');
    expect(calls).toHaveLength(1);
  });

  it('strips a quote that is not a substring and records the removal', async () => {
    const result = await completeHostedProvision(request(), {
      loadSection: () => section,
      provider: provider(validBody('invented quotation'), []),
      book: new QuotaBook(),
      logs: [],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message.citations).toEqual([]);
      expect(result.message.limits).toContain(citationRemovedLimit);
      expect(result.message.content).toContain('loaded text');
    }
  });

  it('allows five successes and stops the sixth before the provider', async () => {
    const calls: string[] = [];
    const book = new QuotaBook();
    const deps = {
      loadSection: () => section,
      provider: provider(validBody(), calls),
      book,
      logs: [],
    };
    for (let index = 0; index < 5; index += 1) {
      const result = await completeHostedProvision(request(), deps);
      expect(result.ok).toBe(true);
    }
    const sixth = await completeHostedProvision(request(), deps);
    expect(sixth.ok).toBe(false);
    if (!sixth.ok) expect(sixth.code).toBe('quota_exceeded');
    expect(calls).toHaveLength(5);
  });

  it('leaves the count unchanged when the provider fails', async () => {
    const book = new QuotaBook();
    const result = await completeHostedProvision(request(), {
      loadSection: () => section,
      provider: {
        async complete() {
          throw new Error('vendor down');
        },
      },
      book,
      logs: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('provider_error');
      expect(countsAsRequest(result.code)).toBe(false);
      expect(result.quota.used).toBe(0);
    }
    const retry = await retryHostedProvision(result, request(), {
      loadSection: () => section,
      provider: provider(validBody(), []),
      book,
      logs: [],
    });
    expect(retry.ok).toBe(true);
    if (retry.ok) expect(retry.quota.used).toBe(1);
  });

  it('keeps the question out of the proxy log', async () => {
    const logs: { status: number; tokens: number }[] = [];
    await completeHostedProvision(
      request([{ role: 'user', content: 'orchid-secret-phrase' }]),
      {
        loadSection: () => section,
        provider: provider(validBody(), []),
        book: new QuotaBook(),
        logs,
      },
    );
    const sink = JSON.stringify(logs);
    expect(sink).not.toContain('orchid-secret-phrase');
    expect(logs[0]?.status).toBe(200);
    expect(logs[0]?.tokens).toBe(12);
  });

  it('does not call the provider once an address has used the ceiling', async () => {
    const calls: string[] = [];
    const book = new QuotaBook();
    book.seedIp('203.0.113.8', now, 20);
    const result = await completeHostedProvision(request(), {
      loadSection: () => section,
      provider: provider(validBody(), calls),
      book,
      logs: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('quota_exceeded');
      expect(result.quota.used).toBe(0);
    }
    expect(calls).toHaveLength(0);
  });

  it('does not count an explain answer that omits the illustration', async () => {
    const book = new QuotaBook();
    const result = await completeHostedProvision(request(), {
      loadSection: () => section,
      provider: provider(
        JSON.stringify({
          explanation: 'This explains the loaded text.',
          illustration: null,
          limits: ['Stay inside the loaded text.'],
          citations: [],
        }),
        [],
      ),
      book,
      logs: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.quota.used).toBe(0);
  });
});
