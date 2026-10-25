const droppedKeys = new Set([
  'authorization',
  'api_key',
  'apikey',
  'secret',
  'note',
  'notebody',
  'notes',
  'scenario',
  'prompt',
  'prompts',
  'messages',
  'question',
  'plaintext',
  'content',
]);

const secretPattern = /sk-[A-Za-z0-9_-]+|Bearer\s+\S+/gi;

export function sanitiseCrash(value: unknown): unknown {
  return walk(value);
}

function walk(value: unknown): unknown {
  if (typeof value === 'string')
    return value.replace(secretPattern, '[redacted]');
  if (Array.isArray(value)) return value.map((item) => walk(item));
  if (!value || typeof value !== 'object') return value;
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (droppedKeys.has(key.toLowerCase().replace(/[_-]/g, ''))) continue;
    next[key] = walk(item);
  }
  return next;
}
