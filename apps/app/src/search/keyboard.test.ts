import { describe, expect, it } from 'vitest';
import { activeResultIndex, searchCursor } from './keyboard';

describe('search keyboard', () => {
  it('moves through results and opens the highlighted row', () => {
    expect(searchCursor(0, 3, 'ArrowDown')).toBe(1);
    expect(searchCursor(1, 3, 'ArrowUp')).toBe(0);
    expect(searchCursor(2, 3, 'ArrowDown')).toBe(2);
    expect(searchCursor(1, 3, 'Enter')).toBe('open');
    expect(searchCursor(0, 0, 'Enter')).toBeNull();
  });

  it('returns to the first result when the query changes', () => {
    expect(activeResultIndex('fair', { query: 'supremacy', index: 2 }, 4)).toBe(
      0,
    );
    expect(
      activeResultIndex('supremacy', { query: 'supremacy', index: 2 }, 4),
    ).toBe(2);
  });
});
