import { useFocusEffect } from '@react-navigation/native';
import { ArrowUpRight, MessageCircle, Search, Star } from 'lucide-react-native';
import { RefObject, useCallback, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingAddButton } from '../components/FloatingAddButton';
import { ContextualFeedback, ContextualFeedbackState, FeedbackPlacement } from '../components/ContextualFeedback';
import { SkeletonBlock, SkeletonCircle, SkeletonPill } from '../components/Skeleton';
import { getServiceSpecialtyById, serviceSpecialtiesForPicker } from '../constants/categories';
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
  getAdditionalServiceCount,
  getLatestActivityDate,
  getServiceName,
  normalize,
  sortProvidersForDirectory
} from '../utils/recommendations';

export function ProvidersScreen({ navigation }: any) {
  const { user } = useApp();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | undefined>();
  const [serviceSearch, setServiceSearch] = useState('');
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [feedback, setFeedback] = useState<ContextualFeedbackState | null>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;
      setLoading(true);
      getRecommendations(user.condominiumId)
        .then((data) => {
          if (!active) return;
          setItems(data);
          setHasLoadedOnce(true);
        })
        .finally(() => {
          if (!active) return;
          setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [user])
  );

  const selectedSpecialty = getServiceSpecialtyById(selectedSpecialtyId);
  const filteredProviders = [...items]
    .filter((item) => (selectedSpecialtyId ? item.serviceSpecialtyId === selectedSpecialtyId : true))
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
          <Text style={styles.heroText}>Busque por profissão e compare os prestadores mais bem avaliados da comunidade.</Text>
        </View>

        <View style={styles.searchPanel}>
          <View style={styles.specialtyFilter}>
            <Text style={styles.specialtyLabel}>Qual profissão você procura?</Text>
            <Pressable
              style={[styles.specialtySelector, selectedSpecialty && styles.specialtySelectorSelected]}
              onPress={() => {
                setServiceSearch(selectedSpecialty?.name ?? '');
                setShowAllServices(false);
                setServicePickerOpen(true);
              }}
            >
              <Search color={selectedSpecialty ? colors.primary : colors.secondaryText} size={18} />
              <Text style={[styles.specialtySelectorText, selectedSpecialty && styles.specialtySelectorTextSelected]}>
                {selectedSpecialty?.name ?? 'Buscar profissão'}
              </Text>
            </Pressable>
            <View style={styles.chipRow}>
              <Pressable style={[styles.chip, !selectedSpecialtyId && styles.chipSelected]} onPress={() => setSelectedSpecialtyId(undefined)}>
                <Text style={[styles.chipText, !selectedSpecialtyId && styles.chipTextSelected]}>Todas</Text>
              </Pressable>
              {selectedSpecialtyId ? (
                <Pressable style={[styles.chip, styles.chipSelected]} onPress={() => setSelectedSpecialtyId(undefined)}>
                  <Text style={[styles.chipText, styles.chipTextSelected]}>{selectedSpecialty?.name}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prestadores recomendados</Text>
          <Text style={styles.sectionSubtitle}>{filteredProviders.length} resultado{filteredProviders.length === 1 ? '' : 's'}</Text>
        </View>

        {loading && !hasLoadedOnce ? (
          <ProvidersListSkeleton />
        ) : filteredProviders.length ? (
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
            <Text style={styles.emptyText}>Tente limpar a busca ou trocar o filtro de profissão para ver mais opções.</Text>
          </View>
        )}
      </ScrollView>

      <ServiceSpecialtyPicker
        visible={servicePickerOpen}
        query={serviceSearch}
        selectedId={selectedSpecialtyId}
        expanded={showAllServices}
        onChangeQuery={setServiceSearch}
        onClose={() => {
          setServiceSearch('');
          setServicePickerOpen(false);
          setShowAllServices(false);
        }}
        onToggleExpanded={() => setShowAllServices((value) => !value)}
        onSelect={(id) => {
          setSelectedSpecialtyId(id === 'outros' ? undefined : id);
          setServiceSearch(getServiceSpecialtyById(id)?.name ?? '');
          setServicePickerOpen(false);
          setShowAllServices(false);
        }}
      />
      <FloatingAddButton insets={insets} onPress={() => navigation.navigate('AddRecommendation', { providerId: undefined })} />
      <ContextualFeedback feedback={feedback} bottomInset={Math.max(insets.bottom, 12) + 82} />
    </SafeAreaView>
  );
}

function ProvidersListSkeleton() {
  return (
    <>
      {[0, 1, 2].map((entry) => (
        <View key={entry} style={styles.card}>
          <View style={styles.cardAccent} />
          <View style={styles.cardHeader}>
            <SkeletonCircle size={48} />
            <View style={styles.skeletonCardTitleWrap}>
              <SkeletonBlock width="64%" height={18} />
              <SkeletonPill width={112} height={24} />
            </View>
          </View>

          <View style={styles.infoPanel}>
            <View style={styles.metricLine}>
              <SkeletonPill width={118} />
            </View>
            <SkeletonBlock width="62%" height={14} />
            <SkeletonBlock width="48%" height={14} />
          </View>

          <View style={styles.actions}>
            <SkeletonBlock width="76%" height={38} radius={12} />
            <SkeletonBlock width={48} height={38} radius={12} />
          </View>
        </View>
      ))}
    </>
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
  const reviewsLabel = totalReviews === 1 ? '1 avaliação' : `${totalReviews} avaliações`;
  const additionalServiceCount = getAdditionalServiceCount(item);
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
            <Text style={styles.professionBadgeText} numberOfLines={1}>{getServiceName(item)}</Text>
            {additionalServiceCount ? <Text style={styles.professionBadgeCount}>+{additionalServiceCount}</Text> : null}
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
              <Text style={styles.metricSeparator}>-</Text>
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
          <Text style={styles.emptyMetricText}>Ainda sem avaliações</Text>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onOpenDetails} style={styles.detailButton}>
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

function ServiceSpecialtyPicker({
  visible,
  query,
  selectedId,
  expanded,
  onChangeQuery,
  onClose,
  onToggleExpanded,
  onSelect
}: {
  visible: boolean;
  query: string;
  selectedId?: string;
  expanded: boolean;
  onChangeQuery: (value: string) => void;
  onClose: () => void;
  onToggleExpanded: () => void;
  onSelect: (id: string) => void;
}) {
  const normalized = normalize(query);
  const allServices = getServiceSuggestions(query);
  const visibleServices = normalized ? allServices : expanded ? allServices : allServices.filter((item) => item.id !== 'outros').slice(0, 8);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <Pressable style={styles.modalScrim} onPress={onClose} />
        <SafeAreaView style={[styles.sheet, normalized || expanded ? styles.sheetExpanded : null]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Escolha a profissão</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.sheetClose}>Fechar</Text>
            </Pressable>
          </View>
          <View style={[styles.sheetSearch, normalized ? styles.sheetSearchActive : null]}>
            <Search color={colors.secondaryText} size={18} />
            <TextInput
              value={query}
              onChangeText={onChangeQuery}
              placeholder="Busque por eletricista, faxina, pet..."
              placeholderTextColor={colors.secondaryText}
              style={styles.serviceSearchInput}
              autoFocus
              blurOnSubmit
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
            <View style={styles.fullListHeader}>
              <Text style={styles.sheetSectionTitle}>{normalized ? 'Resultados' : 'Todas as profissões'}</Text>
              {!normalized ? (
                <Pressable onPress={onToggleExpanded}>
                  <Text style={styles.expandText}>{expanded ? 'Ver menos' : 'Ver todas'}</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.suggestionList}>
              {visibleServices.map((specialty) => {
                const selected = selectedId === specialty.id;
                return (
                  <Pressable
                    key={specialty.id}
                    style={({ pressed }) => [styles.suggestionItem, selected && styles.suggestionItemSelected, pressed && styles.suggestionPressed]}
                    onPress={() => onSelect(specialty.id)}
                  >
                    <Text style={[styles.suggestionName, selected && styles.suggestionNameSelected]}>{specialty.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function getServiceSuggestions(query: string) {
  const normalized = normalize(query);
  return serviceSpecialtiesForPicker
    .filter((specialty) => specialty.id !== 'outros')
    .filter((specialty) => {
      if (!normalized) return true;
      return [specialty.name, ...specialty.aliases].some((value) => normalize(value).includes(normalized));
    })
    .slice(0, normalized ? 12 : 80);
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
  specialtyFilter: {
    gap: 8
  },
  specialtyLabel: {
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  specialtySelector: {
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#DDE9E4',
    backgroundColor: '#FBFCFB',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  specialtySelectorSelected: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primary
  },
  specialtySelectorText: {
    flex: 1,
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  },
  specialtySelectorTextSelected: {
    color: colors.primary,
    fontWeight: '800'
  },
  chipRow: {
    gap: 8,
    flexDirection: 'row',
    flexWrap: 'wrap'
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
  skeletonCardTitleWrap: {
    flex: 1,
    gap: 10,
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
    flexDirection: 'row',
    gap: 6,
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
  professionBadgeCount: { color: colors.secondaryText, fontSize: typography.tiny, fontWeight: '900', fontFamily: typography.fontFamily },
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
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 31, 27, 0.28)'
  },
  sheet: {
    maxHeight: '68%',
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
  sheetExpanded: {
    maxHeight: '82%'
  },
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
  sheetTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  sheetClose: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
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
  sheetSearchActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface
  },
  serviceSearchInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  },
  sheetContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl
  },
  fullListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs
  },
  sheetSectionTitle: {
    color: colors.secondaryText,
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  expandText: {
    color: colors.primary,
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
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
  suggestionItemSelected: {
    backgroundColor: colors.lightGreen
  },
  suggestionPressed: {
    backgroundColor: '#F3F8F5'
  },
  suggestionName: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '500',
    fontFamily: typography.fontFamily
  },
  suggestionNameSelected: {
    color: colors.primary,
    fontWeight: '800'
  }
});
