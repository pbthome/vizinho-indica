import { useFocusEffect } from '@react-navigation/native';
import { Archive, Check, ChevronRight, MessageSquareText, Search, ShieldAlert, Tags, Trash2, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { isAdmin } from '../navigation/guards';
import { countPendingServiceSuggestions } from '../repositories/serviceSuggestionsRepository';
import { useApp } from '../services/AppContext';
import {
  ModerationContentItem,
  ModerationContentType,
  approveAccessRequest,
  archiveFeedback,
  fetchAllAccessRequests,
  fetchPendingAccessRequests,
  getFeedbacks,
  getModerationContent,
  markFeedbackAsRead,
  moderateContent,
  rejectAccessRequest
} from '../services/api';
import { isSupabaseConfigured } from '../services/supabase/config';
import { AccessRequest, Feedback, FeedbackStatus } from '../types';

type Section = 'access' | 'feedbacks' | 'moderation';
type StatusFilter = 'all' | 'pending' | 'novo' | 'comment' | 'photo' | 'review';
type AccessFilter = 'all' | 'pending';

const sectionLabels: Record<Section, string> = {
  access: 'Pedidos',
  feedbacks: 'Feedbacks',
  moderation: 'Moderação'
};

const feedbackStatusLabels: Record<FeedbackStatus, string> = {
  novo: 'Novo',
  lido: 'Lido',
  resolvido: 'Resolvido'
};

const moderationTypeLabels: Record<ModerationContentType, string> = {
  comment: 'Comentário',
  photo: 'Foto',
  review: 'Avaliação'
};

export function ManagementScreen({ navigation }: any) {
  const { user } = useApp();
  const [section, setSection] = useState<Section>('access');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [loadingBySection, setLoadingBySection] = useState<Record<Section, boolean>>({
    access: true,
    feedbacks: true,
    moderation: true
  });
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [moderationItems, setModerationItems] = useState<ModerationContentItem[]>([]);
  const [pendingServiceSuggestions, setPendingServiceSuggestions] = useState(0);
  const [previewPhotoUri, setPreviewPhotoUri] = useState<string | null>(null);
  const [pendingModerationItem, setPendingModerationItem] = useState<ModerationContentItem | null>(null);

  console.log('[ManagementScreen] render snapshot', {
    section,
    filter,
    accessRequestsCount: accessRequests.length,
    accessRequestIds: accessRequests.map((item) => item.id),
    accessRequestStatuses: accessRequests.map((item) => ({ id: item.id, status: item.status }))
  });

  const loadAccessRequests = useCallback(async (accessFilter: AccessFilter): Promise<AccessRequest[]> => {
    if (!user || !isAdmin(user)) return [];

    console.log('[ManagementScreen] fetch access requests', {
      filter: accessFilter,
      source: isSupabaseConfigured() ? 'supabase' : 'mock',
      queryApplied: accessFilter === 'pending' ? "status = 'pending'" : 'all statuses'
    });

    const requests =
      accessFilter === 'pending'
        ? await withTimeout(fetchPendingAccessRequests(user.condominiumId), 'pedidos de acesso pendentes')
        : await withTimeout(fetchAllAccessRequests(user.condominiumId), 'todos os pedidos de acesso');

    console.log('[ManagementScreen] fetch access requests result', {
      filter: accessFilter,
      count: requests.length,
      items: requests.map((item) => ({ id: item.id, status: item.status }))
    });

    return requests;
  }, [user]);

  const load = useCallback(async () => {
    if (!user || !isAdmin(user)) {
      setLoadingBySection({
        access: false,
        feedbacks: false,
        moderation: false
      });
      navigation.navigate('Home');
      return;
    }

    setLoadingBySection({
      access: true,
      feedbacks: true,
      moderation: true
    });
    setLoadWarning(null);

    const warnings: string[] = [];
    const registerWarning = (label: string, reason: unknown) => {
      warnings.push(`${label} (${getLoadErrorMessage(reason)})`);
    };

    console.log('[ManagementScreen] load triggered', {
      reason: 'screen focus / initial load',
      section,
      filter
    });

    await Promise.all([
      loadSection({
        section: 'access',
        request: () => loadAccessRequests(getAccessFilter(filter)),
        onSuccess: (requests) => {
          console.log('[ManagementScreen] load onSuccess access', {
            reason: 'screen focus / initial load',
            count: requests.length,
            items: requests.map((item) => ({ id: item.id, status: item.status }))
          });
          setAccessRequests(requests);
        },
        onError: (reason) => {
          setAccessRequests([]);
          registerWarning('pedidos de acesso', reason);
        },
        setLoadingBySection
      }),
      loadSection({
        section: 'feedbacks',
        request: () => withTimeout(getFeedbacks(user.condominiumId), 'feedbacks'),
        onSuccess: setFeedbacks,
        onError: (reason) => {
          setFeedbacks([]);
          registerWarning('feedbacks', reason);
        },
        setLoadingBySection
      }),
      loadSection({
        section: 'moderation',
        request: () => withTimeout(getModerationContent(user.condominiumId), 'moderacao'),
        onSuccess: setModerationItems,
        onError: (reason) => {
          setModerationItems([]);
          registerWarning('moderacao', reason);
        },
        setLoadingBySection
      }),
      withTimeout(countPendingServiceSuggestions(user.condominiumId), 'sugestões de serviços')
        .then(setPendingServiceSuggestions)
        .catch((reason) => {
          setPendingServiceSuggestions(0);
          registerWarning('sugestões de serviços', reason);
        })
    ]);

    if (warnings.length) {
      setLoadWarning(`Não foi possível carregar: ${warnings.join(', ')}.`);
    }
  }, [filter, loadAccessRequests, navigation, user]);

  useFocusEffect(
    useCallback(() => {
      console.log('[ManagementScreen] useFocusEffect triggered', {
        reason: 'screen focused',
        section,
        filter
      });
      void load();
    }, [filter, load, section])
  );

  useEffect(() => {
    if (!user || !isAdmin(user) || section !== 'access') return;

    console.log('[ManagementScreen] access useEffect triggered', {
      reason: 'filter/section change',
      section,
      filter,
      accessFilter: getAccessFilter(filter)
    });

    void loadSection({
      section: 'access',
      request: () => loadAccessRequests(getAccessFilter(filter)),
      onSuccess: (requests) => {
        console.log('[ManagementScreen] access useEffect onSuccess', {
          reason: 'filter/section change',
          count: requests.length,
          items: requests.map((item) => ({ id: item.id, status: item.status }))
        });
        setAccessRequests(requests);
      },
      onError: (reason) => {
        setAccessRequests([]);
        setLoadWarning(`Não foi possível carregar: pedidos de acesso (${getLoadErrorMessage(reason)}).`);
      },
      setLoadingBySection
    });
  }, [filter, loadAccessRequests, section, user]);

  useEffect(() => {
    if (!actionFeedback) return;

    const timeoutId = setTimeout(() => {
      setActionFeedback(null);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [actionFeedback]);

  useEffect(() => {
    setActionFeedback(null);
  }, [section, filter]);

  const pendingRequests = accessRequests.filter((item) => item.status === 'pending').length;
  const newFeedbacks = feedbacks.filter((item) => item.status === 'novo').length;
  const moderationCount = moderationItems.length;
  const loading = loadingBySection[section];

  const filteredAccessRequests = useMemo<AccessRequest[]>(() => {
    return accessRequests.filter((item) => {
      const matchesQuery = includesQuery([item.name, item.unit, item.phone, item.status], query);
      const matchesFilter = filter === 'pending' ? item.status === 'pending' : true;
      return matchesQuery && matchesFilter;
    });
  }, [accessRequests, filter, query]);

  console.log('[ManagementScreen] filtered access snapshot', {
    filter,
    query,
    filteredAccessRequestsCount: filteredAccessRequests.length,
    filteredAccessRequestIds: filteredAccessRequests.map((item) => item.id),
    filteredAccessRequestStatuses: filteredAccessRequests.map((item) => ({ id: item.id, status: item.status }))
  });

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      const matchesQuery = includesQuery([item.subject, item.message, item.userName, item.status], query);
      const matchesFilter = filter === 'novo' ? item.status === 'novo' : true;
      return matchesQuery && matchesFilter;
    });
  }, [feedbacks, filter, query]);

  const filteredModerationItems = useMemo(() => {
    return moderationItems.filter((item) => {
      const matchesQuery = includesQuery([item.title, item.body, item.author, item.providerName], query);
      const matchesFilter = filter === 'comment' || filter === 'photo' || filter === 'review' ? item.type === filter : true;
      return matchesQuery && matchesFilter;
    });
  }, [filter, moderationItems, query]);

  function selectSection(nextSection: Section) {
    setSection(nextSection);
    setFilter(nextSection === 'access' ? 'pending' : 'all');
    setQuery('');
  }

  async function handleAccessDecision(id: string, action: 'approve' | 'reject') {
    const accessFilter = getAccessFilter(filter);
    const nextStatus = action === 'approve' ? 'approved' : 'rejected';
    const previousRequests = accessRequests;
    console.log('[ManagementScreen] access decision start', {
      filter: accessFilter,
      id,
      action,
      accessRequestsCountBefore: accessRequests.length,
      requestExistsBefore: accessRequests.some((item) => item.id === id),
      accessRequestsBefore: accessRequests.map((item) => ({ id: item.id, status: item.status }))
    });

    setAccessRequests((current) => {
      const next = applyAccessRequestLocalUpdate(current, accessFilter, id, nextStatus);
      console.log('[ManagementScreen] access decision local state update', {
        filter: accessFilter,
        id,
        action,
        currentCount: current.length,
        nextCount: next.length,
        requestExistsInCurrent: current.some((item) => item.id === id),
        requestExistsInNext: next.some((item) => item.id === id),
        nextItems: next.map((item) => ({ id: item.id, status: item.status }))
      });
      return next;
    });

    try {
      const updated =
        action === 'approve'
          ? await approveAccessRequest(id)
          : await rejectAccessRequest(id);

      console.log('[ManagementScreen] access decision update result', {
        filter: accessFilter,
        id,
        action,
        payload: updated
      });

      if (accessFilter === 'all' && updated) {
        setAccessRequests((current) =>
          current.map((item) => (item.id === id ? updated : item))
        );
      }

      const refetchedRequests = await loadAccessRequests(accessFilter);
      const normalizedRefetchedRequests = applyAccessRequestLocalUpdate(
        refetchedRequests ?? [],
        accessFilter,
        id,
        nextStatus
      );
      const refetchedItem = normalizedRefetchedRequests.find((item) => item.id === id);

      console.log('[ManagementScreen] access decision refetch result', {
        filter: accessFilter,
        id,
        count: normalizedRefetchedRequests.length,
        refetchedStatus: refetchedItem?.status ?? 'not-found',
        items: normalizedRefetchedRequests.map((item) => ({ id: item.id, status: item.status }))
      });

      setAccessRequests((current) => {
        console.log('[ManagementScreen] access decision applying refetch to state', {
          filter: accessFilter,
          id,
          currentCount: current.length,
          nextCount: normalizedRefetchedRequests.length,
          currentItems: current.map((item) => ({ id: item.id, status: item.status })),
          nextItems: normalizedRefetchedRequests.map((item) => ({ id: item.id, status: item.status }))
        });
        return normalizedRefetchedRequests;
      });

      if (action === 'approve') {
        Alert.alert('Acesso aprovado', accessFilter === 'pending' ? 'O pedido saiu da lista de pendentes.' : 'O pedido foi atualizado para aprovado.');
      } else {
        Alert.alert('Acesso rejeitado', accessFilter === 'pending' ? 'O pedido saiu da lista de pendentes.' : 'O pedido foi atualizado para rejeitado.');
      }
    } catch (error) {
      setAccessRequests(previousRequests);
      Alert.alert('Não foi possível concluir a ação', getLoadErrorMessage(error));
    }
  }

  async function markRead(id: string) {
    await markFeedbackAsRead(id);
    await load();
  }

  async function archive(id: string) {
    await archiveFeedback(id);
    await load();
  }

  async function runModerationAction(item: ModerationContentItem) {
    if (!user) return;

    setActionFeedback(null);
    setPendingModerationItem(null);

    try {
      await moderateContent(
        user,
        {
          contentId: item.id,
          type: item.type,
          recommendationId: item.recommendationId,
          reviewId: item.reviewId,
          photoUri: item.photoUri
        },
        `Removido pela Gest?o: ${moderationTypeLabels[item.type]}`
      );

      setModerationItems((current) => removeModerationItemFromList(current, item));
      setActionFeedback({
        tone: 'success',
        message: getModerationSuccessMessage(item.type)
      });

      await load();
    } catch (error) {
      setActionFeedback({
        tone: 'error',
        message: `Não foi possível remover: ${getLoadErrorMessage(error)}.`
      });
    }
  }

  function removeContent(item: ModerationContentItem) {
    if (!user) return;

    setPendingModerationItem(item);
    return;

    Alert.alert('Remover conteúdo?', 'O item será escondido do app, mas o histórico ficará salvo para auditoria.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          void runModerationAction(item);
          return;
          try {
            await moderateContent(
            user as NonNullable<typeof user>,
            {
              contentId: item.id,
              type: item.type,
              recommendationId: item.recommendationId,
              reviewId: item.reviewId,
              photoUri: item.photoUri
            },
            `Removido pela Gestão: ${moderationTypeLabels[item.type]}`
          );
            await load();
            Alert.alert('Conteudo removido', `${moderationTypeLabels[item.type]} removido com sucesso.`);
          } catch (error) {
            Alert.alert('Não foi possível remover', getLoadErrorMessage(error));
          }
        }
      }
    ]);
  }

  return (
    <ScreenContainer keyboardDismissMode="interactive">
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <ShieldAlert color={colors.primary} size={22} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.eyebrow}>Área administrativa</Text>
            <Text style={styles.title}>Gestão</Text>
            <Text style={styles.subtitle}>Pedidos, feedbacks e moderação operacional do condomínio.</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <SummaryPill label="Pendentes" value={pendingRequests} />
          <SummaryPill label="Novos" value={newFeedbacks} />
          <SummaryPill label="Moderação" value={moderationCount} />
        </View>

        <Pressable style={styles.serviceSuggestionsLink} onPress={() => navigation.getParent()?.navigate('ServiceSuggestions')}>
          <View style={styles.serviceSuggestionsIcon}><Tags color={colors.primary} size={20} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceSuggestionsTitle}>Sugestões de serviços</Text>
            <Text style={styles.serviceSuggestionsText}>Aprovar, vincular ou rejeitar nomes enviados pelos moradores.</Text>
          </View>
          {pendingServiceSuggestions > 0 ? (
            <View style={styles.serviceSuggestionsBadge}>
              <Text style={styles.serviceSuggestionsBadgeText}>{pendingServiceSuggestions}</Text>
            </View>
          ) : null}
          <ChevronRight color={colors.secondaryText} size={20} />
        </Pressable>

        <View style={styles.sectionTabs}>
          {(Object.keys(sectionLabels) as Section[]).map((item) => (
            <Pressable key={item} accessibilityRole="button" onPress={() => selectSection(item)} style={[styles.sectionTab, section === item && styles.sectionTabActive]}>
              <Text style={[styles.sectionTabText, section === item && styles.sectionTabTextActive]}>{sectionLabels[item]}</Text>
              {getSectionBadge(item, pendingRequests, newFeedbacks, moderationCount) ? (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{getSectionBadge(item, pendingRequests, newFeedbacks, moderationCount)}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>

        <View style={styles.searchBox}>
          <Search color={colors.secondaryText} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nome, assunto ou conteúdo"
            placeholderTextColor={colors.secondaryText}
            style={styles.searchInput}
            autoCapitalize="none"
          />
        </View>

        {section === 'moderation' ? (
          <ModerationFilterRow selected={filter} onSelect={setFilter} />
        ) : (
          <FilterRow section={section} selected={filter} onSelect={setFilter} />
        )}

        {loadWarning ? (
          <View style={styles.mockNote}>
            <Text style={styles.mockNoteText}>{loadWarning}</Text>
          </View>
        ) : null}

        {actionFeedback ? (
          <View style={[styles.mockNote, actionFeedback.tone === 'error' ? styles.feedbackError : styles.feedbackSuccess]}>
            <Text style={[styles.mockNoteText, actionFeedback.tone === 'error' ? styles.feedbackErrorText : styles.feedbackSuccessText]}>
              {actionFeedback.message}
            </Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Carregando gestão...</Text>
          </View>
        ) : null}

        {!loading && section === 'access' ? (
          <View style={styles.list}>
            {filteredAccessRequests.length ? (
              filteredAccessRequests.map((item) => <AccessRequestCard key={item.id} item={item} onApprove={() => handleAccessDecision(item.id, 'approve')} onReject={() => handleAccessDecision(item.id, 'reject')} />)
            ) : (
              <EmptyState title="Nenhum pedido encontrado." />
            )}
          </View>
        ) : null}

        {!loading && section === 'feedbacks' ? (
          <View style={styles.list}>
            {filteredFeedbacks.length ? (
              filteredFeedbacks.map((item) => <FeedbackCard key={item.id} item={item} onRead={() => markRead(item.id)} onArchive={() => archive(item.id)} />)
            ) : (
              <EmptyState title="Nenhum feedback encontrado." />
            )}
          </View>
        ) : null}

        {!loading && section === 'moderation' ? (
          <View style={styles.list}>
            {filteredModerationItems.length ? (
              filteredModerationItems.map((item) => (
                <ModerationCard key={item.id} item={item} onRemove={() => removeContent(item)} onOpenPhoto={setPreviewPhotoUri} />
              ))
            ) : (
              <EmptyState title="Nenhum conteúdo encontrado para moderação." />
            )}
          </View>
        ) : null}

        <ModerationConfirmModal
          item={pendingModerationItem}
          onCancel={() => setPendingModerationItem(null)}
          onConfirm={(item) => {
            void runModerationAction(item);
          }}
        />
        <PhotoPreview uri={previewPhotoUri} onClose={() => setPreviewPhotoUri(null)} />
      </View>
    </ScreenContainer>
  );
}

function FilterRow({ section, selected, onSelect }: { section: Section; selected: StatusFilter; onSelect: (value: StatusFilter) => void }) {
  const filters =
    section === 'access'
      ? [
          { id: 'all' as const, label: 'Todos' },
          { id: 'pending' as const, label: 'Pendentes' }
        ]
      : section === 'feedbacks'
        ? [
            { id: 'all' as const, label: 'Todos' },
            { id: 'novo' as const, label: 'Novos' }
          ]
        : [
            { id: 'all' as const, label: 'Todos' },
            { id: 'comment' as const, label: 'Comentários' },
            { id: 'photo' as const, label: 'Fotos' },
            { id: 'review' as const, label: 'Avaliações' }
          ];

  return (
    <View style={styles.filterRow}>
      {filters.map((item) => (
        <Pressable key={item.id} accessibilityRole="button" onPress={() => onSelect(item.id)} style={[styles.filterChip, selected === item.id && styles.filterChipActive]}>
          <Text style={[styles.filterChipText, selected === item.id && styles.filterChipTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ModerationFilterRow({ selected, onSelect }: { selected: StatusFilter; onSelect: (value: StatusFilter) => void }) {
  const filters = [
    { id: 'review' as const, label: 'Avaliação' },
    { id: 'comment' as const, label: 'Comentários' },
    { id: 'photo' as const, label: 'Fotos' }
  ];

  return (
    <View style={styles.filterRow}>
      {filters.map((item) => (
        <Pressable key={item.id} accessibilityRole="button" onPress={() => onSelect(item.id)} style={[styles.filterChip, selected === item.id && styles.filterChipActive]}>
          <Text style={[styles.filterChipText, selected === item.id && styles.filterChipTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryPill}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function AccessRequestCard({ item, onApprove, onReject }: { item: AccessRequest; onApprove: () => void; onReject: () => void }) {
  const isPending = item.status === 'pending';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardMeta}>{item.unit}</Text>
        </View>
        <Badge label={getAccessStatusLabel(item.status)} tone={item.status === 'pending' ? 'warning' : item.status === 'approved' ? 'success' : 'danger'} />
      </View>

      <View style={styles.infoGrid}>
        <InfoLine label="Telefone" value={item.phone} />
        <InfoLine label="Solicitado em" value={formatDate(item.requestDate)} />
      </View>


      {isPending ? (
        <View style={styles.actionRow}>
          <IconAction title="Aprovar" icon={<Check color={colors.surface} size={16} />} onPress={onApprove} />
          <IconAction title="Rejeitar" icon={<X color={colors.surface} size={16} />} onPress={onReject} danger />
        </View>
      ) : null}
    </View>
  );
}

function FeedbackCard({ item, onRead, onArchive }: { item: Feedback; onRead: () => void; onArchive: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{formatFeedbackSubject(item.subject)}</Text>
          <Text style={styles.cardMeta}>{item.userName || 'Morador sem nome'} · {formatDateTime(item.createdAt)}</Text>
        </View>
        <Badge label={feedbackStatusLabels[item.status]} tone={item.status === 'novo' ? 'warning' : item.status === 'resolvido' ? 'success' : 'neutral'} />
      </View>
      <Text style={styles.cardBody}>{formatFeedbackMessage(item.message)}</Text>
      <View style={styles.actionRow}>
        <IconAction title="Lido" icon={<MessageSquareText color={colors.surface} size={16} />} onPress={onRead} disabled={item.status !== 'novo'} />
        <IconAction title="Arquivar" icon={<Archive color={colors.surface} size={16} />} onPress={onArchive} disabled={item.status === 'resolvido'} />
      </View>
    </View>
  );
}

function ModerationCard({
  item,
  onRemove,
  onOpenPhoto
}: {
  item: ModerationContentItem;
  onRemove: () => void;
  onOpenPhoto: (uri: string) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{item.providerName}</Text>
          <Text style={styles.cardMeta}>{item.author} · {formatDate(item.createdAt)}</Text>
        </View>
        <Badge label={moderationTypeLabels[item.type]} tone={item.type === 'photo' ? 'neutral' : 'warning'} />
      </View>

      {item.photoUri ? (
        <Pressable onPress={() => onOpenPhoto(item.photoUri!)} style={styles.photoPreviewButton}>
          <Image source={{ uri: item.photoUri }} style={styles.photoPreview} />
          <View style={styles.photoPreviewHint}>
            <Text style={styles.photoPreviewHintText}>Toque para ampliar</Text>
          </View>
        </Pressable>
      ) : null}
      <Text style={styles.cardBody}>{item.body}</Text>

      <View style={styles.actionRow}>
        <IconAction title={getModerationActionButtonLabel(item.type)} icon={<Trash2 color={colors.surface} size={16} />} onPress={onRemove} danger />
      </View>
    </View>
  );
}

function ModerationConfirmModal({
  item,
  onCancel,
  onConfirm
}: {
  item: ModerationContentItem | null;
  onCancel: () => void;
  onConfirm: (item: ModerationContentItem) => void;
}) {
  return (
    <Modal visible={Boolean(item)} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.confirmBackdrop}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>{item ? getModerationConfirmTitle(item.type) : ''}</Text>
          <Text style={styles.confirmText}>{item ? getModerationConfirmMessage(item.type) : ''}</Text>
          <View style={styles.confirmActions}>
            <Pressable style={styles.confirmCancelButton} onPress={onCancel}>
              <Text style={styles.confirmCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={styles.confirmDangerButton}
              onPress={() => {
                if (item) onConfirm(item);
              }}
            >
              <Text style={styles.confirmDangerText}>{item ? getModerationConfirmButtonLabel(item.type) : 'Confirmar'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PhotoPreview({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  return (
    <Modal visible={Boolean(uri)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.fullscreenPhotoBackdrop} onPress={onClose}>
        {uri ? <Image source={{ uri }} style={styles.fullscreenPhoto} resizeMode="contain" /> : null}
      </Pressable>
    </Modal>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function IconAction({ title, icon, onPress, danger, disabled }: { title: string; icon: React.ReactNode; onPress: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.iconAction, danger && styles.iconActionDanger, disabled && styles.iconActionDisabled, pressed && !disabled && styles.pressed]}>
      {icon}
      <Text style={styles.iconActionText}>{title}</Text>
    </Pressable>
  );
}

function Badge({ label, tone }: { label: string; tone: 'warning' | 'success' | 'danger' | 'neutral' }) {
  return (
    <View style={[styles.badge, getBadgeStyle(tone)]}>
      <Text style={[styles.badgeText, getBadgeTextStyle(tone)]}>{label}</Text>
    </View>
  );
}

function getBadgeStyle(tone: 'warning' | 'success' | 'danger' | 'neutral') {
  if (tone === 'warning') return styles.badge_warning;
  if (tone === 'success') return styles.badge_success;
  if (tone === 'danger') return styles.badge_danger;
  return styles.badge_neutral;
}

function getBadgeTextStyle(tone: 'warning' | 'success' | 'danger' | 'neutral') {
  if (tone === 'warning') return styles.badgeText_warning;
  if (tone === 'success') return styles.badgeText_success;
  if (tone === 'danger') return styles.badgeText_danger;
  return styles.badgeText_neutral;
}

function getSectionBadge(section: Section, pendingRequests: number, newFeedbacks: number, moderationCount: number) {
  const value = section === 'access' ? pendingRequests : section === 'feedbacks' ? newFeedbacks : moderationCount;
  return value > 0 ? value : null;
}

function getAccessStatusLabel(status: AccessRequest['status']) {
  if (status === 'approved') return 'Aprovado';
  if (status === 'rejected') return 'Rejeitado';
  return 'Pendente';
}

async function loadSection<T>({
  section,
  request,
  onSuccess,
  onError,
  setLoadingBySection
}: {
  section: Section;
  request: () => Promise<T>;
  onSuccess: (value: T) => void;
  onError: (reason: unknown) => void;
  setLoadingBySection: React.Dispatch<React.SetStateAction<Record<Section, boolean>>>;
}) {
  try {
    const value = await request();
    onSuccess(value);
  } catch (reason) {
    onError(reason);
  } finally {
    setLoadingBySection((current) => ({
      ...current,
      [section]: false
    }));
  }
}

function getLoadErrorMessage(reason: unknown) {
  if (reason instanceof Error && reason.message.trim()) return reason.message.trim();
  return 'erro ao consultar o backend';
}

function getAccessFilter(filter: StatusFilter): AccessFilter {
  return filter === 'all' ? 'all' : 'pending';
}

function applyAccessRequestLocalUpdate(
  requests: AccessRequest[],
  accessFilter: AccessFilter,
  requestId: string,
  newStatus: AccessRequest['status']
) {
  if (accessFilter === 'pending') {
    return requests.filter((request) => request.id !== requestId);
  }

  return requests.map((request) =>
    request.id === requestId
      ? { ...request, status: newStatus }
      : request
  );
}

function removeModerationItemFromList(items: ModerationContentItem[], target: ModerationContentItem) {
  if (target.type === 'review') {
    return items.filter((item) => item.reviewId !== target.reviewId);
  }

  return items.filter((item) => item.id !== target.id);
}

function getModerationActionButtonLabel(type: ModerationContentType) {
  if (type === 'review') return 'Remover avaliação inteira';
  if (type === 'comment') return 'Remover só comentário';
  return 'Remover só foto';
}

function formatFeedbackSubject(subject: Feedback['subject']) {
  if (subject === 'Sugestao de melhoria') return 'Sugestão de melhoria';
  if (subject === 'Recomendacao/fornecedor') return 'Recomendação/fornecedor';
  if (subject === 'Duvida') return 'Dúvida';
  return subject;
}

function formatFeedbackMessage(message: string) {
  if (message === 'Nao consegui abrir as fotos de uma recomendacao na primeira tentativa.') {
    return 'Não consegui abrir as fotos de uma recomendação na primeira tentativa.';
  }
  if (message === 'Seria bom ter um jeito mais rapido de avisar quando uma indicacao mudou de telefone.') {
    return 'Seria bom ter um jeito mais rápido de avisar quando uma indicação mudou de telefone.';
  }
  return message;
}

function getModerationConfirmTitle(type: ModerationContentType) {
  if (type === 'review') return 'Remover avaliação?';
  if (type === 'comment') return 'Remover comentário?';
  return 'Remover foto?';
}

function getModerationConfirmMessage(type: ModerationContentType) {
  if (type === 'review') return 'Essa ação remove a avaliação inteira, incluindo comentário, foto e nota.';
  if (type === 'comment') return 'Essa ação remove apenas o comentário. A foto e a nota continuam visíveis.';
  return 'Essa ação remove apenas a foto. O comentário e a nota continuam visíveis.';
}

function getModerationConfirmButtonLabel(type: ModerationContentType) {
  if (type === 'review') return 'Remover avaliação';
  if (type === 'comment') return 'Remover comentário';
  return 'Remover foto';
}

function getModerationSuccessMessage(type: ModerationContentType) {
  if (type === 'review') return 'Avaliação removida com sucesso.';
  if (type === 'comment') return 'Comentário removido com sucesso.';
  return 'Foto removida com sucesso.';
}

async function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs = 8000) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`tempo limite excedido ao carregar ${label}`)), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function includesQuery(values: Array<string | undefined>, query: string) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;
  return values.some((value) => normalizeText(value ?? '').includes(normalizedQuery));
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: 112
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E1EAE5',
    padding: spacing.md,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroText: {
    flex: 1,
    gap: 3
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontFamily: typography.fontFamily
  },
  title: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  subtitle: {
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 19,
    fontFamily: typography.fontFamily
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  serviceSuggestionsLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#D7EAE1' },
  serviceSuggestionsIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#E7F3EF', alignItems: 'center', justifyContent: 'center' },
  serviceSuggestionsTitle: { color: colors.text, fontSize: typography.small, fontWeight: '900', fontFamily: typography.fontFamily },
  serviceSuggestionsText: { color: colors.secondaryText, fontSize: typography.tiny, lineHeight: 16, fontFamily: typography.fontFamily },
  serviceSuggestionsBadge: { minWidth: 25, height: 25, borderRadius: 13, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  serviceSuggestionsBadgeText: { color: colors.surface, fontSize: 11, lineHeight: 14, fontWeight: '900', fontFamily: typography.fontFamily },
  summaryPill: {
    flex: 1,
    minHeight: 68,
    borderRadius: 18,
    backgroundColor: '#EEF7F3',
    padding: spacing.sm,
    justifyContent: 'center',
    gap: 2
  },
  summaryValue: {
    color: colors.darkGreen,
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: typography.fontFamily
  },
  summaryLabel: {
    color: '#42675C',
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: typography.fontFamily
  },
  sectionTabs: {
    flexDirection: 'row',
    gap: 7,
    backgroundColor: '#EBF1EE',
    borderRadius: 18,
    padding: 5
  },
  sectionTab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5
  },
  sectionTabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1
  },
  sectionTabText: {
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  sectionTabTextActive: {
    color: colors.darkGreen
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D92D20',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5
  },
  tabBadgeText: {
    color: colors.surface,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  searchBox: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDE9E4',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7
  },
  filterChip: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DDE9E4',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterChipActive: {
    backgroundColor: colors.darkGreen,
    borderColor: colors.darkGreen
  },
  filterChipText: {
    color: colors.secondaryText,
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  filterChipTextActive: {
    color: colors.surface
  },
  loadingCard: {
    minHeight: 92,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm
  },
  loadingText: {
    color: colors.secondaryText,
    fontSize: typography.small,
    fontFamily: typography.fontFamily
  },
  list: {
    gap: spacing.sm
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E1EAE5',
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  cardTitleWrap: {
    flex: 1,
    gap: 3
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  cardMeta: {
    color: colors.secondaryText,
    fontSize: typography.tiny,
    lineHeight: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamily
  },
  cardBody: {
    color: '#374741',
    fontSize: typography.small,
    lineHeight: 21,
    fontFamily: typography.fontFamily
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6
  },
  badge_warning: {
    backgroundColor: '#FFF4D8'
  },
  badge_success: {
    backgroundColor: '#E7F3EF'
  },
  badge_danger: {
    backgroundColor: '#FEE4E2'
  },
  badge_neutral: {
    backgroundColor: '#F0F2F1'
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontFamily: typography.fontFamily
  },
  badgeText_warning: {
    color: '#966A16'
  },
  badgeText_success: {
    color: colors.primary
  },
  badgeText_danger: {
    color: colors.error
  },
  badgeText_neutral: {
    color: colors.secondaryText
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  infoLine: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#FAFCFB',
    borderWidth: 1,
    borderColor: '#EDF3EF',
    padding: spacing.sm,
    gap: 2
  },
  infoLabel: {
    color: colors.secondaryText,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    fontFamily: typography.fontFamily
  },
  infoValue: {
    color: colors.text,
    fontSize: typography.tiny,
    lineHeight: 16,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  iconAction: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.sm
  },
  iconActionDanger: {
    backgroundColor: colors.error
  },
  iconActionDisabled: {
    opacity: 0.45
  },
  iconActionText: {
    color: colors.surface,
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  photoPreview: {
    width: '100%',
    height: 148,
    borderRadius: 14,
    backgroundColor: colors.muted
  },
  photoPreviewButton: {
    borderRadius: 14,
    overflow: 'hidden'
  },
  photoPreviewHint: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(8, 18, 15, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  photoPreviewHintText: {
    color: colors.surface,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  fullscreenPhotoBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 18, 15, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg
  },
  fullscreenPhoto: {
    width: '100%',
    height: '78%',
    borderRadius: 20
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 18, 15, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E2ECE7',
    padding: spacing.lg,
    gap: spacing.sm
  },
  confirmTitle: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  confirmText: {
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  confirmCancelButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DDE9E4',
    backgroundColor: '#FBFCFB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmCancelText: {
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  confirmDangerButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 15,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmDangerText: {
    color: colors.surface,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  mockNote: {
    borderRadius: 16,
    backgroundColor: '#EEF7F3',
    borderWidth: 1,
    borderColor: '#D7EAE1',
    padding: spacing.md
  },
  mockNoteText: {
    color: '#42675C',
    fontSize: typography.tiny,
    lineHeight: 17,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  feedbackSuccess: {
    backgroundColor: '#E7F3EF',
    borderColor: '#CFE4DA'
  },
  feedbackSuccessText: {
    color: colors.primary
  },
  feedbackError: {
    backgroundColor: '#FEE4E2',
    borderColor: '#F6C7C2'
  },
  feedbackErrorText: {
    color: colors.error
  },
  pressed: {
    opacity: 0.86
  }
});


