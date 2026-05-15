import { Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { spacing } from '../constants/spacing';
import { commonStyles } from './styles';

export function AccessStatusScreen({ navigation }: any) {
  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
        <Text style={commonStyles.title}>Acesso não aprovado</Text>
        <Text style={commonStyles.subtitle}>Confira seus dados com o administrador do condomínio.</Text>
        <AppButton title="Revisar dados" onPress={() => navigation.replace('SignUp')} />
      </View>
    </ScreenContainer>
  );
}
