import { Alert, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { useApp } from '../services/AppContext';
import { commonStyles } from './styles';

const options = ['Editar dados', 'Minhas recomendações', 'Minhas avaliações', 'Status de acesso e regras da comunidade', 'Notificações', 'Privacidade', 'Ajuda'];

export function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useApp();

  async function logout() {
    await signOut();
    navigation.getParent()?.replace('Auth', { screen: 'Welcome' });
  }

  return (
    <ScreenContainer>
      <View style={{ gap: spacing.lg }}>
        <Text style={commonStyles.title}>Perfil</Text>
        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitle}>{user?.name}</Text>
          <Text style={commonStyles.subtitle}>{user?.condominiumName}</Text>
          <Text style={commonStyles.smallText}>{user?.unit}</Text>
          <Text style={[commonStyles.smallText, { color: colors.success, fontWeight: '800' }]}>Acesso aprovado</Text>
        </View>
        {options.map((option) => (
          <View key={option} style={commonStyles.card}>
            <Text style={commonStyles.subtitle} onPress={() => Alert.alert(option, 'Tela demonstrativa do MVP.')}>{option}</Text>
          </View>
        ))}
        <AppButton title="Sair" variant="danger" onPress={logout} />
      </View>
    </ScreenContainer>
  );
}
