import { ArrowLeft, Check, History, Link2, Pencil, Search, Tags, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../components/EmptyState';
import { categories, getCategoryById, serviceSpecialtiesForPicker } from '../constants/categories';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { createSpecialtyFromSuggestion, listServiceSuggestions, reviewServiceSuggestion } from '../repositories/serviceSuggestionsRepository';
import { useApp } from '../services/AppContext';
import { ServiceSuggestion } from '../types';
import { normalize } from '../utils/recommendations';

export function ServiceSuggestionsScreen({ navigation }: any) {
  const { user } = useApp();
  const [items, setItems] = useState<ServiceSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'pending' | 'history'>('pending');
  const [linkingItem, setLinkingItem] = useState<ServiceSuggestion | null>(null);
  const [creatingItem, setCreatingItem] = useState<ServiceSuggestion | null>(null);
  const [linkQuery, setLinkQuery] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftCategoryId, setDraftCategoryId] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try { setItems(await listServiceSuggestions(user.condominiumId)); }
    catch (error) { Alert.alert('Não foi possível carregar', error instanceof Error ? error.message : 'Tente novamente.'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { void load(); }, [load]);
  const pendingCount = items.filter((item) => item.status === 'pending').length;
  const historyCount = items.length - pendingCount;
  const visibleItems = useMemo(() => items
    .filter((item) => view === 'pending' ? item.status === 'pending' : item.status !== 'pending')
    .filter((item) => !query.trim() || [item.proposedName, item.providerName, item.suggestedCategoryName, item.resolvedSpecialtyName, item.resolvedCategoryName].join(' ').toLowerCase().includes(query.trim().toLowerCase())), [items, query, view]);

  async function decide(item: ServiceSuggestion, decision: 'rejected' | 'linked', specialtyId?: string) {
    setActionError(null);
    setBusyId(item.id);
    try {
      await reviewServiceSuggestion(item.id, decision, specialtyId);
      setLinkingItem(null);
      await load();
      Alert.alert('Pendência resolvida', decision === 'linked' ? 'O prestador foi classificado no serviço existente. Nenhum serviço novo foi criado.' : 'A sugestão foi rejeitada.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tente novamente.';
      setActionError(message);
      Alert.alert('Não foi possível atualizar', message);
    }
    finally { setBusyId(null); }
  }

  async function createNewService() {
    if (!creatingItem) return;
    if (draftName.trim().length < 2) return Alert.alert('Revise o nome', 'Digite um nome curto para o novo serviço.');
    if (!draftCategoryId) return Alert.alert('Escolha a categoria', 'Informe onde o novo serviço deve aparecer no catálogo.');
    setBusyId(creatingItem.id);
    try {
      await createSpecialtyFromSuggestion(creatingItem.id, draftName, draftCategoryId);
      setCreatingItem(null);
      await load();
      Alert.alert('Novo serviço criado', `${draftName.trim()} foi adicionado em ${getCategoryById(draftCategoryId)?.name}.`);
    } catch (error) { Alert.alert('Não foi possível criar', error instanceof Error ? error.message : 'Tente novamente.'); }
    finally { setBusyId(null); }
  }

  function openCreate(item: ServiceSuggestion) {
    setDraftName(item.proposedName);
    setDraftCategoryId('');
    setCreatingItem(item);
  }

  function openExisting(item: ServiceSuggestion) {
    setLinkQuery('');
    setSelectedSpecialtyId(item.resolvedSpecialtyId ?? null);
    setActionError(null);
    setLinkingItem(item);
  }

  function confirmExistingService() {
    if (!linkingItem || !selectedSpecialtyId || busyId) return;
    void decide(linkingItem, 'linked', selectedSpecialtyId);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}><ArrowLeft color={colors.darkGreen} size={22} /></Pressable>
          <View style={{ flex: 1 }}><Text style={styles.eyebrow}>Organização do catálogo</Text><Text style={styles.title}>Classificação de serviços</Text></View>
          <View style={styles.headerIcon}><Tags color={colors.primary} size={22} /></View>
        </View>
        <Text style={styles.intro}>Resolva novas sugestões e consulte o histórico das classificações já definidas.</Text>
        <View style={styles.tabs}>
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: view === 'pending' }} style={[styles.tab, view === 'pending' && styles.tabActive]} onPress={() => setView('pending')}><Tags color={view === 'pending' ? colors.surface : colors.secondaryText} size={16} /><Text style={[styles.tabText, view === 'pending' && styles.tabTextActive]}>Pendentes</Text><View style={[styles.tabCount, view === 'pending' && styles.tabCountActive]}><Text style={[styles.tabCountText, view === 'pending' && styles.tabCountTextActive]}>{pendingCount}</Text></View></Pressable>
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: view === 'history' }} style={[styles.tab, view === 'history' && styles.tabActive]} onPress={() => setView('history')}><History color={view === 'history' ? colors.surface : colors.secondaryText} size={16} /><Text style={[styles.tabText, view === 'history' && styles.tabTextActive]}>Histórico</Text><View style={[styles.tabCount, view === 'history' && styles.tabCountActive]}><Text style={[styles.tabCountText, view === 'history' && styles.tabCountTextActive]}>{historyCount}</Text></View></Pressable>
        </View>
        <View style={styles.searchBox}><Search color={colors.secondaryText} size={18} /><TextInput value={query} onChangeText={setQuery} placeholder="Buscar texto ou prestador" placeholderTextColor={colors.secondaryText} style={styles.searchInput} /></View>
        {loading ? <ActivityIndicator color={colors.primary} /> : visibleItems.length ? visibleItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}><Text style={styles.fieldLabel}>Texto enviado pelo morador</Text><Text style={styles.serviceName}>{item.proposedName}</Text></View>
              <View style={[styles.statusInline, item.status !== 'pending' && styles.statusDefined]}><View style={[styles.statusDot, item.status !== 'pending' && styles.statusDotDefined, item.status === 'rejected' && styles.statusDotRejected]} /><Text style={[styles.status, item.status !== 'pending' && styles.statusTextDefined, item.status === 'rejected' && styles.statusTextRejected]}>{item.status === 'pending' ? 'Aguardando decisão' : item.status === 'rejected' ? 'Descartado' : 'Definido'}</Text></View>
            </View>
            <View style={styles.contextPanel}>
              <View style={styles.contextRow}><Text style={styles.contextLabel}>Prestador</Text><Text style={styles.contextValue}>{item.providerName || 'Não informado'}</Text></View>
              <View style={styles.contextDivider} />
              <View style={styles.contextRow}><Text style={styles.contextLabel}>{item.status === 'pending' ? 'Categoria sugerida' : 'Serviço definido'}</Text><Text style={[styles.contextValue, item.status === 'pending' && !item.suggestedCategoryName && styles.contextMissing]}>{item.status === 'pending' ? (item.suggestedCategoryName || 'Ainda não definida') : (item.resolvedSpecialtyName || 'Sem classificação')}</Text></View>
              {item.status !== 'pending' && item.status !== 'rejected' ? <><View style={styles.contextDivider} /><View style={styles.contextRow}><Text style={styles.contextLabel}>Categoria</Text><Text style={styles.contextValue}>{item.resolvedCategoryName || 'Não informada'}</Text></View></> : null}
            </View>
            {item.status === 'pending' ? <View style={styles.actions}>
              <Pressable disabled={busyId === item.id} style={styles.secondaryButton} onPress={() => openExisting(item)}><Link2 color={colors.primary} size={17} /><Text style={styles.secondaryText}>Usar existente</Text></Pressable>
              <Pressable disabled={busyId === item.id} style={styles.approveButton} onPress={() => openCreate(item)}><Check color={colors.surface} size={17} /><Text style={styles.approveText}>Criar novo</Text></Pressable>
              <Pressable disabled={busyId === item.id} style={styles.rejectButton} onPress={() => decide(item, 'rejected')}><X color={colors.error} size={17} /></Pressable>
            </View> : <Pressable disabled={busyId === item.id} style={styles.changeButton} onPress={() => openExisting(item)}><Pencil color={colors.primary} size={16} /><Text style={styles.changeButtonText}>Alterar classificação</Text></Pressable>}
          </View>
        )) : <EmptyState title={view === 'pending' ? 'Nenhuma pendência encontrada' : 'Nenhuma classificação no histórico'} />}
      </ScrollView>

      <ExistingServiceModal item={linkingItem} query={linkQuery} selectedId={selectedSpecialtyId} error={actionError} busy={Boolean(busyId)} onChangeQuery={setLinkQuery} onClose={() => { if (!busyId) setLinkingItem(null); }} onSelect={(id) => { setSelectedSpecialtyId(id); setActionError(null); }} onConfirm={confirmExistingService} />
      <CreateServiceModal item={creatingItem} name={draftName} categoryId={draftCategoryId} busy={Boolean(busyId)} onChangeName={setDraftName} onChangeCategory={setDraftCategoryId} onClose={() => setCreatingItem(null)} onConfirm={createNewService} />
    </SafeAreaView>
  );
}

function ExistingServiceModal({ item, query, selectedId, error, busy, onChangeQuery, onClose, onSelect, onConfirm }: { item: ServiceSuggestion | null; query: string; selectedId: string | null; error: string | null; busy: boolean; onChangeQuery: (value: string) => void; onClose: () => void; onSelect: (id: string) => void; onConfirm: () => void }) {
  const normalized = normalize(query);
  const services = serviceSpecialtiesForPicker.filter((service) => service.id !== 'outros').filter((service) => !normalized || [service.name, ...service.aliases].some((value) => normalize(value).includes(normalized)));
  return <Modal visible={Boolean(item)} transparent animationType="slide" onRequestClose={onClose}><KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Pressable style={styles.modalScrim} onPress={onClose} /><SafeAreaView style={styles.sheet} edges={['bottom']}>
    <View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View style={{ flex: 1 }}><Text style={styles.sheetTitle}>Usar serviço existente</Text><Text style={styles.sheetSubtitle}>Isso não cria um serviço novo. Apenas classifica {item?.providerName || 'o prestador'} em uma opção que já existe.</Text></View><Pressable onPress={onClose}><X color={colors.secondaryText} size={22} /></Pressable></View>
    <View style={styles.searchBox}><Search color={colors.secondaryText} size={18} /><TextInput value={query} onChangeText={onChangeQuery} placeholder="Ex: Cortinas e persianas" placeholderTextColor={colors.secondaryText} style={styles.searchInput} autoFocus /></View>
    <ScrollView contentContainerStyle={styles.catalogList} keyboardShouldPersistTaps="handled">{services.map((service) => {
      const selected = selectedId === service.id;
      return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} disabled={busy} key={service.id} style={[styles.catalogOption, selected && styles.catalogOptionSelected]} onPress={() => onSelect(service.id)}><View style={{ flex: 1 }}><Text style={[styles.catalogOptionText, selected && styles.catalogOptionTextSelected]}>{service.name}</Text><Text style={[styles.catalogCategory, selected && styles.catalogCategorySelected]}>{getCategoryById(service.categoryId)?.name}</Text></View>{selected ? <View style={styles.selectedMark}><Check color={colors.surface} size={16} /></View> : <Link2 color={colors.primary} size={17} />}</Pressable>;
    })}</ScrollView>
    {selectedId ? <View style={styles.selectionSummary}><Text style={styles.selectionSummaryLabel}>Serviço escolhido</Text><Text style={styles.selectionSummaryText}>{serviceSpecialtiesForPicker.find((service) => service.id === selectedId)?.name}</Text><Text style={styles.selectionSummaryHint}>O prestador será classificado neste serviço. Nenhum serviço novo será criado.</Text></View> : null}
    {error ? <Text style={styles.actionError}>Não foi possível vincular: {error}</Text> : null}
    <Pressable accessibilityRole="button" accessibilityLabel="Vincular a este serviço" disabled={busy || !selectedId} style={({ pressed }) => [styles.confirmButton, (busy || !selectedId) && styles.confirmButtonDisabled, pressed && styles.confirmButtonPressed]} onPress={() => onConfirm()}>{busy ? <View style={styles.confirmProgress}><ActivityIndicator color={colors.surface} /><Text style={styles.confirmButtonText}>Vinculando...</Text></View> : <Text style={styles.confirmButtonText}>{selectedId ? 'Vincular a este serviço' : 'Selecione um serviço'}</Text>}</Pressable>
  </SafeAreaView></KeyboardAvoidingView></Modal>;
}

function CreateServiceModal({ item, name, categoryId, busy, onChangeName, onChangeCategory, onClose, onConfirm }: { item: ServiceSuggestion | null; name: string; categoryId: string; busy: boolean; onChangeName: (value: string) => void; onChangeCategory: (id: string) => void; onClose: () => void; onConfirm: () => void }) {
  return <Modal visible={Boolean(item)} transparent animationType="slide" onRequestClose={onClose}><KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Pressable style={styles.modalScrim} onPress={onClose} /><SafeAreaView style={styles.sheet} edges={['bottom']}>
    <View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View style={{ flex: 1 }}><Text style={styles.sheetTitle}>Criar serviço novo</Text><Text style={styles.sheetSubtitle}>Crie somente se nenhuma opção equivalente existir no catálogo.</Text></View><Pressable onPress={onClose}><X color={colors.secondaryText} size={22} /></Pressable></View>
    <Text style={styles.inputLabel}>Nome curto do serviço</Text><TextInput value={name} onChangeText={onChangeName} maxLength={40} placeholder="Ex: Mestre de obras" placeholderTextColor={colors.secondaryText} style={styles.nameInput} />
    <Text style={styles.inputLabel}>Categoria</Text><ScrollView contentContainerStyle={styles.categoryGrid}>{categories.filter((category) => category.id !== 'outros').map((category) => <Pressable key={category.id} style={[styles.categoryChip, categoryId === category.id && styles.categoryChipSelected]} onPress={() => onChangeCategory(category.id)}><Text style={[styles.categoryChipText, categoryId === category.id && styles.categoryChipTextSelected]}>{category.name}</Text></Pressable>)}</ScrollView>
    <Pressable disabled={busy || name.trim().length < 2 || !categoryId} style={[styles.confirmButton, (busy || name.trim().length < 2 || !categoryId) && styles.confirmButtonDisabled]} onPress={onConfirm}><Text style={styles.confirmButtonText}>Criar {name.trim() || 'novo serviço'}</Text></Pressable>
  </SafeAreaView></KeyboardAvoidingView></Modal>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 }, header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }, headerIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.lightGreen, alignItems: 'center', justifyContent: 'center' }, eyebrow: { color: colors.primary, fontSize: typography.tiny, fontWeight: '900', textTransform: 'uppercase', fontFamily: typography.fontFamily }, title: { color: colors.text, fontSize: 25, fontWeight: '900', fontFamily: typography.fontFamily }, intro: { color: colors.secondaryText, fontSize: typography.small, lineHeight: 20, fontFamily: typography.fontFamily }, tabs: { flexDirection: 'row', gap: spacing.sm, padding: 4, borderRadius: 16, backgroundColor: '#E8EFEB' }, tab: { flex: 1, minHeight: 42, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, tabActive: { backgroundColor: colors.darkGreen }, tabText: { color: colors.secondaryText, fontSize: typography.small, fontWeight: '900', fontFamily: typography.fontFamily }, tabTextActive: { color: colors.surface }, tabCount: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D5DFDA' }, tabCountActive: { backgroundColor: colors.primary }, tabCountText: { color: colors.secondaryText, fontSize: 10, fontWeight: '900', fontFamily: typography.fontFamily }, tabCountTextActive: { color: colors.surface }, searchBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, borderRadius: 16, paddingHorizontal: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, searchInput: { flex: 1, color: colors.text, fontFamily: typography.fontFamily },
  card: { gap: spacing.sm, padding: spacing.md, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#E1EAE5' }, cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }, fieldLabel: { color: colors.secondaryText, fontSize: 10, lineHeight: 13, fontWeight: '800', textTransform: 'uppercase', fontFamily: typography.fontFamily }, serviceName: { color: colors.text, fontSize: typography.body, lineHeight: 22, fontWeight: '900', fontFamily: typography.fontFamily, marginTop: 2 }, statusInline: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 2 }, statusDefined: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: colors.lightGreen }, statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.secondaryText }, statusDotDefined: { backgroundColor: colors.primary }, statusDotRejected: { backgroundColor: colors.error }, status: { color: colors.secondaryText, fontSize: 10, fontWeight: '800', fontFamily: typography.fontFamily }, statusTextDefined: { color: colors.darkGreen }, statusTextRejected: { color: colors.error }, contextPanel: { borderRadius: 14, backgroundColor: '#F7FAF8', borderWidth: 1, borderColor: '#E4ECE7', paddingHorizontal: spacing.sm }, contextRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, contextLabel: { color: colors.secondaryText, fontSize: typography.tiny, fontFamily: typography.fontFamily }, contextValue: { flex: 1, color: colors.text, fontSize: typography.tiny, fontWeight: '800', textAlign: 'right', fontFamily: typography.fontFamily }, contextMissing: { color: colors.error }, contextDivider: { height: 1, backgroundColor: '#E4ECE7' }, actions: { flexDirection: 'row', gap: 7 }, secondaryButton: { flex: 1, minHeight: 42, borderRadius: 14, backgroundColor: '#E7F3EF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, secondaryText: { color: colors.primary, fontSize: typography.tiny, fontWeight: '900', fontFamily: typography.fontFamily }, approveButton: { flex: 1, minHeight: 42, borderRadius: 14, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, approveText: { color: colors.surface, fontSize: typography.tiny, fontWeight: '900', fontFamily: typography.fontFamily }, rejectButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FEE4E2', alignItems: 'center', justifyContent: 'center' }, changeButton: { minHeight: 42, borderRadius: 14, backgroundColor: '#E7F3EF', borderWidth: 1, borderColor: '#CEE3DC', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, changeButtonText: { color: colors.primary, fontSize: typography.tiny, fontWeight: '900', fontFamily: typography.fontFamily },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' }, modalScrim: { ...StyleSheet.absoluteFillObject, zIndex: 0, backgroundColor: 'rgba(8, 18, 15, 0.38)' }, sheet: { position: 'relative', zIndex: 1, elevation: 2, maxHeight: '86%', backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: spacing.lg, gap: spacing.md }, sheetHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: '#CAD5D0', alignSelf: 'center' }, sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }, sheetTitle: { color: colors.text, fontSize: 22, lineHeight: 27, fontWeight: '900', fontFamily: typography.fontFamily }, sheetSubtitle: { color: colors.secondaryText, fontSize: typography.small, lineHeight: 19, fontFamily: typography.fontFamily, marginTop: 3 }, catalogList: { zIndex: 0, gap: 7, paddingBottom: spacing.sm }, catalogOption: { minHeight: 54, borderRadius: 14, backgroundColor: '#F7FAF8', borderWidth: 1, borderColor: '#E4ECE7', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, catalogOptionSelected: { backgroundColor: colors.darkGreen, borderColor: colors.darkGreen }, catalogOptionText: { color: colors.darkGreen, fontSize: typography.small, fontWeight: '900', fontFamily: typography.fontFamily }, catalogOptionTextSelected: { color: colors.surface }, catalogCategory: { color: colors.secondaryText, fontSize: typography.tiny, marginTop: 2, fontFamily: typography.fontFamily }, catalogCategorySelected: { color: '#D7ECE5' }, selectedMark: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, selectionSummary: { borderRadius: 14, backgroundColor: colors.lightGreen, borderWidth: 1, borderColor: '#C8E2D9', padding: spacing.sm }, selectionSummaryLabel: { color: colors.secondaryText, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', fontFamily: typography.fontFamily }, selectionSummaryText: { color: colors.darkGreen, fontSize: typography.small, fontWeight: '900', fontFamily: typography.fontFamily, marginTop: 2 }, selectionSummaryHint: { color: colors.secondaryText, fontSize: typography.tiny, lineHeight: 17, fontFamily: typography.fontFamily, marginTop: 3 }, actionError: { color: colors.error, fontSize: typography.tiny, lineHeight: 17, fontWeight: '700', fontFamily: typography.fontFamily }, inputLabel: { color: colors.text, fontSize: typography.small, fontWeight: '800', fontFamily: typography.fontFamily }, nameInput: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: '#DDE9E4', backgroundColor: '#FBFCFB', paddingHorizontal: spacing.md, color: colors.text, fontSize: typography.small, fontFamily: typography.fontFamily }, categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, categoryChip: { borderRadius: 999, borderWidth: 1, borderColor: '#DDE9E4', paddingHorizontal: 11, paddingVertical: 8 }, categoryChipSelected: { backgroundColor: colors.darkGreen, borderColor: colors.darkGreen }, categoryChipText: { color: colors.secondaryText, fontSize: typography.tiny, fontWeight: '800', fontFamily: typography.fontFamily }, categoryChipTextSelected: { color: colors.surface }, confirmButton: { position: 'relative', zIndex: 5, elevation: 5, minHeight: 50, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, confirmButtonPressed: { opacity: 0.82 }, confirmButtonDisabled: { backgroundColor: '#A9B8B2' }, confirmProgress: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, confirmButtonText: { color: colors.surface, fontSize: typography.small, fontWeight: '900', fontFamily: typography.fontFamily }
});
