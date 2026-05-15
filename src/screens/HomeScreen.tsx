import { useFocusEffect, useRoute } from '@react-navigation/native';
import { ArrowUpRight, MessageCircle, Plus, Search, Star, ThumbsDown, ThumbsUp } from 'lucide-react-native';
import { RefObject, useCallback, useRef, useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminSummaryCard } from '../components/AdminSummaryCard';
import { ContextualFeedback, ContextualFeedbackState, FeedbackPlacement } from '../components/ContextualFeedback';
import { getServiceSpecialtyById, popularServiceSpecialties, serviceSpecialtiesForPicker } from '../constants/categories';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { isAdmin } from '../navigation/guards';
import { useApp } from '../services/AppContext';
import { getAccessRequests, getRecommendations, getReportedRecommendations } from '../services/mockApi';
import { openWhatsApp } from '../services/whatsapp';
import { Recommendation, ServiceSpecialty } from '../types';

export function HomeScreen({ navigation }: any) {
  const { user } = useApp();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const pendingFocusId = useRef<string | undefined>(undefined);
  const recommendationPositions = useRef<Record<string, number>>({});
  const [items, setItems] = useState<Recommendation[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [feedback, setFeedback] = useState<ContextualFeedbackState | null>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      pendingFocusId.current = route.params?.focusRecommendationId;
      getRecommendations(user.condominiumId).then(setItems);
      if (isAdmin(user)) {
        getAccessRequests(user.condominiumId).then((data) => setPendingCount(data.length));
        getReportedRecommendations(user.condominiumId).then((data) => setReportCount(data.length));
      }
    }, [route.params?.focusRecommendationId, user])
  );

  const bestRated = [...items].sort(sortByBestRated).slice(0, 3);
  const recent = [...items].sort((a, b) => getLatestActivityDate(b).localeCompare(getLatestActivityDate(a))).slice(0, 3);
  const popularSpecialties = getPopularHomeServices();
  const firstName = user?.name.split(' ')[0] ?? 'vizinho';

  function focusRecommendationIfNeeded() {
    const id = pendingFocusId.current;
    if (!id) return;
    const y = recommendationPositions.current[id];
    if (typeof y !== 'number') return;
    pendingFocusId.current = undefined;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(y - 18, 0), animated: true });
      navigation.setParams?.({ focusRecommendationId: undefined });
    }, 180);
  }

  function openProvider(item: Recommendation) {
    setSearchQuery(item.supplierName);
    setSearchOpen(false);
    navigation.getParent()?.navigate('RecommendationDetail', { id: item.id });
  }

  function openService(service: ServiceSpecialty) {
    setSearchQuery(service.name);
    setSearchOpen(true);
  }

  function submitSearch() {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    setSearchQuery(trimmedQuery);
  }

  function showFeedback(message: string, anchor: ContextualFeedbackState['anchor'], placement?: FeedbackPlacement) {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    setFeedback({ id: Date.now(), message, anchor, placement });
    feedbackTimeout.current = setTimeout(() => setFeedback(null), 1950);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <Text style={styles.greeting}>Olá, {firstName}</Text>
          <Text style={styles.condominiumName}>{user?.condominiumName}</Text>
          <Text style={styles.heroText}>Indicações reais de vizinhos do seu condomínio.</Text>
        </View>

        <View style={styles.discoveryPanel}>
          <Pressable style={styles.searchBar} onPress={() => setSearchOpen(true)}>
            <Search color={colors.darkGreen} size={19} />
            <Text style={styles.placeholder}>Buscar eletricista, diarista, piscineiro...</Text>
          </Pressable>

          <Text style={styles.discoveryLabel}>Profissões mais procuradas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {popularSpecialties.map((specialty) => (
              <Pressable key={specialty.id} style={styles.categoryPill} onPress={() => openService(specialty)}>
                <Text style={styles.categoryPillText}>{specialty.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {isAdmin(user) ? (
          <AdminSummaryCard
            title="Painel do condomínio"
            value={`${pendingCount} solicitações pendentes · ${reportCount} denúncias abertas`}
            buttonTitle="Abrir painel"
            onPress={() => navigation.getParent()?.navigate('AdminDashboard')}
          />
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Melhores Avaliados</Text>
        </View>
        {bestRated.map((item) => (
          <HomeRecommendationCard
            key={item.id}
            item={item}
            onShowFeedback={showFeedback}
            onDetails={() => navigation.getParent()?.navigate('RecommendationDetail', { id: item.id })}
            onWhatsApp={() => openWhatsApp(item.whatsapp)}
          />
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimas Avaliações</Text>
        </View>
        {recent.map((item) => (
          <HomeRecommendationCard
            key={item.id}
            item={item}
            onLayout={(y) => {
              recommendationPositions.current[item.id] = y;
              focusRecommendationIfNeeded();
            }}
            onShowFeedback={showFeedback}
            onDetails={() => navigation.getParent()?.navigate('RecommendationDetail', { id: item.id })}
            onWhatsApp={() => openWhatsApp(item.whatsapp)}
          />
        ))}
      </ScrollView>

      <Pressable
        accessibilityLabel="Indicar serviço"
        accessibilityRole="button"
        onPress={() => navigation.navigate('AddRecommendation', { providerId: undefined })}
        style={[styles.fab, { bottom: Math.max(insets.bottom, 12) + 16 }]}
      >
        <Plus color={colors.surface} size={25} strokeWidth={2.8} />
        <Text style={styles.fabText}>Indicar</Text>
      </Pressable>

      <HomeSearchSheet
        visible={searchOpen}
        query={searchQuery}
        items={items}
        expanded={showAllServices}
        onChangeQuery={setSearchQuery}
        onClose={() => {
          setSearchOpen(false);
          setShowAllServices(false);
        }}
        onToggleExpanded={() => setShowAllServices((value) => !value)}
        onOpenProvider={openProvider}
        onOpenService={openService}
        onSubmitSearch={submitSearch}
      />
      <ContextualFeedback feedback={feedback} bottomInset={Math.max(insets.bottom, 12) + 82} />
    </SafeAreaView>
  );
}

function HomeSearchSheet({
  visible,
  query,
  items,
  expanded,
  onChangeQuery,
  onClose,
  onToggleExpanded,
  onOpenProvider,
  onOpenService,
  onSubmitSearch
}: {
  visible: boolean;
  query: string;
  items: Recommendation[];
  expanded: boolean;
  onChangeQuery: (value: string) => void;
  onClose: () => void;
  onToggleExpanded: () => void;
  onOpenProvider: (item: Recommendation) => void;
  onOpenService: (service: ServiceSpecialty) => void;
  onSubmitSearch: () => void;
}) {
  const normalized = normalize(query);
  const popular = getPopularHomeServices();
  const providerResults = getProviderSuggestions(items, query);
  const serviceResults = getServiceSuggestions(query);
  const visibleServices = normalized ? serviceResults : expanded ? serviceResults : serviceResults.filter((item) => item.id !== 'outros').slice(0, 5);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalScrim} onPress={onClose} />
        <SafeAreaView style={[styles.sheet, normalized || expanded ? styles.sheetExpanded : null]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Buscar na comunidade</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.sheetClose}>Fechar</Text>
            </Pressable>
          </View>

          <View style={[styles.sheetSearch, normalized ? styles.sheetSearchActive : null]}>
            <Search color={colors.secondaryText} size={18} />
            <TextInput
              value={query}
              onChangeText={onChangeQuery}
              onSubmitEditing={() => {
                onSubmitSearch();
                Keyboard.dismiss();
              }}
              placeholder="Busque por eletricista, faxina, pet..."
              placeholderTextColor={colors.secondaryText}
              returnKeyType="search"
              blurOnSubmit
              style={styles.serviceSearchInput}
              autoFocus
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
            {!normalized ? (
              <>
                <Text style={styles.sheetSectionTitle}>Mais procurados</Text>
                <View style={styles.sheetChipWrap}>
                  {popular.map((specialty) => (
                    <Pressable key={specialty.id} style={styles.popularChip} onPress={() => onOpenService(specialty)}>
                      <Text style={styles.popularChipText}>{specialty.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            {normalized && providerResults.length ? (
              <>
                <Text style={styles.sheetSectionTitle}>Prestadores</Text>
                <View style={styles.suggestionList}>
                  {providerResults.map((item) => (
                    <Pressable key={item.id} style={({ pressed }) => [styles.providerSuggestion, pressed && styles.suggestionPressed]} onPress={() => onOpenProvider(item)}>
                      <View style={styles.providerSuggestionTextWrap}>
                        <Text style={styles.providerSuggestionName}>{item.supplierName}</Text>
                        <Text style={styles.providerSuggestionMeta}>{getRecommendationServiceName(item)}</Text>
                      </View>
                      <View style={styles.providerSuggestionRating}>
                        <Star color={colors.star} fill={colors.star} size={13} />
                        <Text style={styles.providerSuggestionRatingText}>{item.averageRating.toFixed(1)}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            <View style={styles.fullListHeader}>
              <Text style={styles.sheetSectionTitle}>{normalized ? 'Serviços' : 'Todos os serviços'}</Text>
              {!normalized ? (
                <Pressable onPress={onToggleExpanded}>
                  <Text style={styles.expandText}>{expanded ? 'Ver menos' : 'Ver todos'}</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.suggestionList}>
              {visibleServices.map((specialty) => (
                <Pressable key={specialty.id} style={({ pressed }) => [styles.suggestionItem, pressed && styles.suggestionPressed]} onPress={() => onOpenService(specialty)}>
                  <Text style={styles.suggestionName}>{specialty.name}</Text>
                </Pressable>
              ))}
              {normalized && !providerResults.length && !visibleServices.length ? (
                <Pressable style={styles.suggestionItem} onPress={onSubmitSearch}>
                  <Text style={styles.suggestionName}>Buscar por “{query.trim()}”</Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function HomeRecommendationCard({
  item,
  onLayout,
  onShowFeedback,
  onDetails,
  onWhatsApp
}: {
  item: Recommendation;
  onLayout?: (y: number) => void;
  onShowFeedback: (message: string, anchor: ContextualFeedbackState['anchor'], placement?: FeedbackPlacement) => void;
  onDetails: () => void;
  onWhatsApp: () => void;
}) {
  const ratingRef = useRef<View>(null);
  const trustRef = useRef<View>(null);
  const initials = item.supplierName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const reviewPreview = getReviewPreview(item);
  const hireAgain = getHireAgainMetric(item.reviews);
  const hasTrustMetric = hireAgain.total >= 3;

  return (
    <View style={styles.card} onLayout={(event) => onLayout?.(event.nativeEvent.layout.y)}>
      <View style={styles.cardAccent} />
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{item.supplierName}</Text>
          <Text style={styles.cardCategory}>{getRecommendationServiceName(item)}</Text>
        </View>
      </View>

      <View style={[styles.providerMetaRow, !hasTrustMetric && styles.providerMetaRowCompact]}>
        <Pressable
          ref={ratingRef}
          accessibilityRole="button"
          accessibilityLabel={formatAverageMessage(item.reviews.length)}
          onPress={() => showAnchoredFeedback(ratingRef, formatAverageMessage(item.reviews.length), onShowFeedback)}
          style={styles.ratingMeta}
        >
          <Star color={colors.star} fill={colors.star} size={15} />
          <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
          <Text style={styles.ratingCount}>({item.reviews.length})</Text>
        </Pressable>
        <TrustIndicator metric={hireAgain} reference={trustRef} onShowFeedback={onShowFeedback} />
      </View>

      <Text style={styles.comment}>“{reviewPreview.comment}”</Text>
      <View style={styles.reviewMetaRow}>
        <Text style={styles.reviewMeta}>{reviewPreview.authorMeta}</Text>
        <HireAgainBadge reviewerName={reviewPreview.authorName} value={reviewPreview.wouldHireAgain} onShowFeedback={onShowFeedback} />
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={onDetails} style={styles.detailButton}>
            <Text style={styles.detailText}>Ver recomendações</Text>
            <ArrowUpRight color={colors.darkGreen} size={17} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onWhatsApp} style={styles.whatsButton}>
            <MessageCircle color={colors.surface} size={20} />
          </Pressable>
        </View>
      </View>
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
  const shouldShow = metric.total >= 3;
  const message = formatTrustMessage(metric.yes, metric.total);

  if (!shouldShow) {
    return null;
  }

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
      <Text style={styles.trustInlineLabel}>contratariam novamente</Text>
    </Pressable>
  );
}

function HireAgainBadge({
  reviewerName,
  value,
  onShowFeedback
}: {
  reviewerName: string;
  value?: boolean;
  onShowFeedback: (message: string, anchor: ContextualFeedbackState['anchor'], placement?: FeedbackPlacement) => void;
}) {
  const badgeRef = useRef<View>(null);
  if (typeof value !== 'boolean') return null;
  const Icon = value ? ThumbsUp : ThumbsDown;
  const iconColor = value ? colors.primary : colors.error;
  const message = value ? `${reviewerName} contrataria novamente` : `${reviewerName} não contrataria novamente`;

  return (
    <Pressable
      ref={badgeRef}
      accessibilityRole="button"
      accessibilityLabel={message}
      onPress={() => showAnchoredFeedback(badgeRef, message, onShowFeedback)}
      style={[styles.hireAgainBadge, value ? styles.hireAgainBadgePositive : styles.hireAgainBadgeNegative]}
    >
      <Icon color={iconColor} size={13} strokeWidth={2.4} />
    </Pressable>
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

function formatAverageMessage(count: number) {
  return count === 1 ? 'Média de 1 avaliação' : `Média de ${count} avaliações`;
}

function formatTrustMessage(yes: number, total: number) {
  const suffix = total === 1 ? 'morador contrataria' : 'moradores contratariam';
  return `${yes} de ${total} ${suffix} novamente`;
}

function getRecommendationServiceName(item: Recommendation) {
  return item.customServiceDescription || item.serviceSpecialtyName || item.categoryName;
}

function getHireAgainMetric(reviews: Recommendation['reviews']) {
  const total = reviews.length;
  if (!total) return { percentage: 100, yes: 0, total };
  const yes = reviews.filter((review) => getReviewWouldHireAgain(review)).length;
  return { percentage: Math.round((yes / total) * 100), yes, total };
}

function sortByBestRated(a: Recommendation, b: Recommendation) {
  if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
  return b.recommendedByCount - a.recommendedByCount;
}

function getProviderSuggestions(items: Recommendation[], query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];
  const seenProviders = new Set<string>();

  return items
    .filter((item) => {
      const service = getRecommendationServiceName(item);
      const searchable = normalize(`${item.supplierName} ${service}`);
      const normalizedProviderName = normalize(item.supplierName);
      if (!searchable.includes(normalizedQuery) || seenProviders.has(normalizedProviderName)) return false;
      seenProviders.add(normalizedProviderName);
      return true;
    })
    .sort((a, b) => {
      const aStarts = normalize(a.supplierName).startsWith(normalizedQuery) ? 0 : 1;
      const bStarts = normalize(b.supplierName).startsWith(normalizedQuery) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return b.recommendedByCount - a.recommendedByCount;
    })
    .slice(0, 5);
}

function getServiceSuggestions(query: string) {
  const normalized = normalize(query);
  const outros = serviceSpecialtiesForPicker.find((specialty) => specialty.id === 'outros');
  const matches = serviceSpecialtiesForPicker
    .filter((specialty) => specialty.id !== 'outros')
    .filter((specialty) => {
      if (!normalized) return true;
      return [specialty.name, ...specialty.aliases].some((value) => normalize(value).includes(normalized));
    })
    .slice(0, normalized ? 12 : 80);

  return outros ? [...matches, outros] : matches;
}

function getPopularHomeServices() {
  const ids = ['eletricista', 'diarista', 'jardineiro', 'piscineiro', 'marido_de_aluguel', 'encanador'];
  const fixedServices = ids.map((id) => getServiceSpecialtyById(id)).filter(Boolean) as ServiceSpecialty[];
  return fixedServices.length ? fixedServices : popularServiceSpecialties.slice(0, 6);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getLatestActivityDate(item: Recommendation) {
  const latestReviewDate = item.reviews
    .map((review) => review.uploadedAt || review.createdAt)
    .sort((a, b) => b.localeCompare(a))[0];

  return latestReviewDate || item.uploadedAt || item.createdAt;
}

function getReviewPreview(item: Recommendation) {
  const review = [...item.reviews]
    .filter((entry) => entry.comment.trim().length > 0)
    .sort((a, b) => (b.uploadedAt || b.createdAt).localeCompare(a.uploadedAt || a.createdAt))[0];

  if (!review) {
    return {
      comment: item.shortComment || 'Recomendação registrada por moradores do condomínio.',
      authorName: 'Moradores do condomínio',
      authorMeta: 'Moradores do condomínio',
      wouldHireAgain: typeof item.wouldHireAgain === 'boolean' ? item.wouldHireAgain : item.averageRating >= 4.5
    };
  }

  return {
    comment: review.comment,
    authorName: getResidentDisplayName(review),
    authorMeta: formatResidentMeta(review),
    wouldHireAgain: getReviewWouldHireAgain(review)
  };
}

function getReviewWouldHireAgain(review: Recommendation['reviews'][number]) {
  if (typeof review.wouldHireAgain === 'boolean') return review.wouldHireAgain;
  return review.rating >= 4.5;
}

function formatResidentMeta(review: Recommendation['reviews'][number]) {
  const [, fallbackUnit] = review.residentName.split(',').map((part) => part.trim());
  const name = getResidentDisplayName(review);
  const block = normalizeResidenceToken(review.reviewerBlock || fallbackUnit, 'Qd');
  const lot = normalizeResidenceToken(review.reviewerLot, 'Lt');
  const residence = [block, lot].filter(Boolean).join(' ');

  return residence ? `${name} - ${residence}` : name;
}

function getResidentDisplayName(review: Recommendation['reviews'][number]) {
  const [fallbackName] = review.residentName.split(',').map((part) => part.trim());
  return review.reviewerName || fallbackName || 'Morador';
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
    gap: 11,
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
  discoveryPanel: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2ECE7',
    padding: spacing.sm,
    gap: 9,
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
  placeholder: {
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 20,
    flex: 1,
    fontFamily: typography.fontFamily
  },
  categoryList: {
    gap: 8,
    paddingRight: spacing.md,
    paddingVertical: 1
  },
  discoveryLabel: {
    color: colors.secondaryText,
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  categoryPill: {
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE9E4',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  categoryPillText: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily: typography.fontFamily
  },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 31, 27, 0.28)'
  },
  sheet: {
    maxHeight: '72%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 10
  },
  sheetExpanded: { maxHeight: '84%' },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#D8E3DE',
    marginBottom: spacing.md
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  sheetTitle: { color: colors.text, fontSize: 20, lineHeight: 25, fontWeight: '900', fontFamily: typography.fontFamily },
  sheetClose: { color: colors.primary, fontSize: typography.small, fontWeight: '800', fontFamily: typography.fontFamily },
  sheetSearch: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE9E4',
    backgroundColor: '#FBFCFB',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  sheetSearchActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  serviceSearchInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  },
  sheetContent: { gap: spacing.sm, paddingBottom: spacing.xl },
  sheetSectionTitle: { color: colors.secondaryText, fontSize: typography.tiny, lineHeight: 15, fontWeight: '800', fontFamily: typography.fontFamily },
  sheetChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 2 },
  popularChip: {
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DDE9E4',
    backgroundColor: '#FBFCFB',
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  popularChipText: { color: colors.text, fontSize: typography.small, fontWeight: '600', fontFamily: typography.fontFamily },
  fullListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs
  },
  expandText: { color: colors.primary, fontSize: typography.tiny, lineHeight: 15, fontWeight: '800', fontFamily: typography.fontFamily },
  suggestionList: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5ECE8',
    backgroundColor: '#FCFDFC',
    overflow: 'hidden'
  },
  suggestionItem: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  suggestionPressed: { backgroundColor: '#F3F8F5' },
  suggestionName: { color: colors.text, fontSize: typography.small, fontWeight: '500', fontFamily: typography.fontFamily },
  providerSuggestion: {
    minHeight: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  providerSuggestionTextWrap: {
    flex: 1,
    gap: 2
  },
  providerSuggestionName: {
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  providerSuggestionMeta: {
    color: colors.secondaryText,
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '600',
    fontFamily: typography.fontFamily
  },
  providerSuggestionRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    backgroundColor: '#FFF7E8',
    paddingHorizontal: 7,
    paddingVertical: 4
  },
  providerSuggestionRatingText: {
    color: colors.text,
    fontSize: typography.tiny,
    lineHeight: 14,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  sectionHeader: {
    gap: 2,
    marginTop: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
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
    alignItems: 'center',
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
  providerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 1,
    marginBottom: 4
  },
  providerMetaRowCompact: {
    marginBottom: 2
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
  ratingCount: {
    color: colors.secondaryText,
    fontSize: typography.tiny,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  comment: {
    color: '#33443F',
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '400',
    fontFamily: typography.fontFamily
  },
  reviewMeta: {
    color: '#7B8B85',
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '400',
    fontFamily: typography.fontFamily
  },
  reviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 7,
    marginTop: -1
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
  cardFooter: {
    gap: spacing.sm,
    marginTop: 3
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
    gap: spacing.xs,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1
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
    justifyContent: 'center',
    shadowColor: '#1F6F5B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2
  },
  trustInline: {
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
  fab: {
    position: 'absolute',
    right: spacing.lg,
    height: 52,
    minWidth: 104,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    shadowColor: colors.darkGreen,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6
  },
  fabText: {
    color: colors.surface,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  }
});


