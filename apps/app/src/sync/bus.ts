const changed = new Set<() => void>();
const pulled = new Set<() => void>();

export function onNotesChanged(listener: () => void): () => void {
  changed.add(listener);
  return () => {
    changed.delete(listener);
  };
}

export function notifyNotesChanged(): void {
  for (const listener of changed) listener();
}

export function onNotesPulled(listener: () => void): () => void {
  pulled.add(listener);
  return () => {
    pulled.delete(listener);
  };
}

export function notifyNotesPulled(): void {
  for (const listener of pulled) listener();
}
