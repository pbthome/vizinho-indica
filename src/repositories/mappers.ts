import { Feedback, Recommendation, Review, User } from '../types';
import { Tables } from '../types/database';

type ProviderWithRelations = Tables<'providers'> & {
  provider_categories?: Pick<Tables<'provider_categories'>, 'id' | 'name'> | null;
  provider_specialties?: Pick<Tables<'provider_specialties'>, 'id' | 'name' | 'category_id'> | null;
  reviews?: Array<Tables<'reviews'> & { users?: Pick<Tables<'users'>, 'full_name' | 'block' | 'apartment'> | null; review_photos?: Tables<'review_photos'>[] }>;
};

export function mapDbUser(row: Tables<'users'> & { condominiums?: Pick<Tables<'condominiums'>, 'name'> | null }): User {
  const block = row.block?.trim();
  const apartment = row.apartment?.trim();
  const unit = [block ? `Quadra ${block}` : '', apartment ? `Lote ${apartment}` : ''].filter(Boolean).join(', ');
  const userStatus = row.role === 'admin' && row.status === 'approved' ? 'admin' : row.status;

  return {
    id: row.id,
    name: row.full_name,
    phone: row.phone ?? '',
    email: row.email,
    condominiumId: row.condominium_id,
    condominiumName: row.condominiums?.name ?? 'Condominio',
    unit,
    status: userStatus
  };
}

export function mapDbReview(row: Tables<'reviews'> & { users?: Pick<Tables<'users'>, 'full_name' | 'block' | 'apartment'> | null; review_photos?: Tables<'review_photos'>[] }): Review {
  const reviewerBlock = row.users?.block ?? undefined;
  const reviewerLot = row.users?.apartment ?? undefined;
  const residentName = [row.users?.full_name ?? 'Morador', reviewerBlock ? `Quadra ${reviewerBlock}` : '', reviewerLot ? `Lote ${reviewerLot}` : '']
    .filter(Boolean)
    .join(', ');

  return {
    id: row.id,
    recommendationId: row.provider_id,
    residentName,
    reviewerName: row.users?.full_name ?? undefined,
    reviewerBlock,
    reviewerLot,
    servicePerformed: row.service_performed ?? undefined,
    usedWhen: row.used_when ?? undefined,
    realUseConfirmed: row.real_use_confirmed,
    rating: row.rating,
    comment: row.comment,
    wouldHireAgain: row.would_hire_again,
    photos: row.review_photos?.filter((photo) => !photo.deleted_at).map((photo) => photo.storage_path) ?? [],
    createdAt: row.created_at.slice(0, 10),
    uploadedAt: row.created_at
  };
}

export function mapDbProvider(row: ProviderWithRelations): Recommendation {
  const reviews = (row.reviews ?? []).filter((review) => !review.deleted_at).map(mapDbReview);
  const latestReview = [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return {
    id: row.id,
    condominiumId: row.condominium_id,
    supplierName: row.name,
    categoryId: row.provider_categories?.id ?? row.category_id ?? 'outros',
    categoryName: row.provider_categories?.name ?? 'Outros',
    serviceSpecialtyId: row.provider_specialties?.id ?? row.service_specialty_id ?? undefined,
    serviceSpecialtyName: row.provider_specialties?.name ?? row.service_specialty_name ?? undefined,
    customServiceDescription: row.custom_service_description ?? undefined,
    whatsapp: row.whatsapp ?? row.phone ?? '',
    normalizedPhone: row.phone ?? row.whatsapp ?? '',
    contactInfo: row.description ?? 'Contato informado por morador.',
    averageRating: Number(row.average_rating ?? 0),
    recommendedByCount: row.total_reviews,
    shortComment: latestReview?.comment ?? row.description ?? '',
    servicePerformed: latestReview?.servicePerformed ?? row.description ?? undefined,
    usedWhen: latestReview?.usedWhen,
    realUseConfirmed: latestReview?.realUseConfirmed,
    wouldHireAgain: row.would_hire_again_rate >= 50,
    photos: reviews.flatMap((review) => review.photos ?? []),
    providerPhotos: [],
    createdAt: row.created_at.slice(0, 10),
    uploadedAt: row.updated_at,
    reviews
  };
}

export function mapDbFeedback(row: Tables<'feedbacks'> & { users?: Pick<Tables<'users'>, 'full_name'> | null }): Feedback {
  return {
    id: row.id,
    condominiumId: row.condominium_id,
    userId: row.user_id,
    userName: row.users?.full_name ?? undefined,
    subject: row.subject as Feedback['subject'],
    message: row.message,
    createdAt: row.created_at,
    status: row.status === 'new' ? 'novo' : row.status === 'read' ? 'lido' : 'resolvido',
    archivedAt: row.status === 'archived' ? row.resolved_at ?? undefined : undefined
  };
}
