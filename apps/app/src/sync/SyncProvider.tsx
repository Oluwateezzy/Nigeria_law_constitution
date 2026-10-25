import { elapsedNow } from '@nigeria-law/domain';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { useAccount } from '@/account/AuthProvider';
import {
  localRowsNeedChoice,
  shouldAskUpload,
  type UploadChoice,
} from '@/account/upload';
import { useNotes } from '@/notes/NotesProvider';
import { usePreferences } from '@/persistence/PreferencesProvider';
import { useSearch } from '@/search/SearchProvider';
import { onNotesChanged, notifyNotesPulled } from './bus';
import { runSync } from './run';

type SyncValue = {
  askUpload: boolean;
  chooseUpload: (choice: UploadChoice) => Promise<void>;
};

const SyncContext = createContext<SyncValue | null>(null);

function isoNow(): string {
  return new Date(elapsedNow()).toISOString();
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { signedIn, gateway } = useAccount();
  const { ready, database } = useSearch();
  const { notes } = useNotes();
  const preferences = usePreferences();
  const [threadRows, setThreadRows] = useState<
    { syncState: string; updatedAt: string; deletedAt: string | null }[]
  >([]);

  useEffect(() => {
    if (!ready) return;
    const db = database();
    if (!db) return;
    let cancelled = false;
    void db
      .all('SELECT sync_state, updated_at, deleted_at FROM threads')
      .then((rows) => {
        if (cancelled) return;
        setThreadRows(
          rows.map((row) => ({
            syncState:
              typeof row.sync_state === 'string' ? row.sync_state : 'local',
            updatedAt: typeof row.updated_at === 'string' ? row.updated_at : '',
            deletedAt:
              typeof row.deleted_at === 'string' ? row.deleted_at : null,
          })),
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [database, notes, ready]);

  const drain = useCallback(async () => {
    const db = database();
    const choice = preferences.uploadChoice;
    const choiceAt = preferences.uploadChoiceAt;
    if (!db || !gateway || !signedIn || !choice || !choiceAt) return;
    const position =
      preferences.position && preferences.positionUpdatedAt
        ? {
            sectionId: preferences.position.sectionId,
            anchor: preferences.position.anchor,
            updatedAt: preferences.positionUpdatedAt,
          }
        : null;
    const next = await runSync(db, gateway, { choice, choiceAt, position });
    preferences.rememberLastSync(isoNow());
    if (
      next &&
      (next.sectionId !== preferences.position?.sectionId ||
        next.anchor !== preferences.position?.anchor)
    ) {
      await preferences.savePosition({
        sectionId: next.sectionId,
        anchor: next.anchor,
      });
    }
    notifyNotesPulled();
  }, [database, gateway, preferences, signedIn]);

  useEffect(
    () =>
      onNotesChanged(() => {
        void drain().catch((error: unknown) => {
          console.info(
            'sync-failed',
            error instanceof Error ? error.message : 'unknown',
          );
        });
      }),
    [drain],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void drain().catch(() => undefined);
    });
    return () => subscription.remove();
  }, [drain]);

  const chooseUpload = useCallback(
    async (choice: UploadChoice) => {
      const at = isoNow();
      preferences.rememberUploadChoice(choice, at);
      preferences.rememberLastSync(at);
      const db = database();
      if (!db || !gateway) return;
      const position =
        preferences.position && preferences.positionUpdatedAt
          ? {
              sectionId: preferences.position.sectionId,
              anchor: preferences.position.anchor,
              updatedAt: preferences.positionUpdatedAt,
            }
          : null;
      await runSync(db, gateway, { choice, choiceAt: at, position });
      notifyNotesPulled();
    },
    [database, gateway, preferences],
  );

  const askUpload = shouldAskUpload({
    signedIn,
    hasLocalContent:
      notes.some((note) => note.deletedAt === null) ||
      threadRows.some((thread) => thread.deletedAt === null),
    choice: preferences.uploadChoice,
    localNewerThanSync:
      preferences.uploadChoice !== null &&
      localRowsNeedChoice([...notes, ...threadRows], preferences.lastSyncAt),
  });

  const value = useMemo(
    () => ({ askUpload, chooseUpload }),
    [askUpload, chooseUpload],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncValue {
  const value = useContext(SyncContext);
  if (!value) throw new Error('useSync must be used within SyncProvider');
  return value;
}
