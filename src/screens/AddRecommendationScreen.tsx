import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Camera, Search, Star, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { PhoneInput } from '../components/PhoneInput';
import { getServiceSpecialtyById, serviceSpecialtiesForPicker } from '../constants/categories';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useApp } from '../services/AppContext';
import { addRecommendation, addReviewToExistingRecommendation, findRecommendationByPhoneAsync, getRecommendationByIdAsync } from '../services/api';
import { NewRecommendationPayload, Recommendation } from '../types';
import { getPhoneValidation } from '../utils/phone';

type UsedWhen = NewRecommendationPayload['usedWhen'];
type UploadedPhoto = { id: string; uri: string };
type Errors = Partial<Record<'supplierName' | 'whatsapp' | 'serviceSpecialtyId' | 'customServiceDescription' | 'servicePerformed' | 'usedWhen' | 'rating' | 'wouldHireAgain' | 'comment', string>>;
type SuccessTarget =
  | { type: 'provider'; recommendationId: string; reviewId?: string }
  | { type: 'home'; recommendationId: string };

const usedWhenOptions: { label: string; value: UsedWhen }[] = [
  { label: 'Esta semana', value: 'this_week' },
  { label: 'Último mês', value: 'last_month' },
  { label: '3-6 meses', value: 'three_to_six_months' },
  { label: 'Mais de 6 meses', value: 'more_than_six_months' }
];

const ratingLabels = ['Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'];

export function AddRecommendationScreen() {
  const { user } = useApp();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollRef = useRef<ScrollView>(null);
  const [supplierName, setSupplierName] = useState('');
  const [serviceSpecialtyId, setServiceSpecialtyId] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [customServiceDescription, setCustomServiceDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [servicePerformed, setServicePerformed] = useState('');
  const [usedWhen, setUsedWhen] = useState<UsedWhen | null>(null);
  const [rating, setRating] = useState(0);
  const [wouldHireAgain, setWouldHireAgain] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successTarget, setSuccessTarget] = useState<SuccessTarget | null>(null);
  const [commentFieldY, setCommentFieldY] = useState(0);
  const [providerFromRoute, setProviderFromRoute] = useState<Recommendation | undefined>();
  const [existingProvider, setExistingProvider] = useState<Recommendation | undefined>();
  const selectedSpecialty = getServiceSpecialtyById(serviceSpecialtyId);
  const contextualProvider = providerFromRoute || existingProvider;
  const isContextualReviewFlow = Boolean(providerFromRoute);
  const isAddingToExistingProvider = Boolean(contextualProvider);

  useEffect(() => {
    const providerId = route.params?.providerId;
    if (!providerId) {
      setProviderFromRoute(undefined);
      resetForm();
      return;
    }

    getRecommendationByIdAsync(providerId).then((provider) => {
      if (!provider) return;

      setProviderFromRoute(provider);
      setSupplierName(provider.supplierName);
      setWhatsapp(provider.whatsapp);
      setServiceSpecialtyId(provider.serviceSpecialtyId ?? '');
      setServiceSearch('');
      setCustomServiceDescription(provider.customServiceDescription ?? '');
      setServicePerformed('');
      setUsedWhen(null);
      setRating(0);
      setWouldHireAgain(null);
      setComment('');
      setPhotos([]);
      setErrors({});
    });
  }, [route.params?.providerId]);

  useEffect(() => {
    if (!user || !getPhoneValidation(whatsapp).isValid || providerFromRoute) {
      setExistingProvider(undefined);
      return;
    }

    let active = true;
    findRecommendationByPhoneAsync(user.condominiumId, whatsapp).then((provider) => {
      if (active) setExistingProvider(provider);
    });
    return () => {
      active = false;
    };
  }, [providerFromRoute, user, whatsapp]);

  function resetForm() {
    setSupplierName('');
    setServiceSpecialtyId('');
    setServiceSearch('');
    setCustomServiceDescription('');
    setWhatsapp('');
    setServicePerformed('');
    setUsedWhen(null);
    setRating(0);
    setWouldHireAgain(null);
    setComment('');
    setPhotos([]);
    setErrors({});
  }

  function validate() {
    const nextErrors: Errors = {};
    const phoneValidation = getPhoneValidation(whatsapp);
    if (!isAddingToExistingProvider && !supplierName.trim()) nextErrors.supplierName = 'Informe o nome do fornecedor.';
    if (!phoneValidation.isValid) nextErrors.whatsapp = phoneValidation.message || 'Informe um WhatsApp válido.';
    if (!isAddingToExistingProvider && !serviceSpecialtyId) nextErrors.serviceSpecialtyId = 'Escolha qual serviço esse profissional realiza.';
    if (!isAddingToExistingProvider && serviceSpecialtyId === 'outros' && !customServiceDescription.trim()) nextErrors.customServiceDescription = 'Descreva o serviço.';
    if (!servicePerformed.trim()) nextErrors.servicePerformed = 'Informe qual serviço foi realizado.';
    if (!usedWhen) nextErrors.usedWhen = 'Escolha quando você utilizou.';
    if (!rating) nextErrors.rating = 'Escolha uma nota.';
    if (wouldHireAgain === null) nextErrors.wouldHireAgain = 'Informe se contrataria novamente.';
    if (!comment.trim()) nextErrors.comment = 'Conte como foi sua experiência.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit() {
    if (!user || !validate() || !usedWhen || wouldHireAgain === null) return;
    const wasAddingToExistingProvider = Boolean(contextualProvider);
    const specialty = contextualProvider ? getServiceSpecialtyById(contextualProvider.serviceSpecialtyId) : getServiceSpecialtyById(serviceSpecialtyId);
    const payload: NewRecommendationPayload = {
      supplierName: contextualProvider?.supplierName ?? supplierName.trim(),
      categoryId: contextualProvider?.categoryId ?? specialty?.categoryId ?? 'outros',
      serviceSpecialtyId: contextualProvider?.serviceSpecialtyId ?? serviceSpecialtyId,
      customServiceDescription: contextualProvider?.customServiceDescription ?? (serviceSpecialtyId === 'outros' ? customServiceDescription.trim() : undefined),
      whatsapp: contextualProvider?.whatsapp ?? whatsapp.trim(),
      servicePerformed: servicePerformed.trim(),
      usedWhen,
      wouldHireAgain,
      rating,
      comment: comment.trim(),
      photos: photos.map((photo) => photo.uri),
      confirmedUse: true
    };

    setLoading(true);
    if (contextualProvider) {
      const result = await addReviewToExistingRecommendation(user, contextualProvider.id, payload);
      setSuccessTarget({ type: 'provider', recommendationId: contextualProvider.id, reviewId: result?.reviews[0]?.id });
    } else {
      const result = await addRecommendation(user, payload);
      setSuccessTarget({ type: 'home', recommendationId: result.id });
    }
    setLoading(false);
    setSupplierName('');
    setServiceSpecialtyId('');
    setServiceSearch('');
    setCustomServiceDescription('');
    setWhatsapp('');
    setServicePerformed('');
    setUsedWhen(null);
    setRating(0);
    setWouldHireAgain(null);
    setComment('');
    setPhotos([]);
    setErrors({});
    navigation.setParams?.({ providerId: undefined });
    setSuccessMessage(
      wasAddingToExistingProvider
        ? 'Sua experiência foi adicionada ao perfil do prestador.'
        : 'Sua indicação foi compartilhada com a comunidade.'
    );
    return;
  }

  async function pickPhotos() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        orderedSelection: true,
        selectionLimit: 6,
        quality: 0.72
      });

      if (result.canceled) return;
      const selectedPhotos = result.assets.map((asset: { uri: string }) => ({
        id: `${asset.uri}-${Date.now()}-${Math.random()}`,
        uri: asset.uri
      }));
      setPhotos((current) => [...current, ...selectedPhotos].slice(0, 6));
    } catch {
      Alert.alert('Não foi possível abrir suas fotos', 'Tente novamente em instantes.');
    }
  }

  function removePhoto(id: string) {
    setPhotos((current) => current.filter((photo) => photo.id !== id));
  }

  function focusCommentField() {
    const targetY = Math.max(commentFieldY - 24, 0);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: targetY, animated: true });
    }, Platform.OS === 'ios' ? 120 : 40);
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? Math.max(insets.top, 8) : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.lg,
              paddingBottom: tabBarHeight + spacing.lg
            }
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
      <View style={styles.screen}>
        <View style={styles.intro}>
          <Text style={styles.title}>{isContextualReviewFlow ? 'Compartilhar experiência' : 'Indicar serviço'}</Text>
          <Text style={styles.subtitle}>
            {isContextualReviewFlow
              ? 'Conte como foi contratar este profissional e ajude seus vizinhos a decidir com mais confiança.'
              : 'Ajude seus vizinhos compartilhando profissionais confiáveis que você realmente utilizou.'}
          </Text>
        </View>

        {isContextualReviewFlow && contextualProvider ? (
          <ProviderSummaryCard provider={contextualProvider} />
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profissional</Text>
            <AppInput label="Nome do fornecedor" value={supplierName} onChangeText={setSupplierName} error={errors.supplierName} placeholder="Ex: Dona Cida Diarista" />
            <PhoneInput label="WhatsApp/contato" value={whatsapp} onChangeText={setWhatsapp} error={errors.whatsapp} helperText="Escolha o país e digite DDD + número." />
            {existingProvider ? (
              <ExistingProviderCard
                provider={existingProvider}
                onViewProvider={() => navigation.getParent()?.navigate('RecommendationDetail', { id: existingProvider.id })}
              />
            ) : (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Qual serviço esse profissional realiza?</Text>
                <Pressable
                  style={[styles.serviceSelector, selectedSpecialty && styles.serviceSelectorSelected]}
                  onPress={() => {
                    setServiceSearch('');
                    setShowAllServices(false);
                    setServicePickerOpen(true);
                  }}
                >
                  <Search color={selectedSpecialty ? colors.primary : colors.secondaryText} size={18} />
                  <Text style={[styles.serviceSelectorText, selectedSpecialty && styles.serviceSelectorTextSelected]}>
                    {selectedSpecialty?.name ?? 'Buscar serviço'}
                  </Text>
                </Pressable>
                <Text style={styles.popularLabel}>Mais procurados</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularChipList}>
                  {getPopularSelectorServices().map((specialtyItem) => (
                    <Pressable key={specialtyItem.id} style={[styles.popularChip, serviceSpecialtyId === specialtyItem.id && styles.popularChipSelected]} onPress={() => selectSpecialty(specialtyItem.id)}>
                      <Text style={[styles.popularChipText, serviceSpecialtyId === specialtyItem.id && styles.popularChipTextSelected]}>{specialtyItem.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
            {!existingProvider ? (
              <>
              {errors.serviceSpecialtyId ? <Text style={styles.error}>{errors.serviceSpecialtyId}</Text> : null}
              {serviceSpecialtyId === 'outros' ? (
                <AppInput
                  label="Descreva o serviço"
                  value={customServiceDescription}
                  onChangeText={setCustomServiceDescription}
                  error={errors.customServiceDescription}
                  placeholder="Ex: afiação de facas, instalação de tela, professor particular..."
                />
              ) : null}
              </>
            ) : null}
          </View>
        )}

        <View style={[styles.section, isContextualReviewFlow && styles.composerSection]}>
          <Text style={styles.sectionTitle}>Sua experiência</Text>
          {isContextualReviewFlow ? <Text style={styles.sectionHint}>Você não está editando o prestador. Sua contribuição entra como uma nova experiência no perfil.</Text> : null}
          <AppInput
            label="Serviço realizado"
            value={servicePerformed}
            onChangeText={setServicePerformed}
            error={errors.servicePerformed}
            placeholder={getServicePerformedPlaceholder(contextualProvider)}
          />

          <OptionGroup label="Quando você utilizou?" error={errors.usedWhen}>
            {usedWhenOptions.map((option) => (
              <Pressable key={option.value} style={[styles.optionChip, usedWhen === option.value && styles.optionSelected]} onPress={() => setUsedWhen(option.value)}>
                <Text style={[styles.optionText, usedWhen === option.value && styles.optionTextSelected]}>{option.label}</Text>
              </Pressable>
            ))}
          </OptionGroup>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nota</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable key={value} accessibilityRole="button" onPress={() => setRating(value)} style={styles.starButton}>
                  <Star color={value <= rating ? colors.star : '#C9D1CC'} fill={value <= rating ? colors.star : 'transparent'} size={28} />
                </Pressable>
              ))}
            </View>
            <Text style={styles.ratingText}>{rating ? ratingLabels[rating - 1] : 'Toque para avaliar'}</Text>
            {errors.rating ? <Text style={styles.error}>{errors.rating}</Text> : null}
          </View>

          <OptionGroup label="Você contrataria novamente?" error={errors.wouldHireAgain}>
            <Pressable style={[styles.binaryOption, wouldHireAgain === true && styles.optionSelected]} onPress={() => setWouldHireAgain(true)}>
              <Text style={[styles.optionText, wouldHireAgain === true && styles.optionTextSelected]}>Sim</Text>
            </Pressable>
            <Pressable style={[styles.binaryOption, wouldHireAgain === false && styles.optionSelected]} onPress={() => setWouldHireAgain(false)}>
              <Text style={[styles.optionText, wouldHireAgain === false && styles.optionTextSelected]}>Não</Text>
            </Pressable>
          </OptionGroup>

          <View onLayout={(event) => setCommentFieldY(event.nativeEvent.layout.y)}>
            <AppInput
              label="Comentário"
              value={comment}
              onChangeText={setComment}
              onFocus={focusCommentField}
              error={errors.comment}
              multiline
              placeholder="Conte como foi sua experiência. O profissional foi pontual? Confiável? Resolveu o problema?"
              style={styles.commentInput}
            />
          </View>

          <PhotoUploadSection photos={photos} onPickPhotos={pickPhotos} onRemovePhoto={removePhoto} />
        </View>

        <AppButton title={contextualProvider ? 'Adicionar recomendação' : 'Indicar aos vizinhos'} onPress={submit} loading={loading} style={styles.submitButton} />
      </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <SuccessModal
        visible={Boolean(successMessage)}
        message={successMessage}
        onClose={() => {
          setSuccessMessage('');
          if (successTarget?.type === 'provider') {
            navigation.getParent()?.navigate('RecommendationDetail', {
              id: successTarget.recommendationId,
              focusReviewId: successTarget.reviewId
            });
          } else if (successTarget?.type === 'home') {
            navigation.navigate('Resident', {
              screen: 'Home',
              params: { focusRecommendationId: successTarget.recommendationId }
            });
          } else {
            navigation.navigate('Resident', { screen: 'Home' });
          }
          setSuccessTarget(null);
        }}
      />
      <ServiceSpecialtyPicker
        visible={servicePickerOpen}
        query={serviceSearch}
        selectedId={serviceSpecialtyId}
        expanded={showAllServices}
        onChangeQuery={setServiceSearch}
        onClose={() => {
          setServiceSearch('');
          setServicePickerOpen(false);
          setShowAllServices(false);
        }}
        onToggleExpanded={() => setShowAllServices((value) => !value)}
        onSelect={selectSpecialty}
      />
    </SafeAreaView>
  );

  function selectSpecialty(id: string) {
    setServiceSpecialtyId(id);
    setServiceSearch('');
    if (id !== 'outros') setCustomServiceDescription('');
    setServicePickerOpen(false);
    setShowAllServices(false);
  }
}

function ProviderSummaryCard({ provider }: { provider: any }) {
  const hireAgain = getHireAgainMetric(provider.reviews ?? []);

  return (
    <View style={styles.providerSummaryCard}>
      <View style={styles.providerSummaryHeader}>
        <View style={styles.providerAvatar}>
          <Text style={styles.providerAvatarText}>{provider.supplierName.slice(0, 1)}</Text>
        </View>
        <View style={styles.providerTextWrap}>
          <Text style={styles.providerName}>{provider.supplierName}</Text>
          <Text style={styles.providerMeta}>{provider.customServiceDescription || provider.serviceSpecialtyName || provider.categoryName}</Text>
        </View>
      </View>
      <View style={styles.providerSummaryMetaRow}>
        <View style={styles.providerRatingMeta}>
          <Star color={colors.star} fill={colors.star} size={14} />
          <Text style={styles.providerRatingText}>{provider.averageRating.toFixed(1)}</Text>
          <Text style={styles.providerRatingCount}>({provider.reviews?.length ?? 0})</Text>
        </View>
        {hireAgain.total >= 3 ? (
          <View style={styles.providerTrustMeta}>
            <Text style={styles.providerMetaDivider}>•</Text>
            <Text style={styles.providerTrustPercent}>{hireAgain.percentage}%</Text>
            <Text style={styles.providerTrustLabel}>contratariam novamente</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.providerContact}>{provider.whatsapp}</Text>
    </View>
  );
}

function ExistingProviderCard({ provider, onViewProvider }: { provider: any; onViewProvider: () => void }) {
  return (
    <View style={styles.existingProviderCard}>
      <Text style={styles.existingProviderTitle}>Este prestador já existe na comunidade.</Text>
      <Text style={styles.existingProviderCopy}>Você pode somar sua experiência ao perfil que outros moradores já conhecem.</Text>
      <View style={styles.existingProviderInfo}>
        <View style={styles.providerAvatar}>
          <Text style={styles.providerAvatarText}>{provider.supplierName.slice(0, 1)}</Text>
        </View>
        <View style={styles.providerTextWrap}>
          <Text style={styles.providerName}>{provider.supplierName}</Text>
          <Text style={styles.providerMeta}>{provider.customServiceDescription || provider.serviceSpecialtyName || provider.categoryName}</Text>
          <Text style={styles.providerStats}>{provider.averageRating.toFixed(1)} estrelas · {provider.recommendedByCount} recomendações</Text>
        </View>
      </View>
      <View style={styles.existingProviderActions}>
        <Pressable style={styles.providerGhostButton} onPress={onViewProvider}>
          <Text style={styles.providerGhostButtonText}>Ver prestador</Text>
        </Pressable>
        <Text style={styles.providerActionHint}>Adicionar recomendação abaixo</Text>
      </View>
    </View>
  );
}

function getHireAgainMetric(reviews: any[]) {
  const total = reviews.length;
  if (!total) return { percentage: 100, total };
  const yes = reviews.filter((review) => (typeof review.wouldHireAgain === 'boolean' ? review.wouldHireAgain : review.rating >= 4.5)).length;
  return { percentage: Math.round((yes / total) * 100), total };
}

function getServicePerformedPlaceholder(provider?: any) {
  const service = normalize(provider?.serviceSpecialtyName || provider?.customServiceDescription || '');
  if (service.includes('diarista') || service.includes('limpeza')) return 'Ex: limpeza semanal, faxina pós-obra...';
  if (service.includes('eletricista')) return 'Ex: troca de disjuntor, instalação de tomada...';
  if (service.includes('jardineiro')) return 'Ex: poda do jardim, limpeza do canteiro...';
  if (service.includes('piscineiro')) return 'Ex: limpeza da piscina, tratamento da água...';
  if (service.includes('chaveiro')) return 'Ex: troca de fechadura, abertura emergencial...';
  return 'Ex: descreva o serviço que este profissional realizou';
}

function SuccessModal({ visible, message, onClose }: { visible: boolean; message: string; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.successBackdrop}>
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>Recomendação adicionada</Text>
          <Text style={styles.successText}>{message}</Text>
          <Pressable accessibilityRole="button" style={styles.successButton} onPress={onClose}>
            <Text style={styles.successButtonText}>Fechar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function PhotoUploadSection({
  photos,
  onPickPhotos,
  onRemovePhoto
}: {
  photos: UploadedPhoto[];
  onPickPhotos: () => void;
  onRemovePhoto: (id: string) => void;
}) {
  return (
    <View style={styles.photoSection}>
      <View style={styles.photoHeader}>
        <Text style={styles.label}>Fotos do serviço (opcional)</Text>
        <Text style={styles.photoHelper}>Adicione fotos para ajudar outros moradores a entender melhor o serviço realizado.</Text>
      </View>
      <Pressable style={styles.uploadArea} onPress={onPickPhotos}>
        <View style={styles.uploadIconWrap}>
          <Camera color={colors.primary} size={18} />
        </View>
        <View style={styles.uploadTextWrap}>
          <Text style={styles.uploadTitle}>Adicionar fotos</Text>
          <Text style={styles.uploadHint}>Até 6 imagens da galeria</Text>
        </View>
      </Pressable>
      {photos.length ? (
        <View style={styles.photoGrid}>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.thumbnailWrap}>
              <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
              <Pressable style={styles.removePhotoButton} onPress={() => onRemovePhoto(photo.id)} accessibilityRole="button">
                <X color={colors.text} size={14} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
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
  selectedId: string;
  expanded: boolean;
  onChangeQuery: (value: string) => void;
  onClose: () => void;
  onToggleExpanded: () => void;
  onSelect: (id: string) => void;
}) {
  const normalized = normalize(query);
  const allServices = getServiceSuggestions(query);
  const visibleServices = normalized ? allServices : expanded ? allServices : allServices.filter((item) => item.id !== 'outros').slice(0, 5);

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
            <Text style={styles.sheetTitle}>Escolha o serviço</Text>
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
              <Text style={styles.sheetSectionTitle}>{normalized ? 'Resultados' : 'Todos os serviços'}</Text>
              {!normalized ? (
                <Pressable onPress={onToggleExpanded}>
                  <Text style={styles.expandText}>{expanded ? 'Ver menos' : 'Ver todos'}</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.suggestionList}>
              {visibleServices.map((specialty) => (
                <Pressable key={specialty.id} style={({ pressed }) => [styles.suggestionItem, pressed && styles.suggestionPressed]} onPress={() => onSelect(specialty.id)}>
                  <Text style={styles.suggestionName}>{specialty.name}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function OptionGroup({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionWrap}>{children}</View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
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

function getPopularSelectorServices() {
  const ids = ['diarista', 'eletricista', 'jardineiro', 'encanador', 'piscineiro', 'marido_de_aluguel'];
  return ids.map((id) => getServiceSpecialtyById(id)).filter(Boolean) as NonNullable<ReturnType<typeof getServiceSpecialtyById>>[];
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  keyboardArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  screen: { gap: spacing.md },
  intro: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2ECE7',
    padding: spacing.md,
    gap: 7,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2
  },
  title: { color: colors.text, fontSize: 25, lineHeight: 30, fontWeight: '900', fontFamily: typography.fontFamily },
  subtitle: { color: colors.secondaryText, fontSize: typography.small, lineHeight: 19, fontFamily: typography.fontFamily },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5ECE8',
    padding: spacing.md,
    gap: spacing.sm
  },
  composerSection: {
    gap: 10
  },
  sectionTitle: { color: colors.text, fontSize: typography.body, lineHeight: 21, fontWeight: '800', fontFamily: typography.fontFamily },
  sectionHint: { color: '#6B8179', fontSize: typography.tiny, lineHeight: 16, fontWeight: '500', fontFamily: typography.fontFamily },
  label: { color: colors.text, fontSize: typography.small, lineHeight: 18, fontWeight: '700', fontFamily: typography.fontFamily },
  serviceSelector: {
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
  serviceSelectorSelected: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primary
  },
  serviceSelectorText: {
    flex: 1,
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  },
  serviceSelectorTextSelected: { color: colors.primary, fontWeight: '800' },
  serviceSearchInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  },
  popularLabel: { color: colors.secondaryText, fontSize: typography.tiny, lineHeight: 15, fontWeight: '700', fontFamily: typography.fontFamily },
  popularChipList: { gap: 7, paddingRight: spacing.md },
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
  popularChipSelected: { backgroundColor: colors.lightGreen, borderColor: colors.primary },
  popularChipText: { color: colors.text, fontSize: typography.small, fontWeight: '600', fontFamily: typography.fontFamily },
  popularChipTextSelected: { color: colors.primary, fontWeight: '800' },
  providerSummaryCard: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E7ECE9',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2
  },
  providerSummaryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  providerSummaryMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  providerRatingMeta: {
    minHeight: 25,
    borderRadius: 999,
    backgroundColor: '#FFF7E8',
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  providerRatingText: { color: colors.text, fontSize: typography.tiny, fontWeight: '700', fontFamily: typography.fontFamily },
  providerRatingCount: { color: colors.secondaryText, fontSize: typography.tiny, fontWeight: '700', fontFamily: typography.fontFamily },
  providerTrustMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 24 },
  providerMetaDivider: { color: '#C0AE7B', fontSize: typography.tiny, lineHeight: 15, fontWeight: '700', fontFamily: typography.fontFamily },
  providerTrustPercent: { color: '#3F6F61', fontSize: typography.tiny, lineHeight: 15, fontWeight: '700', fontFamily: typography.fontFamily },
  providerTrustLabel: { color: '#6B8179', fontSize: typography.tiny, lineHeight: 15, fontWeight: '500', fontFamily: typography.fontFamily },
  providerContact: { color: '#6B8179', fontSize: typography.tiny, lineHeight: 15, fontWeight: '600', fontFamily: typography.fontFamily },
  existingProviderCard: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#DDE9E4',
    backgroundColor: '#F7FAF8',
    padding: spacing.sm,
    gap: spacing.sm
  },
  existingProviderTitle: { color: colors.darkGreen, fontSize: typography.small, lineHeight: 18, fontWeight: '900', fontFamily: typography.fontFamily },
  existingProviderCopy: { color: '#58766D', fontSize: typography.tiny, lineHeight: 16, fontFamily: typography.fontFamily },
  existingProviderInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  providerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center'
  },
  providerAvatarText: { color: colors.primary, fontSize: 18, fontWeight: '900', fontFamily: typography.fontFamily },
  providerTextWrap: { flex: 1, gap: 2 },
  providerName: { color: colors.text, fontSize: typography.small, lineHeight: 18, fontWeight: '900', fontFamily: typography.fontFamily },
  providerMeta: { color: colors.secondaryText, fontSize: typography.tiny, lineHeight: 15, fontWeight: '700', fontFamily: typography.fontFamily },
  providerStats: { color: colors.primary, fontSize: typography.tiny, lineHeight: 15, fontWeight: '800', fontFamily: typography.fontFamily },
  existingProviderActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  providerGhostButton: {
    minHeight: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  providerGhostButtonText: { color: colors.primary, fontSize: typography.tiny, fontWeight: '900', fontFamily: typography.fontFamily },
  providerActionHint: { flex: 1, color: colors.secondaryText, fontSize: typography.tiny, lineHeight: 15, fontWeight: '600', fontFamily: typography.fontFamily },
  photoSection: { gap: spacing.sm },
  photoHeader: { gap: 3 },
  photoHelper: { color: colors.secondaryText, fontSize: typography.tiny, lineHeight: 16, fontFamily: typography.fontFamily },
  uploadArea: {
    minHeight: 58,
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CFE0D9',
    backgroundColor: '#FBFCFB',
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  uploadIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadTextWrap: { flex: 1, gap: 2 },
  uploadTitle: { color: colors.text, fontSize: typography.small, fontWeight: '800', fontFamily: typography.fontFamily },
  uploadHint: { color: colors.secondaryText, fontSize: typography.tiny, fontFamily: typography.fontFamily },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbnailWrap: { width: 68, height: 68, borderRadius: 15 },
  thumbnail: { width: 68, height: 68, borderRadius: 15, backgroundColor: colors.muted },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDE9E4'
  },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
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
  sheetExpanded: { maxHeight: '82%' },
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
  sheetContent: { gap: spacing.sm, paddingBottom: spacing.xl },
  sheetSectionTitle: { color: colors.secondaryText, fontSize: typography.tiny, lineHeight: 15, fontWeight: '800', fontFamily: typography.fontFamily },
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
  fieldGroup: { gap: 5 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  optionChip: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DDE9E4',
    backgroundColor: '#FBFCFB',
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  binaryOption: {
    flex: 1,
    minHeight: 38,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#DDE9E4',
    backgroundColor: '#FBFCFB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionSelected: { backgroundColor: colors.lightGreen, borderColor: colors.primary },
  optionText: { color: colors.text, fontSize: typography.small, fontWeight: '600', fontFamily: typography.fontFamily },
  optionTextSelected: { color: colors.primary, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  starButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  ratingText: { color: colors.secondaryText, fontSize: typography.tiny, lineHeight: 15, fontWeight: '600', fontFamily: typography.fontFamily },
  commentInput: { minHeight: 88, textAlignVertical: 'top', paddingTop: spacing.sm, lineHeight: 20 },
  submitButton: { minHeight: 48, borderRadius: 15 },
  successBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 31, 27, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg
  },
  successCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E2ECE7',
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8
  },
  successTitle: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  successText: {
    color: colors.secondaryText,
    fontSize: typography.small,
    lineHeight: 20,
    fontFamily: typography.fontFamily
  },
  successButton: {
    minHeight: 46,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs
  },
  successButtonText: {
    color: colors.surface,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  error: { color: colors.error, fontSize: typography.tiny, lineHeight: 16, fontWeight: '600', fontFamily: typography.fontFamily }
});
