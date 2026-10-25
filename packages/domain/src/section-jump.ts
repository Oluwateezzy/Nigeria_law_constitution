export type SectionJump = {
  number: string;
  anchor: string | null;
};

const jumpPattern =
  /^\s*(?:(?:section|s)\b\.?\s*)?(\d+)([A-Za-z])?(?:\s*\(\s*(\d+)\s*\))?(?:\s*\(\s*([a-z])\s*\))?(?:\s*\(\s*([ivx]+)\s*\))?\s*$/i;

export function parseSectionJump(input: string): SectionJump | null {
  const match = jumpPattern.exec(input);
  const digits = match?.[1];
  if (!match || !digits) {
    return null;
  }
  const letter = match[2] ? match[2].toUpperCase() : '';
  const subsection = match[3];
  const paragraph = match[4]?.toLowerCase();
  const subparagraph = match[5]?.toLowerCase();
  let anchor: string | null = null;
  if (subsection) {
    anchor = `sub-${subsection}`;
    if (paragraph) {
      anchor += `-${paragraph}`;
    }
    if (subparagraph) {
      anchor += `-${subparagraph}`;
    }
  }
  return { number: `${digits}${letter}`, anchor };
}
