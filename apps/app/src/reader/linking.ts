export const linkingPrefixes = ['nigerialaw://'] as const;

export const documentedReaderUrl = 'nigerialaw://read/cfrn-1999/s/36#sub-1';

export function readerHref(
  instrumentId: string,
  sectionKey: string,
  anchor?: string | null,
): string {
  const path = `/read/${instrumentId}/s/${sectionKey}`;
  if (!anchor) {
    return path;
  }
  return `${path}?anchor=${encodeURIComponent(anchor)}#${encodeURIComponent(anchor)}`;
}

export function parseReaderUrl(url: string): {
  instrumentId: string;
  sectionKey: string;
  anchor: string | null;
} | null {
  const match = /\/read\/([^/?#]+)\/s\/([^/?#]+)/.exec(url);
  const instrumentId = match?.[1];
  const sectionKey = match?.[2];
  if (!instrumentId || !sectionKey) {
    return null;
  }
  const hash = /#([^#]+)$/.exec(url)?.[1];
  const query = /[?&]anchor=([^&#]+)/.exec(url)?.[1];
  const raw = hash ?? query ?? '';
  const anchor = raw ? decodeURIComponent(raw) : null;
  return {
    instrumentId: decodeURIComponent(instrumentId),
    sectionKey: decodeURIComponent(sectionKey),
    anchor,
  };
}
