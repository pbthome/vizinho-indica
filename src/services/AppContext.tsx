import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import type { EmailOtpType } from '@supabase/supabase-js';
import { updatePassword } from '../repositories/authRepository';
import { User } from '../types';
import * as api from './api';
import { isSupabaseConfigured } from './supabase/config';
import { supabase } from './supabase/client';

type AppContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshSession: () => Promise<User | null>;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  completePasswordRecovery: (password: string) => Promise<void>;
  clearPasswordRecoveryState: () => void;
  isPasswordRecoveryMode: boolean;
  passwordRecoveryError: string | null;
  authInitialized: boolean;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isPasswordRecoveryMode, setIsPasswordRecoveryMode] = useState(false);
  const [passwordRecoveryError, setPasswordRecoveryError] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const lastHandledRecoveryUrl = useRef<string | null>(null);

  const handleRecoveryUrl = useCallback(async (url: string | null) => {
    if (!url || !isSupabaseConfigured()) return false;
    if (lastHandledRecoveryUrl.current === url) return true;

    const recoveryState = await detectPasswordRecoveryFromUrl(url);
    if (!recoveryState.active) return false;

    lastHandledRecoveryUrl.current = url;
    setPasswordRecoveryError(recoveryState.error);
    setIsPasswordRecoveryMode(true);
    setAuthInitialized(true);
    return true;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAuthInitialized(true);
      return;
    }

    const syncAuthenticatedUser = () => {
      setTimeout(() => {
        void api
          .getCurrentUser()
          .then((nextUser) => setUser(nextUser))
          .catch(() => setUser(null));
      }, 0);
    };

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryError(null);
        setIsPasswordRecoveryMode(true);
        setAuthInitialized(true);
        return;
      }

      if (!session?.user) {
        setUser(null);
        return;
      }

      if (isPasswordRecoveryMode) {
        setAuthInitialized(true);
        return;
      }

      syncAuthenticatedUser();
    });

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      void handleRecoveryUrl(url).catch((error) => {
        console.error('[AppContext] handleRecoveryUrl failed', error);
      });
    });

    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, [handleRecoveryUrl, isPasswordRecoveryMode]);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      setUser,
      refreshSession: async () => {
        try {
          const session = await api.getCurrentUser();
          setUser(session);
          return session;
        } catch (error) {
          console.error('[AppContext] refreshSession failed', error);
          setUser(null);
          return null;
        }
      },
      signOut: async () => {
        await api.logout();
        setUser(null);
      },
      initializeAuth: async () => {
        if (!isSupabaseConfigured()) {
          setAuthInitialized(true);
          return;
        }

        try {
          const recoveryState = await detectPasswordRecovery();
          setPasswordRecoveryError(recoveryState.error);
          setIsPasswordRecoveryMode(recoveryState.active);
        } catch (error) {
          console.error('[AppContext] initializeAuth failed', error);
          setPasswordRecoveryError(null);
          setIsPasswordRecoveryMode(false);
        } finally {
          setAuthInitialized(true);
        }
      },
      completePasswordRecovery: async (password: string) => {
        await updatePassword(password);
        await supabase.auth.signOut().catch(() => undefined);
        clearRecoveryUrl();
        setUser(null);
        setPasswordRecoveryError(null);
        setIsPasswordRecoveryMode(false);
      },
      clearPasswordRecoveryState: () => {
        clearRecoveryUrl();
        setPasswordRecoveryError(null);
        setIsPasswordRecoveryMode(false);
      },
      isPasswordRecoveryMode,
      passwordRecoveryError,
      authInitialized
    }),
    [authInitialized, isPasswordRecoveryMode, passwordRecoveryError, user]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

async function detectPasswordRecovery() {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.location) {
      return { active: false, error: null as string | null };
    }

    return detectPasswordRecoveryFromUrl(window.location.href);
  }

  const initialUrl = await Linking.getInitialURL();
  return detectPasswordRecoveryFromUrl(initialUrl);
}

async function detectPasswordRecoveryFromUrl(url: string | null) {
  if (!url) {
    return { active: false, error: null as string | null };
  }

  const [urlWithoutHash, hashPart = ''] = url.split('#');
  const queryPart = urlWithoutHash.includes('?') ? urlWithoutHash.slice(urlWithoutHash.indexOf('?') + 1) : '';
  const searchParams = new URLSearchParams(queryPart);
  const hashParams = new URLSearchParams(hashPart.replace(/^#/, ''));
  const normalizedUrl = url.toLowerCase();
  const screen = searchParams.get('screen');
  const code = searchParams.get('code');
  const searchType = searchParams.get('type');
  const hashType = hashParams.get('type');
  const type = searchType ?? hashType;
  const tokenHash = searchParams.get('token_hash');
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  const errorCode = hashParams.get('error_code');
  const errorDescription = hashParams.get('error_description');
  const hasRecoveryIntent =
    normalizedUrl.includes('reset-password') ||
    screen === 'reset-password' ||
    type === 'recovery' ||
    Boolean(tokenHash) ||
    Boolean(code) ||
    Boolean(accessToken) ||
    Boolean(errorCode);

  if (!hasRecoveryIntent) {
    return { active: false, error: null as string | null };
  }

  if (errorCode || errorDescription) {
    return {
      active: true,
      error: getFriendlyRecoveryLinkError(errorCode, errorDescription)
    };
  }

  if (tokenHash && type === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery' as EmailOtpType
    });

    if (error) {
      return {
        active: true,
        error: getFriendlyRecoveryLinkError(error.name, error.message)
      };
    }

    clearRecoveryUrl(true);

    return { active: true, error: null as string | null };
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return {
        active: true,
        error: getFriendlyRecoveryLinkError(error.name, error.message)
      };
    }

    clearRecoveryUrl(true);

    return { active: true, error: null as string | null };
  }

  if (!accessToken || !refreshToken) {
    return {
      active: true,
      error: 'O link de recuperação está incompleto. Solicite um novo email para redefinir sua senha.'
    };
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  if (error) {
    return {
      active: true,
      error: getFriendlyRecoveryLinkError(error.name, error.message)
    };
  }

  clearRecoveryUrl(true);

  return { active: true, error: null as string | null };
}

function clearRecoveryUrl(keepResetScreen = false) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.location || !window.history?.replaceState) return;

  const url = new URL(window.location.href);
  if (keepResetScreen) url.searchParams.set('screen', 'reset-password');
  else url.searchParams.delete('screen');
  url.hash = '';

  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function getFriendlyRecoveryLinkError(errorCode: string | null, errorDescription: string | null) {
  const normalizedCode = errorCode?.toLowerCase() ?? '';
  const normalizedDescription = errorDescription?.toLowerCase() ?? '';

  if (normalizedCode.includes('otp_expired') || normalizedDescription.includes('expired')) {
    return 'Esse link de recuperação expirou ou já foi usado. Solicite um novo email para redefinir sua senha.';
  }

  if (normalizedCode.includes('access_denied') || normalizedDescription.includes('invalid')) {
    return 'O link de recuperação não é mais válido. Solicite um novo email para redefinir sua senha.';
  }

  return errorDescription ?? 'Não foi possível validar o link de recuperação.';
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
