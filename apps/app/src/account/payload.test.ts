import { describe, expect, it } from 'vitest';
import {
  accountLabel,
  payloadHasSecretField,
  syncedNoteFields,
  syncedThreadFields,
} from './payload';

describe('account payload', () => {
  it('keeps keys and tokens off the synced note and thread fields', () => {
    expect(payloadHasSecretField(syncedNoteFields)).toBe(false);
    expect(payloadHasSecretField(syncedThreadFields)).toBe(false);
    expect(accountLabel({ email: 'ada@example.com' })).toBe('ada@example.com');
    expect(accountLabel({ email: null, provider: 'google' })).toBe('Google');
  });
});
