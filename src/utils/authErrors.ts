export function getFriendlyAuthErrorMessage(error: unknown, context: 'login' | 'signup' | 'reset' = 'login') {
  const rawMessage = error instanceof Error ? error.message : 'Tente novamente.';
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    if (context === 'signup') {
      return 'Este email já pode ter sido usado antes. Tente entrar com a senha anterior ou use "Esqueci minha senha".';
    }

    return 'Email ou senha incorretos. Confira os dados usados no cadastro.';
  }

  if (normalized.includes('user already registered') || normalized.includes('already registered') || normalized.includes('already exists')) {
    return 'Este email já está cadastrado. Se a conta for sua, tente entrar ou use "Esqueci minha senha".';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Seu email ainda não foi confirmado. Verifique sua caixa de entrada e o spam.';
  }

  if (normalized.includes('too many requests')) {
    return 'Houve muitas tentativas seguidas. Aguarde um pouco e tente novamente.';
  }

  if (normalized.includes('signup is disabled')) {
    return 'O acesso por email e senha não está habilitado no Supabase.';
  }

  if (normalized.includes('network request failed')) {
    if (context === 'signup') {
      return 'Não foi possível concluir o pedido agora. Se este email já foi usado antes no app, tente entrar ou recuperar a senha.';
    }

    return 'Não foi possível falar com o servidor. Verifique sua internet e tente novamente.';
  }

  if (normalized.includes('perfil de acesso ainda não está pronto') || normalized.includes('perfil de acesso nao esta pronto')) {
    return 'Sua conta existe, mas o cadastro interno precisou ser reconstruído. Tente entrar novamente em alguns segundos.';
  }

  return rawMessage;
}
