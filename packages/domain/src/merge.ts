export type Timestamped = {
  id: string;
  updatedAt: string;
  deletedAt: string | null;
};

export function mergeByUpdatedAt<T extends Timestamped>(
  local: T,
  remote: T,
): T {
  if (remote.updatedAt > local.updatedAt) return remote;
  if (local.updatedAt > remote.updatedAt) return local;
  if (remote.deletedAt && !local.deletedAt) return remote;
  if (local.deletedAt && !remote.deletedAt) return local;
  return remote;
}
