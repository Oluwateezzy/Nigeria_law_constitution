import { NotImplemented } from './not-implemented';

export type ParsedQuery =
  | { kind: 'section'; number: string; anchor: string | null; raw: string }
  | { kind: 'phrase'; phrase: string; raw: string }
  | { kind: 'text'; text: string; raw: string };

export function parseQuery(input: string): ParsedQuery {
  void input;
  throw new NotImplemented('parseQuery');
}
