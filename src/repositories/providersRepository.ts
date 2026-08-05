import { getCategoryById, getServiceSpecialtyById } from '../constants/categories';
import { supabase } from '../services/supabase/client';
import { NewRecommendationPayload, Recommendation, User } from '../types';
import { toAmericanNameCase } from '../utils/name';
import { normalizePhoneNumber } from '../utils/phone';
import { trackEvent } from './analyticsRepository';
import { mapDbProvider } from './mappers';
import { createReviewPhotoUrls, uploadReviewPhoto } from './storageRepository';

const DUPLICATE_PROVIDER_MESSAGE = 'Este prestador ja existe na comunidade. Adicione sua experiencia ao perfil existente.';

export async function listProviders(condominiumId: string, limit = 50, offset = 0) {
  const { data, error } = await providerQuery()
    .eq('condominium_id', condominiumId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return hydratePhotoUrls((data ?? []).map((row) => mapDbProvider(row as any)));
}

export async function getProviderById(id: string) {
  const { data, error } = await providerQuery().eq('id', id).is('deleted_at', null).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return undefined;

  const provider = (await hydratePhotoUrls([mapDbProvider(data as any)]))[0];
  await trackEvent({
    condominiumId: provider.condominiumId,
    eventType: 'provider_view',
    entityType: 'provider',
    entityId: provider.id
  }).catch(() => undefined);
  return provider;
}

export async function findProviderByPhone(condominiumId: string, phone: string) {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return undefined;

  const { data, error } = await providerQuery()
    .eq('condominium_id', condominiumId)
    .is('deleted_at', null)
    .or(`phone.eq.${normalized},whatsapp.eq.${phone.trim()}`)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? (await hydratePhotoUrls([mapDbProvider(data as any)]))[0] : undefined;
}

export async function searchProviders(condominiumId: string, query: string, categoryId?: string, minRating?: number) {
  const normalized = query.trim();
  const specialty = getServiceSpecialtyById(categoryId);
  const category = getCategoryById(categoryId);
  let request = providerQuery()
    .eq('condominium_id', condominiumId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (normalized) request = request.or(`name.ilike.%${normalized}%,description.ilike.%${normalized}%,whatsapp.ilike.%${normalized}%`);
  if (specialty) {
    request = request.or(`service_specialty_id.eq.${specialty.id},additional_service_specialty_ids.cs.{${specialty.id}}`);
  } else if (category) {
    request = request.eq('category_id', category.id);
  }
  if (minRating) request = request.gte('average_rating', minRating);

  const { data, error } = await request;
  if (error) throw new Error(error.message);

  const results = await hydratePhotoUrls((data ?? []).map((row) => mapDbProvider(row as any)));
  await trackEvent({
    condominiumId,
    eventType: 'search_performed',
    entityType: 'provider',
    metadata: { query: normalized, results_count: results.length }
  }).catch(() => undefined);
  await supabase
    .from('searches')
    .insert({ condominium_id: condominiumId, user_id: null, query: normalized || 'todos', results_count: results.length })
    .then(() => undefined);
  return results;
}

export async function createProviderWithReview(user: User, payload: NewRecommendationPayload) {
  const normalizedPhone = normalizePhoneNumber(payload.whatsapp);
  const formattedSupplierName = toAmericanNameCase(payload.supplierName);
  const existingProvider = await findProviderByPhone(user.condominiumId, payload.whatsapp);
  if (existingProvider) throw new Error(DUPLICATE_PROVIDER_MESSAGE);

  const specialty = await resolveSpecialty(payload.serviceSpecialtyId);
  const additionalSpecialties = await resolveAdditionalSpecialties(
    payload.additionalServiceSpecialtyIds ?? [],
    specialty.id
  );
  const { data: provider, error } = await supabase
    .from('providers')
    .insert({
      condominium_id: user.condominiumId,
      category_id: specialty.category_id,
      name: formattedSupplierName,
      phone: normalizedPhone,
      whatsapp: payload.whatsapp,
      description: payload.servicePerformed ?? null,
      service_specialty_id: specialty.id,
      service_specialty_name: specialty.name,
      custom_service_description: payload.customServiceDescription ?? null,
      business_description: payload.businessDescription ?? null,
      additional_service_specialty_ids: additionalSpecialties.map((item) => item.id),
      additional_service_specialty_names: additionalSpecialties.map((item) => item.name),
      created_by: user.id
    })
    .select('id')
    .single();

  if (error) {
    if (isDuplicateProviderPhoneError(error.message)) throw new Error(DUPLICATE_PROVIDER_MESSAGE);
    throw new Error(error.message);
  }
  if (payload.serviceSpecialtyId === 'outros' && payload.customServiceDescription) {
    const category = getCategoryById(payload.suggestedCategoryId);
    const { data: suggestedCategory } = category
      ? await supabase.from('provider_categories').select('id').eq('name', getDatabaseCategoryName(category.name)).maybeSingle()
      : { data: null };
    const { error: suggestionError } = await supabase.from('service_suggestions').insert({
      condominium_id: user.condominiumId,
      proposed_name: payload.customServiceDescription,
      suggested_category_id: suggestedCategory?.id ?? null,
      provider_id: provider.id,
      created_by: user.id,
      status: 'pending'
    });
    if (suggestionError) throw new Error(`Prestador salvo, mas a sugestão de serviço não foi enviada: ${suggestionError.message}`);
  }
  await createReview(user, provider.id, payload);

  const created = await getProviderById(provider.id);
  if (!created) throw new Error('Fornecedor criado, mas não encontrado após salvar.');
  return created;
}

export async function createReviewForProvider(user: User, providerId: string, payload: NewRecommendationPayload) {
  const reviewId = await createReview(user, providerId, payload);
  const provider = await getProviderById(providerId);
  if (!provider) return undefined;

  return {
    ...provider,
    reviews: provider.reviews.sort((a, b) => (a.id === reviewId ? -1 : b.id === reviewId ? 1 : 0))
  };
}

async function createReview(user: User, providerId: string, payload: NewRecommendationPayload) {
  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      condominium_id: user.condominiumId,
      provider_id: providerId,
      user_id: user.id,
      rating: payload.rating,
      comment: payload.comment,
      service_performed: payload.servicePerformed ?? null,
      used_when: payload.usedWhen,
      would_hire_again: payload.wouldHireAgain,
      real_use_confirmed: payload.confirmedUse
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  await uploadReviewPhotos(user, providerId, review.id, payload.photos ?? []);
  await trackEvent({
    condominiumId: user.condominiumId,
    userId: user.id,
    eventType: 'review_created',
    entityType: 'review',
    entityId: review.id,
    metadata: { provider_id: providerId }
  }).catch(() => undefined);

  return review.id;
}

async function uploadReviewPhotos(user: User, providerId: string, reviewId: string, photos: string[]) {
  const uploadedPaths = [];

  for (const uri of photos) {
    const storagePath = await uploadReviewPhoto({
      condominiumId: user.condominiumId,
      providerId,
      reviewId,
      userId: user.id,
      uri
    });
    uploadedPaths.push(storagePath);
  }

  if (!uploadedPaths.length) return;

  const { error } = await supabase.from('review_photos').insert(
    uploadedPaths.map((storagePath) => ({
      condominium_id: user.condominiumId,
      review_id: reviewId,
      uploaded_by: user.id,
      storage_path: storagePath
    }))
  );

  if (error) throw new Error(error.message);
}

async function resolveSpecialty(serviceSpecialtyId: string) {
  const { data, error } = await supabase
    .from('provider_specialties')
    .select('id, name, category_id')
    .eq('id', serviceSpecialtyId)
    .eq('active', true)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function resolveAdditionalSpecialties(ids: string[], primaryId: string) {
  const uniqueIds = [...new Set(ids)].filter((id) => id !== primaryId && id !== 'outros').slice(0, 4);
  if (!uniqueIds.length) return [];
  const { data, error } = await supabase
    .from('provider_specialties')
    .select('id, name, category_id')
    .in('id', uniqueIds)
    .eq('active', true);
  if (error) throw new Error(error.message);
  if ((data ?? []).length !== uniqueIds.length) throw new Error('Um dos serviços adicionais não está mais disponível.');
  return uniqueIds.map((id) => (data ?? []).find((item) => item.id === id)!);
}

function getDatabaseCategoryName(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function isDuplicateProviderPhoneError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes('uq_providers_condominium_phone_active') || normalized.includes('providers_condominium_id_phone');
}

function providerQuery() {
  return supabase.from('providers').select(`
    *,
    provider_categories(id, name),
    reviews(
      *,
      users!reviews_user_id_fkey(full_name, block, apartment),
      review_photos(*)
    )
  `);
}

async function hydratePhotoUrls(items: Recommendation[]) {
  const paths = items.flatMap((item) => item.reviews.flatMap((review) => review.photos ?? []));
  const signedUrls = await createReviewPhotoUrls(paths);

  return items.map((item) => ({
    ...item,
    photos: (item.photos ?? []).map((path) => signedUrls.get(path) ?? path),
    reviews: item.reviews.map((review) => ({
      ...review,
      photos: (review.photos ?? []).map((path) => signedUrls.get(path) ?? path)
    }))
  }));
}
