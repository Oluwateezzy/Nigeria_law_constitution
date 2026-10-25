import {
  assemblePrompt,
  citationRemovedLimit,
  hostedModelId,
  ownKeyHeaders,
  ownKeyProbes,
  parseModelPayload,
  validateCitations,
  type ChatMessage,
  type OwnKeyProvider,
  type PromptSection,
} from '@nigeria-law/domain';

export type AskHttp = (request: {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}) => Promise<{ status: number; body: string }>;

export type OwnKey = {
  provider: OwnKeyProvider;
  secret: string;
};

export type AskAnswer = {
  content: string;
  illustration: string | null;
  limits: string[];
  citations: { sectionId: string; quote: string }[];
};

export type SendResult =
  | { kind: 'disclosure' }
  | { kind: 'offline' }
  | { kind: 'quota' }
  | { kind: 'provider' }
  | {
      kind: 'answer';
      answer: AskAnswer;
      counted: boolean;
      quota?: { remaining: number; limit: number; resetsAt: string };
    };

export async function validateOwnKey(
  provider: OwnKeyProvider,
  secret: string,
  http: AskHttp,
): Promise<boolean> {
  const probe = ownKeyProbes[provider];
  const response = await http({
    url: probe.url,
    method: probe.method,
    headers: ownKeyHeaders(provider, secret),
  });
  return response.status === 200;
}

export async function sendProvision(input: {
  ownKey: OwnKey | null;
  proxyUrl: string;
  http: AskHttp;
  section: PromptSection;
  messages: readonly ChatMessage[];
  disclosed: boolean;
  online: boolean;
  remaining: number;
}): Promise<SendResult> {
  if (!input.disclosed) return { kind: 'disclosure' };
  if (!input.online) return { kind: 'offline' };
  if (!input.ownKey && input.remaining <= 0) return { kind: 'quota' };
  if (input.ownKey) {
    return sendWithOwnKey(input.ownKey, input.section, input.messages, input.http);
  }
  const response = await input.http({
    url: input.proxyUrl,
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      kind: 'provision',
      sectionId: input.section.id,
      messages: input.messages,
    }),
  });
  if (response.status === 429) return { kind: 'quota' };
  if (response.status >= 400) return { kind: 'provider' };
  const payload = JSON.parse(response.body) as {
    message?: AskAnswer & { content: string };
    quota?: { remaining: number; limit: number; resetsAt: string };
  };
  if (!payload.message) return { kind: 'provider' };
  return {
    kind: 'answer',
    counted: true,
    answer: payload.message,
    quota: payload.quota,
  };
}

async function sendWithOwnKey(
  key: OwnKey,
  section: PromptSection,
  messages: readonly ChatMessage[],
  http: AskHttp,
): Promise<SendResult> {
  const prompt = assemblePrompt({ kind: 'provision', section, messages });
  const url =
    key.provider === 'anthropic'
      ? 'https://api.anthropic.com/v1/messages'
      : 'https://api.openai.com/v1/chat/completions';
  const response = await http({
    url,
    method: 'POST',
    headers: {
      ...ownKeyHeaders(key.provider, key.secret),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: hostedModelId,
      system: prompt.system,
      messages: prompt.messages,
    }),
  });
  if (response.status >= 400) return { kind: 'provider' };
  let text = response.body;
  try {
    const envelope = JSON.parse(response.body) as {
      choices?: { message?: { content?: string } }[];
      content?: { text?: string }[];
    };
    text =
      envelope.choices?.[0]?.message?.content ??
      envelope.content?.[0]?.text ??
      response.body;
  } catch {
    return { kind: 'provider' };
  }
  try {
    const parsed = parseModelPayload(text);
    const checked = validateCitations(parsed.citations, [
      { sectionId: section.id, plainText: section.plainText },
    ]);
    return {
      kind: 'answer',
      counted: false,
      answer: {
        content: parsed.explanation,
        illustration: parsed.illustration,
        limits: checked.removed
          ? [...parsed.limits, citationRemovedLimit]
          : parsed.limits,
        citations: checked.citations,
      },
    };
  } catch {
    return { kind: 'provider' };
  }
}
