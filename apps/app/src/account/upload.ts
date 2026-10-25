export type UploadChoice = 'upload' | 'keep';

export function shouldAskUpload(input: {
  signedIn: boolean;
  hasLocalContent: boolean;
  choice: UploadChoice | null;
  localNewerThanSync: boolean;
}): boolean {
  if (!input.signedIn) return false;
  if (input.choice === null) return input.hasLocalContent;
  return input.localNewerThanSync;
}

export function noteShouldSync(
  updatedAt: string,
  choice: UploadChoice,
  choiceAt: string,
): boolean {
  if (choice === 'upload') return true;
  return updatedAt > choiceAt;
}

export function localRowsNeedChoice(
  rows: readonly { syncState: string; updatedAt: string }[],
  lastSyncAt: string | null,
): boolean {
  const floor = lastSyncAt ?? '';
  return rows.some((row) => row.syncState === 'local' && row.updatedAt > floor);
}
