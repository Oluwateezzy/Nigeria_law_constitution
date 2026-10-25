import type { Block } from '@nigeria-law/content';

export type ProvisionLine = {
  anchor: string;
  marker: string;
  text: string;
  depth: number;
  kind: Block['type'];
  rows?: string[][];
};

export function provisionLines(
  blocks: readonly Block[],
  depth = 0,
): ProvisionLine[] {
  const lines: ProvisionLine[] = [];
  for (const block of blocks) {
    if (block.type === 'table') {
      lines.push({
        anchor: block.anchor,
        marker: '',
        text: '',
        depth,
        kind: 'table',
        rows: block.rows ?? [],
      });
    } else {
      lines.push({
        anchor: block.anchor,
        marker: block.marker ? `(${block.marker})` : '',
        text: block.text,
        depth,
        kind: block.type,
      });
    }
    if (block.blocks) {
      lines.push(...provisionLines(block.blocks, depth + 1));
    }
  }
  return lines;
}
