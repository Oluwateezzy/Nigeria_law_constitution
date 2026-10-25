import { sha256 } from './sha256';

export type HashSection = {
  id: string;
  plainText: string;
  aliases?: readonly string[];
};

export function legalTextHash(sections: readonly HashSection[]): string {
  return sha256(
    sections.map((section) => `${section.id}\n${section.plainText}`).join('\n'),
  );
}

export function indexHash(sections: readonly HashSection[]): string {
  return sha256(
    sections
      .map((section) => `${section.id}\n${(section.aliases ?? []).join('\n')}`)
      .join('\n'),
  );
}

export function makeContentVersion(date: string, legalHash: string): string {
  return `${date}.${legalHash.slice(0, 12)}`;
}
