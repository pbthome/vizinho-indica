export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
export const DEFAULT_CONDOMINIUM_SLUG = process.env.EXPO_PUBLIC_DEFAULT_CONDOMINIUM_SLUG ?? 'jardins-bolonha';

export function isSupabaseConfigured() {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_ENABLED === 'true' &&
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_PUBLISHABLE_KEY.length > 20
  );
}

export function getBackendMode() {
  return isSupabaseConfigured() ? 'supabase' : 'mock';
}

export function getBackendStatusMessage() {
  if (isSupabaseConfigured()) {
    return 'Conectado ao Supabase real.';
  }

  const enabledValue = process.env.EXPO_PUBLIC_SUPABASE_ENABLED ?? '(vazio)';
  const urlOk = SUPABASE_URL.startsWith('https://');
  const keyLength = SUPABASE_PUBLISHABLE_KEY.length;
  const urlPreview = SUPABASE_URL ? SUPABASE_URL.replace(/^https?:\/\//, '').slice(0, 24) : '(vazio)';

  if (process.env.EXPO_PUBLIC_SUPABASE_ENABLED === 'true') {
    return `Supabase foi habilitado, mas a configuração não ficou disponível no app. enabled=${enabledValue}; urlOk=${urlOk ? 'sim' : 'não'}; keyLen=${keyLength}; url=${urlPreview}.`;
  }

  return `Aplicativo em modo demonstração com dados simulados. enabled=${enabledValue}; urlOk=${urlOk ? 'sim' : 'não'}; keyLen=${keyLength}; url=${urlPreview}.`;
}
