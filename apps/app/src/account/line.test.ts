import { describe, expect, it } from 'vitest';
import { launchRequiresAccount, showAccountLine } from './line';

describe('account line', () => {
  it('stays hidden until the third living note and after dismiss', () => {
    expect(launchRequiresAccount).toBe(false);
    expect(showAccountLine(2, false)).toBe(false);
    expect(showAccountLine(3, false)).toBe(true);
    expect(showAccountLine(4, true)).toBe(false);
  });
});
