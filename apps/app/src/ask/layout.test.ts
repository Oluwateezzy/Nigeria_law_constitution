import { describe, expect, it } from 'vitest';
import { askUsesColumn } from './layout';

describe('ask layout', () => {
  it('uses a column only when the section can stay at 68 characters', () => {
    expect(askUsesColumn(390)).toBe(false);
    expect(askUsesColumn(1280)).toBe(true);
  });
});
