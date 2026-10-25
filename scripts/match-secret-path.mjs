import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const patternFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'secret-patterns.txt',
);

export function loadSecretRules(source = readFileSync(patternFile, 'utf8')) {
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

export function isSecretPath(filePath, rules = loadSecretRules()) {
  const base = filePath.split('/').pop() ?? filePath;
  return rules.some((rule) => matches(base, rule));
}

function matches(base, rule) {
  if (rule === 'env') {
    if (base.endsWith('.example')) {
      return false;
    }
    return base === '.env' || base.startsWith('.env.');
  }
  if (rule.startsWith('ext:')) {
    return base.endsWith(`.${rule.slice(4)}`);
  }
  if (rule.startsWith('name:')) {
    return base === rule.slice(5);
  }
  throw new Error(
    `Unknown secret rule "${rule}" in scripts/secret-patterns.txt`,
  );
}
