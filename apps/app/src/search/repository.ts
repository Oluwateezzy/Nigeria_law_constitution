import { parseQuery, elapsedNow, type ParsedQuery } from '@nigeria-law/domain';
import type { SqlDatabase } from './driver';
import type { SearchRow } from './rows';

export type SearchResult = {
  sectionId: string;
  instrumentId: string;
  shortTitle: string;
  kind: 'constitution' | 'act';
  number: string;
  heading: string;
  path: string;
  snippet: string;
  reviewStatus: 'draft' | 'reviewed';
  anchor: string | null;
  extent: string;
};

const schema = `
CREATE TABLE IF NOT EXISTS search_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE VIRTUAL TABLE IF NOT EXISTS sections_fts USING fts5(
  heading,
  aliases,
  plain_text,
  id UNINDEXED,
  instrument_id UNINDEXED,
  kind UNINDEXED,
  number UNINDEXED,
  path UNINDEXED,
  extent UNINDEXED,
  review_status UNINDEXED,
  short_title UNINDEXED,
  anchors UNINDEXED
);
`;

const insertSql = `
INSERT INTO sections_fts (
  heading, aliases, plain_text, id, instrument_id, kind, number, path,
  extent, review_status, short_title, anchors
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const columns = `
heading, aliases, plain_text, id, instrument_id, kind, number, path,
extent, review_status, short_title, anchors
`;

type StoredRow = {
  heading: string;
  aliases: string;
  plain_text: string;
  id: string;
  instrument_id: string;
  kind: string;
  number: string;
  path: string;
  extent: string;
  review_status: string;
  short_title: string;
  anchors: string;
};

const timings: { query: string; ms: number }[] = [];

export function searchTimings(): readonly { query: string; ms: number }[] {
  return timings;
}

export function resetSearchTimings(): void {
  timings.length = 0;
}

export function reviewBadge(status: SearchResult['reviewStatus']): string | null {
  return status === 'reviewed' ? null : 'Not yet reviewed';
}

export async function ensureIndex(
  db: SqlDatabase,
  rows: readonly SearchRow[],
  hash: string,
): Promise<void> {
  await db.exec(schema);
  const stored = await db.get(
    `SELECT value FROM search_meta WHERE key = 'index_hash'`,
  );
  const count = await db.get(`SELECT count(*) AS count FROM sections_fts`);
  const storedHash = typeof stored?.value === 'string' ? stored.value : null;
  const storedCount = Number(count?.count ?? 0);
  if (storedHash === hash && storedCount > 0) {
    return;
  }
  await db.transaction(async () => {
    await db.exec('DELETE FROM sections_fts');
    for (const row of rows) {
      await db.run(insertSql, [
        row.heading,
        row.aliases,
        row.plainText,
        row.id,
        row.instrumentId,
        row.kind,
        row.number,
        row.path,
        row.extent,
        row.reviewStatus,
        row.shortTitle,
        row.anchors,
      ]);
    }
    await db.run(
      `INSERT INTO search_meta (key, value) VALUES ('index_hash', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [hash],
    );
  });
}

export function matchExpression(parsed: ParsedQuery): string | null {
  if (parsed.kind === 'section') {
    return `"${parsed.number}"`;
  }
  if (parsed.kind === 'phrase') {
    const phrase = parsed.phrase.replace(/"/g, '').trim();
    return phrase ? `"${phrase}"` : null;
  }
  const tokens = parsed.text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 0);
  if (tokens.length === 0) return null;
  return tokens.map((token) => `"${token}"`).join(' AND ');
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readStored(row: Record<string, unknown>): StoredRow {
  return {
    heading: asText(row.heading),
    aliases: asText(row.aliases),
    plain_text: asText(row.plain_text),
    id: asText(row.id),
    instrument_id: asText(row.instrument_id),
    kind: asText(row.kind),
    number: asText(row.number),
    path: asText(row.path),
    extent: asText(row.extent),
    review_status: asText(row.review_status),
    short_title: asText(row.short_title),
    anchors: asText(row.anchors),
  };
}

export function makeSnippet(plain: string, needle: string): string {
  const text = plain.replace(/\s+/g, ' ').trim();
  const probe = needle.trim().toLowerCase();
  const window = 140;
  const at = probe ? text.toLowerCase().indexOf(probe) : -1;
  const startAt =
    at >= 0
      ? at
      : (() => {
          const word = probe.split(/\s+/).find((part) => part.length > 2);
          return word ? text.toLowerCase().indexOf(word) : -1;
        })();
  const from = startAt > 40 ? startAt - 40 : 0;
  const slice = text.slice(from, from + window).trim();
  const prefix = from > 0 ? '…' : '';
  const suffix = from + window < text.length ? '…' : '';
  return `${prefix}${slice}${suffix}`;
}

function toResult(
  row: StoredRow,
  parsed: ParsedQuery,
  anchor: string | null,
): SearchResult {
  const needle =
    parsed.kind === 'phrase'
      ? parsed.phrase
      : parsed.kind === 'text'
        ? parsed.text
        : row.plain_text.slice(0, 48);
  const haystack =
    parsed.kind === 'section'
      ? row.plain_text
      : `${row.heading}\n${row.aliases}\n${row.plain_text}`;
  return {
    sectionId: row.id,
    instrumentId: row.instrument_id,
    shortTitle: row.short_title,
    kind: row.kind === 'act' ? 'act' : 'constitution',
    number: row.number,
    heading: row.heading,
    path: row.path,
    snippet: makeSnippet(haystack, needle),
    reviewStatus: row.review_status === 'draft' ? 'draft' : 'reviewed',
    anchor,
    extent: row.extent,
  };
}

function constitutionFirst(rows: StoredRow[]): StoredRow[] {
  return [...rows].sort((left, right) => {
    const leftRank = left.kind === 'constitution' ? 0 : 1;
    const rightRank = right.kind === 'constitution' ? 0 : 1;
    return leftRank - rightRank;
  });
}

function anchorFor(row: StoredRow, parsed: ParsedQuery): string | null {
  if (parsed.kind !== 'section' || !parsed.anchor) return null;
  const anchors = new Set(row.anchors.split(/\s+/).filter(Boolean));
  return anchors.has(parsed.anchor) ? parsed.anchor : null;
}

export async function search(
  db: SqlDatabase,
  query: string,
  options?: { instrumentId?: string | null },
): Promise<SearchResult[]> {
  const started = elapsedNow();
  const parsed = parseQuery(query);
  const instrumentId = options?.instrumentId ?? null;
  const results = await collect(db, parsed, instrumentId);
  timings.push({ query, ms: elapsedNow() - started });
  if (timings.length > 40) timings.splice(0, timings.length - 40);
  return results;
}

async function collect(
  db: SqlDatabase,
  parsed: ParsedQuery,
  instrumentId: string | null,
): Promise<SearchResult[]> {
  if (parsed.kind === 'text' && parsed.text.length === 0) return [];
  const filter = instrumentId ? ` AND instrument_id = ?` : '';
  const filterParams = instrumentId ? [instrumentId] : [];
  const chosen: SearchResult[] = [];
  const seen = new Set<string>();
  if (parsed.kind === 'section') {
    const exact = constitutionFirst(
      (await db.all(
        `SELECT ${columns} FROM sections_fts WHERE number = ?${filter}`,
        [parsed.number, ...filterParams],
      )).map(readStored),
    );
    for (const row of exact) {
      seen.add(row.id);
      chosen.push(toResult(row, parsed, anchorFor(row, parsed)));
    }
  }
  const match = matchExpression(parsed);
  if (match) {
    try {
      const ranked = (
        await db.all(
          `SELECT ${columns}, bm25(sections_fts, 10.0, 5.0, 1.0) AS rank
           FROM sections_fts
           WHERE sections_fts MATCH ?${filter}
           ORDER BY rank
           LIMIT 20`,
          [match, ...filterParams],
        )
      ).map(readStored);
      for (const row of ranked) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        chosen.push(toResult(row, parsed, null));
      }
    } catch {
      return chosen.slice(0, 20);
    }
  }
  return chosen.slice(0, 20);
}
