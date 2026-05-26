import { supabase } from '../services/supabase/client';
import { AccessRequest, Feedback, Report, User } from '../types';
import { Tables } from '../types/database';
import { mapDbFeedback } from './mappers';
import { createReviewPhotoUrls } from './storageRepository';

export async function fetchAllAccessRequests(condominiumId: string) {
  const { data, error } = await supabase
    .from('access_requests')
    .select('*')
    .eq('condominium_id', condominiumId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAccessRequest);
}

export async function fetchPendingAccessRequests(condominiumId: string) {
  const { data, error } = await supabase
    .from('access_requests')
    .select('*')
    .eq('condominium_id', condominiumId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAccessRequest);
}

export async function listAccessRequests(condominiumId: string) {
  return fetchAllAccessRequests(condominiumId);
}

export async function decideAccessRequest(admin: User, id: string, status: 'approved' | 'rejected') {
  const { data: request, error: requestError } = await supabase
    .from('access_requests')
    .update({ status, reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (requestError) throw new Error(requestError.message);

  return mapAccessRequest(request);
}

export async function listFeedbacks(condominiumId: string) {
  const { data, error } = await supabase
    .from('feedbacks')
    .select('*, users(full_name)')
    .eq('condominium_id', condominiumId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapDbFeedback(row as any));
}

export async function listReports(condominiumId: string): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*, providers(name), users!reports_reported_by_fkey(full_name)')
    .eq('condominium_id', condominiumId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    condominiumId: row.condominium_id,
    recommendationId: row.provider_id,
    recommendationName: row.providers?.name ?? 'Fornecedor',
    reason: row.reason,
    reportedBy: row.users?.full_name ?? 'Morador',
    createdAt: row.created_at,
    status: row.status
  }));
}

export async function resolveReport(admin: User, id: string, status: Report['status']) {
  const resolvedAt = new Date().toISOString();
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .update({
      status,
      resolved_by: admin.id,
      resolved_at: resolvedAt
    })
    .eq('id', id)
    .select('*')
    .single();

  if (reportError) throw new Error(reportError.message);

  if (status === 'hidden' || status === 'removed') {
    const { error: providerError } = await supabase
      .from('providers')
      .update({
        deleted_at: resolvedAt,
        deleted_by: admin.id,
        moderation_reason: report.reason
      })
      .eq('id', report.provider_id);

    if (providerError) throw new Error(providerError.message);
  }

  return report;
}

export async function updateFeedbackStatus(id: string, status: Feedback['status']) {
  const dbStatus = status === 'novo' ? 'new' : status === 'lido' ? 'read' : status === 'resolvido' ? 'resolved' : 'archived';
  const { error } = await supabase
    .from('feedbacks')
    .update({ status: dbStatus, resolved_at: dbStatus === 'resolved' || dbStatus === 'archived' ? new Date().toISOString() : null })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export type BackendModerationContentItem = {
  id: string;
  type: 'comment' | 'photo' | 'review';
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

export async function listModerationContent(condominiumId: string): Promise<BackendModerationContentItem[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, providers(name), users!reviews_user_id_fkey(full_name), review_photos(*)')
    .eq('condominium_id', condominiumId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  const reviewPhotoPaths = (data ?? []).flatMap((review: any) =>
    (review.review_photos ?? []).filter((photo: any) => !photo.deleted_at).map((photo: any) => photo.storage_path)
  );
  const signedUrls = await createReviewPhotoUrls(reviewPhotoPaths);

  return (data ?? []).flatMap((review: any) => {
    const base = {
      recommendationId: review.provider_id,
      reviewId: review.id,
      providerName: review.providers?.name ?? 'Fornecedor',
      author: review.users?.full_name ?? 'Morador',
      createdAt: review.created_at,
      status: 'active' as const
    };

    const items: BackendModerationContentItem[] = [
      {
        ...base,
        id: `review:${review.id}`,
        type: 'review',
        title: `Avaliacao ${review.rating}`,
        body: review.comment_deleted_at ? 'Avaliacao sem comentario visivel.' : review.comment
      }
    ];

    if (!review.comment_deleted_at) {
      items.unshift({
        ...base,
        id: `comment:${review.id}`,
        type: 'comment',
        title: 'Comentario',
        body: review.comment
      });
    }

    for (const photo of review.review_photos ?? []) {
      if (photo.deleted_at) continue;
      items.push({
        ...base,
        id: `photo:${photo.id}`,
        type: 'photo',
        title: 'Foto da avaliacao',
        body: review.comment,
        photoUri: signedUrls.get(photo.storage_path) ?? photo.storage_path
      });
    }

    return items;
  });
}

export async function moderateReview(admin: User, reviewId: string, reason: string) {
  const { error } = await supabase
    .from('reviews')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: admin.id,
      moderation_reason: reason
    })
    .eq('id', reviewId);

  if (error) throw new Error(error.message);
}

export async function moderateReviewComment(admin: User, reviewId: string, reason: string) {
  const { error } = await supabase
    .from('reviews')
    .update({
      comment_deleted_at: new Date().toISOString(),
      comment_deleted_by: admin.id,
      comment_moderation_reason: reason
    })
    .eq('id', reviewId)
    .is('comment_deleted_at', null);

  if (error) throw new Error(error.message);
}

export async function moderateReviewPhoto(admin: User, photoId: string, reason: string) {
  const { error } = await supabase
    .from('review_photos')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: admin.id,
      moderation_reason: reason
    })
    .eq('id', photoId);

  if (error) throw new Error(error.message);
}

function mapAccessRequest(row: Tables<'access_requests'>): AccessRequest {
  const unit = [row.block ? `Quadra ${row.block}` : '', row.apartment ? `Lote ${row.apartment}` : ''].filter(Boolean).join(', ');

  return {
    id: row.id,
    condominiumId: row.condominium_id,
    name: row.full_name,
    phone: row.phone ?? '',
    email: row.email,
    unit,
    requestDate: row.created_at.slice(0, 10),
    status: row.status === 'approved' ? 'approved' : row.status === 'rejected' ? 'rejected' : 'pending'
  };
}
