import { elapsedNow } from '@nigeria-law/domain';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { NoteSheet } from '@/components/NoteSheet';
import { useSearch } from '@/search/SearchProvider';
import { onNotesPulled, notifyNotesChanged } from '@/sync/bus';
import { noteSections } from './catalog';
import {
  dismissDraft,
  listLiving,
  readerNote,
  saveDraft,
  tombstoneNote,
  type Note,
} from './repository';
import { notesMarkdown } from './present';
import { shareNotesMarkdown } from './share';

export type NoteDraft = {
  key: string;
  id: string | null;
  sectionId: string | null;
  instrumentId: string | null;
  body: string;
};

type NotesValue = {
  notes: Note[];
  openSection: (input: { sectionId: string; instrumentId: string }) => void;
  openNote: (id: string) => void;
  openStandalone: () => void;
  exportNotes: () => Promise<void>;
  noteFilled: (sectionId: string) => boolean;
};

const NotesContext = createContext<NotesValue | null>(null);

function isoNow(): string {
  return new Date(elapsedNow()).toISOString();
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const { ready, database } = useSearch();
  const notesRef = useRef<Note[]>([]);
  const draftRef = useRef<NoteDraft | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState<NoteDraft | null>(null);

  const remember = useCallback((next: Note[]) => {
    notesRef.current = next;
    setNotes(next);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let mounted = true;
    const db = database();
    if (!db) return;
    listLiving(db)
      .then((living) => {
        if (!mounted) return;
        notesRef.current = living;
        setNotes(living);
      })
      .catch((error: unknown) => {
        console.info(
          'notes-load-failed',
          error instanceof Error ? error.message : 'unknown',
        );
      });
    return () => {
      mounted = false;
    };
  }, [database, ready]);

  const refresh = useCallback(async () => {
    const db = database();
    if (!db) return;
    remember(await listLiving(db));
  }, [database, remember]);

  useEffect(() => {
    return onNotesPulled(() => {
      void refresh();
    });
  }, [refresh]);

  const openSection = useCallback(
    (input: { sectionId: string; instrumentId: string }) => {
      const existing = readerNote(notesRef.current, input.sectionId);
      const next: NoteDraft = {
        key: existing?.id ?? `new-${input.sectionId}-${elapsedNow()}`,
        id: existing?.id ?? null,
        sectionId: input.sectionId,
        instrumentId: input.instrumentId,
        body: existing?.body ?? '',
      };
      draftRef.current = next;
      setDraft(next);
    },
    [],
  );

  const openNote = useCallback((id: string) => {
    const existing = notesRef.current.find((note) => note.id === id);
    if (!existing) return;
    const next: NoteDraft = {
      key: existing.id,
      id: existing.id,
      sectionId: existing.sectionId,
      instrumentId: existing.instrumentId,
      body: existing.body,
    };
    draftRef.current = next;
    setDraft(next);
  }, []);

  const openStandalone = useCallback(() => {
    const next: NoteDraft = {
      key: `solo-${elapsedNow()}`,
      id: null,
      sectionId: null,
      instrumentId: null,
      body: '',
    };
    draftRef.current = next;
    setDraft(next);
  }, []);

  const onCommit = useCallback(
    async (id: string | null, body: string) => {
      const db = database();
      const current = draftRef.current;
      if (!db || !current) return null;
      const saved = await saveDraft(db, {
        id,
        sectionId: current.sectionId,
        instrumentId: current.instrumentId,
        body,
        now: isoNow(),
      });
      if (!saved) return null;
      draftRef.current = { ...current, id: saved.id };
      await refresh();
      notifyNotesChanged();
      return saved.id;
    },
    [database, refresh],
  );

  const onDismiss = useCallback(
    async (id: string | null, body: string) => {
      const db = database();
      const current = draftRef.current;
      draftRef.current = null;
      setDraft(null);
      if (!db || !current) return;
      await dismissDraft(db, {
        id,
        sectionId: current.sectionId,
        instrumentId: current.instrumentId,
        body,
        now: isoNow(),
      });
      await refresh();
      notifyNotesChanged();
    },
    [database, refresh],
  );

  const onDelete = useCallback(
    async (id: string) => {
      const db = database();
      draftRef.current = null;
      setDraft(null);
      if (!db) return;
      await tombstoneNote(db, id, isoNow());
      await refresh();
      notifyNotesChanged();
    },
    [database, refresh],
  );

  const exportNotes = useCallback(async () => {
    const db = database();
    if (!db) return;
    const living = await listLiving(db);
    remember(living);
    await shareNotesMarkdown(notesMarkdown(living, noteSections()));
  }, [database, remember]);

  const noteFilled = useCallback(
    (sectionId: string) => readerNote(notes, sectionId) !== null,
    [notes],
  );

  const value = useMemo(
    () => ({
      notes,
      openSection,
      openNote,
      openStandalone,
      exportNotes,
      noteFilled,
    }),
    [exportNotes, noteFilled, notes, openNote, openSection, openStandalone],
  );

  return (
    <NotesContext.Provider value={value}>
      {children}
      {draft ? (
        <NoteSheet
          key={draft.key}
          noteId={draft.id}
          initialBody={draft.body}
          onCommit={onCommit}
          onDismiss={onDismiss}
          onDelete={onDelete}
        />
      ) : null}
    </NotesContext.Provider>
  );
}

export function useNotes(): NotesValue {
  const value = useContext(NotesContext);
  if (!value) {
    throw new Error('useNotes must be used within NotesProvider');
  }
  return value;
}
