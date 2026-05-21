import { getCategoryById, getServiceSpecialtyById } from '../constants/categories';
import { supabase } from '../services/supabase/client';
import { NewRecommendationPayload, Recommendation, User } from '../types';
import { normalizePhoneNumber } from '../utils/phone';
import { trackEvent } from './analyticsRepository';
import { mapDbProvider } from './mappers';
import { createReviewPhotoUrls, uploadReviewPhoto } from './storageRepository';

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
    request = request.eq('service_specialty_id', specialty.id);
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
  const specialty = await resolveSpecialty(payload.serviceSpecialtyId);
  const { data: provider, error } = await supabase
    .from('providers')
    .insert({
      condominium_id: user.condominiumId,
      category_id: specialty.category_id,
      name: payload.supplierName,
      phone: normalizePhoneNumber(payload.whatsapp),
      whatsapp: payload.whatsapp,
      description: payload.servicePerformed,
      service_specialty_id: specialty.id,
      service_specialty_name: specialty.name,
      custom_service_description: payload.customServiceDescription ?? null,
      created_by: user.id
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  await createReview(user, provider.id, payload);

  const created = await getProviderById(provider.id);
  if (!created) throw new Error('Fornecedor criado, mas nao encontrado apos salvar.');
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
      service_performed: payload.servicePerformed,
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
