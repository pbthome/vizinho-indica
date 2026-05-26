import { useFocusEffect } from '@react-navigation/native';
import { ArrowUpRight, MessageCircle, Search, Star } from 'lucide-react-native';
import { RefObject, useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingAddButton } from '../components/FloatingAddButton';
import { ContextualFeedback, ContextualFeedbackState, FeedbackPlacement } from '../components/ContextualFeedback';
import { serviceSpecialtiesForPicker } from '../constants/categories';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useApp } from '../services/AppContext';
import { getRecommendations } from '../services/api';
import { openWhatsApp } from '../services/whatsapp';
import { Recommendation } from '../types';
import {
  formatAverageMessage,
  formatLastRecommendationLabel,
  formatTrustMessage,
  getHireAgainMetric,
  getLatestActivityDate,
  getServiceName,
  normalize,
  sortProvidersForDirectory
} from '../utils/recommendations';

export function ProvidersScreen({ navigation }: any) {
  const { user } = useApp();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Recommendation[]>([]);
  const [query, setQuery] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | undefined>();
  const [feedback, setFeedback] = useState<ContextualFeedbackState | null>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      getRecommendations(user.condominiumId).then(setItems);
    }, [user])
  );

  const visibleSpecialties = serviceSpecialtiesForPicker.filter((specialty) => specialty.id !== 'outros');
  const normalizedQuery = normalize(query);
  const filteredProviders = [...items]
    .filter((item) => (selectedSpecialtyId ? item.serviceSpecialtyId === selectedSpecialtyId : true))
    .filter((item) => {
      if (!normalizedQuery) return true;
      const haystack = normalize(
        [item.supplierName, getServiceName(item), item.shortComment, item.contactInfo, ...item.reviews.map((review) => review.comment)].join(' ')
      );
      return haystack.includes(normalizedQuery);
    })
    .sort(sortProvidersForDirectory);

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
          <Text style={styles.heroTitle}>Prestadores</Text>
          <Text style={styles.heroText}>Busque por profissao e compare os prestadores mais bem avaliados da comunidade.</Text>
        </View>

        <View style={styles.searchPanel}>
          <View style={styles.searchBar}>
            <Search color={colors.darkGreen} size={19} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por nome ou profissao"
              placeholderTextColor={colors.secondaryText}
              style={styles.searchInput}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <Pressable style={[styles.chip, !selectedSpecialtyId && styles.chipSelected]} onPress={() => setSelectedSpecialtyId(undefined)}>
              <Text style={[styles.chipText, !selectedSpecialtyId && styles.chipTextSelected]}>Todas</Text>
            </Pressable>
            {visibleSpecialties.map((specialty) => (
              <Pressable
                key={specialty.id}
                style={[styles.chip, selectedSpecialtyId === specialty.id && styles.chipSelected]}
                onPress={() => setSelectedSpecialtyId((current) => (current === specialty.id ? undefined : specialty.id))}
              >
                <Text style={[styles.chipText, selectedSpecialtyId === specialty.id && styles.chipTextSelected]}>{specialty.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prestadores recomendados</Text>
          <Text style={styles.sectionSubtitle}>{filteredProviders.length} resultado{filteredProviders.length === 1 ? '' : 's'}</Text>
        </View>

        {filteredProviders.length ? (
          filteredProviders.map((item) => (
            <ProviderCard
              key={item.id}
              item={item}
              onOpenDetails={() => navigation.getParent()?.navigate('RecommendationDetail', { id: item.id })}
              onOpenWhatsApp={() => openWhatsApp(item.whatsapp)}
              onShowFeedback={showFeedback}
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhum prestador encontrado</Text>
            <Text style={styles.emptyText}>Tente limpar a busca ou trocar o filtro de profissao para ver mais opcoes.</Text>
          </View>
        )}
      </ScrollView>

      <FloatingAddButton insets={insets} onPress={() => navigation.navigate('AddRecommendation', { providerId: undefined })} />
      <ContextualFeedback feedback={feedback} bottomInset={Math.max(insets.bottom, 12) + 82} />
    </SafeAreaView>
  );
}

function ProviderCard({
  item,
  onOpenDetails,
  onOpenWhatsApp,
  onShowFeedback
}: {
  item: Recommendation;
  onOpenDetails: () => void;
  onOpenWhatsApp: () => void;
  onShowFeedback: (message: string, anchor: ContextualFeedbackState['anchor'], placement?: FeedbackPlacement) => void;
}) {
  const ratingRef = useRef<View>(null);
  const trustRef = useRef<View>(null);
  const hireAgain = getHireAgainMetric(item.reviews);
  const totalReviews = item.reviews.length;
  const hasReviews = totalReviews > 0;
  const showTrustLine = totalReviews > 1 ? hireAgain.total > 0 : totalReviews === 1 ? hireAgain.yes === 1 : false;
  const lastRecommendationDate = hasReviews ? formatLastRecommendationLabel(getLatestActivityDate(item)) : '';
  const reviewsLabel = totalReviews === 1 ? '1 avaliacao' : `${totalReviews} avaliacoes`;
  const trustSummary =
    totalReviews === 1
      ? '1 morador contrataria novamente'
      : `${hireAgain.percentage}% contratariam novamente`;

  return (
    <View style={styles.card}>
      <View style={styles.cardAccent} />
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.supplierName
              .split(' ')
              .slice(0, 2)
              .map((part) => part[0])
              .join('')
              .toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{item.supplierName}</Text>
          <View style={styles.professionBadge}>
            <Text style={styles.professionBadgeText}>{getServiceName(item)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoPanel}>
        {hasReviews ? (
          <>
            <Pressable
              ref={ratingRef}
              accessibilityRole="button"
              accessibilityLabel={formatAverageMessage(item.reviews.length)}
              onPress={() => showAnchoredFeedback(ratingRef, formatAverageMessage(item.reviews.length), onShowFeedback)}
              style={styles.metricLine}
            >
              <Star color={colors.star} fill={colors.star} size={15} />
              <Text style={styles.ratingValue}>{item.averageRating.toFixed(1)}</Text>
              <Text style={styles.metricSeparator}>·</Text>
              <Text style={styles.metricText}>{reviewsLabel}</Text>
            </Pressable>

            {showTrustLine ? (
              <Pressable
                ref={trustRef}
                accessibilityRole="button"
                accessibilityLabel={formatTrustMessage(hireAgain.yes, hireAgain.total)}
                onPress={() => showAnchoredFeedback(trustRef, formatTrustMessage(hireAgain.yes, hireAgain.total), onShowFeedback)}
                style={({ pressed }) => [styles.trustRow, pressed && styles.inlinePressed]}
              >
                <Text style={styles.trustSummary}>{trustSummary}</Text>
              </Pressable>
            ) : null}

            <Text style={styles.lastRecommendationText}>{lastRecommendationDate}</Text>
          </>
        ) : (
          <Text style={styles.emptyMetricText}>Ainda sem avaliacoes</Text>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onOpenDetails}
          style={styles.detailButton}
        >
          <Text style={styles.detailText}>Ver perfil</Text>
          <ArrowUpRight color={colors.darkGreen} size={17} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onOpenWhatsApp} style={styles.whatsButton}>
          <MessageCircle color={colors.surface} size={20} />
        </Pressable>
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
    paddingBottom: 156
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
  heroTitle: {
    color: colors.surface,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  heroText: {
    color: '#CBE7DD',
    fontSize: typography.small,
    lineHeight: 18,
    maxWidth: 330,
    fontFamily: typography.fontFamily
  },
  searchPanel: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2ECE7',
    padding: spacing.sm,
    gap: 10,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.055,
    shadowRadius: 16,
    elevation: 2
  },
  searchBar: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: '#F8FAF8',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#DDEAE4'
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  },
  chipRow: {
    gap: 8,
    paddingRight: spacing.md
  },
  chip: {
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE9E4',
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chipSelected: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primary
  },
  chipText: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: typography.fontFamily
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '800'
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
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
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
    right: -32,
    top: -36,
    width: 104,
    height: 104,
    borderRadius: 999,
    backgroundColor: '#E8F5EF'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E6F3ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CFE1D8'
  },
  avatarText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  cardTitleWrap: {
    flex: 1,
    gap: 5,
    paddingTop: 1
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  professionBadge: {
    alignSelf: 'flex-start',
    minHeight: 24,
    borderRadius: 999,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: '#CFE1D8',
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center'
  },
  professionBadgeText: {
    color: colors.primary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  infoPanel: {
    borderRadius: 16,
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: '#E4ECE7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 5
  },
  metricLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start'
  },
  ratingValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  metricSeparator: {
    color: '#A0B2AA',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  metricText: {
    color: colors.secondaryText,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  trustRow: {
    alignSelf: 'flex-start',
    minHeight: 24,
    justifyContent: 'center'
  },
  inlinePressed: {
    opacity: 0.72
  },
  trustSummary: {
    color: '#3F6F61',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  emptyMetricText: {
    color: colors.secondaryText,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  lastRecommendationText: {
    color: '#7B8B85',
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
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
    padding: 3
  },
  detailButton: {
    flex: 1,
    minHeight: 38,
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
    height: 38,
    borderRadius: 12,
    backgroundColor: '#2E9F6E',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
