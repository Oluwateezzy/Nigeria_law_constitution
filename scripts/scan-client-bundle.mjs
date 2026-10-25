import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const jwtPattern =
  /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;

export function jwtRole(token) {
  const body = token.split('.')[1];
  if (!body) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

export function secretFindings(text) {
  const findings = [];
  if (/SUPABASE_SERVICE_ROLE_KEY/i.test(text)) {
    findings.push('service role name');
  }
  if (/HOSTED_MODEL_KEY/.test(text)) {
    findings.push('hosted model key name');
  }
  if (/sk_(?:live|test)_[A-Za-z0-9]/.test(text)) {
    findings.push('stripe secret');
  }
  if (/sk-[A-Za-z0-9]{20,}/.test(text)) {
    findings.push('model key');
  }
  for (const token of text.match(jwtPattern) ?? []) {
    if (jwtRole(token) === 'service_role') {
      findings.push('service role token');
    }
  }
  return findings;
}

export async function scanBundleTree(root) {
  const hits = [];
  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(path);
        continue;
      }
      if (!/\.(js|html|json|css|map|txt)$/.test(entry.name)) continue;
      const text = await readFile(path, 'utf8');
      const findings = secretFindings(text);
      if (findings.length > 0) {
        hits.push({ file: relative(root, path), findings });
      }
    }
  }
  await walk(root);
  return hits;
}

const isDirect =
  process.argv[1] && process.argv[1].endsWith('scan-client-bundle.mjs');

if (isDirect) {
  const root = process.argv[2] ?? 'apps/app/dist';
  const hits = await scanBundleTree(root).catch((error) => {
    console.error(`Client bundle scan could not read ${root}`);
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
  if (hits.length > 0) {
    console.error('The client bundle contains a server secret:');
    for (const hit of hits) {
      console.error(`  ${hit.file}: ${hit.findings.join(', ')}`);
    }
    process.exit(1);
  }
}
