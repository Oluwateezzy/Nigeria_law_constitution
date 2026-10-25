import { describe, expect, it } from 'vitest';
import { readerBarActions } from './bar';

describe('reader bar', () => {
  it('leaves Ask and Note available, and disables the ends', () => {
    expect(
      readerBarActions({ atStart: true, atEnd: false }).map((item) => item.id),
    ).toEqual(['previous', 'ask', 'note', 'next']);
    const atStart = readerBarActions({ atStart: true, atEnd: false });
    expect(atStart.find((item) => item.id === 'previous')?.disabled).toBe(true);
    expect(atStart.find((item) => item.id === 'next')?.disabled).toBe(false);
    expect(atStart.find((item) => item.id === 'ask')?.disabled).toBe(false);
    expect(atStart.find((item) => item.id === 'note')?.disabled).toBe(false);
    expect(
      readerBarActions({ atStart: false, atEnd: true }).find(
        (item) => item.id === 'next',
      )?.disabled,
    ).toBe(true);
  });
});
