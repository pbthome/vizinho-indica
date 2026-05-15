import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { useApp } from '../services/AppContext';
import { ScreenContainer } from '../components/ScreenContainer';
import { commonStyles } from './styles';

export function SplashScreen({ navigation }: any) {
  const { refreshSession } = useApp();

  useEffect(() => {
    refreshSession().then((user) => {
      if (!user) navigation.replace('Welcome');
      else if (user.status === 'pending') navigation.replace('WaitingApproval');
      else if (user.status === 'rejected' || user.status === 'blocked') navigation.replace('AccessStatus');
      else navigation.getParent()?.replace('Resident');
    });
  }, [navigation, refreshSession]);

  return (
    <ScreenContainer scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <View style={commonStyles.logoMark}>
          <Text style={commonStyles.logoText}>V</Text>
        </View>
        <Text style={commonStyles.title}>Vicini</Text>
        <ActivityIndicator color={colors.primary} />
      </View>
    </ScreenContainer>
  );
}
