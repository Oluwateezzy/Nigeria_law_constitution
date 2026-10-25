import { mergeByUpdatedAt, type Timestamped } from '@nigeria-law/domain';

export function mergeRows<T extends Timestamped>(
  local: readonly T[],
  remote: readonly T[],
): T[] {
  const byId = new Map(local.map((row) => [row.id, row]));
  for (const row of remote) {
    const current = byId.get(row.id);
    byId.set(row.id, current ? mergeByUpdatedAt(current, row) : row);
  }
  return [...byId.values()];
}
