import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { secretFindings, scanBundleTree } from './scan-client-bundle.mjs';

function token(role: string): string {
  const body = Buffer.from(JSON.stringify({ role })).toString('base64url');
  return `eyJhbGciOiJIUzI1NiJ9.${body}.signaturevalue`;
}

describe('client bundle secrets', () => {
  it('rejects a service role and a hosted model key', () => {
    expect(
      secretFindings(`HOSTED_MODEL_KEY = "sk-abcdefghijklmnopqrst"`),
    ).toContain('hosted model key name');
    expect(secretFindings(token('service_role'))).toContain(
      'service role token',
    );
    expect(secretFindings('SUPABASE_SERVICE_ROLE_KEY')).toContain(
      'service role name',
    );
  });

  it('allows the anon token and the crash redaction pattern', () => {
    expect(secretFindings(token('anon'))).toEqual([]);
    expect(secretFindings('/sk-[A-Za-z0-9_-]+|Bearer\\s+\\S+/gi')).toEqual([]);
  });

  it('scans a built file tree', async () => {
    const root = await mkdtemp(join(tmpdir(), 'bundle-'));
    await writeFile(join(root, 'app.js'), 'var key = "HOSTED_MODEL_KEY";');
    const hits = await scanBundleTree(root);
    expect(hits).toEqual([
      { file: 'app.js', findings: ['hosted model key name'] },
    ]);
  });
});
