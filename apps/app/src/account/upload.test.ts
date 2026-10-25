import { describe, expect, it } from 'vitest';
import { localRowsNeedChoice, noteShouldSync, shouldAskUpload } from './upload';

describe('upload choice', () => {
  it('asks once, then only when a later local row appeared', () => {
    expect(
      shouldAskUpload({
        signedIn: true,
        hasLocalContent: true,
        choice: null,
        localNewerThanSync: false,
      }),
    ).toBe(true);
    expect(
      shouldAskUpload({
        signedIn: true,
        hasLocalContent: true,
        choice: 'upload',
        localNewerThanSync: false,
      }),
    ).toBe(false);
    expect(
      shouldAskUpload({
        signedIn: true,
        hasLocalContent: true,
        choice: 'keep',
        localNewerThanSync: true,
      }),
    ).toBe(true);
    expect(
      shouldAskUpload({
        signedIn: false,
        hasLocalContent: true,
        choice: null,
        localNewerThanSync: false,
      }),
    ).toBe(false);
  });

  it('uploads every row for Upload, and only later rows for Keep', () => {
    expect(
      noteShouldSync(
        '2026-10-25T10:00:00.000Z',
        'upload',
        '2026-10-25T12:00:00.000Z',
      ),
    ).toBe(true);
    expect(
      noteShouldSync(
        '2026-10-25T10:00:00.000Z',
        'keep',
        '2026-10-25T12:00:00.000Z',
      ),
    ).toBe(false);
    expect(
      noteShouldSync(
        '2026-10-25T12:01:00.000Z',
        'keep',
        '2026-10-25T12:00:00.000Z',
      ),
    ).toBe(true);
    expect(
      localRowsNeedChoice(
        [{ syncState: 'local', updatedAt: '2026-10-25T13:00:00.000Z' }],
        '2026-10-25T12:00:00.000Z',
      ),
    ).toBe(true);
  });
});
