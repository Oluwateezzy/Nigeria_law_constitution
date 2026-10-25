import { parseSectionJump } from './section-jump';

export type ParsedQuery =
  | { kind: 'section'; number: string; anchor: string | null; raw: string }
  | { kind: 'phrase'; phrase: string; raw: string }
  | { kind: 'text'; text: string; raw: string };

const quotedPhrase = /^\s*"([^"]+)"\s*$/;

export function parseQuery(input: string): ParsedQuery {
  const trimmed = input.trim();
  const phrase = quotedPhrase.exec(trimmed);
  const quoted = phrase?.[1]?.trim();
  if (quoted) {
    return { kind: 'phrase', phrase: quoted, raw: input };
  }
  const jump = parseSectionJump(trimmed);
  if (jump) {
    return {
      kind: 'section',
      number: jump.number,
      anchor: jump.anchor,
      raw: input,
    };
  }
  return { kind: 'text', text: trimmed, raw: input };
}
