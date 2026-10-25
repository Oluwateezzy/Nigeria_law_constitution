import { execFileSync } from 'node:child_process';
import { isSecretPath } from './match-secret-path.mjs';

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const hits = tracked.filter((file) => isSecretPath(file));

if (hits.length > 0) {
  console.error(
    'Tracked files match the secret patterns in scripts/secret-patterns.txt:',
  );
  for (const file of hits) {
    console.error(`  ${file}`);
  }
  process.exit(1);
}
