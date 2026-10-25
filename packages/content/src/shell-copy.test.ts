import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { copy } from '../../../apps/app/src/copy/index';

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../apps/app',
);
const disclaimerPhrase = 'not legal advice';

const deck = {
  searchPlaceholder: 'Search the Constitution and laws',
  askPlaceholder: 'Ask about this section',
  scenarioPlaceholder: 'Describe what happened, in your own words',
  disclaimer:
    'This explains the text loaded in the app. It is not legal advice.',
  signIn: 'Sign in to keep notes and conversations when you change phones.',
  quotaFreeSomeLeft: '4 free explanations left today',
  quotaFreeNoneLeft:
    "You have used today's 5 free explanations. They reset at midnight Lagos time.",
  ownKeyActive: 'Using your own key on this device.',
  offlineAi:
    'Explanations need a connection. You can still read, search, and edit notes.',
} as const;

describe('shell copy', () => {
  it('exports every line from the copy deck', () => {
    expect(copy.searchPlaceholder).toBe(deck.searchPlaceholder);
    expect(copy.askPlaceholder).toBe(deck.askPlaceholder);
    expect(copy.scenarioPlaceholder).toBe(deck.scenarioPlaceholder);
    expect(copy.disclaimer).toBe(deck.disclaimer);
    expect(copy.signIn).toBe(deck.signIn);
    expect(copy.quotaFreeSomeLeft).toBe(deck.quotaFreeSomeLeft);
    expect(copy.quotaFreeNoneLeft).toBe(deck.quotaFreeNoneLeft);
    expect(copy.ownKeyActive).toBe(deck.ownKeyActive);
    expect(copy.offlineAi).toBe(deck.offlineAi);
    expect(copy.disclosure.notLegalAdvice).toBe(
      'The explanation is not legal advice.',
    );
    expect(copy.disclosure.sentToProvider).toBe(
      'The words of the question, and the text of the sections used, are sent to the model provider for that request.',
    );
    expect(copy.disclosure.hostedOrOwnKey).toBe(
      'Hosted requests use the project provider. Own-key requests use the provider they chose.',
    );
    expect(copy.disclosure.freeLane).toBe(
      'The free lane allows 5 hosted requests per day on this install.',
    );
  });

  it('keeps the disclaimer phrase in the app copy module only', () => {
    const hits = walk(appRoot).filter((file) =>
      readFileSync(file, 'utf8').includes(disclaimerPhrase),
    );
    expect(hits.map((file) => path.relative(appRoot, file)).sort()).toEqual([
      'src/copy/index.ts',
    ]);
  });
});

function walk(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    if (entry === 'node_modules' || entry === '.expo' || entry === 'assets') {
      continue;
    }
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
