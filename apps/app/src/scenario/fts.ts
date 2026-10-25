import {
  retrieveScenario,
  scenarioMatchTokens,
  scenarioMinimumTokens,
  type ScenarioCandidate,
  type ScenarioRetrieval,
} from '@nigeria-law/domain';
import type { SqlDatabase } from '../search/driver';

export async function retrieveFromIndex(
  db: SqlDatabase,
  text: string,
): Promise<ScenarioRetrieval> {
  if (scenarioMatchTokens(text).length < scenarioMinimumTokens) {
    return retrieveScenario(text, []);
  }
  const match = scenarioMatchTokens(text)
    .map((token) => `"${token.replace(/"/g, '')}"`)
    .join(' OR ');
  let rows: Record<string, unknown>[] = [];
  try {
    rows = await db.all(
      `SELECT id, path, extent, plain_text, heading, number, short_title,
              bm25(sections_fts, 10.0, 5.0, 1.0) AS rank
       FROM sections_fts
       WHERE sections_fts MATCH ?
       ORDER BY rank
       LIMIT 20`,
      [match],
    );
  } catch {
    return { kind: 'weak', sections: [] };
  }
  const hits: ScenarioCandidate[] = rows.map((row) => ({
    sectionId: textOf(row.id),
    score: -Number(row.rank),
    path: textOf(row.path),
    extent: textOf(row.extent),
    plainText: textOf(row.plain_text),
    heading: textOf(row.heading),
    number: textOf(row.number),
    shortTitle: textOf(row.short_title),
    citation: textOf(row.short_title),
  }));
  return retrieveScenario(text, hits);
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
