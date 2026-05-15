import { getCategoryById, getServiceSpecialtyById } from '../constants/categories';
import {
  accessRequests as initialRequests,
  recommendations as initialRecommendations,
  reports as initialReports,
  users
} from '../data/mockData';
import { AccessRequest, NewRecommendationPayload, Recommendation, Report, SignUpPayload, User } from '../types';
import { normalizePhoneNumber } from '../utils/phone';

let currentUser: User | null = null;
let recommendations: Recommendation[] = [...initialRecommendations];
let accessRequests: AccessRequest[] = [...initialRequests];
let reports: Report[] = [...initialReports];

const wait = async () => new Promise((resolve) => setTimeout(resolve, 250));
const active = (items: Recommendation[]) => items.filter((item) => !item.hidden);

export async function getCurrentUser() {
  await wait();
  return currentUser;
}

export async function login(identifier: string) {
  await wait();
  const normalized = identifier.trim().toLowerCase();
  currentUser =
    users.find((user) => user.email.toLowerCase() === normalized || user.phone === normalized) ?? users[0];
  return currentUser;
}

export async function logout() {
  await wait();
  currentUser = null;
}

export async function requestAccess(payload: SignUpPayload) {
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
  await wait();
  return active(recommendations).filter((item) => item.condominiumId === condominiumId);
}

export function findRecommendationByPhone(condominiumId: string, phone: string) {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) return undefined;
  return active(recommendations).find((item) => {
    const itemPhone = item.normalizedPhone || normalizePhoneNumber(item.whatsapp);
    return item.condominiumId === condominiumId && itemPhone === normalizedPhone;
  });
}

export async function searchRecommendations(condominiumId: string, query: string, categoryId?: string, minRating?: number) {
  await wait();
  const normalized = query.trim().toLowerCase();
  return active(recommendations)
    .filter((item) => item.condominiumId === condominiumId)
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
  await wait();
  return accessRequests.filter((request) => request.condominiumId === condominiumId && request.status === 'pending');
}

export function getAccessRequestById(id: string) {
  return accessRequests.find((request) => request.id === id);
}

export async function approveAccessRequest(id: string) {
  await wait();
  accessRequests = accessRequests.map((request) => (request.id === id ? { ...request, status: 'approved' } : request));
}

export async function rejectAccessRequest(id: string) {
  await wait();
  accessRequests = accessRequests.map((request) => (request.id === id ? { ...request, status: 'rejected' } : request));
}

export async function getReportedRecommendations(condominiumId: string) {
  await wait();
  return reports.filter((report) => report.condominiumId === condominiumId && report.status === 'open');
}

export async function moderateReport(id: string, action: 'kept' | 'hidden' | 'removed') {
  await wait();
  reports = reports.map((report) => (report.id === id ? { ...report, status: action } : report));
  const report = reports.find((item) => item.id === id);
  if (report && (action === 'hidden' || action === 'removed')) {
    recommendations = recommendations.map((item) =>
      item.id === report.recommendationId ? { ...item, hidden: true } : item
    );
  }
}

export function getRecommendationById(id: string) {
  return recommendations.find((item) => item.id === id);
}
