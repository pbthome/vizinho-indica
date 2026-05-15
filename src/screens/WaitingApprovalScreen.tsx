import { Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { spacing } from '../constants/spacing';
import { commonStyles } from './styles';

export function WaitingApprovalScreen({ navigation }: any) {
  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
        <Text style={commonStyles.title}>Cadastro enviado</Text>
        <Text style={commonStyles.subtitle}>Vamos validar seu acesso ao condomínio.</Text>
        <Text style={commonStyles.subtitle}>A aprovação ou rejeição será comunicada por email e/ou WhatsApp assim que o administrador revisar seus dados.</Text>
        <AppButton title="Entendi" onPress={() => navigation.replace('Welcome')} />
      </View>
    </ScreenContainer>
  );
}
