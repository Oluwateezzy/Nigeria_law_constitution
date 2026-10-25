import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { copy } from '@/copy';
import { deleteAllNotes } from '@/notes/repository';
import { useSearch } from '@/search/SearchProvider';
import { notifyNotesPulled } from '@/sync/bus';
import type { SyncGateway } from '@/sync/gateway';
import { accountLabel } from './payload';
import { createSupabaseClient, readSupabasePublicConfig } from './client';
import { supabaseGateway } from './supabase-gateway';

WebBrowser.maybeCompleteAuthSession();

type AccountValue = {
  configured: boolean;
  signedIn: boolean;
  accessToken: string | null;
  label: string | null;
  gateway: SyncGateway | null;
  sendMagicLink: (email: string) => Promise<string | null>;
  signInWithProvider: (provider: 'apple' | 'google') => Promise<string | null>;
  signOut: () => Promise<void>;
  deleteAccount: (deleteDeviceNotes: boolean) => Promise<string | null>;
};

const AccountContext = createContext<AccountValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { database } = useSearch();
  const [client] = useState<SupabaseClient | null>(() => {
    const config = readSupabasePublicConfig();
    return config ? createSupabaseClient(config) : null;
  });
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!client) return;
    let mounted = true;
    client.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
      })
      .catch(() => undefined);
    const subscription = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      mounted = false;
      subscription.data.subscription.unsubscribe();
    };
  }, [client]);

  const gateway = useMemo<SyncGateway | null>(() => {
    const userId = session?.user.id;
    if (!client || !userId) return null;
    return supabaseGateway(client, userId);
  }, [client, session]);

  const sendMagicLink = useCallback(
    async (email: string) => {
      const trimmed = email.trim();
      if (!client || !trimmed) return copy.account.linkFailed;
      const { error } = await client.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: Linking.createURL('settings') },
      });
      if (error) return copy.account.linkFailed;
      return null;
    },
    [client],
  );

  const signInWithProvider = useCallback(
    async (provider: 'apple' | 'google') => {
      if (!client) return copy.account.linkFailed;
      const redirectTo = Linking.createURL('settings');
      const { data, error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });
      if (error || !data.url) return copy.account.linkFailed;
      if (Platform.OS === 'web') return null;
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );
      if (result.type !== 'success') return copy.account.linkFailed;
      const parsed = new URL(result.url);
      const code = parsed.searchParams.get('code');
      if (code) {
        const exchanged = await client.auth.exchangeCodeForSession(code);
        if (exchanged.error) return copy.account.linkFailed;
        return null;
      }
      const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''));
      const accessToken = hash.get('access_token');
      const refreshToken = hash.get('refresh_token');
      if (!accessToken || !refreshToken) return copy.account.linkFailed;
      const stored = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (stored.error) return copy.account.linkFailed;
      return null;
    },
    [client],
  );

  const signOut = useCallback(async () => {
    if (client) await client.auth.signOut();
    setSession(null);
  }, [client]);

  const deleteAccount = useCallback(
    async (deleteDeviceNotes: boolean) => {
      const current = gateway;
      if (!current) return copy.account.linkFailed;
      try {
        await current.deleteAccount();
      } catch {
        return copy.account.linkFailed;
      }
      if (deleteDeviceNotes) {
        const db = database();
        if (db) {
          await deleteAllNotes(db);
          notifyNotesPulled();
        }
      }
      await signOut();
      return null;
    },
    [database, gateway, signOut],
  );

  const label = session
    ? accountLabel({
        email: session.user.email,
        provider:
          typeof session.user.app_metadata.provider === 'string'
            ? session.user.app_metadata.provider
            : null,
      })
    : null;

  const value = useMemo(
    () => ({
      configured: client !== null,
      signedIn: session !== null,
      accessToken: session?.access_token ?? null,
      label,
      gateway,
      sendMagicLink,
      signInWithProvider,
      signOut,
      deleteAccount,
    }),
    [
      client,
      deleteAccount,
      gateway,
      label,
      sendMagicLink,
      session,
      signInWithProvider,
      signOut,
    ],
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useAccount(): AccountValue {
  const value = useContext(AccountContext);
  if (!value) {
    throw new Error('useAccount must be used within AuthProvider');
  }
  return value;
}
