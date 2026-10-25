import { sanitiseCrash } from '@nigeria-law/domain';

export function reportCrash(
  error: unknown,
  extra?: Record<string, unknown>,
): unknown {
  const message = error instanceof Error ? error.message : 'unknown';
  const payload = sanitiseCrash({ message, ...extra });
  const url = process.env.EXPO_PUBLIC_CRASH_URL;
  if (url) {
    void fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => undefined);
  }
  return payload;
}
