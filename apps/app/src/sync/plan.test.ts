import { describe, expect, it } from 'vitest';
import { mergeRows } from './plan';

describe('sync merge', () => {
  it('applies a newer remote tombstone and keeps a newer local body', () => {
    const merged = mergeRows(
      [
        {
          id: 'local-newer',
          updatedAt: '2026-10-25T12:00:00.000Z',
          deletedAt: null,
          body: 'on this device',
        },
        {
          id: 'remote-deleted',
          updatedAt: '2026-10-25T09:00:00.000Z',
          deletedAt: null,
          body: 'old',
        },
      ],
      [
        {
          id: 'local-newer',
          updatedAt: '2026-10-25T10:00:00.000Z',
          deletedAt: '2026-10-25T10:00:00.000Z',
          body: 'old',
        },
        {
          id: 'remote-deleted',
          updatedAt: '2026-10-25T11:00:00.000Z',
          deletedAt: '2026-10-25T11:00:00.000Z',
          body: 'old',
        },
      ],
    );
    const kept = merged.find((row) => row.id === 'local-newer');
    const gone = merged.find((row) => row.id === 'remote-deleted');
    expect(kept?.body).toBe('on this device');
    expect(kept?.deletedAt).toBeNull();
    expect(gone?.deletedAt).toBe('2026-10-25T11:00:00.000Z');
  });
});
