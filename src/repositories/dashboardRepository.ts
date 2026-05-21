import { supabase } from '../services/supabase/client';
import type { AdminDashboardMetrics } from '../services/api';

export async function getDashboardMetrics(condominiumId: string): Promise<AdminDashboardMetrics> {
  const [usersResult, providersResult, reviewsResult, feedbacksResult, searchesResult] = await Promise.all([
    supabase.from('users').select('id, status, last_active_at, created_at').eq('condominium_id', condominiumId).is('deleted_at', null),
    supabase.from('providers').select('id, name, average_rating, total_reviews, created_at, service_specialty_name, provider_categories(name)').eq('condominium_id', condominiumId).is('deleted_at', null),
    supabase.from('reviews').select('id, rating, comment, created_at, provider_id, users!reviews_user_id_fkey(full_name), providers(name, service_specialty_name, provider_categories(name))').eq('condominium_id', condominiumId).is('deleted_at', null),
    supabase.from('feedbacks').select('id, status, created_at').eq('condominium_id', condominiumId),
    supabase.from('searches').select('query, results_count, created_at').eq('condominium_id', condominiumId).order('created_at', { ascending: false }).limit(100)
  ]);

  for (const result of [usersResult, providersResult, reviewsResult, feedbacksResult, searchesResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const users = (usersResult.data ?? []) as any[];
  const providers = (providersResult.data ?? []) as any[];
  const reviews = (reviewsResult.data ?? []) as any[];
  const activeUsers = users.filter((user) => isSameMonth(user.last_active_at ?? user.created_at, new Date())).length;

  return {
    totals: {
      residents: users.filter((user) => user.status === 'approved').length,
      suppliers: providers.length,
      reviews: reviews.length,
      monthlyActiveUsers: activeUsers
    },
    derived: {
      activeResidentsPercentage: users.length ? Math.round((activeUsers / users.length) * 100) : 0,
      reviewsPerSupplier: providers.length ? Number((reviews.length / providers.length).toFixed(1)) : 0
    },
    trends: {
      day: { reviews: buildTrend(reviews, 'day'), activeUsers: buildFlatActiveTrend(activeUsers, 'day') },
      week: { reviews: buildTrend(reviews, 'week'), activeUsers: buildFlatActiveTrend(activeUsers, 'week') },
      month: { reviews: buildTrend(reviews, 'month'), activeUsers: buildFlatActiveTrend(activeUsers, 'month') }
    },
    rankings: {
      searchedCategories: buildSearchRanking(searchesResult.data ?? []),
      viewedProviders: providers
        .sort((a, b) => (b.total_reviews ?? 0) - (a.total_reviews ?? 0))
        .slice(0, 5)
        .map((provider: any) => ({
          name: provider.name,
          service: provider.service_specialty_name ?? provider.provider_categories?.name ?? 'Servico',
          views: provider.total_reviews ?? 0
        })),
      latestReviews: reviews
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 4)
        .map((review: any) => ({
          id: review.id,
          provider: review.providers?.name ?? 'Fornecedor',
          reviewer: review.users?.full_name ?? 'Morador',
          rating: review.rating,
          comment: review.comment,
          createdAt: review.created_at.slice(0, 10)
        }))
    }
  };
}

function buildSearchRanking(searches: Array<{ query: string }>) {
  const counts = new Map<string, number>();
  searches.forEach((search) => counts.set(search.query, (counts.get(search.query) ?? 0) + 1));
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function buildTrend(reviews: Array<{ created_at: string }>, range: 'day' | 'week' | 'month') {
  const buckets = buildBuckets(range);
  return buckets.map((bucket) => ({
    label: bucket.label,
    value: reviews.filter((review) => isDateInBucket(review.created_at, bucket, range)).length
  }));
}

function buildFlatActiveTrend(activeUsers: number, range: 'day' | 'week' | 'month') {
  return buildBuckets(range).map((bucket) => ({ label: bucket.label, value: activeUsers }));
}

function buildBuckets(range: 'day' | 'week' | 'month') {
  const today = new Date();
  const bucketCount = range === 'day' ? 7 : 6;

  return Array.from({ length: bucketCount }, (_, index) => {
    const date = new Date(today);
    const distance = bucketCount - index - 1;

    if (range === 'day') {
      date.setDate(today.getDate() - distance);
      return { label: `${date.getDate()}/${date.getMonth() + 1}`, start: startOfDay(date), end: endOfDay(date) };
    }

    if (range === 'week') {
      date.setDate(today.getDate() - distance * 7);
      const start = startOfDay(date);
      start.setDate(start.getDate() - start.getDay());
      const end = endOfDay(start);
      end.setDate(start.getDate() + 6);
      return { label: `${start.getDate()}/${start.getMonth() + 1}`, start, end };
    }

    date.setMonth(today.getMonth() - distance);
    return {
      label: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      start: new Date(date.getFullYear(), date.getMonth(), 1),
      end: endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0))
    };
  });
}

function isDateInBucket(value: string, bucket: { start: Date; end: Date }, range: 'day' | 'week' | 'month') {
  const date = new Date(value);
  if (range === 'month') return date.getFullYear() === bucket.start.getFullYear() && date.getMonth() === bucket.start.getMonth();
  return date >= bucket.start && date <= bucket.end;
}

function isSameMonth(value: string, date: Date) {
  const parsed = new Date(value);
  return parsed.getFullYear() === date.getFullYear() && parsed.getMonth() === date.getMonth();
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}
