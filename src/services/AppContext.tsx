import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
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

    return () => subscription.unsubscribe();
  }, [isPasswordRecoveryMode]);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      setUser,
      refreshSession: async () => {
        const session = await api.getCurrentUser();
        setUser(session);
        return session;
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

        const recoveryState = await detectPasswordRecovery();
        setPasswordRecoveryError(recoveryState.error);
        setIsPasswordRecoveryMode(recoveryState.active);
        setAuthInitialized(true);
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
  if (typeof window === 'undefined') {
    return { active: false, error: null as string | null };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
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
    screen === 'reset-password' || type === 'recovery' || Boolean(tokenHash) || Boolean(code) || Boolean(accessToken) || Boolean(errorCode);

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
      error: 'O link de recuperacao esta incompleto. Solicite um novo email para redefinir sua senha.'
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
  if (typeof window === 'undefined') return;

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
    return 'Esse link de recuperacao expirou ou ja foi usado. Solicite um novo email para redefinir sua senha.';
  }

  if (normalizedCode.includes('access_denied') || normalizedDescription.includes('invalid')) {
    return 'O link de recuperacao nao e mais valido. Solicite um novo email para redefinir sua senha.';
  }

  return errorDescription ?? 'Nao foi possivel validar o link de recuperacao.';
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
