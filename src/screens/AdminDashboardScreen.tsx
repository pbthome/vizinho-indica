import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { AdminSummaryCard } from '../components/AdminSummaryCard';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { spacing } from '../constants/spacing';
import { useApp } from '../services/AppContext';
import { getAccessRequests, getRecommendations, getReportedRecommendations } from '../services/mockApi';
import { commonStyles } from './styles';

export function AdminDashboardScreen({ navigation }: any) {
  const { user } = useApp();
  const [pendingCount, setPendingCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [residentCount, setResidentCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!user || user.status !== 'admin') {
        navigation.replace('Resident');
        return;
      }
      getAccessRequests(user.condominiumId).then((data) => setPendingCount(data.length));
      getReportedRecommendations(user.condominiumId).then((data) => setReportCount(data.length));
      getRecommendations(user.condominiumId).then((data) => setResidentCount(data.length + 1));
    }, [navigation, user])
  );

  return (
    <ScreenContainer>
      <View style={{ gap: spacing.lg }}>
        <AppButton title="Voltar" variant="ghost" onPress={() => navigation.goBack()} />
        <Text style={commonStyles.title}>Painel do condomínio</Text>
        {pendingCount === 0 ? <EmptyState title="Nenhum morador aguardando aprovação agora." /> : null}
        <AdminSummaryCard title="Usuários pendentes" value={`${pendingCount} solicitações aguardando revisão`} buttonTitle="Revisar solicitações" onPress={() => navigation.navigate('AccessRequests')} />
        <AdminSummaryCard title="Recomendações denunciadas" value={`${reportCount} denúncias abertas`} buttonTitle="Revisar denúncias" onPress={() => navigation.navigate('ReportedRecommendations')} />
        <AdminSummaryCard title="Moradores aprovados" value={`${residentCount} moradores ativos no mock`} buttonTitle="Ver moradores" onPress={() => {}} />
      </View>
    </ScreenContainer>
  );
}
