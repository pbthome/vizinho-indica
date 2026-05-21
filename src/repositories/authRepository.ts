import { DEFAULT_CONDOMINIUM_SLUG } from '../services/supabase/config';
import { supabase } from '../services/supabase/client';
import { SignUpPayload, User } from '../types';
import { mapDbUser } from './mappers';
import { trackEvent } from './analyticsRepository';

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
  if (!data.user) throw new Error('Nao foi possivel iniciar a sessao.');

  const profile = await getProfileByAuthUserId(data.user.id);
  if (!profile) {
    await supabase.auth.signOut().catch(() => undefined);
    throw new Error('Sua conta foi autenticada, mas o perfil de acesso ainda nao esta pronto. Tente novamente em instantes ou fale com o administrador.');
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
  const { data, error } = await supabase.auth.signUp({
    email: payload.email.trim().toLowerCase(),
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

  if (error) throw new Error(error.message);
  await supabase.auth.signOut();

  return {
    id: data.user?.id ?? `pending-${Date.now()}`,
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    email: payload.email.trim().toLowerCase(),
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
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
  if (error) throw new Error(error.message);
}

async function getProfileByAuthUserId(authUserId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*, condominiums(name)')
    .eq('auth_user_id', authUserId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapDbUser(data) : null;
}

function splitUnit(unit: string) {
  const block = unit.match(/Quadra\s+([^,]+)/i)?.[1]?.trim() ?? '';
  const apartment = unit.match(/Lote\s+(.+)$/i)?.[1]?.trim() ?? '';
  return { block, apartment };
}
