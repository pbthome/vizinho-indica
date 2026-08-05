import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { DEFAULT_CONDOMINIUM_SLUG } from '../services/supabase/config';
import { supabase } from '../services/supabase/client';
import { SignUpPayload, User } from '../types';
import { mapDbUser } from './mappers';
import { trackEvent } from './analyticsRepository';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../services/supabase/config';

export async function getCurrentProfile() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(sessionError.message);
  if (!sessionData.session?.user) return null;

  return getProfileByAuthUserId(sessionData.session.user.id);
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Não foi possível iniciar a sessão.');

  let profile = await getProfileByAuthUserId(data.user.id);
  if (!profile) {
    await restoreMissingSignupAccess().catch(() => undefined);
    profile = await getProfileByAuthUserId(data.user.id);
  }

  if (!profile) {
    await supabase.auth.signOut().catch(() => undefined);
    throw new Error('Sua conta foi autenticada, mas o perfil de acesso ainda não está pronto. Tente novamente em instantes ou fale com o administrador.');
  }

  if (profile?.status === 'approved' || profile?.status === 'admin') {
    await trackEvent({
      condominiumId: profile.condominiumId,
      userId: profile.id,
      eventType: 'login',
      entityType: 'user',
      entityId: profile.id
    }).catch(() => undefined);
  }
  return profile;
}

export async function signUpPendingAccess(payload: SignUpPayload) {
  if (!payload.password) throw new Error('Informe uma senha para criar sua conta.');

  const { block, apartment } = splitUnit(payload.unit);
  const normalizedEmail = payload.email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: payload.password,
    options: {
      data: {
        full_name: payload.name.trim(),
        phone: payload.phone.trim(),
        block,
        apartment,
        condominium_slug: DEFAULT_CONDOMINIUM_SLUG
      }
    }
  });

  if (error) {
    const restoredUser = await tryRestoreExistingSignup(payload);
    if (restoredUser) return restoredUser;
    throw new Error(error.message);
  }

  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    const restoredUser = await tryRestoreExistingSignup(payload);
    if (restoredUser) return restoredUser;
  }

  return {
    id: data.user?.id ?? `pending-${Date.now()}`,
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    email: normalizedEmail,
    condominiumId: '',
    condominiumName: payload.condominium,
    unit: payload.unit,
    status: 'pending'
  } satisfies User;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: getPasswordResetRedirectTo()
  });
  if (error) throw new Error(error.message);
}

export async function updatePassword(password: string) {
  await updatePasswordWithActiveSession(password);
}

export async function resetPasswordWithCode(email: string, token: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedToken = token.trim();

  const { data, error: verifyError } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token: normalizedToken,
    type: 'recovery'
  });

  if (verifyError) throw new Error(verifyError.message);

  if (data.session) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });

    if (sessionError) throw new Error(sessionError.message);
  }

  await updatePasswordWithRecoverySession(password, data.session ?? null);

  await supabase.auth.signOut().catch(() => undefined);
}

async function updatePasswordWithActiveSession(password: string) {
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) throw new Error(sessionError.message);
  await updatePasswordWithRecoverySession(password, session);
}

async function updatePasswordWithRecoverySession(password: string, session: Session | null) {
  const accessToken = session?.access_token;
  if (!accessToken) {
    throw new Error('Sessão de recuperação não encontrada.');
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  });

  const rawBody = await response.text();
  const payload = rawBody ? tryParseJson(rawBody) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'msg' in payload && typeof payload.msg === 'string' && payload.msg) ||
      (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string' && payload.message) ||
      `Erro HTTP ${response.status} ao atualizar a senha.`;
    throw new Error(message);
  }
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function getProfileByAuthUserId(authUserId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*, condominiums(name)')
    .eq('auth_user_id', authUserId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapDbUser(data as unknown as Parameters<typeof mapDbUser>[0]) : null;
}

async function tryRestoreExistingSignup(payload: SignUpPayload) {
  if (!payload.password) return null;
  const { block, apartment } = splitUnit(payload.unit);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email.trim().toLowerCase(),
    password: payload.password
  });

  if (error || !data.user) {
    await supabase.auth.signOut().catch(() => undefined);
    return null;
  }

  try {
    await restoreMissingSignupAccess({
      fullName: payload.name.trim(),
      phone: payload.phone.trim(),
      block,
      apartment
    });
    const profile = await getProfileByAuthUserId(data.user.id);
    if (!profile) {
      throw new Error('Sua conta existe, mas não foi possível reconstruir o cadastro interno agora.');
    }
    return profile;
  } finally {
    await supabase.auth.signOut().catch(() => undefined);
  }
}

async function restoreMissingSignupAccess(
  payload?: {
    fullName?: string;
    phone?: string;
    block?: string;
    apartment?: string;
  }
) {
  const { error } = await (supabase as any).rpc('restore_missing_signup_access', {
    input_full_name: payload?.fullName ?? null,
    input_phone: payload?.phone ?? null,
    input_block: payload?.block ?? null,
    input_apartment: payload?.apartment ?? null
  });
  if (error) throw new Error(error.message);
}

function splitUnit(unit: string) {
  const block = unit.match(/Quadra\s+([^,]+)/i)?.[1]?.trim() ?? '';
  const apartment = unit.match(/Lote\s+(.+)$/i)?.[1]?.trim() ?? '';
  return { block, apartment };
}

function getPasswordResetRedirectTo() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/?screen=reset-password`;
  }

  return 'vizinhoindica://reset-password';
}
