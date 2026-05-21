import { getCategoryById, getServiceSpecialtyById } from '../constants/categories';
import {
  accessRequests as initialRequests,
  feedbacks as initialFeedbacks,
  recommendations as initialRecommendations,
  reports as initialReports,
  users
} from '../data/mockData';
import { AccessRequest, CreateFeedbackPayload, DeletedPhoto, Feedback, NewRecommendationPayload, Recommendation, Report, Review, SignUpPayload, User } from '../types';
import { normalizePhoneNumber } from '../utils/phone';
import { isSupabaseConfigured } from './supabase/config';
import {
  getCurrentProfile,
  signInWithPassword,
  signOut as supabaseSignOut,
  sendPasswordReset,
  signUpPendingAccess
} from '../repositories/authRepository';
import {
  createProviderWithReview,
  createReviewForProvider,
  findProviderByPhone,
  getProviderById,
  listProviders,
  searchProviders
} from '../repositories/providersRepository';
import { createFeedback } from '../repositories/feedbackRepository';
import {
  decideAccessRequest,
  fetchAllAccessRequests as fetchAllAccessRequestsFromRepository,
  fetchPendingAccessRequests as fetchPendingAccessRequestsFromRepository,
  listFeedbacks,
  listModerationContent,
  listReports,
  moderateReview,
  moderateReviewPhoto,
  resolveReport,
  updateFeedbackStatus
} from '../repositories/adminRepository';
import { getDashboardMetrics } from '../repositories/dashboardRepository';

export type AdminMetricsRange = 'day' | 'week' | 'month';

export type AdminMetricPoint = {
  label: string;
  value: number;
};

export type AdminDashboardMetrics = {
  totals: {
    residents: number;
    suppliers: number;
    reviews: number;
    monthlyActiveUsers: number;
  };
  derived: {
    activeResidentsPercentage: number;
    reviewsPerSupplier: number;
  };
  trends: Record<
    AdminMetricsRange,
    {
      reviews: AdminMetricPoint[];
      activeUsers: AdminMetricPoint[];
    }
  >;
  rankings: {
    searchedCategories: Array<{ name: string; count: number }>;
    viewedProviders: Array<{ name: string; service: string; views: number }>;
    latestReviews: Array<{ id: string; provider: string; reviewer: string; rating: number; comment: string; createdAt: string }>;
  };
};

export type ModerationContentType = 'comment' | 'photo' | 'review';

export type ModerationContentItem = {
  id: string;
  type: ModerationContentType;
  recommendationId: string;
  reviewId?: string;
  providerName: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  status: 'active' | 'removed';
  photoUri?: string;
};

let currentUser: User | null = null;
let recommendations: Recommendation[] = [...initialRecommendations];
let accessRequests: AccessRequest[] = [...initialRequests];
let reports: Report[] = [...initialReports];
let feedbacks: Feedback[] = [...initialFeedbacks];

const wait = async () => new Promise((resolve) => setTimeout(resolve, 250));
const active = (items: Recommendation[]) => items.filter((item) => !item.hidden && !item.deletedAt);

export async function getCurrentUser() {
  if (isSupabaseConfigured()) {
    currentUser = await getCurrentProfile();
    return currentUser;
  }
  await wait();
  return currentUser;
}

export async function login(identifier: string, password?: string) {
  if (isSupabaseConfigured()) {
    if (!password) throw new Error('Informe sua senha.');
    currentUser = await signInWithPassword(identifier, password);
    return currentUser;
  }
  await wait();
  const normalized = identifier.trim().toLowerCase();
  currentUser =
    users.find((user) => user.email.toLowerCase() === normalized || user.phone === normalized) ?? users[0];
  return currentUser;
}

export async function logout() {
  if (isSupabaseConfigured()) {
    await supabaseSignOut();
    currentUser = null;
    return;
  }
  await wait();
  currentUser = null;
}

export async function resetPassword(email: string) {
  if (isSupabaseConfigured()) {
    await sendPasswordReset(email);
    return;
  }
  await wait();
}

export async function requestAccess(payload: SignUpPayload) {
  if (isSupabaseConfigured()) {
    currentUser = await signUpPendingAccess(payload);
    return currentUser;
  }
  await wait();
  const request: AccessRequest = {
    id: `req-${Date.now()}`,
    condominiumId: 'condo-vila-verde',
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    unit: payload.unit,
    requestDate: new Date().toISOString().slice(0, 10),
    status: 'pending'
  };
  accessRequests = [request, ...accessRequests];
  currentUser = {
    id: `user-${Date.now()}`,
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    condominiumId: request.condominiumId,
    condominiumName: payload.condominium,
    unit: payload.unit,
    status: 'pending'
  };
  return currentUser;
}

export async function getRecommendations(condominiumId: string) {
  if (isSupabaseConfigured()) return listProviders(condominiumId);
  await wait();
  return active(recommendations)
    .filter((item) => item.condominiumId === condominiumId)
    .map(toPublicRecommendation);
}

export async function getAdminDashboardMetrics(condominiumId: string): Promise<AdminDashboardMetrics> {
  if (isSupabaseConfigured()) return getDashboardMetrics(condominiumId);
  await wait();
  const condominiumRecommendations = active(recommendations)
    .filter((item) => item.condominiumId === condominiumId)
    .map(toPublicRecommendation);
  const reviewEntries = condominiumRecommendations.flatMap((item) =>
    item.reviews.map((review) => ({
      ...review,
      provider: item.supplierName,
      service: item.customServiceDescription || item.serviceSpecialtyName || item.categoryName,
      category: item.categoryName
    }))
  );
  const residentNames = new Set<string>();

  users
    .filter((item) => item.condominiumId === condominiumId && item.status !== 'admin' && item.status !== 'rejected')
    .forEach((item) => residentNames.add(item.name));
  reviewEntries.forEach((review) => residentNames.add(getReviewResidentName(review.residentName, review.reviewerName)));

  const monthlyActiveNames = new Set(
    reviewEntries.filter((review) => isSameMonth(review.createdAt, new Date())).map((review) => getReviewResidentName(review.residentName, review.reviewerName))
  );
  const residents = Math.max(residentNames.size, monthlyActiveNames.size);
  const monthlyActiveUsers = Math.min(residents, Math.max(monthlyActiveNames.size + 6, Math.round(residents * 0.64)));
  const suppliers = condominiumRecommendations.length;
  const reviews = reviewEntries.length;

  return {
    totals: {
      residents,
      suppliers,
      reviews,
      monthlyActiveUsers
    },
    derived: {
      activeResidentsPercentage: residents ? Math.round((monthlyActiveUsers / residents) * 100) : 0,
      reviewsPerSupplier: suppliers ? Number((reviews / suppliers).toFixed(1)) : 0
    },
    trends: {
      day: {
        reviews: buildTrend(reviewEntries, 'day'),
        activeUsers: buildActiveUserTrend(reviewEntries, 'day', residents)
      },
      week: {
        reviews: buildTrend(reviewEntries, 'week'),
        activeUsers: buildActiveUserTrend(reviewEntries, 'week', residents)
      },
      month: {
        reviews: buildTrend(reviewEntries, 'month'),
        activeUsers: buildActiveUserTrend(reviewEntries, 'month', residents)
      }
    },
    rankings: {
      searchedCategories: buildCategoryRanking(condominiumRecommendations),
      viewedProviders: buildProviderRanking(condominiumRecommendations),
      latestReviews: reviewEntries
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 4)
        .map((review) => ({
          id: review.id,
          provider: review.provider,
          reviewer: getReviewResidentName(review.residentName, review.reviewerName),
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt
        }))
    }
  };
}

export function findRecommendationByPhone(condominiumId: string, phone: string) {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) return undefined;
  return active(recommendations).find((item) => {
    const itemPhone = item.normalizedPhone || normalizePhoneNumber(item.whatsapp);
    return item.condominiumId === condominiumId && itemPhone === normalizedPhone;
  });
}

export async function findRecommendationByPhoneAsync(condominiumId: string, phone: string) {
  if (isSupabaseConfigured()) return findProviderByPhone(condominiumId, phone);
  return findRecommendationByPhone(condominiumId, phone);
}

export async function searchRecommendations(condominiumId: string, query: string, categoryId?: string, minRating?: number) {
  if (isSupabaseConfigured()) return searchProviders(condominiumId, query, categoryId, minRating);
  await wait();
  const normalized = query.trim().toLowerCase();
  return active(recommendations)
    .filter((item) => item.condominiumId === condominiumId)
    .map(toPublicRecommendation)
    .filter((item) => (categoryId ? item.categoryId === categoryId || item.serviceSpecialtyId === categoryId : true))
    .filter((item) => (minRating ? item.averageRating >= minRating : true))
    .filter((item) => {
      if (!normalized) return true;
      const specialty = getServiceSpecialtyById(item.serviceSpecialtyId);
      const category = getCategoryById(item.categoryId);
      const haystack = [
        item.supplierName,
        item.serviceSpecialtyName,
        specialty?.name,
        ...(specialty?.aliases ?? []),
        item.categoryName,
        category?.name,
        item.servicePerformed,
        item.customServiceDescription,
        item.shortComment,
        ...item.reviews.map((review) => review.comment)
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
}

export async function addRecommendation(user: User, payload: NewRecommendationPayload) {
  if (isSupabaseConfigured()) return createProviderWithReview(user, payload);
  await wait();
  if (!payload.confirmedUse) throw new Error('Confirme que você realmente usou este serviço/produto.');
  if (findRecommendationByPhone(user.condominiumId, payload.whatsapp)) {
    throw new Error('Este prestador já existe na comunidade.');
  }
  const specialty = getServiceSpecialtyById(payload.serviceSpecialtyId);
  const category = getCategoryById(specialty?.categoryId ?? payload.categoryId);
  const recommendationId = `rec-${Date.now()}`;
  const [reviewerBlock, reviewerLot] = user.unit.split(',').map((part) => part.trim());
  const recommendation: Recommendation = {
    id: recommendationId,
    condominiumId: user.condominiumId,
    supplierName: payload.supplierName,
    categoryId: category?.id ?? payload.categoryId,
    categoryName: category?.name ?? 'Outros',
    serviceSpecialtyId: payload.serviceSpecialtyId,
    serviceSpecialtyName: specialty?.name ?? 'Outros',
    customServiceDescription: payload.customServiceDescription,
    whatsapp: payload.whatsapp,
    normalizedPhone: normalizePhoneNumber(payload.whatsapp),
    contactInfo: 'Contato informado por morador.',
    providerPhotos: [],
    averageRating: payload.rating,
    recommendedByCount: 1,
    shortComment: payload.comment,
    servicePerformed: payload.servicePerformed,
    usedWhen: payload.usedWhen,
    wouldHireAgain: payload.wouldHireAgain,
    realUseConfirmed: payload.confirmedUse,
    photos: payload.photos ?? [],
    createdAt: new Date().toISOString().slice(0, 10),
    uploadedAt: new Date().toISOString(),
    reviews: [
      {
        id: `rev-${Date.now()}`,
        recommendationId,
        residentName: user.unit ? `${user.name}, ${user.unit}` : user.name,
        reviewerName: user.name,
        reviewerBlock,
        reviewerLot,
        servicePerformed: payload.servicePerformed,
        usedWhen: payload.usedWhen,
        wouldHireAgain: payload.wouldHireAgain,
        realUseConfirmed: payload.confirmedUse,
        rating: payload.rating,
        comment: payload.comment,
        photos: payload.photos ?? [],
        createdAt: new Date().toISOString().slice(0, 10),
        uploadedAt: new Date().toISOString()
      }
    ]
  };
  recommendations = [recommendation, ...recommendations];
  return recommendation;
}

export async function addReviewToExistingRecommendation(user: User, recommendationId: string, payload: NewRecommendationPayload) {
  if (isSupabaseConfigured()) return createReviewForProvider(user, recommendationId, payload);
  await wait();
  if (!payload.confirmedUse) throw new Error('Confirme que você realmente usou este serviço/produto.');
  const [reviewerBlock, reviewerLot] = user.unit.split(',').map((part) => part.trim());
  const createdAt = new Date().toISOString().slice(0, 10);
  const uploadedAt = new Date().toISOString();
  let updatedRecommendation: Recommendation | undefined;

  recommendations = recommendations.map((item) => {
    if (item.id !== recommendationId) return item;

    const review = {
      id: `rev-${Date.now()}`,
      recommendationId,
      residentName: user.unit ? `${user.name}, ${user.unit}` : user.name,
      reviewerName: user.name,
      reviewerBlock,
      reviewerLot,
      servicePerformed: payload.servicePerformed,
      usedWhen: payload.usedWhen,
      wouldHireAgain: payload.wouldHireAgain,
      realUseConfirmed: payload.confirmedUse,
      rating: payload.rating,
      comment: payload.comment,
      photos: payload.photos ?? [],
      createdAt,
      uploadedAt
    };
    const reviews = [review, ...item.reviews];
    const averageRating = reviews.reduce((sum, current) => sum + current.rating, 0) / reviews.length;

    updatedRecommendation = {
      ...item,
      averageRating: Number(averageRating.toFixed(1)),
      recommendedByCount: item.recommendedByCount + 1,
      shortComment: payload.comment,
      servicePerformed: payload.servicePerformed,
      usedWhen: payload.usedWhen,
      wouldHireAgain: payload.wouldHireAgain,
      realUseConfirmed: payload.confirmedUse,
      photos: [...(payload.photos ?? []), ...(item.photos ?? [])],
      uploadedAt,
      reviews
    };

    return updatedRecommendation;
  });

  return updatedRecommendation;
}

export async function reportRecommendation(user: User, recommendation: Recommendation, reason = 'Problema reportado pelo morador') {
  await wait();
  const report: Report = {
    id: `rep-${Date.now()}`,
    condominiumId: user.condominiumId,
    recommendationId: recommendation.id,
    recommendationName: recommendation.supplierName,
    reason,
    reportedBy: user.name,
    createdAt: new Date().toISOString().slice(0, 10),
    status: 'open'
  };
  reports = [report, ...reports];
  return report;
}

export async function getAccessRequests(condominiumId: string) {
  if (isSupabaseConfigured()) return fetchPendingAccessRequests(condominiumId);
  await wait();
  return accessRequests
    .filter((request) => request.condominiumId === condominiumId && request.status === 'pending')
    .sort((a, b) => b.requestDate.localeCompare(a.requestDate));
}

export async function fetchAllAccessRequests(condominiumId: string) {
  if (isSupabaseConfigured()) return fetchAllAccessRequestsFromRepository(condominiumId);
  await wait();
  return accessRequests
    .filter((request) => request.condominiumId === condominiumId)
    .sort((a, b) => b.requestDate.localeCompare(a.requestDate));
}

export async function fetchPendingAccessRequests(condominiumId: string) {
  if (isSupabaseConfigured()) return fetchPendingAccessRequestsFromRepository(condominiumId);
  await wait();
  return accessRequests
    .filter((request) => request.condominiumId === condominiumId && request.status === 'pending')
    .sort((a, b) => b.requestDate.localeCompare(a.requestDate));
}

export async function getManagementAccessRequests(condominiumId: string) {
  return fetchAllAccessRequests(condominiumId);
}

export function getAccessRequestById(id: string) {
  return accessRequests.find((request) => request.id === id);
}

export async function approveAccessRequest(id: string) {
  if (isSupabaseConfigured()) {
    const admin = currentUser ?? (await getCurrentProfile());
    if (!admin) throw new Error('Sessao do administrador nao encontrada.');
    currentUser = admin;
    return decideAccessRequest(admin, id, 'approved');
  }
  await wait();
  let updatedRequest: AccessRequest | undefined;
  accessRequests = accessRequests.map((request) => {
    if (request.id !== id) return request;
    updatedRequest = { ...request, status: 'approved' };
    return updatedRequest;
  });
  return updatedRequest;
}

export async function rejectAccessRequest(id: string) {
  if (isSupabaseConfigured()) {
    const admin = currentUser ?? (await getCurrentProfile());
    if (!admin) throw new Error('Sessao do administrador nao encontrada.');
    currentUser = admin;
    return decideAccessRequest(admin, id, 'rejected');
  }
  await wait();
  let updatedRequest: AccessRequest | undefined;
  accessRequests = accessRequests.map((request) => {
    if (request.id !== id) return request;
    updatedRequest = { ...request, status: 'rejected' };
    return updatedRequest;
  });
  return updatedRequest;
}

export async function getReportedRecommendations(condominiumId: string) {
  if (isSupabaseConfigured()) return listReports(condominiumId);
  await wait();
  return reports.filter((report) => report.condominiumId === condominiumId && report.status === 'open');
}

export async function sendFeedback(user: User, payload: CreateFeedbackPayload) {
  if (isSupabaseConfigured()) return createFeedback(user, payload);
  await wait();
  const subject = payload.subject?.trim();
  const message = payload.message?.trim();

  if (!subject) throw new Error('Selecione um assunto para o feedback.');
  if (!message) throw new Error('Descreva seu feedback antes de enviar.');

  const feedback: Feedback = {
    id: `fb-${Date.now()}`,
    condominiumId: user.condominiumId,
    userId: user.id,
    userName: user.name,
    subject: payload.subject,
    message,
    createdAt: new Date().toISOString(),
    status: 'novo'
  };

  feedbacks = [feedback, ...feedbacks];
  return feedback;
}

export async function getFeedbacks(condominiumId: string) {
  if (isSupabaseConfigured()) return listFeedbacks(condominiumId);
  await wait();
  return feedbacks
    .filter((item) => item.condominiumId === condominiumId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function markFeedbackAsRead(id: string) {
  if (isSupabaseConfigured()) {
    await updateFeedbackStatus(id, 'lido');
    return;
  }
  await wait();
  feedbacks = feedbacks.map((item) => (item.id === id && item.status === 'novo' ? { ...item, status: 'lido' } : item));
}

export async function archiveFeedback(id: string) {
  if (isSupabaseConfigured()) {
    await updateFeedbackStatus(id, 'resolvido');
    return;
  }
  await wait();
  feedbacks = feedbacks.map((item) =>
    item.id === id
      ? {
          ...item,
          status: 'resolvido',
          archivedAt: new Date().toISOString()
        }
      : item
  );
}

export async function getModerationContent(condominiumId: string): Promise<ModerationContentItem[]> {
  if (isSupabaseConfigured()) return listModerationContent(condominiumId);
  await wait();

  return recommendations
    .filter((item) => item.condominiumId === condominiumId && !item.deletedAt)
    .flatMap((recommendation) => {
      const reviewItems = recommendation.reviews.flatMap((review) => buildReviewModerationItems(recommendation, review));
      const providerPhotos = (recommendation.providerPhotos ?? []).map((uri, index) => ({
        id: `photo:${recommendation.id}:provider:${index}`,
        type: 'photo' as const,
        recommendationId: recommendation.id,
        providerName: recommendation.supplierName,
        title: 'Foto do prestador',
        body: 'Imagem enviada para representar o prestador.',
        author: 'Morador',
        createdAt: recommendation.uploadedAt || recommendation.createdAt,
        status: 'active' as const,
        photoUri: uri
      }));

      return [...reviewItems, ...providerPhotos];
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function moderateContent(
  admin: User,
  target: { type: ModerationContentType; recommendationId: string; reviewId?: string; photoUri?: string; contentId?: string },
  reason: string
) {
  if (isSupabaseConfigured()) {
    const reasonText = reason.trim() || 'Removido pela moderacao';
    if (target.type === 'photo') {
      await moderateReviewPhoto(admin, target.contentId?.replace('photo:', '') ?? '', reasonText);
    } else if (target.reviewId) {
      await moderateReview(admin, target.reviewId, reasonText);
    }
    return;
  }
  await wait();
  const deletedAt = new Date().toISOString();
  const moderationReason = reason.trim() || 'Removido pela moderação';

  recommendations = recommendations.map((recommendation) => {
    if (recommendation.id !== target.recommendationId) return recommendation;

    if (target.type === 'photo' && target.photoUri) {
      return movePhotoToDeleted(recommendation, target.photoUri, admin.id, deletedAt, moderationReason, target.reviewId);
    }

    const reviews = recommendation.reviews.map((review) => {
      if (review.id !== target.reviewId) return review;

      if (target.type === 'comment') {
        return {
          ...review,
          commentDeletedAt: deletedAt,
          commentDeletedBy: admin.id,
          commentModerationReason: moderationReason
        };
      }

      return {
        ...review,
        deletedAt,
        deletedBy: admin.id,
        moderationReason
      };
    });

    return recalculateRecommendation({ ...recommendation, reviews });
  });
}

export async function moderateReport(admin: User, id: string, action: 'kept' | 'hidden' | 'removed') {
  if (isSupabaseConfigured()) {
    await resolveReport(admin, id, action);
    return;
  }
  await wait();
  reports = reports.map((report) => (report.id === id ? { ...report, status: action } : report));
  const report = reports.find((item) => item.id === id);
  if (report && (action === 'hidden' || action === 'removed')) {
    const deletedAt = new Date().toISOString();
    recommendations = recommendations.map((item) =>
      item.id === report.recommendationId
        ? {
            ...item,
            hidden: true,
            deletedAt,
            deletedBy: 'admin',
            moderationReason: report.reason
          }
        : item
    );
  }
}

export function getRecommendationById(id: string) {
  const recommendation = recommendations.find((item) => item.id === id && !item.deletedAt);
  return recommendation ? toPublicRecommendation(recommendation) : undefined;
}

export async function getRecommendationByIdAsync(id: string) {
  if (isSupabaseConfigured()) return getProviderById(id);
  return getRecommendationById(id);
}

function toPublicRecommendation(item: Recommendation): Recommendation {
  const reviews = getVisibleReviews(item.reviews).map((review) => ({
    ...review,
    comment: review.commentDeletedAt ? 'Comentário removido pela moderação.' : review.comment
  }));

  return {
    ...item,
    photos: item.photos ?? [],
    providerPhotos: item.providerPhotos ?? [],
    reviews
  };
}

function getVisibleReviews(reviews: Review[]) {
  return reviews.filter((review) => !review.deletedAt);
}

function buildReviewModerationItems(recommendation: Recommendation, review: Review): ModerationContentItem[] {
  if (review.deletedAt) return [];

  const base = {
    recommendationId: recommendation.id,
    reviewId: review.id,
    providerName: recommendation.supplierName,
    author: getReviewResidentName(review.residentName, review.reviewerName),
    createdAt: review.uploadedAt || review.createdAt
  };

  const items: ModerationContentItem[] = [];

  if (review.comment && !review.commentDeletedAt) {
    items.push({
      ...base,
      id: `comment:${review.id}`,
      type: 'comment',
      title: 'Comentário',
      body: review.comment,
      status: 'active'
    });
  }

  items.push({
    ...base,
    id: `review:${review.id}`,
    type: 'review',
    title: `Avaliação ${review.rating.toFixed(1)}`,
    body: review.commentDeletedAt ? 'Avaliação sem comentário visível.' : review.comment,
    status: 'active'
  });

  (review.photos ?? []).forEach((uri, index) => {
    items.push({
      ...base,
      id: `photo:${review.id}:${index}`,
      type: 'photo',
      title: 'Foto da avaliação',
      body: review.comment || 'Foto enviada em uma avaliação.',
      status: 'active',
      photoUri: uri
    });
  });

  return items;
}

function movePhotoToDeleted(
  recommendation: Recommendation,
  uri: string,
  deletedBy: string,
  deletedAt: string,
  moderationReason: string,
  reviewId?: string
): Recommendation {
  const deletedPhoto: DeletedPhoto = {
    uri,
    source: reviewId ? 'review' : 'provider',
    recommendationId: recommendation.id,
    reviewId,
    deletedAt,
    deletedBy,
    moderationReason
  };

  if (reviewId) {
    return {
      ...recommendation,
      reviews: recommendation.reviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              photos: (review.photos ?? []).filter((photo) => photo !== uri),
              deletedPhotos: [deletedPhoto, ...(review.deletedPhotos ?? [])]
            }
          : review
      )
    };
  }

  return {
    ...recommendation,
    providerPhotos: (recommendation.providerPhotos ?? []).filter((photo) => photo !== uri),
    deletedPhotos: [deletedPhoto, ...(recommendation.deletedPhotos ?? [])]
  };
}

function recalculateRecommendation(item: Recommendation): Recommendation {
  const visibleReviews = getVisibleReviews(item.reviews);
  const averageRating = visibleReviews.length
    ? Number((visibleReviews.reduce((sum, review) => sum + review.rating, 0) / visibleReviews.length).toFixed(1))
    : 0;
  const latestReview = [...visibleReviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return {
    ...item,
    averageRating,
    recommendedByCount: visibleReviews.length,
    shortComment: latestReview?.commentDeletedAt ? 'Comentário removido pela moderação.' : latestReview?.comment || item.shortComment
  };
}

function buildCategoryRanking(items: Recommendation[]) {
  const categories = new Map<string, number>();
  items.forEach((item) => {
    const score = item.recommendedByCount + item.reviews.length * 3;
    categories.set(item.categoryName, (categories.get(item.categoryName) ?? 0) + score);
  });

  return [...categories.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function buildProviderRanking(items: Recommendation[]) {
  return [...items]
    .map((item) => ({
      name: item.supplierName,
      service: item.customServiceDescription || item.serviceSpecialtyName || item.categoryName,
      views: item.recommendedByCount * 9 + item.reviews.length * 6
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
}

function buildTrend(
  reviews: Array<{ createdAt: string }>,
  range: AdminMetricsRange
): AdminMetricPoint[] {
  const buckets = buildBuckets(range);
  return buckets.map((bucket) => ({
    label: bucket.label,
    value: reviews.filter((review) => isDateInBucket(review.createdAt, bucket, range)).length
  }));
}

function buildActiveUserTrend(
  reviews: Array<{ createdAt: string; residentName: string; reviewerName?: string }>,
  range: AdminMetricsRange,
  totalResidents: number
): AdminMetricPoint[] {
  const reviewTrend = buildTrend(reviews, range);
  const base = range === 'day' ? 5 : range === 'week' ? 8 : 10;

  return reviewTrend.map((point, index) => ({
    label: point.label,
    value: Math.min(totalResidents, Math.max(point.value, base + point.value * 2 + ((index % 3) - 1)))
  }));
}

function buildBuckets(range: AdminMetricsRange) {
  const today = new Date();
  const bucketCount = range === 'day' ? 7 : 6;

  return Array.from({ length: bucketCount }, (_, index) => {
    const date = new Date(today);
    const distance = bucketCount - index - 1;

    if (range === 'day') {
      date.setDate(today.getDate() - distance);
      return {
        label: `${date.getDate()}/${date.getMonth() + 1}`,
        start: startOfDay(date),
        end: endOfDay(date)
      };
    }

    if (range === 'week') {
      date.setDate(today.getDate() - distance * 7);
      const start = startOfDay(date);
      start.setDate(start.getDate() - start.getDay());
      const end = endOfDay(start);
      end.setDate(start.getDate() + 6);
      return {
        label: `${start.getDate()}/${start.getMonth() + 1}`,
        start,
        end
      };
    }

    date.setMonth(today.getMonth() - distance);
    return {
      label: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      start: new Date(date.getFullYear(), date.getMonth(), 1),
      end: endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0))
    };
  });
}

function isDateInBucket(value: string, bucket: { start: Date; end: Date }, range: AdminMetricsRange) {
  const date = parseDate(value);
  if (range === 'month') {
    return date.getFullYear() === bucket.start.getFullYear() && date.getMonth() === bucket.start.getMonth();
  }

  return date >= bucket.start && date <= bucket.end;
}

function parseDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function isSameMonth(value: string, date: Date) {
  const parsed = parseDate(value);
  return parsed.getFullYear() === date.getFullYear() && parsed.getMonth() === date.getMonth();
}

function getReviewResidentName(residentName: string, reviewerName?: string) {
  if (reviewerName?.trim()) return reviewerName.trim();
  return residentName.split(',')[0]?.trim() || 'Morador';
}
