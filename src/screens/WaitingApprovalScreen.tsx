import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useApp } from '../services/AppContext';
import { commonStyles } from './styles';

export function WaitingApprovalScreen({ navigation }: any) {
  const { signOut } = useApp();

  async function handleGoToLogin() {
    await signOut();
    navigation.replace('Welcome', { mode: 'login' });
  }

  async function handleGoToSignUp() {
    await signOut();
    navigation.replace('SignUp');
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={commonStyles.title}>Cadastro enviado</Text>
        <Text style={commonStyles.subtitle}>Seu acesso esta em analise. Enquanto isso, este app continuara mostrando esta tela ate o administrador aprovar ou recusar seu cadastro.</Text>
        <Text style={commonStyles.subtitle}>A decisao sera comunicada por email assim que a revisao terminar.</Text>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>O que acontece depois</Text>
          <Text style={styles.noticeText}>Assim que o cadastro for aprovado, voce entra direto no aplicativo na proxima vez que abrir ou atualizar esta tela.</Text>
        </View>

        <View style={styles.actions}>
          <AppButton title="Ja tenho uma conta" variant="secondary" onPress={handleGoToLogin} />
          <AppButton title="Fazer novo cadastro" variant="ghost" onPress={handleGoToSignUp} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg
  },
  notice: {
    backgroundColor: '#F5F8F6',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D9E5DF',
    padding: spacing.md,
    gap: spacing.xs
  },
  noticeTitle: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  noticeText: {
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 22,
    fontFamily: typography.fontFamily
  },
  actions: {
    gap: spacing.sm
  }
});
