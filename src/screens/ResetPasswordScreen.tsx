import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { resetPasswordWithCode } from '../services/api';
import { useApp } from '../services/AppContext';

export function ResetPasswordScreen({ navigation, route }: any) {
  const { completePasswordRecovery, passwordRecoveryError, clearPasswordRecoveryState, isPasswordRecoveryMode } = useApp();
  const isLinkMode = route.params?.mode === 'link' || isPasswordRecoveryMode;
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const helperMessage = useMemo(() => {
    if (passwordRecoveryError) return passwordRecoveryError;
    if (isLinkMode) return 'Digite sua nova senha para concluir a recuperacao.';
    return 'Digite o codigo que chegou por email e escolha a nova senha.';
  }, [isLinkMode, passwordRecoveryError]);

  function clearError() {
    if (submitError) setSubmitError(null);
  }

  async function submit() {
    if (passwordRecoveryError && isLinkMode) {
      navigation.replace('Welcome', { mode: 'login' });
      clearPasswordRecoveryState();
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim().replace(/\s+/g, '');

    if (!isLinkMode) {
      if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
        const message = 'Informe o mesmo email usado para pedir a recuperacao.';
        setSubmitError(message);
        Alert.alert('Revise o email', message);
        return;
      }

      if (!/^\d{6,8}$/.test(normalizedCode)) {
        const message = 'Digite o codigo numerico enviado para o seu email.';
        setSubmitError(message);
        Alert.alert('Codigo incompleto', message);
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

      Alert.alert('Senha atualizada', 'Sua senha foi redefinida. Agora voce pode entrar com a nova senha.');
      clearPasswordRecoveryState();
      navigation.replace('Welcome', { mode: 'login' });
    } catch (error) {
      const message = getFriendlyRecoveryErrorMessage(error, isLinkMode);
      setSubmitError(message);
      Alert.alert('Nao foi possivel atualizar', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer keyboardAvoiding keyboardDismissMode="interactive">
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.title}>Redefinir senha</Text>
          <Text style={[styles.subtitle, passwordRecoveryError && styles.errorText]}>{helperMessage}</Text>

          {!passwordRecoveryError ? (
            <View style={styles.form}>
              {!isLinkMode ? (
                <>
                  <AppInput
                    label="Email"
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      clearError();
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <AppInput
                    label="Codigo de recuperacao"
                    value={code}
                    onChangeText={(value) => {
                      setCode(value);
                      clearError();
                    }}
                    autoCapitalize="characters"
                    keyboardType="number-pad"
                    placeholder="Digite o codigo"
                  />
                </>
              ) : null}
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
            </View>
          ) : null}

          {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

          <AppButton title={passwordRecoveryError ? 'Voltar para entrar' : 'Salvar nova senha'} onPress={submit} loading={loading} />

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

  if (normalized.includes('session')) {
    return isLinkMode
      ? 'O link de recuperacao nao esta mais valido. Solicite um novo email para redefinir a senha.'
      : 'Nao foi possivel validar o codigo. Solicite um novo email e tente novamente.';
  }

  if (normalized.includes('token has expired') || normalized.includes('expired')) {
    return 'Esse codigo expirou. Solicite um novo email para redefinir sua senha.';
  }

  if (normalized.includes('token') || normalized.includes('otp')) {
    return 'O codigo informado nao e valido. Confira o codigo recebido por email e tente novamente.';
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
