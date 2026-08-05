import { Recommendation, Review } from '../types';

export type TimelineReviewItem = {
  providerId: string;
  providerName: string;
  professionLabel: string;
  averageRating: number;
  ratingCount: number;
  whatsapp?: string;
  reviewId: string;
  reviewRating: number;
  comment: string;
  residentName: string;
  residentMeta: string;
  wouldHireAgain?: boolean;
  reviewedAt: string;
};

export function getServiceName(item: Recommendation) {
  return item.serviceSpecialtyId === 'outros'
    ? item.customServiceDescription || 'Serviço sugerido'
    : item.serviceSpecialtyName || item.categoryName;
}

export function getAdditionalServiceCount(item: Recommendation) {
  return item.additionalServiceSpecialtyIds?.length ?? item.additionalServiceSpecialtyNames?.length ?? 0;
}

export function getReviewWouldHireAgain(review: Review) {
  if (typeof review.wouldHireAgain === 'boolean') return review.wouldHireAgain;
  return review.rating >= 4.5;
}

export function getHireAgainMetric(reviews: Review[]) {
  const total = reviews.length;
  if (!total) return { percentage: 100, yes: 0, total };
  const yes = reviews.filter((review) => getReviewWouldHireAgain(review)).length;
  return { percentage: Math.round((yes / total) * 100), yes, total };
}

export function formatAverageMessage(count: number) {
  return count === 1 ? 'Baseado em 1 avaliação' : `Baseado em ${count} avaliações`;
}

export function formatTrustMessage(yes: number, total: number) {
  const suffix = total === 1 ? 'morador contrataria' : 'moradores contratariam';
  return `${yes} de ${total} ${suffix} novamente`;
}

export function formatTimelineAverageMessage(count: number) {
  return count === 1 ? 'Média de 1 avaliação' : `Média de ${count} avaliações`;
}

export function getLatestActivityDate(item: Recommendation) {
  const latestReviewDate = item.reviews
    .map((review) => review.uploadedAt || review.createdAt)
    .sort((a, b) => b.localeCompare(a))[0];

  return latestReviewDate || item.uploadedAt || item.createdAt;
}

export function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function normalizeResidenceToken(value: string | undefined, label: 'Qd' | 'Lt') {
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

export function getResidentDisplayName(review: Review) {
  const [fallbackName] = review.residentName.split(',').map((part) => part.trim());
  return review.reviewerName || fallbackName || 'Morador';
}

export function formatResidentMeta(review: Review) {
  const [, fallbackUnit] = review.residentName.split(',').map((part) => part.trim());
  const name = getResidentDisplayName(review);
  const block = normalizeResidenceToken(review.reviewerBlock || fallbackUnit, 'Qd');
  const lot = normalizeResidenceToken(review.reviewerLot, 'Lt');
  const residence = [block, lot].filter(Boolean).join(' ');

  return residence ? `${name} - ${residence}` : name;
}

export function sortProvidersForDirectory(a: Recommendation, b: Recommendation) {
  if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
  if (b.recommendedByCount !== a.recommendedByCount) return b.recommendedByCount - a.recommendedByCount;
  return getLatestActivityDate(b).localeCompare(getLatestActivityDate(a));
}

export function buildTimelineReviews(items: Recommendation[]): TimelineReviewItem[] {
  return items
    .flatMap((item) =>
      item.reviews.map((review) => ({
        providerId: item.id,
        providerName: item.supplierName,
        professionLabel: getServiceName(item),
        averageRating: item.averageRating,
        ratingCount: item.reviews.length,
        whatsapp: item.whatsapp,
        reviewId: review.id,
        reviewRating: review.rating,
        comment: review.comment,
        residentName: getResidentDisplayName(review),
        residentMeta: formatResidentMeta(review),
        wouldHireAgain: getReviewWouldHireAgain(review),
        reviewedAt: review.uploadedAt || review.createdAt
      }))
    )
    .sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt));
}

export function formatReviewDateLabel(value: string) {
  return `Avaliado em ${formatDayMonth(value)}`.trim();
}

export function formatLastRecommendationLabel(value: string) {
  return `Última recomendação: ${formatDayMonth(value)}`.trim();
}

function parseDateValue(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
}

function formatDayMonth(value: string) {
  const date = parseDateValue(value);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  }).format(date);
}
