import { describe, expect, it } from 'vitest';
import { isSecretPath, loadSecretRules } from './match-secret-path.mjs';

const rules = loadSecretRules();

describe('secret paths', () => {
  it('flags env files and key material, and allows examples', () => {
    expect(isSecretPath('.env', rules)).toBe(true);
    expect(isSecretPath('apps/app/.env.local', rules)).toBe(true);
    expect(isSecretPath('supabase/.env', rules)).toBe(true);
    expect(isSecretPath('apps/app/.env.example', rules)).toBe(false);
    expect(isSecretPath('supabase/.env.example', rules)).toBe(false);
    expect(isSecretPath('certs/server.pem', rules)).toBe(true);
    expect(isSecretPath('keys/upload.p12', rules)).toBe(true);
    expect(isSecretPath('secrets/credentials.json', rules)).toBe(true);
    expect(isSecretPath('README.md', rules)).toBe(false);
  });
});
