import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { resetPassword, resetPasswordWithCode } from '../services/api';
import { useApp } from '../services/AppContext';

export function ResetPasswordScreen({ navigation, route }: any) {
  const { completePasswordRecovery, passwordRecoveryError, clearPasswordRecoveryState, isPasswordRecoveryMode } = useApp();
  const isLinkMode = route.params?.mode === 'link' || isPasswordRecoveryMode;
  const isRequestMode = route.params?.mode === 'request';
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState<string | null>(route.params?.notice ?? null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [hasAutoSent, setHasAutoSent] = useState(false);

  const helperMessage = useMemo(() => {
    if (passwordRecoveryError) return passwordRecoveryError;
    if (isRequestMode) return 'Digite o email da conta para receber as instruções de recuperação.';
    if (isLinkMode) return 'Digite sua nova senha para concluir a recuperação.';
    return 'Digite o código que chegou por email e escolha a nova senha.';
  }, [isLinkMode, isRequestMode, passwordRecoveryError]);

  function clearError() {
    if (submitError) setSubmitError(null);
  }

  function updateEmail(value: string) {
    setEmail(value);
    clearError();
    if (notice) setNotice(null);
  }

  useEffect(() => {
    if (route.params?.autoSend !== true || isRequestMode || isLinkMode || hasAutoSent) return;

    const normalizedEmail = (route.params?.email ?? '').trim().toLowerCase();
    if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) return;

    setHasAutoSent(true);
    setResendLoading(true);

    resetPassword(normalizedEmail)
      .then(() => {
        setNotice('Confira seu email para ver o código.');
      })
      .catch((error) => {
        const message = getFriendlyRecoveryErrorMessage(error, false);
        setSubmitError(message);
        Alert.alert('Não foi possível enviar', message);
      })
      .finally(() => {
        setResendLoading(false);
      });
  }, [hasAutoSent, isLinkMode, isRequestMode, route.params?.autoSend, route.params?.email]);

  async function submitRecoveryRequest() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
      const message = 'Informe um email válido para receber a recuperação.';
      setSubmitError(message);
      Alert.alert('Revise o email', message);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(normalizedEmail);
      navigation.replace('ResetPassword', {
        email: normalizedEmail,
        mode: 'code',
        notice: 'Confira seu email para ver o código.'
      });
    } catch (error) {
      const message = getFriendlyRecoveryErrorMessage(error, false);
      setSubmitError(message);
      Alert.alert('Não foi possível enviar', message);
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (isRequestMode) {
      await submitRecoveryRequest();
      return;
    }

    if (passwordRecoveryError && isLinkMode) {
      navigation.replace('Welcome', { mode: 'login' });
      clearPasswordRecoveryState();
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim().replace(/\s+/g, '');

    if (!isLinkMode) {
      if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
        const message = 'Informe o mesmo email usado para pedir a recuperação.';
        setSubmitError(message);
        Alert.alert('Revise o email', message);
        return;
      }

      if (!/^\d{6,8}$/.test(normalizedCode)) {
        const message = 'Digite o código numérico enviado para o seu email.';
        setSubmitError(message);
        Alert.alert('Código incompleto', message);
        return;
      }
    }

    if (password.length < 6) {
      const message = 'A nova senha precisa ter pelo menos 6 caracteres.';
      setSubmitError(message);
      Alert.alert('Senha muito curta', message);
      return;
    }

    if (password !== confirmPassword) {
      const message = 'Os dois campos de senha precisam ser iguais.';
      setSubmitError(message);
      Alert.alert('Senhas diferentes', message);
      return;
    }

    setLoading(true);
    try {
      if (isLinkMode) {
        await completePasswordRecovery(password);
      } else {
        await resetPasswordWithCode(normalizedEmail, normalizedCode, password);
      }

      Alert.alert('Senha atualizada', 'Sua senha foi redefinida. Agora você pode entrar com a nova senha.');
      clearPasswordRecoveryState();
      navigation.replace('Welcome', { mode: 'login' });
    } catch (error) {
      const message = getFriendlyRecoveryErrorMessage(error, isLinkMode);
      setSubmitError(message);
      Alert.alert('Não foi possível atualizar', message);
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
      const message = 'Informe um email válido para receber um novo código.';
      setSubmitError(message);
      Alert.alert('Revise o email', message);
      return;
    }

    setResendLoading(true);
    try {
      await resetPassword(normalizedEmail);
      clearError();
      setNotice('Se o email existir, um novo código ou link será enviado em instantes.');
    } catch (error) {
      const message = getFriendlyRecoveryErrorMessage(error, false);
      setSubmitError(message);
      Alert.alert('Não foi possível reenviar', message);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <ScreenContainer keyboardAvoiding keyboardDismissMode="interactive">
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.title}>{isRequestMode ? 'Recuperar senha' : 'Redefinir senha'}</Text>
          <Text style={[styles.subtitle, passwordRecoveryError && styles.errorText]}>{helperMessage}</Text>

          {!passwordRecoveryError ? (
            <View style={styles.form}>
              {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
              {isRequestMode ? (
                <AppInput label="Email" value={email} onChangeText={updateEmail} autoCapitalize="none" keyboardType="email-address" autoFocus />
              ) : !isLinkMode ? (
                <>
                  <AppInput label="Email" value={email} onChangeText={updateEmail} autoCapitalize="none" keyboardType="email-address" />
                  <AppInput
                    label="Código de recuperação"
                    value={code}
                    onChangeText={(value) => {
                      setCode(value);
                      clearError();
                    }}
                    autoCapitalize="characters"
                    keyboardType="number-pad"
                    placeholder="Digite o código"
                  />
                  <Pressable accessibilityRole="button" hitSlop={10} onPress={resendCode} style={styles.secondaryAction} disabled={resendLoading}>
                    <Text style={styles.secondaryActionText}>{resendLoading ? 'Reenviando...' : 'Reenviar código'}</Text>
                  </Pressable>
                </>
              ) : null}
              {!isRequestMode ? (
                <>
                  <AppInput
                    label="Nova senha"
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      clearError();
                    }}
                    secureTextEntry
                  />
                  <AppInput
                    label="Confirmar nova senha"
                    value={confirmPassword}
                    onChangeText={(value) => {
                      setConfirmPassword(value);
                      clearError();
                    }}
                    secureTextEntry
                  />
                </>
              ) : null}
            </View>
          ) : null}

          {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

          <AppButton title={passwordRecoveryError ? 'Voltar para entrar' : isRequestMode ? 'Enviar recuperação' : 'Salvar nova senha'} onPress={submit} loading={loading} />

          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              clearPasswordRecoveryState();
              navigation.replace('Welcome', { mode: 'login' });
            }}
            style={styles.secondaryAction}
          >
            <Text style={styles.secondaryActionText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

function getFriendlyRecoveryErrorMessage(error: unknown, isLinkMode: boolean) {
  const rawMessage = error instanceof Error ? error.message : 'Tente novamente em instantes.';
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes('same password')) {
    return 'Escolha uma senha diferente da anterior.';
  }

  if (normalized.includes('network request failed')) {
    return 'Não foi possível falar com o servidor para atualizar a senha. Verifique sua internet, tente novamente em alguns segundos e, se continuar, solicite um novo código.';
  }

  if (normalized.includes('session')) {
    return isLinkMode
      ? 'O link de recuperação não está mais válido. Solicite um novo email para redefinir a senha.'
      : 'Não foi possível validar o código. Solicite um novo email e tente novamente.';
  }

  if (normalized.includes('token has expired') || normalized.includes('expired')) {
    return isLinkMode
      ? 'Esse link expirou. Solicite um novo email para redefinir sua senha.'
      : 'Esse código expirou. Solicite um novo email para redefinir sua senha.';
  }

  if (normalized.includes('token') || normalized.includes('otp')) {
    return isLinkMode
      ? 'Esse link não é mais válido. Solicite um novo email para redefinir sua senha.'
      : 'O código informado não é válido. Confira o código recebido por email e tente novamente.';
  }

  return rawMessage;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center'
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDE9E4',
    padding: spacing.lg,
    gap: spacing.md
  },
  title: {
    color: colors.text,
    fontSize: typography.h1,
    lineHeight: 34,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  subtitle: {
    color: colors.secondaryText,
    fontSize: typography.body,
    lineHeight: 24,
    fontFamily: typography.fontFamily
  },
  form: {
    gap: spacing.sm
  },
  noticeText: {
    color: colors.darkGreen,
    backgroundColor: '#EAF4EF',
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  errorText: {
    color: colors.error,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  secondaryAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24
  },
  secondaryActionText: {
    color: colors.darkGreen,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  }
});
