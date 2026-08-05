import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { PhoneInput } from '../components/PhoneInput';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useApp } from '../services/AppContext';
import { requestAccess } from '../services/api';
import { getBackendMode, getBackendStatusMessage } from '../services/supabase/config';
import { getFriendlyAuthErrorMessage } from '../utils/authErrors';
import { getPhoneValidation } from '../utils/phone';

const MVP_CONDOMINIUM = 'Jardins Bolonha';

type SignUpForm = {
  name: string;
  phone: string;
  email: string;
  password: string;
  condominium: string;
  block: string;
  lot: string;
};

type SignUpErrors = Partial<Record<keyof SignUpForm, string>>;

export function SignUpScreen({ navigation }: any) {
  const { setUser } = useApp();
  const backendMode = getBackendMode();
  const backendMessage = getBackendStatusMessage();
  const [form, setForm] = useState<SignUpForm>({
    name: '',
    phone: '',
    email: '',
    password: '',
    condominium: MVP_CONDOMINIUM,
    block: '',
    lot: ''
  });
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [loading, setLoading] = useState(false);

  const update = (key: keyof SignUpForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  function validate() {
    const nextErrors: SignUpErrors = {};
    const phoneValidation = getPhoneValidation(form.phone);
    const emailOk = /\S+@\S+\.\S+/.test(form.email.trim());

    if (!form.name.trim()) nextErrors.name = 'O campo Nome completo está vazio.';
    if (!phoneValidation.isValid) nextErrors.phone = phoneValidation.message || 'O campo Telefone está incorreto.';
    if (!form.email.trim()) nextErrors.email = 'O campo Email está vazio.';
    else if (!emailOk) nextErrors.email = 'O campo Email está incorreto.';
    if (!form.condominium.trim()) nextErrors.condominium = 'O campo Condomínio está vazio.';
    if (!form.block.trim()) nextErrors.block = 'O campo Quadra está vazio.';
    if (!form.lot.trim()) nextErrors.lot = 'O campo Lote está vazio.';

    if (form.password.length < 6) nextErrors.password = 'A senha precisa ter pelo menos 6 caracteres.';
    setErrors(nextErrors);
    return nextErrors;
  }

  async function submit() {
    const nextErrors = validate();
    const firstError = Object.values(nextErrors)[0];
    if (firstError) {
      Alert.alert('Revise os dados', firstError);
      return;
    }

    setLoading(true);
    try {
      const user = await requestAccess({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        condominium: form.condominium.trim(),
        unit: `Quadra ${form.block.trim()}, Lote ${form.lot.trim()}`
      });
      setUser(user);
      navigation.replace('WaitingApproval');
    } catch (error) {
      Alert.alert('Não foi possível solicitar acesso', getFriendlyAuthErrorMessage(error, 'signup'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer keyboardAvoiding keyboardDismissMode="interactive">
      <View style={styles.screen}>
        <View style={styles.hero}>
          <Text style={styles.title}>Solicitar acesso</Text>
          <Text style={styles.subtitle}>A Vicini é uma rede privada do condomínio. Seus dados ajudam a manter as recomendações dentro da comunidade.</Text>
        </View>
        {backendMode === 'mock' ? (
          <View style={styles.mockNotice}>
            <Text style={styles.mockNoticeLabel}>Modo demonstração</Text>
            <Text style={styles.mockNoticeText}>{backendMessage}</Text>
          </View>
        ) : null}

        <View style={styles.formSurface}>
          <View style={styles.formSection}>
            <AppInput label="Nome completo" value={form.name} onChangeText={update('name')} error={errors.name} />
            <PhoneInput label="Telefone" value={form.phone} onChangeText={update('phone')} error={errors.phone} helperText="Escolha o país e digite DDD + número." />
            <AppInput label="Email" value={form.email} onChangeText={update('email')} error={errors.email} autoCapitalize="none" keyboardType="email-address" />
            <AppInput label="Senha" value={form.password} onChangeText={update('password')} error={errors.password} secureTextEntry />
          </View>

          <View style={styles.formSection}>
            <LockedCondominium value={form.condominium} error={errors.condominium} />
            <View style={styles.addressRow}>
              <View style={styles.addressField}>
                <AppInput label="Quadra" value={form.block} onChangeText={update('block')} error={errors.block} placeholder="Ex: A" />
              </View>
              <View style={styles.addressField}>
                <AppInput label="Lote" value={form.lot} onChangeText={update('lot')} error={errors.lot} placeholder="Ex: 12" />
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <AppButton title="Solicitar acesso" onPress={submit} loading={loading} style={styles.primaryButton} />
            <View style={styles.inlineFooter}>
              <Text style={styles.inlineText}>Já tem conta?</Text>
              <Pressable onPress={() => navigation.navigate('Welcome', { mode: 'login' })} hitSlop={10}>
                <Text style={styles.inlineLink}>Entrar</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Text style={styles.trustCue}>Acesso liberado apenas para moradores verificados.</Text>
      </View>
    </ScreenContainer>
  );
}

function LockedCondominium({ value, error }: { value: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Condomínio</Text>
      <View style={[styles.condominiumSurface, error && styles.condominiumError]}>
        <Text style={styles.condominiumName}>{value}</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    gap: spacing.md,
    paddingVertical: spacing.sm
  },
  hero: {
    gap: 8,
    paddingTop: spacing.xs,
    paddingBottom: 2
  },
  mockNotice: {
    backgroundColor: '#FFF6E4',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8D7A8',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 6
  },
  mockNoticeLabel: {
    color: '#7A5A00',
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  mockNoticeText: {
    color: '#7A5A00',
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  },
  title: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  subtitle: {
    color: colors.secondaryText,
    fontSize: typography.body,
    lineHeight: 23,
    fontFamily: typography.fontFamily
  },
  formSurface: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2ECE7',
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2
  },
  formSection: {
    gap: spacing.sm
  },
  field: { gap: 5 },
  label: { color: colors.text, fontSize: typography.small, lineHeight: 18, fontWeight: '700', fontFamily: typography.fontFamily },
  condominiumSurface: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDE9E4',
    backgroundColor: '#F7FAF8',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  condominiumError: { borderColor: colors.error },
  condominiumName: {
    flex: 1,
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  addressRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  addressField: { flex: 1 },
  actions: {
    gap: spacing.sm,
    paddingTop: spacing.xs
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 15
  },
  inlineFooter: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5
  },
  inlineText: {
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  },
  inlineLink: {
    color: colors.primary,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  trustCue: {
    color: '#71877F',
    textAlign: 'center',
    fontSize: typography.tiny,
    lineHeight: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamily
  },
  error: { color: colors.error, fontSize: typography.tiny, fontFamily: typography.fontFamily }
});
