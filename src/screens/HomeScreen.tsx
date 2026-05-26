import { useFocusEffect } from '@react-navigation/native';
import { ArrowUpRight, MessageCircle, Star, ThumbsDown, ThumbsUp } from 'lucide-react-native';
import { RefObject, useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingAddButton } from '../components/FloatingAddButton';
import { ContextualFeedback, ContextualFeedbackState, FeedbackPlacement } from '../components/ContextualFeedback';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useApp } from '../services/AppContext';
import { getRecommendations } from '../services/api';
import { openWhatsApp } from '../services/whatsapp';
import { Recommendation } from '../types';
import {
  buildTimelineReviews,
  formatReviewDateLabel,
  formatTimelineAverageMessage,
  getServiceName,
  TimelineReviewItem
} from '../utils/recommendations';

export function HomeScreen({ navigation }: any) {
  const { user } = useApp();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Recommendation[]>([]);
  const [feedback, setFeedback] = useState<ContextualFeedbackState | null>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      getRecommendations(user.condominiumId).then(setItems);
    }, [user])
  );

  const timelineItems = buildTimelineReviews(items);
  const firstName = user?.name.split(' ')[0] ?? 'vizinho';

  function showFeedback(message: string, anchor: ContextualFeedbackState['anchor'], placement?: FeedbackPlacement) {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    setFeedback({ id: Date.now(), message, anchor, placement });
    feedbackTimeout.current = setTimeout(() => setFeedback(null), 1950);
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <Text style={styles.greeting}>Ola, {firstName}</Text>
          <Text style={styles.condominiumName}>{user?.condominiumName}</Text>
          <Text style={styles.heroText}>Acompanhe as avaliacoes mais recentes compartilhadas pelos moradores.</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ultimas avaliacoes</Text>
          <Text style={styles.sectionSubtitle}>{timelineItems.length} avaliacao{timelineItems.length === 1 ? '' : 'oes'} registradas recentemente</Text>
        </View>

        {timelineItems.length ? (
          timelineItems.map((entry) => {
            const provider = items.find((item) => item.id === entry.providerId);
            if (!provider) return null;

            return (
              <TimelineReviewCard
                key={entry.reviewId}
                provider={provider}
                item={entry}
                onOpenDetails={() => navigation.getParent()?.navigate('RecommendationDetail', { id: entry.providerId, focusReviewId: entry.reviewId })}
                onOpenWhatsApp={() => (entry.whatsapp ? openWhatsApp(entry.whatsapp) : undefined)}
                onShowFeedback={showFeedback}
              />
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Ainda nao ha avaliacoes recentes</Text>
            <Text style={styles.emptyText}>Quando os moradores cadastrarem novas indicacoes, elas aparecerao aqui em ordem da mais nova para a mais antiga.</Text>
          </View>
        )}
      </ScrollView>

      <FloatingAddButton insets={insets} onPress={() => navigation.navigate('AddRecommendation', { providerId: undefined })} />
      <ContextualFeedback feedback={feedback} bottomInset={Math.max(insets.bottom, 12) + 82} />
    </SafeAreaView>
  );
}

function TimelineReviewCard({
  provider,
  item,
  onOpenDetails,
  onOpenWhatsApp,
  onShowFeedback
}: {
  provider: Recommendation;
  item: TimelineReviewItem;
  onOpenDetails: () => void;
  onOpenWhatsApp: () => void;
  onShowFeedback: (message: string, anchor: ContextualFeedbackState['anchor'], placement?: FeedbackPlacement) => void;
}) {
  const ratingRef = useRef<View>(null);
  const hireAgainRef = useRef<View>(null);
  const initials = item.providerName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const HireAgainIcon = item.wouldHireAgain ? ThumbsUp : ThumbsDown;
  const hireAgainColor = item.wouldHireAgain ? colors.primary : colors.error;
  const hireAgainMessage = item.wouldHireAgain
    ? `${item.residentName} contrataria novamente`
    : `${item.residentName} nao contrataria novamente`;

  return (
    <View style={styles.card}>
      <View style={styles.cardAccent} />
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{item.providerName}</Text>
          <Text style={styles.cardCategory}>{getServiceName(provider)}</Text>
        </View>
        <Text style={styles.dateText}>{formatReviewDateLabel(item.reviewedAt)}</Text>
      </View>

      <View style={styles.metaRow}>
        <Pressable
          ref={ratingRef}
          accessibilityRole="button"
          accessibilityLabel={formatTimelineAverageMessage(item.ratingCount)}
          onPress={() => showAnchoredFeedback(ratingRef, formatTimelineAverageMessage(item.ratingCount), onShowFeedback)}
          style={styles.ratingMeta}
        >
          <Star color={colors.star} fill={colors.star} size={15} />
          <Text style={styles.ratingText}>{item.reviewRating.toFixed(1)}</Text>
        </Pressable>
        <Text style={styles.metaDivider}>•</Text>
        <Text style={styles.metaAuthor}>{item.residentMeta}</Text>
        {typeof item.wouldHireAgain === 'boolean' ? (
          <Pressable
            ref={hireAgainRef}
            accessibilityRole="button"
            accessibilityLabel={hireAgainMessage}
            onPress={() => showAnchoredFeedback(hireAgainRef, hireAgainMessage, onShowFeedback)}
            style={[styles.hireAgainBadge, item.wouldHireAgain ? styles.hireAgainBadgePositive : styles.hireAgainBadgeNegative]}
          >
            <HireAgainIcon color={hireAgainColor} size={13} strokeWidth={2.4} />
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.comment}>“{item.comment}”</Text>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onOpenDetails} style={styles.detailButton}>
          <Text style={styles.detailText}>Ver recomendacoes</Text>
          <ArrowUpRight color={colors.darkGreen} size={17} />
        </Pressable>
        {item.whatsapp ? (
          <Pressable accessibilityRole="button" onPress={onOpenWhatsApp} style={styles.whatsButton}>
            <MessageCircle color={colors.surface} size={20} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function showAnchoredFeedback(
  ref: RefObject<View | null>,
  message: string,
  onShowFeedback: (message: string, anchor: ContextualFeedbackState['anchor'], placement?: FeedbackPlacement) => void
) {
  ref.current?.measureInWindow((x, y, width, height) => {
    onShowFeedback(message, { x, y, width, height });
  });
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 112
  },
  hero: {
    backgroundColor: colors.darkGreen,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 6,
    overflow: 'hidden',
    shadowColor: colors.darkGreen,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3
  },
  heroGlow: {
    position: 'absolute',
    right: -52,
    top: -62,
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: '#4CC7A0',
    opacity: 0.14
  },
  greeting: {
    color: colors.surface,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  condominiumName: {
    color: '#E2F3ED',
    fontSize: typography.small,
    lineHeight: 19,
    fontWeight: '500',
    fontFamily: typography.fontFamily
  },
  heroText: {
    color: '#CBE7DD',
    fontSize: typography.small,
    lineHeight: 18,
    maxWidth: 330,
    fontFamily: typography.fontFamily
  },
  sectionHeader: {
    gap: 2,
    marginTop: spacing.xs
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  sectionSubtitle: {
    color: colors.secondaryText,
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '600',
    fontFamily: typography.fontFamily
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: '#E7ECE9',
    gap: 6
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 20,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  emptyText: {
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom: 11,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E7ECE9',
    overflow: 'hidden',
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#8DCDB8'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEF6F2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: colors.primary,
    fontSize: typography.tiny,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  cardTitleWrap: {
    flex: 1,
    gap: 2
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 20,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  cardCategory: {
    color: '#4F7469',
    fontSize: typography.tiny,
    lineHeight: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamily
  },
  dateText: {
    color: '#7B8B85',
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
    fontFamily: typography.fontFamily
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6
  },
  ratingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: '#FFF7E8',
    paddingHorizontal: 7,
    paddingVertical: 4
  },
  ratingText: {
    color: colors.text,
    fontSize: typography.tiny,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  metaDivider: {
    color: '#C0AE7B',
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  metaAuthor: {
    color: '#7B8B85',
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '400',
    fontFamily: typography.fontFamily
  },
  hireAgainBadge: {
    width: 23,
    height: 23,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  hireAgainBadgePositive: {
    backgroundColor: '#EEF8F3',
    borderColor: '#CFE8DC'
  },
  hireAgainBadgeNegative: {
    backgroundColor: '#FFF1F1',
    borderColor: '#F3CDCD'
  },
  comment: {
    color: '#33443F',
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 17,
    backgroundColor: '#F6F8F6',
    borderWidth: 1,
    borderColor: '#E5ECE8',
    padding: 4
  },
  detailButton: {
    flex: 1,
    minHeight: 39,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#C9DDD4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs
  },
  detailText: {
    color: colors.darkGreen,
    fontSize: typography.small,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  whatsButton: {
    width: 48,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#2E9F6E',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
