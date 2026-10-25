import { describe, expect, it } from 'vitest';
import { parseSectionJump } from './section-jump';

describe('parseSectionJump', () => {
  it('accepts the in-instrument forms from the query rules', () => {
    expect(parseSectionJump('36')).toEqual({ number: '36', anchor: null });
    expect(parseSectionJump('s 36')).toEqual({ number: '36', anchor: null });
    expect(parseSectionJump('s.36')).toEqual({ number: '36', anchor: null });
    expect(parseSectionJump('s. 36')).toEqual({ number: '36', anchor: null });
    expect(parseSectionJump('section 36')).toEqual({
      number: '36',
      anchor: null,
    });
    expect(parseSectionJump('Section 36')).toEqual({
      number: '36',
      anchor: null,
    });
    expect(parseSectionJump('S.36')).toEqual({ number: '36', anchor: null });
    expect(parseSectionJump('36(1)')).toEqual({
      number: '36',
      anchor: 'sub-1',
    });
    expect(parseSectionJump('36 (1)')).toEqual({
      number: '36',
      anchor: 'sub-1',
    });
    expect(parseSectionJump('section 36(1)')).toEqual({
      number: '36',
      anchor: 'sub-1',
    });
    expect(parseSectionJump('s.36(1)(a)')).toEqual({
      number: '36',
      anchor: 'sub-1-a',
    });
    expect(parseSectionJump('36(1)(a)(i)')).toEqual({
      number: '36',
      anchor: 'sub-1-a-i',
    });
    expect(parseSectionJump('16a')).toEqual({ number: '16A', anchor: null });
  });

  it('leaves uncertain text unmatched', () => {
    expect(parseSectionJump('')).toBeNull();
    expect(parseSectionJump('fair hearing')).toBeNull();
    expect(parseSectionJump('sections 33 to 36')).toBeNull();
    expect(parseSectionJump('36 extra')).toBeNull();
    expect(parseSectionJump('section')).toBeNull();
  });
});
