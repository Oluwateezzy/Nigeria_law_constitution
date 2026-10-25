import { describe, expect, it } from 'vitest';
import { documentedReaderUrl, parseReaderUrl, readerHref } from './linking';

describe('reader links', () => {
  it('opens the documented section URL and keeps the fragment', () => {
    expect(parseReaderUrl(documentedReaderUrl)).toEqual({
      instrumentId: 'cfrn-1999',
      sectionKey: '36',
      anchor: 'sub-1',
    });
    expect(
      parseReaderUrl('http://localhost:8081/read/cfrn-1999/s/36#sub-1'),
    ).toEqual({
      instrumentId: 'cfrn-1999',
      sectionKey: '36',
      anchor: 'sub-1',
    });
    expect(parseReaderUrl(readerHref('cfrn-1999', 'sch1-pt1'))).toEqual({
      instrumentId: 'cfrn-1999',
      sectionKey: 'sch1-pt1',
      anchor: null,
    });
    expect(parseReaderUrl('nigerialaw://settings')).toBeNull();
  });
});
