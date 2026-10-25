import { aliasList, shippingInstrument } from '@nigeria-law/content';
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
import { ensureNotesTable } from '@/notes/repository';
import type { SqlDatabase } from './driver';
import { openExpoSearchDatabase } from './expo';
import { ensureIndex, search as runSearch, searchTimings } from './repository';
import type { SearchResult } from './repository';
import { bundledIndexKey, searchRows } from './rows';

declare global {
  var __searchBuildMs: number | undefined;
  var __searchLastMs: number | undefined;
}

type SearchValue = {
  ready: boolean;
  buildMs: number | null;
  database: () => SqlDatabase | null;
  search: (
    query: string,
    instrumentId?: string | null,
  ) => Promise<SearchResult[]>;
};

const SearchContext = createContext<SearchValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const dbRef = useRef<SqlDatabase | null>(null);
  const [ready, setReady] = useState(false);
  const [buildMs, setBuildMs] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const started = elapsedNow();
    openExpoSearchDatabase()
      .then(async (db) => {
        if (!mounted) return;
        const instruments = [shippingInstrument()];
        const aliases = aliasList();
        await ensureIndex(
          db,
          searchRows(instruments, aliases),
          bundledIndexKey(instruments, aliases),
        );
        await ensureNotesTable(db);
        if (!mounted) return;
        dbRef.current = db;
        const ms = elapsedNow() - started;
        setBuildMs(ms);
        setReady(true);
        globalThis.__searchBuildMs = ms;
        console.info(`search-index-ready ${ms}`);
      })
      .catch((error: unknown) => {
        console.info(
          'search-index-failed',
          error instanceof Error ? error.message : 'unknown',
        );
      });
    return () => {
      mounted = false;
    };
  }, []);

  const search = useCallback(
    async (query: string, instrumentId?: string | null) => {
      const db = dbRef.current;
      if (!db) return [];
      const results = await runSearch(db, query, { instrumentId });
      const timing = searchTimings().at(-1);
      if (timing) {
        globalThis.__searchLastMs = timing.ms;
        console.info(`search-repository ${timing.ms} ${timing.query}`);
      }
      return results;
    },
    [],
  );

  const database = useCallback(() => dbRef.current, []);

  const value = useMemo(
    () => ({ ready, buildMs, database, search }),
    [buildMs, database, ready, search],
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearch(): SearchValue {
  const value = useContext(SearchContext);
  if (!value) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return value;
}
