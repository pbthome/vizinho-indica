import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { createClient, processLock } from '@supabase/supabase-js';
import { Database } from '../../types/database';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';

const memoryStorage = new Map<string, string>();
const webStorage =
  Platform.OS === 'web' && typeof globalThis !== 'undefined' && 'localStorage' in globalThis ? globalThis.localStorage : undefined;

const authStorage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      try {
        return webStorage?.getItem(key) ?? memoryStorage.get(key) ?? null;
      } catch {
        return memoryStorage.get(key) ?? null;
      }
    }

    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      try {
        webStorage?.setItem(key, value);
      } catch {
        memoryStorage.set(key, value);
      }
      return;
    }

    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      memoryStorage.set(key, value);
    }
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      try {
        webStorage?.removeItem(key);
      } catch {
        memoryStorage.delete(key);
      }
      return;
    }

    try {
      await AsyncStorage.removeItem(key);
    } catch {
      memoryStorage.delete(key);
    }
  }
};

export const supabase = createClient<Database>(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_PUBLISHABLE_KEY || 'placeholder-key', {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: Platform.OS === 'web' ? undefined : processLock
  }
});

if (isSupabaseConfigured() && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
