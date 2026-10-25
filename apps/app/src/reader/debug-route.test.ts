import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

describe('debug corpus route', () => {
  it('is removed from the app', () => {
    const hits = walk(path.join(appRoot, 'src')).filter((file) => {
      if (file.endsWith(`${path.sep}debug-route.test.ts`)) {
        return false;
      }
      const text = readFileSync(file, 'utf8');
      return (
        file.includes(`${path.sep}debug${path.sep}corpus`) ||
        text.includes('/debug/corpus') ||
        text.includes('Corpus debug')
      );
    });
    expect(hits).toEqual([]);
  });
});

function walk(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const fullPath = path.join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}
