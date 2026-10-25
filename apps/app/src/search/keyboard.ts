export function activeResultIndex(
  query: string,
  cursor: { query: string; index: number },
  count: number,
): number {
  if (count <= 0) return 0;
  const index = cursor.query === query ? cursor.index : 0;
  return Math.max(0, Math.min(count - 1, index));
}

export function searchCursor(
  index: number,
  count: number,
  key: string,
): number | 'open' | null {
  if (count <= 0) return null;
  if (key === 'ArrowDown') return Math.min(count - 1, index + 1);
  if (key === 'ArrowUp') return Math.max(0, index - 1);
  if (key === 'Enter') return 'open';
  return null;
}
