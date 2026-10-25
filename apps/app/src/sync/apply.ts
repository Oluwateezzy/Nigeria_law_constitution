import { noteShouldSync, type UploadChoice } from '../account/upload';
import type { Note } from '../notes/repository';
import { mergeRows } from './plan';

export function notesToPush(
  notes: readonly Note[],
  choice: UploadChoice,
  choiceAt: string,
): Note[] {
  return notes.filter((note) =>
    noteShouldSync(note.updatedAt, choice, choiceAt),
  );
}

export function mergeSyncedNotes(
  local: readonly Note[],
  remote: readonly Note[],
  pushed: ReadonlySet<string>,
): Note[] {
  const merged = mergeRows(
    local,
    remote.map((note) => ({ ...note, syncState: 'synced' as const })),
  );
  return merged.map((note) => {
    if (pushed.has(note.id)) return { ...note, syncState: 'synced' as const };
    const fromServer = remote.find((row) => row.id === note.id);
    if (
      fromServer &&
      fromServer.updatedAt === note.updatedAt &&
      fromServer.deletedAt === note.deletedAt
    ) {
      return { ...note, syncState: 'synced' as const };
    }
    const fromDevice = local.find((row) => row.id === note.id);
    return {
      ...note,
      syncState: fromDevice?.syncState ?? 'local',
    };
  });
}
