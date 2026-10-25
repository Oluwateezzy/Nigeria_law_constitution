import { describe, expect, it } from 'vitest';
import {
  MemoryDatabase,
  readReadingPosition,
  readTextSize,
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
});
