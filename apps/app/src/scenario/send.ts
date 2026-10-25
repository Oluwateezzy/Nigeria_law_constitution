import {
  assemblePrompt,
  citationRemovedLimit,
  hostedModelId,
  ownKeyHeaders,
  parseModelPayload,
  retrieveScenario,
  validateCitations,
  type ChatMessage,
  type ScenarioCandidate,
} from '@nigeria-law/domain';
import { aiDoubleEnabled, scriptedScenario } from '../ask/double';
import { type AskHttp, type OwnKey, type SendResult } from '../ask/send';

export type ScenarioSendResult = SendResult | { kind: 'weak' };

export async function sendScenario(input: {
  facts: string;
  hits: readonly ScenarioCandidate[];
  ownKey: OwnKey | null;
  proxyUrl: string;
  http: AskHttp;
  messages: readonly ChatMessage[];
  disclosed: boolean;
  online: boolean;
  remaining: number;
  installId: string;
  contentVersion: string;
  citation: string;
}): Promise<ScenarioSendResult> {
  if (!input.disclosed) return { kind: 'disclosure' };
  const retrieval = retrieveScenario(
    input.facts,
    input.hits.map((hit) => ({
      ...hit,
      citation: input.citation || hit.citation,
    })),
  );
  if (retrieval.kind === 'weak') return { kind: 'weak' };
  if (!input.online) return { kind: 'offline' };
  if (!input.ownKey && input.remaining <= 0) return { kind: 'quota' };
  const sections = retrieval.sections;
  if (aiDoubleEnabled()) {
    const section = sections[0];
    if (!section) return { kind: 'weak' };
    return {
      kind: 'answer',
      counted: false,
      answer: scriptedScenario(section),
    };
  }
  if (input.ownKey) {
    return sendOwnScenario(input.ownKey, sections, input.messages, input.http);
  }
  const response = await input.http({
    url: input.proxyUrl,
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      kind: 'scenario',
      installId: input.installId,
      contentVersion: input.contentVersion,
      retrievedSectionIds: sections.map((section) => section.sectionId),
      messages: input.messages,
    }),
  });
  if (response.status === 429) return { kind: 'quota' };
  if (response.status >= 400) return { kind: 'provider' };
  const payload = JSON.parse(response.body) as {
    message?: {
      content: string;
      illustration: string | null;
      limits: string[];
      citations: { sectionId: string; quote: string }[];
    };
    quota?: {
      remaining: number;
      limit: number;
      resetsAt: string;
      lane?: 'free' | 'plus';
    };
    contentVersion?: string;
  };
  if (!payload.message) return { kind: 'provider' };
  const checked = validateCitations(
    payload.message.citations,
    sections.map((section) => ({
      sectionId: section.sectionId,
      plainText: section.plainText,
    })),
  );
  return {
    kind: 'answer',
    counted: true,
    answer: {
      content: payload.message.content,
      illustration: payload.message.illustration,
      limits:
        checked.removed &&
        !payload.message.limits.includes(citationRemovedLimit)
          ? [...payload.message.limits, citationRemovedLimit]
          : payload.message.limits,
      citations: checked.citations,
    },
    quota: payload.quota,
    contentVersion: payload.contentVersion,
  };
}

async function sendOwnScenario(
  key: OwnKey,
  sections: readonly ScenarioCandidate[],
  messages: readonly ChatMessage[],
  http: AskHttp,
): Promise<SendResult> {
  const prompt = assemblePrompt({
    kind: 'scenario',
    retrieved: sections.map((section) => ({
      id: section.sectionId,
      plainText: section.plainText,
      path: section.path,
      citation: section.citation,
      extent: section.extent,
    })),
    messages,
  });
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
  try {
    const envelope = JSON.parse(response.body) as {
      choices?: { message?: { content?: string } }[];
      content?: { text?: string }[];
    };
    const text =
      envelope.choices?.[0]?.message?.content ??
      envelope.content?.[0]?.text ??
      response.body;
    const parsed = parseModelPayload(text);
    const checked = validateCitations(
      parsed.citations,
      sections.map((section) => ({
        sectionId: section.sectionId,
        plainText: section.plainText,
      })),
    );
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
