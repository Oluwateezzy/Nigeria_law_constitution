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
import {
  readAccountLineDismissed,
  readLastSyncAt,
  readPositionUpdatedAt,
  readReadingPosition,
  readRecentQueries,
  readTextSize,
  readUploadChoice,
  readUploadChoiceAt,
  rememberQuery,
  writeAccountLineDismissed,
  writeLastSyncAt,
  writeReadingPosition,
  writeTextSize,
  writeUploadChoice,
  type ReadingPosition,
  type TextSizeStep,
} from './database';
import type { UploadChoice } from '@/account/upload';
import { openDeviceDatabase } from './device';

type PreferencesValue = {
  ready: boolean;
  textSize: TextSizeStep;
  position: ReadingPosition | null;
  recentQueries: string[];
  setTextSize: (step: TextSizeStep) => void;
  savePosition: (position: ReadingPosition) => Promise<void>;
  refreshPosition: () => void;
  rememberSearch: (query: string) => void;
  accountLineDismissed: boolean;
  dismissAccountLine: () => void;
  uploadChoice: UploadChoice | null;
  uploadChoiceAt: string | null;
  lastSyncAt: string | null;
  positionUpdatedAt: string | null;
  rememberUploadChoice: (choice: UploadChoice, at: string) => void;
  rememberLastSync: (at: string) => void;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const databaseRef = useRef<Awaited<
    ReturnType<typeof openDeviceDatabase>
  > | null>(null);
  const [ready, setReady] = useState(false);
  const [textSize, setTextSizeState] = useState<TextSizeStep>(1);
  const [position, setPosition] = useState<ReadingPosition | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [accountLineDismissed, setAccountLineDismissed] = useState(false);
  const [uploadChoice, setUploadChoice] = useState<UploadChoice | null>(null);
  const [uploadChoiceAt, setUploadChoiceAt] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [positionUpdatedAt, setPositionUpdatedAt] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;
    openDeviceDatabase()
      .then((loaded) => {
        if (!mounted) {
          return;
        }
        databaseRef.current = loaded;
        setTextSizeState(readTextSize(loaded));
        setPosition(readReadingPosition(loaded));
        setRecentQueries(readRecentQueries(loaded));
        setAccountLineDismissed(readAccountLineDismissed(loaded));
        setUploadChoice(readUploadChoice(loaded));
        setUploadChoiceAt(readUploadChoiceAt(loaded));
        setLastSyncAt(readLastSyncAt(loaded));
        setPositionUpdatedAt(readPositionUpdatedAt(loaded));
        setReady(true);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const setTextSize = useCallback((step: TextSizeStep) => {
    setTextSizeState(step);
    const database = databaseRef.current;
    if (!database) {
      return;
    }
    writeTextSize(database, step);
    void database.flush();
  }, []);

  const savePosition = useCallback(async (next: ReadingPosition) => {
    const database = databaseRef.current;
    if (!database) {
      return;
    }
    writeReadingPosition(database, next);
    setPosition(next);
    setPositionUpdatedAt(readPositionUpdatedAt(database));
    await database.flush();
  }, []);

  const refreshPosition = useCallback(() => {
    const database = databaseRef.current;
    if (!database) {
      return;
    }
    setPosition(readReadingPosition(database));
  }, []);

  const rememberSearch = useCallback((query: string) => {
    const database = databaseRef.current;
    if (!database) {
      return;
    }
    setRecentQueries(rememberQuery(database, query));
    void database.flush();
  }, []);

  const dismissAccountLine = useCallback(() => {
    setAccountLineDismissed(true);
    const database = databaseRef.current;
    if (!database) return;
    writeAccountLineDismissed(database);
    void database.flush();
  }, []);

  const rememberUploadChoice = useCallback(
    (choice: UploadChoice, at: string) => {
      setUploadChoice(choice);
      setUploadChoiceAt(at);
      const database = databaseRef.current;
      if (!database) return;
      writeUploadChoice(database, choice, at);
      void database.flush();
    },
    [],
  );

  const rememberLastSync = useCallback((at: string) => {
    setLastSyncAt(at);
    const database = databaseRef.current;
    if (!database) return;
    writeLastSyncAt(database, at);
    void database.flush();
  }, []);

  const value = useMemo(
    () => ({
      ready,
      textSize,
      position,
      recentQueries,
      setTextSize,
      savePosition,
      refreshPosition,
      rememberSearch,
      accountLineDismissed,
      dismissAccountLine,
      uploadChoice,
      uploadChoiceAt,
      lastSyncAt,
      positionUpdatedAt,
      rememberUploadChoice,
      rememberLastSync,
    }),
    [
      accountLineDismissed,
      dismissAccountLine,
      lastSyncAt,
      position,
      positionUpdatedAt,
      ready,
      recentQueries,
      refreshPosition,
      rememberLastSync,
      rememberSearch,
      rememberUploadChoice,
      savePosition,
      setTextSize,
      textSize,
      uploadChoice,
      uploadChoiceAt,
    ],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesValue {
  const value = useContext(PreferencesContext);
  if (!value) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return value;
}
