import { describe, expect, it } from 'vitest';
import {
  MemoryDatabase,
  readReadingPosition,
  readRecentQueries,
  readTextSize,
  rememberQuery,
  writeReadingPosition,
  writeTextSize,
} from './database';

describe('local database', () => {
  it('reloads the reading position and the text size from the same snapshot', () => {
    const database = MemoryDatabase.load({});
    writeReadingPosition(database, {
      sectionId: 'cfrn-1999:s:36',
      anchor: 'sub-1',
    });
    writeTextSize(database, 2);
    const reloaded = MemoryDatabase.load(database.snapshot());
    expect(readReadingPosition(reloaded)).toEqual({
      sectionId: 'cfrn-1999:s:36',
      anchor: 'sub-1',
    });
    expect(readTextSize(reloaded)).toBe(2);
    expect(readTextSize(MemoryDatabase.load({}))).toBe(1);
    expect(readReadingPosition(MemoryDatabase.load({}))).toBeNull();
  });

  it('keeps eight recent queries and restores them from the snapshot', () => {
    const database = MemoryDatabase.load({});
    for (let index = 1; index <= 10; index += 1) {
      rememberQuery(database, `query ${index}`);
    }
    rememberQuery(database, 'query 10');
    const reloaded = MemoryDatabase.load(database.snapshot());
    expect(readRecentQueries(reloaded)).toEqual([
      'query 10',
      'query 9',
      'query 8',
      'query 7',
      'query 6',
      'query 5',
      'query 4',
      'query 3',
    ]);
  });
});
