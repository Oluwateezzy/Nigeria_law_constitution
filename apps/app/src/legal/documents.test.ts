import { describe, expect, it } from 'vitest';
import { privacyParagraphs, termsParagraphs } from './documents';

describe('privacy policy', () => {
  const text = privacyParagraphs.join('\n');

  it('covers the release list', () => {
    expect(text).toContain('account is optional');
    expect(text).toContain('Notes stay on the device');
    expect(text).toContain('install id');
    expect(text).toContain('hosted request');
    expect(text).toContain('own-key request');
    expect(text).toContain('store subscription');
    expect(text).toContain('Stripe');
    expect(text).toContain('Crash reports');
    expect(text).toContain('Account deletion');
    expect(text).toContain('advertising SDK');
  });
});

describe('terms', () => {
  it('states the product boundary and account deletion', () => {
    const text = termsParagraphs.join('\n');
    expect(text).toContain('not a lawyer');
    expect(text).toContain('delete an account');
  });
});
