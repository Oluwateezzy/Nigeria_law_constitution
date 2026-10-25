const MENTION =
  /\bsections?\s+(\d+[A-Za-z]?(?:\s*(?:,|and|to)\s*\d+[A-Za-z]?)*)/gi;

/**
 * Section numbers named in text. A range such as "sections 33 to 36" expands
 * only when both ends are plain integers. Anything uncertain is left out.
 */
export function extractSectionMentions(plainText: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  const add = (number: string) => {
    if (!/^\d+[A-Za-z]?$/.test(number) || seen.has(number)) return;
    seen.add(number);
    found.push(number);
  };

  for (const match of plainText.matchAll(MENTION)) {
    const list = match[1] ?? '';
    const parts = list.split(/\s*,\s*|\s+and\s+|\s+to\s+/).filter(Boolean);
    const range = /\bto\b/.test(list);
    if (range) {
      if (parts.length !== 2) continue;
      const from = Number(parts[0]);
      const to = Number(parts[1]);
      if (!Number.isInteger(from) || !Number.isInteger(to)) continue;
      if (to < from || to - from > 40) continue;
      for (let number = from; number <= to; number += 1) add(String(number));
      continue;
    }
    for (const part of parts) add(part);
  }

  return found;
}
