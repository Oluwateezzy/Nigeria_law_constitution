import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function readSupabasePublicConfig(): {
  url: string;
  anonKey: string;
} | null {
  const extra = Constants.expoConfig?.extra as
    { supabaseUrl?: string; supabaseAnonKey?: string } | undefined;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || extra?.supabaseUrl || '';
  const anonKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra?.supabaseAnonKey || '';
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function createSupabaseClient(config: {
  url: string;
  anonKey: string;
}): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  });
}
