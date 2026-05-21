import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useApp } from '../services/AppContext';
import { getFeedbacks } from '../services/api';
import { Feedback } from '../types';
import { commonStyles } from './styles';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function FeedbacksScreen({ navigation }: any) {
  const { user } = useApp();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeedbacks = useCallback(async () => {
    if (!user || user.status !== 'admin') {
      navigation.replace('Resident');
      return;
    }

    setLoading(true);
    try {
      const data = await getFeedbacks(user.condominiumId);
      setFeedbacks(data);
    } finally {
      setLoading(false);
    }
  }, [navigation, user]);

  useFocusEffect(
    useCallback(() => {
      void loadFeedbacks();
    }, [loadFeedbacks])
  );

  return (
    <ScreenContainer>
      <View style={{ gap: spacing.lg }}>
        <AppButton title="Voltar" variant="ghost" onPress={() => navigation.goBack()} />
        <View style={{ gap: spacing.xs }}>
          <Text style={commonStyles.title}>Feedbacks</Text>
          <Text style={commonStyles.subtitle}>Mensagens enviadas pelos moradores, com a mais recente primeiro.</Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={commonStyles.smallText}>Carregando feedbacks...</Text>
          </View>
        ) : null}

        {!loading && feedbacks.length === 0 ? <EmptyState title="Nenhum feedback enviado ate agora." /> : null}

        {!loading
          ? feedbacks.map((item) => (
              <View key={item.id} style={commonStyles.card}>
                <View style={styles.headerRow}>
                  <Text style={styles.subject}>{item.subject}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={commonStyles.smallText}>{item.userName || 'Morador sem nome'}</Text>
                <Text style={commonStyles.smallText}>{formatDateTime(item.createdAt)}</Text>
              </View>
            ))
          : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  subject: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  statusBadge: {
    borderRadius: 999,
    backgroundColor: colors.lightGreen,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6
  },
  statusText: {
    color: colors.primary,
    fontSize: typography.tiny,
    fontWeight: '800',
    textTransform: 'uppercase',
    fontFamily: typography.fontFamily
  },
  message: {
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 22,
    fontFamily: typography.fontFamily
  }
});
