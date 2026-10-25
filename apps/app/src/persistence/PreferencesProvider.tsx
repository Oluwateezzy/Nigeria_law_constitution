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
  readReadingPosition,
  readRecentQueries,
  readTextSize,
  rememberQuery,
  writeReadingPosition,
  writeTextSize,
  type ReadingPosition,
  type TextSizeStep,
} from './database';
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
    }),
    [
      position,
      ready,
      recentQueries,
      refreshPosition,
      rememberSearch,
      savePosition,
      setTextSize,
      textSize,
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
