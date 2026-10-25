import type { Citation } from './validate-citations';

export type ModelAnswer = {
  explanation: string;
  illustration: string | null;
  limits: string[];
  citations: Citation[];
};

export function parseModelPayload(payload: unknown): ModelAnswer {
  const value = typeof payload === 'string' ? readJson(payload) : payload;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('model payload is not an object');
  }
  const record = value as Record<string, unknown>;
  if (typeof record.explanation !== 'string' || record.explanation.length === 0) {
    throw new Error('model payload needs an explanation');
  }
  if (!(record.illustration === null || typeof record.illustration === 'string')) {
    throw new Error('model payload illustration is not a string or null');
  }
  if (!stringList(record.limits)) {
    throw new Error('model payload limits are not strings');
  }
  if (!Array.isArray(record.citations)) {
    throw new Error('model payload citations are missing');
  }
  const citations: Citation[] = [];
  for (const item of record.citations) {
    if (!item || typeof item !== 'object') {
      throw new Error('model payload citation is not an object');
    }
    const citation = item as Record<string, unknown>;
    if (typeof citation.sectionId !== 'string' || typeof citation.quote !== 'string') {
      throw new Error('model payload citation is incomplete');
    }
    citations.push({ sectionId: citation.sectionId, quote: citation.quote });
  }
  return {
    explanation: record.explanation,
    illustration: record.illustration,
    limits: record.limits,
    citations,
  };
}

function readJson(payload: string): unknown {
  try {
    return JSON.parse(payload) as unknown;
  } catch {
    throw new Error('model payload is not json');
  }
}

function stringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
