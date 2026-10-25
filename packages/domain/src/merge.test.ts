import { describe, expect, it } from 'vitest';
import { mergeByUpdatedAt, type Timestamped } from './merge';

const base = {
  id: 'note-1',
  body: 'local',
  updatedAt: '2026-10-25T10:00:00.000Z',
  deletedAt: null as string | null,
};

describe('mergeByUpdatedAt', () => {
  it('keeps the remote row when it is newer', () => {
    const local = { ...base };
    const remote = {
      ...base,
      body: 'remote',
      updatedAt: '2026-10-25T11:00:00.000Z',
    };
    expect(mergeByUpdatedAt(local, remote)).toEqual(remote);
  });

  it('keeps the local row when it is newer', () => {
    const local = { ...base, updatedAt: '2026-10-25T12:00:00.000Z' };
    const remote = { ...base, body: 'remote' };
    expect(mergeByUpdatedAt(local, remote)).toEqual(local);
  });

  it('lets a newer tombstone delete the row', () => {
    const local = { ...base, body: 'still here' };
    const remote: Timestamped & { body: string } = {
      ...base,
      body: 'still here',
      updatedAt: '2026-10-25T11:00:00.000Z',
      deletedAt: '2026-10-25T11:00:00.000Z',
    };
    expect(mergeByUpdatedAt(local, remote).deletedAt).toBe(remote.deletedAt);
  });

  it('does not let an older tombstone resurrect or erase a newer edit', () => {
    const local = {
      ...base,
      body: 'edited later',
      updatedAt: '2026-10-25T12:00:00.000Z',
      deletedAt: null,
    };
    const remote = {
      ...base,
      body: 'old',
      updatedAt: '2026-10-25T09:00:00.000Z',
      deletedAt: '2026-10-25T09:00:00.000Z',
    };
    const merged = mergeByUpdatedAt(local, remote);
    expect(merged.body).toBe('edited later');
    expect(merged.deletedAt).toBeNull();
  });
});
