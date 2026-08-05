import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { spacing } from '../constants/spacing';
import { isAdmin } from '../navigation/guards';
import { useApp } from '../services/AppContext';
import { approveAccessRequest, getAccessRequests, rejectAccessRequest } from '../services/api';
import { AccessRequest } from '../types';
import { commonStyles } from './styles';

export function AccessRequestsScreen({ navigation }: any) {
  const { user } = useApp();
  const [requests, setRequests] = useState<AccessRequest[]>([]);

  const load = useCallback(() => {
    if (!user || !isAdmin(user)) {
      navigation.replace('Resident');
      return;
    }
    getAccessRequests(user.condominiumId).then(setRequests);
  }, [navigation, user]);

  useFocusEffect(load);

  async function decide(id: string, action: 'approve' | 'reject') {
    if (action === 'approve') {
      await approveAccessRequest(id);
      Alert.alert('Morador aprovado', 'O residente recebera um email com a confirmacao de acesso.');
    } else {
      await rejectAccessRequest(id);
      Alert.alert('Solicitacao rejeitada', 'O status do pedido foi atualizado.');
    }
    load();
  }

  return (
    <ScreenContainer>
      <View style={{ gap: spacing.lg }}>
        <AppButton title="Voltar" variant="ghost" onPress={() => navigation.goBack()} />
        <Text style={commonStyles.title}>Usuarios pendentes</Text>
        {requests.length === 0 ? <EmptyState title="Nenhum morador aguardando aprovacao agora." /> : null}
        {requests.map((request) => (
          <View key={request.id} style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>{request.name}</Text>
            <Text style={commonStyles.smallText}>{request.phone}</Text>
            <Text style={commonStyles.smallText}>{request.email}</Text>
            <Text style={commonStyles.smallText}>{request.unit}</Text>
            <Text style={commonStyles.smallText}>Solicitado em {request.requestDate}</Text>
            <AppButton title="Ver detalhes" variant="secondary" onPress={() => navigation.navigate('AccessRequestDetail', { id: request.id })} />
            <View style={commonStyles.row}>
              <AppButton title="Aprovar" onPress={() => decide(request.id, 'approve')} style={{ flex: 1 }} />
              <AppButton title="Rejeitar" variant="danger" onPress={() => decide(request.id, 'reject')} style={{ flex: 1 }} />
            </View>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
