import { parseSectionJump } from '@nigeria-law/domain';
import type { Block, Instrument } from './schema';
import { locateSections, type LocatedSection } from './walk';

export type ResolvedJump = LocatedSection & {
  anchor: string | null;
};

function hasAnchor(blocks: readonly Block[], anchor: string): boolean {
  for (const block of blocks) {
    if (block.anchor === anchor) {
      return true;
    }
    if (block.blocks && hasAnchor(block.blocks, anchor)) {
      return true;
    }
  }
  return false;
}

export function resolveSectionJump(
  instrument: Instrument,
  input: string,
): ResolvedJump | null {
  const jump = parseSectionJump(input);
  if (!jump) {
    return null;
  }
  const located = locateSections(instrument).find(
    (item) => item.section.number.toUpperCase() === jump.number.toUpperCase(),
  );
  if (!located) {
    return null;
  }
  if (jump.anchor && !hasAnchor(located.section.blocks, jump.anchor)) {
    return null;
  }
  return { ...located, anchor: jump.anchor };
}
