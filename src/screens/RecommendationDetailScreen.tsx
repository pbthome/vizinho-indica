import { ArrowLeft, MessageCircle, Star, ThumbsDown, ThumbsUp } from 'lucide-react-native';
import { RefObject, useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContextualFeedback, ContextualFeedbackState, FeedbackPlacement } from '../components/ContextualFeedback';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { getRecommendationByIdAsync } from '../services/api';
import { openWhatsApp } from '../services/whatsapp';
import { Recommendation, Review } from '../types';

export function RecommendationDetailScreen({ route, navigation }: any) {
  const [item, setItem] = useState<Recommendation | undefined>();
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ContextualFeedbackState | null>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const pendingFocusReviewId = useRef<string | undefined>(undefined);
  const reviewPositions = useRef<Record<string, number>>({});
  const ratingRef = useRef<View>(null);
  const trustRef = useRef<View>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    pendingFocusReviewId.current = route.params.focusReviewId;
    getRecommendationByIdAsync(route.params.id).then(setItem);
  }, [route.params.focusReviewId, route.params.id]);

  if (!item) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <View style={styles.emptyState}>
          <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={colors.darkGreen} size={22} />
          </Pressable>
          <Text style={styles.emptyTitle}>Indicação não encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hireAgain = getHireAgainMetric(item.reviews);

  function showFeedback(message: string, anchor: ContextualFeedbackState['anchor'], placement?: FeedbackPlacement) {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    setFeedback({ id: Date.now(), message, anchor, placement });
    feedbackTimeout.current = setTimeout(() => setFeedback(null), 1950);
  }

  function focusReviewIfNeeded() {
    const id = pendingFocusReviewId.current;
    if (!id) return;
    const y = reviewPositions.current[id];
    if (typeof y !== 'number') return;
    pendingFocusReviewId.current = undefined;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(y - 18, 0), animated: true });
      navigation.setParams?.({ focusReviewId: undefined });
    }, 180);
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.darkGreen} size={22} />
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.providerName}>{item.supplierName}</Text>
          <Text style={styles.providerSpecialty}>{getServiceName(item)}</Text>

          <View style={styles.heroMetrics}>
            <Pressable
              ref={ratingRef}
              accessibilityRole="button"
              accessibilityLabel={formatAverageMessage(item.reviews.length)}
              onPress={() => showAnchoredFeedback(ratingRef, formatAverageMessage(item.reviews.length), showFeedback)}
              style={styles.ratingMeta}
            >
              <Star color={colors.star} fill={colors.star} size={15} />
              <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({item.reviews.length})</Text>
            </Pressable>
            <TrustIndicator metric={hireAgain} reference={trustRef} onShowFeedback={showFeedback} />
          </View>
        </View>

        <View style={styles.ctaGroup}>
          <Pressable accessibilityRole="button" style={styles.whatsappButton} onPress={() => openWhatsApp(item.whatsapp)}>
            <MessageCircle color={colors.surface} size={20} />
            <Text style={styles.whatsappText}>Chamar no WhatsApp</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.secondaryAction} onPress={() => navigation.navigate('Resident', { screen: 'AddRecommendation', params: { providerId: item.id } })}>
            <Text style={styles.secondaryActionText}>Adicionar recomendação</Text>
          </Pressable>
        </View>

        <View style={styles.reviewSectionHeader}>
          <Text style={styles.sectionTitle}>Avaliações dos vizinhos</Text>
          <Text style={styles.sectionSubtitle}>Experiências reais compartilhadas pela comunidade.</Text>
        </View>

        <View style={styles.reviewFeed}>
          {item.reviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              onLayout={(y) => {
                reviewPositions.current[review.id] = y;
                focusReviewIfNeeded();
              }}
              onOpenPhoto={setExpandedPhoto}
            />
          ))}
        </View>
      </ScrollView>

      <PhotoPreview uri={expandedPhoto} onClose={() => setExpandedPhoto(null)} />
      <ContextualFeedback feedback={feedback} bottomInset={Math.max(insets.bottom, 12) + 24} />
    </SafeAreaView>
  );
}

function ReviewItem({
  review,
  onLayout,
  onOpenPhoto
}: {
  review: Review;
  onLayout?: (y: number) => void;
  onOpenPhoto: (uri: string) => void;
}) {
  const wouldHireAgain = getReviewWouldHireAgain(review);
  const reviewerName = getReviewerName(review);
  const reviewContext = getReviewContext(review);

  return (
    <View style={styles.reviewItem} onLayout={(event) => onLayout?.(event.nativeEvent.layout.y)}>
      <View style={styles.reviewTopRow}>
        <View style={styles.reviewerAvatar}>
          <Text style={styles.reviewerAvatarText}>{getReviewerInitial(review)}</Text>
        </View>
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>{reviewerName}</Text>
          <Text style={styles.reviewerLocation}>{getReviewerLocation(review)}</Text>
        </View>
      </View>

      <View style={styles.reviewMetadataRow}>
        <View style={styles.reviewRating}>
          <Star color={colors.star} fill={colors.star} size={12} />
          <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
        </View>
        {reviewContext ? <Text style={styles.reviewContext}>{reviewContext}</Text> : null}
      </View>

      <Text style={styles.reviewComment}>“{review.comment}”</Text>

      <View style={styles.reviewMicroAction}>
        <HireAgainBadge value={wouldHireAgain} />
        <Text style={styles.reviewMicroActionText}>{wouldHireAgain ? 'Contrataria novamente' : 'Não contrataria novamente'}</Text>
      </View>

      {review.photos?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
          {review.photos.map((uri) => (
            <Pressable key={uri} onPress={() => onOpenPhoto(uri)} style={styles.photoThumbWrap}>
              <Image source={{ uri }} style={styles.photoThumb} />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

function TrustIndicator({
  metric,
  reference,
  onShowFeedback
}: {
  metric: ReturnType<typeof getHireAgainMetric>;
  reference: RefObject<View | null>;
  onShowFeedback: (message: string, anchor: ContextualFeedbackState['anchor'], placement?: FeedbackPlacement) => void;
}) {
  if (!metric.total) return null;
  const message = formatTrustMessage(metric.yes, metric.total);

  return (
    <Pressable
      ref={reference}
      accessibilityRole="button"
      accessibilityLabel={message}
      onPress={() => showAnchoredFeedback(reference, message, onShowFeedback)}
      style={({ pressed }) => [styles.trustInline, pressed && styles.trustInlinePressed]}
    >
      <Text style={styles.metaDivider}>•</Text>
      <Text style={styles.trustInlinePercent}>{metric.percentage}%</Text>
      <Text style={styles.trustInlineLabel}>Contrataria novamente</Text>
    </Pressable>
  );
}

function HireAgainBadge({ value }: { value?: boolean }) {
  if (typeof value !== 'boolean') return null;
  const Icon = value ? ThumbsUp : ThumbsDown;
  const iconColor = value ? colors.primary : colors.error;

  return (
    <View style={[styles.hireAgainBadge, value ? styles.hireAgainBadgePositive : styles.hireAgainBadgeNegative]}>
      <Icon color={iconColor} size={13} strokeWidth={2.4} />
    </View>
  );
}

function PhotoPreview({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  return (
    <Modal visible={Boolean(uri)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.photoPreviewBackdrop} onPress={onClose}>
        {uri ? <Image source={{ uri }} style={styles.photoPreview} resizeMode="contain" /> : null}
      </Pressable>
    </Modal>
  );
}

function getHireAgainMetric(reviews: Review[]) {
  const total = reviews.length;
  if (!total) return { percentage: 100, yes: 0, total };
  const yes = reviews.filter((review) => getReviewWouldHireAgain(review)).length;
  return { percentage: Math.round((yes / total) * 100), yes, total };
}

function getReviewWouldHireAgain(review: Review) {
  if (typeof review.wouldHireAgain === 'boolean') return review.wouldHireAgain;
  return review.rating >= 4.5;
}

function getServiceName(item: Recommendation) {
  return item.customServiceDescription || item.serviceSpecialtyName || item.categoryName;
}


function getReviewerInitial(review: Review) {
  const name = getReviewerName(review);
  return name.trim().slice(0, 1).toUpperCase();
}

function getReviewContext(review: Review) {
  if (review.servicePerformed) return review.servicePerformed;
  return '';
}

function getReviewerName(review: Review) {
  const [fallbackName, fallbackUnit] = review.residentName.split(',').map((part) => part.trim());
  return review.reviewerName || fallbackName;
}

function getReviewerLocation(review: Review) {
  const [, fallbackUnit] = review.residentName.split(',').map((part) => part.trim());
  const block = normalizeResidenceToken(review.reviewerBlock || fallbackUnit, 'Qd');
  const lot = normalizeResidenceToken(review.reviewerLot, 'Lt');
  return [block, lot].filter(Boolean).join(' ');
}

function formatAverageMessage(count: number) {
  return count === 1 ? 'Baseado em 1 avaliação' : `Baseado em ${count} avaliações`;
}

function formatTrustMessage(yes: number, total: number) {
  const suffix = total === 1 ? 'morador contrataria' : 'moradores contratariam';
  return `${yes} de ${total} ${suffix} novamente`;
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

function normalizeResidenceToken(value: string | undefined, label: 'Qd' | 'Lt') {
  if (!value) return '';
  const clean = value
    .replace(/^quadra\s*/i, '')
    .replace(/^qd\.?\s*/i, '')
    .replace(/^bloco\s*/i, '')
    .replace(/^casa\s*/i, '')
    .replace(/^lote\s*/i, '')
    .replace(/^lt\.?\s*/i, '')
    .trim();

  return clean ? `${label} ${clean}` : '';
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: 14
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#DDE9E4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1
  },
  hero: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E7ECE9',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 7,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2
  },
  providerName: {
    color: colors.text,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  providerSpecialty: {
    color: colors.primary,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 3
  },
  ratingMeta: {
    alignSelf: 'flex-start',
    minHeight: 25,
    borderRadius: 999,
    backgroundColor: '#FFF7E8',
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  ratingText: {
    color: colors.text,
    fontSize: typography.tiny,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  ratingCount: {
    color: colors.secondaryText,
    fontSize: typography.tiny,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  trustInline: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 24,
    paddingVertical: 3
  },
  trustInlinePressed: {
    opacity: 0.72
  },
  metaDivider: {
    color: '#C0AE7B',
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  trustInlinePercent: {
    color: '#3F6F61',
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 0,
    fontFamily: typography.fontFamily
  },
  trustInlineLabel: {
    color: '#6B8179',
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '500',
    fontFamily: typography.fontFamily
  },
  ctaGroup: {
    gap: 9
  },
  whatsappButton: {
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: '#2E9F6E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1F6F5B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3
  },
  whatsappText: {
    color: colors.surface,
    fontSize: typography.body,
    lineHeight: 20,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  secondaryAction: {
    alignSelf: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CFE1D8',
    backgroundColor: 'rgba(255,255,255,0.58)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryActionText: {
    color: colors.primary,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  reviewSectionHeader: {
    gap: 3,
    marginTop: spacing.xs
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  sectionSubtitle: {
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 18,
    fontFamily: typography.fontFamily
  },
  reviewFeed: {
    gap: 9
  },
  reviewItem: {
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1,
    borderColor: '#E4EBE7',
    paddingHorizontal: 11,
    paddingVertical: 12,
    gap: 9
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  reviewerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#EEF6F2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  reviewerAvatarText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  reviewerInfo: {
    flex: 1,
    gap: 2
  },
  reviewerName: {
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  reviewContext: {
    color: colors.secondaryText,
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '500',
    fontFamily: typography.fontFamily
  },
  reviewerLocation: {
    color: colors.secondaryText,
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '500',
    fontFamily: typography.fontFamily
  },
  reviewMetadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 0,
    minHeight: 24
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
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    backgroundColor: '#FFF7E8',
    paddingHorizontal: 6,
    paddingVertical: 3
  },
  reviewRatingText: {
    color: colors.text,
    fontSize: typography.tiny,
    lineHeight: 14,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  reviewComment: {
    color: '#33443F',
    fontSize: 14.5,
    lineHeight: 22,
    paddingTop: 1,
    fontFamily: typography.fontFamily
  },
  reviewMicroAction: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 25,
    marginTop: 1
  },
  reviewMicroActionText: {
    color: '#6B8179',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    fontFamily: typography.fontFamily
  },
  photoStrip: {
    gap: 8,
    paddingRight: spacing.md
  },
  photoThumbWrap: {
    width: 76,
    height: 76,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.muted
  },
  photoThumb: {
    width: 76,
    height: 76,
    borderRadius: 16
  },
  photoPreviewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 18, 15, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg
  },
  photoPreview: {
    width: '100%',
    height: '78%',
    borderRadius: 20
  },
  emptyState: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  }
});

