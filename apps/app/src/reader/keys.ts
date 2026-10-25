export function arrowMovesSection(target: unknown): boolean {
  if (!target || typeof target !== 'object') return true;
  const element = target as { tagName?: string; isContentEditable?: boolean };
  const tag = element.tagName?.toUpperCase() ?? '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false;
  if (element.isContentEditable) return false;
  return true;
}
