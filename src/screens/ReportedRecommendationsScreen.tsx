import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { spacing } from '../constants/spacing';
import { useApp } from '../services/AppContext';
import { getReportedRecommendations, moderateReport } from '../services/mockApi';
import { Report } from '../types';
import { commonStyles } from './styles';

export function ReportedRecommendationsScreen({ navigation }: any) {
  const { user } = useApp();
  const [reports, setReports] = useState<Report[]>([]);

  const load = useCallback(() => {
    if (!user) return;
    getReportedRecommendations(user.condominiumId).then(setReports);
  }, [user]);

  useFocusEffect(load);

  async function decide(id: string, action: 'kept' | 'hidden' | 'removed') {
    await moderateReport(id, action);
    Alert.alert('Denúncia revisada', 'A decisão foi aplicada no mock.');
    load();
  }

  return (
    <ScreenContainer>
      <View style={{ gap: spacing.lg }}>
        <AppButton title="Voltar" variant="ghost" onPress={() => navigation.goBack()} />
        <Text style={commonStyles.title}>Recomendações denunciadas</Text>
        {reports.length === 0 ? <EmptyState title="Nenhuma denúncia aguardando revisão." /> : null}
        {reports.map((report) => (
          <View key={report.id} style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>{report.recommendationName}</Text>
            <Text style={commonStyles.subtitle}>{report.reason}</Text>
            <Text style={commonStyles.smallText}>Reportado por {report.reportedBy} em {report.createdAt}</Text>
            <View style={{ gap: spacing.sm }}>
              <AppButton title="Manter" variant="secondary" onPress={() => decide(report.id, 'kept')} />
              <AppButton title="Ocultar" onPress={() => decide(report.id, 'hidden')} />
              <AppButton title="Remover" variant="danger" onPress={() => decide(report.id, 'removed')} />
            </View>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
