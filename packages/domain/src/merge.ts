import { NotImplemented } from './not-implemented';

export type Timestamped = {
  id: string;
  updatedAt: string;
  deletedAt: string | null;
};

export function mergeByUpdatedAt<T extends Timestamped>(
  local: T,
  remote: T,
): T {
  void local;
  void remote;
  throw new NotImplemented('mergeByUpdatedAt');
}
