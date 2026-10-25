export type OwnKeyProvider = 'openai' | 'anthropic';

export type OwnKeyProbe = {
  method: 'GET';
  url: string;
};

export const ownKeyProbes: Record<OwnKeyProvider, OwnKeyProbe> = {
  openai: { method: 'GET', url: 'https://api.openai.com/v1/models' },
  anthropic: { method: 'GET', url: 'https://api.anthropic.com/v1/models' },
};

export const hostedVendor = 'openai';
export const hostedModelId = 'gpt-4.1-mini';

export function ownKeyHeaders(
  provider: OwnKeyProvider,
  secret: string,
): Record<string, string> {
  if (provider === 'anthropic') {
    return {
      'x-api-key': secret,
      'anthropic-version': '2023-06-01',
    };
  }
  return { Authorization: `Bearer ${secret}` };
}
