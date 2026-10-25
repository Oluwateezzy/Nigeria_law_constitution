import { describe, expect, it } from 'vitest';
import { arrowMovesSection } from './keys';

describe('reader arrow keys', () => {
  it('moves when focus is not in a text field', () => {
    expect(arrowMovesSection(null)).toBe(true);
    expect(arrowMovesSection({ tagName: 'BUTTON' })).toBe(true);
    expect(arrowMovesSection({ tagName: 'INPUT' })).toBe(false);
    expect(arrowMovesSection({ tagName: 'TEXTAREA' })).toBe(false);
    expect(arrowMovesSection({ isContentEditable: true })).toBe(false);
  });
});
