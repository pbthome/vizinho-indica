import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { spacing } from '../constants/spacing';
import { isAdmin } from '../navigation/guards';
import { useApp } from '../services/AppContext';
import { approveAccessRequest, getAccessRequestById, rejectAccessRequest } from '../services/api';
import { AccessRequest } from '../types';
import { commonStyles } from './styles';

export function AccessRequestDetailScreen({ route, navigation }: any) {
  const { user } = useApp();
  const [request] = useState<AccessRequest | undefined>(() => getAccessRequestById(route.params.id));

  if (!user || !isAdmin(user)) {
    navigation.replace('Resident');
    return null;
  }

  async function approve() {
    if (!request) return;
    await approveAccessRequest(request.id);
    Alert.alert('Acesso aprovado', 'O morador recebera a confirmacao por email.');
    navigation.goBack();
  }

  function reject() {
    if (!request) return;
    Alert.prompt?.('Rejeitar solicitacao', 'Motivo opcional', async () => {
      await rejectAccessRequest(request.id);
      Alert.alert('Solicitacao rejeitada', 'O status do pedido foi atualizado.');
      navigation.goBack();
    }) ??
      Alert.alert('Rejeitar solicitacao', 'Confirma rejeicao desta solicitacao?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rejeitar',
          style: 'destructive',
          onPress: async () => {
            await rejectAccessRequest(request.id);
            Alert.alert('Solicitacao rejeitada', 'O status do pedido foi atualizado.');
            navigation.goBack();
          }
        }
      ]);
  }

  if (!request) {
    return (
      <ScreenContainer>
        <Text style={commonStyles.title}>Solicitacao nao encontrada</Text>
        <AppButton title="Voltar" onPress={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={{ gap: spacing.lg }}>
        <AppButton title="Voltar" variant="ghost" onPress={() => navigation.goBack()} />
        <Text style={commonStyles.title}>{request.name}</Text>
        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Telefone: {request.phone}</Text>
          <Text style={commonStyles.subtitle}>Email: {request.email}</Text>
          <Text style={commonStyles.subtitle}>Unidade: {request.unit}</Text>
          <Text style={commonStyles.subtitle}>Data: {request.requestDate}</Text>
        </View>
        <AppButton title="Aprovar acesso" onPress={approve} />
        <AppButton title="Rejeitar" variant="danger" onPress={reject} />
      </View>
    </ScreenContainer>
  );
}
