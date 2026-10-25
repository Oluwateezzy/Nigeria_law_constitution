import {
  assemblePrompt,
  type ChatMessage,
  type PromptSection,
} from './assemble-prompt';
import { parseModelPayload } from './model-payload';
import { scenarioRetrievalCap } from './retrieve';
import {
  countsAsRequest,
  QuotaBook,
  type QuotaLane,
  type QuotaSnapshot,
} from './quota';
import { sha256 } from './sha256';
import { citationRemovedLimit, validateCitations } from './validate-citations';

export type HostedErrorCode =
  | 'quota_exceeded'
  | 'entitlement_required'
  | 'content_unknown_section'
  | 'payload_too_large'
  | 'provider_error'
  | 'unauthorized';

export type LoadedSection = PromptSection & { contentVersion: string };

export type HostedRequest = {
  kind: 'provision';
  installId: string;
  userId: string | null;
  ip: string;
  lane: QuotaLane;
  contentVersion: string;
  sectionId: string;
  messages: readonly ChatMessage[];
  now: Date;
};

export type ProxyLog = {
  at: string;
  status: number;
  tokens: number;
  kind: 'provision' | 'scenario';
  contentVersion: string;
  installHash: string;
};

export type HostedMessage = {
  role: 'assistant';
  content: string;
  citations: { sectionId: string; quote: string }[];
  illustration: string | null;
  limits: string[];
};

export type HostedResult =
  | {
      ok: true;
      contentVersion: string;
      message: HostedMessage;
      quota: QuotaSnapshot;
    }
  | {
      ok: false;
      code: HostedErrorCode;
      quota: QuotaSnapshot;
    };

export type ModelProvider = {
  complete(prompt: { system: string; messages: ChatMessage[] }): Promise<{
    text: string;
    tokens: number;
  }>;
};

function logLine(
  request: { kind: ProxyLog['kind']; installId: string; now: Date },
  status: number,
  tokens: number,
  contentVersion: string,
): ProxyLog {
  return {
    at: request.now.toISOString(),
    status,
    tokens,
    kind: 'provision',
    contentVersion,
    installHash: sha256(request.installId),
  };
}

export async function completeHostedProvision(
  request: HostedRequest,
  deps: {
    loadSection: (sectionId: string) => LoadedSection | null;
    provider: ModelProvider;
    book: QuotaBook;
    logs: ProxyLog[];
  },
): Promise<HostedResult> {
  const subject = {
    installId: request.installId,
    userId: request.userId,
    ip: request.ip,
    lane: request.lane,
    now: request.now,
  };
  const loaded = deps.loadSection(request.sectionId);
  if (!loaded) {
    deps.logs.push(logLine(request, 404, 0, request.contentVersion));
    return {
      ok: false,
      code: 'content_unknown_section',
      quota: deps.book.snapshot(subject),
    };
  }
  if (deps.book.blocked(subject)) {
    deps.logs.push(logLine(request, 429, 0, loaded.contentVersion));
    return {
      ok: false,
      code: 'quota_exceeded',
      quota: deps.book.snapshot(subject),
    };
  }
  let tokens = 0;
  let parsed;
  try {
    const prompt = assemblePrompt({
      kind: 'provision',
      section: loaded,
      messages: request.messages,
    });
    const completed = await deps.provider.complete(prompt);
    tokens = completed.tokens;
    parsed = parseModelPayload(completed.text);
    if (prompt.illustrationRequired && !parsed.illustration?.trim()) {
      throw new Error('illustration required');
    }
  } catch {
    deps.logs.push(logLine(request, 502, tokens, loaded.contentVersion));
    return {
      ok: false,
      code: 'provider_error',
      quota: deps.book.snapshot(subject),
    };
  }
  const checked = validateCitations(parsed.citations, [
    { sectionId: loaded.id, plainText: loaded.plainText },
  ]);
  const limits = checked.removed
    ? [...parsed.limits, citationRemovedLimit]
    : parsed.limits;
  const quota = deps.book.commit(subject);
  deps.logs.push(logLine(request, 200, tokens, loaded.contentVersion));
  return {
    ok: true,
    contentVersion: loaded.contentVersion,
    quota,
    message: {
      role: 'assistant',
      content: parsed.explanation,
      illustration: parsed.illustration,
      limits,
      citations: checked.citations,
    },
  };
}

export type ScenarioRequest = {
  kind: 'scenario';
  installId: string;
  userId: string | null;
  ip: string;
  lane: QuotaLane;
  contentVersion: string;
  sectionIds: readonly string[];
  messages: readonly ChatMessage[];
  now: Date;
};

export async function completeHostedScenario(
  request: ScenarioRequest,
  deps: {
    loadSection: (sectionId: string) => LoadedSection | null;
    provider: ModelProvider;
    book: QuotaBook;
    logs: ProxyLog[];
  },
): Promise<HostedResult> {
  const subject = {
    installId: request.installId,
    userId: request.userId,
    ip: request.ip,
    lane: request.lane,
    now: request.now,
  };
  const loaded = request.sectionIds
    .slice(0, scenarioRetrievalCap)
    .map((id) => deps.loadSection(id))
    .filter((section): section is LoadedSection => section !== null);
  if (loaded.length === 0) {
    deps.logs.push(logLine(request, 404, 0, request.contentVersion));
    return {
      ok: false,
      code: 'content_unknown_section',
      quota: deps.book.snapshot(subject),
    };
  }
  if (deps.book.blocked(subject)) {
    deps.logs.push(logLine(request, 429, 0, loaded[0]!.contentVersion));
    return {
      ok: false,
      code: 'quota_exceeded',
      quota: deps.book.snapshot(subject),
    };
  }
  let tokens = 0;
  let parsed;
  try {
    const prompt = assemblePrompt({
      kind: 'scenario',
      retrieved: loaded,
      messages: request.messages,
    });
    const completed = await deps.provider.complete(prompt);
    tokens = completed.tokens;
    parsed = parseModelPayload(completed.text);
  } catch {
    deps.logs.push(logLine(request, 502, tokens, loaded[0]!.contentVersion));
    return {
      ok: false,
      code: 'provider_error',
      quota: deps.book.snapshot(subject),
    };
  }
  const checked = validateCitations(
    parsed.citations,
    loaded.map((section) => ({
      sectionId: section.id,
      plainText: section.plainText,
    })),
  );
  const limits = checked.removed
    ? [...parsed.limits, citationRemovedLimit]
    : parsed.limits;
  const quota = deps.book.commit(subject);
  deps.logs.push(logLine(request, 200, tokens, loaded[0]!.contentVersion));
  return {
    ok: true,
    contentVersion: loaded[0]!.contentVersion,
    quota,
    message: {
      role: 'assistant',
      content: parsed.explanation,
      illustration: parsed.illustration,
      limits,
      citations: checked.citations,
    },
  };
}

export async function retryHostedProvision(
  previous: HostedResult,
  request: HostedRequest,
  deps: {
    loadSection: (sectionId: string) => LoadedSection | null;
    provider: ModelProvider;
    book: QuotaBook;
    logs: ProxyLog[];
  },
): Promise<HostedResult> {
  if (previous.ok || previous.code !== 'provider_error') return previous;
  if (countsAsRequest(previous.code)) return previous;
  return completeHostedProvision(request, deps);
}
