import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useApp } from '../services/AppContext';
import { login } from '../services/mockApi';

export function WelcomeScreen({ navigation, route }: any) {
  const { setUser } = useApp();
  const [mode, setMode] = useState<'default' | 'login'>(route.params?.mode === 'login' ? 'login' : 'default');
  const [email, setEmail] = useState('pedro@vizinho.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const loginProgress = useRef(new Animated.Value(mode === 'login' ? 1 : 0)).current;

  useEffect(() => {
    if (route.params?.mode === 'login') setMode('login');
  }, [route.params?.mode]);

  useEffect(() => {
    Animated.timing(loginProgress, {
      toValue: mode === 'login' ? 1 : 0,
      duration: 220,
      useNativeDriver: true
    }).start();
  }, [loginProgress, mode]);

  async function submitLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Dados obrigatórios', 'Informe email e senha.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      Alert.alert('Revise o email', 'Informe um email válido para entrar.');
      return;
    }

    setLoading(true);
    const user = await login(email.trim());
    setUser(user);
    setLoading(false);
    if (user.status === 'pending') navigation.replace('WaitingApproval');
    else if (user.status === 'rejected' || user.status === 'blocked') navigation.replace('AccessStatus');
    else navigation.getParent()?.replace('Resident');
  }

  return (
    <ScreenContainer>
      <View style={styles.screen}>
        <View style={styles.warmGlow} />
        <View style={styles.greenGlow} />

        <View style={styles.composition}>
          <ViciniHeroLockup />

          <View style={styles.message}>
            <Text style={styles.headline}>Indicações confiáveis,{'\n'}feitas por quem mora perto.</Text>
          </View>

          <View style={styles.actions}>
            {mode === 'default' ? (
              <>
                <AppButton title="Criar conta" onPress={() => navigation.navigate('Onboarding')} style={styles.primaryButton} />
                <Pressable accessibilityRole="button" onPress={() => setMode('login')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                  <Text style={styles.secondaryButtonText}>Entrar</Text>
                </Pressable>
              </>
            ) : (
              <Animated.View
                style={[
                  styles.loginMode,
                  {
                    opacity: loginProgress,
                    transform: [
                      {
                        translateY: loginProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [8, 0]
                        })
                      }
                    ]
                  }
                ]}
              >
                <View style={styles.loginFields}>
                  <AppInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                  <AppInput label="Senha" value={password} onChangeText={setPassword} secureTextEntry />
                </View>
                <AppButton title="Entrar" onPress={submitLogin} loading={loading} style={styles.primaryButton} />
                <View style={styles.inlineAccount}>
                  <Text style={styles.inlineAccountText}>Não tem conta?</Text>
                  <Pressable onPress={() => navigation.navigate('Onboarding')} hitSlop={10}>
                    <Text style={styles.inlineAccountLink}>Criar conta</Text>
                  </Pressable>
                </View>
                <Text style={styles.trustCue}>Acesso liberado apenas para moradores verificados.</Text>
              </Animated.View>
            )}
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

function ViciniHeroLockup() {
  return (
    <View style={styles.logoLockup}>
      <Svg width={92} height={56} viewBox="0 0 92 56">
        <Path d="M16 46V24L34 8L51 24V46" fill="none" stroke={colors.darkGreen} strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M57 46V27L72 14L86 27V46" fill="none" stroke={colors.darkGreen} strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <Text style={styles.wordmark}>Vicini</Text>
      <View style={styles.tagDivider} />
      <Text style={styles.tagline}>INDICAÇÕES REAIS.{'\n'}VIZINHOS DE VERDADE.</Text>
    </View>
  );
}

const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia'
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm
  },
  warmGlow: {
    position: 'absolute',
    left: -74,
    top: 10,
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: '#F0EDDD',
    opacity: 0.36
  },
  greenGlow: {
    position: 'absolute',
    right: -88,
    bottom: 92,
    width: 178,
    height: 178,
    borderRadius: 89,
    backgroundColor: '#E1EEE8',
    opacity: 0.46
  },
  composition: {
    gap: 24
  },
  logoLockup: {
    alignItems: 'center',
    gap: 7,
    marginBottom: 8
  },
  wordmark: {
    color: colors.darkGreen,
    fontSize: 58,
    lineHeight: 62,
    fontWeight: '400',
    letterSpacing: 2.1,
    fontFamily: serifFont
  },
  tagDivider: {
    width: 39,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: '#8B9F74',
    marginTop: 2,
    marginBottom: 3
  },
  tagline: {
    color: colors.text,
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: typography.fontFamily
  },
  message: {
    alignItems: 'center',
    paddingTop: 4
  },
  headline: {
    color: colors.text,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
    maxWidth: 360,
    fontFamily: typography.fontFamily
  },
  actions: {
    gap: spacing.sm,
    paddingTop: 8
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 17,
    backgroundColor: colors.darkGreen
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 17,
    backgroundColor: '#F0F7F4',
    borderWidth: 1,
    borderColor: '#D6E8E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: colors.darkGreen,
    fontSize: typography.body,
    lineHeight: 20,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  loginMode: {
    gap: spacing.sm
  },
  loginFields: {
    gap: 10
  },
  inlineAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 24
  },
  inlineAccountText: {
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  },
  inlineAccountLink: {
    color: colors.darkGreen,
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
  pressed: {
    opacity: 0.86
  }
});
