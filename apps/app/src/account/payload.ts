export const syncedNoteFields = [
  'id',
  'sectionId',
  'instrumentId',
  'body',
  'createdAt',
  'updatedAt',
  'deletedAt',
] as const;

export const syncedThreadFields = [
  'id',
  'kind',
  'sectionId',
  'title',
  'createdAt',
  'updatedAt',
  'deletedAt',
] as const;

export function payloadHasSecretField(fields: readonly string[]): boolean {
  return fields.some((field) => /key|secret|token/i.test(field));
}

export function accountLabel(user: {
  email?: string | null;
  provider?: string | null;
}): string {
  const email = user.email?.trim();
  if (email) return email;
  if (user.provider === 'apple') return 'Apple';
  if (user.provider === 'google') return 'Google';
  return 'Signed in';
}
