import { ServiceSuggestion } from '../types';
import { supabase } from '../services/supabase/client';
import { getCategoryById } from '../constants/categories';

export async function listServiceSuggestions(condominiumId: string): Promise<ServiceSuggestion[]> {
  const { data, error } = await supabase
    .from('service_suggestions')
    .select('*, provider_categories!service_suggestions_suggested_category_id_fkey(name), resolved_specialty:provider_specialties!service_suggestions_resolved_specialty_id_fkey(name, provider_categories(name)), providers!service_suggestions_provider_id_fkey(name), users!service_suggestions_created_by_fkey(full_name)')
    .eq('condominium_id', condominiumId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    condominiumId: row.condominium_id,
    proposedName: row.proposed_name,
    suggestedCategoryId: row.suggested_category_id ?? undefined,
    suggestedCategoryName: row.provider_categories?.name ?? undefined,
    providerId: row.provider_id ?? undefined,
    providerName: row.providers?.name ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdByName: row.users?.full_name ?? undefined,
    status: row.status,
    resolvedSpecialtyId: row.resolved_specialty_id ?? undefined,
    resolvedSpecialtyName: row.resolved_specialty?.name ?? undefined,
    resolvedCategoryName: row.resolved_specialty?.provider_categories?.name ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    createdAt: row.created_at
  }));
}

export async function countPendingServiceSuggestions(condominiumId: string) {
  const { count, error } = await supabase
    .from('service_suggestions')
    .select('id', { count: 'exact', head: true })
    .eq('condominium_id', condominiumId)
    .eq('status', 'pending');
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function reviewServiceSuggestion(id: string, decision: 'approved' | 'rejected' | 'linked', targetSpecialtyId?: string) {
  const request = supabase.rpc('review_service_suggestion', {
      target_suggestion_id: id,
      decision,
      target_specialty_id: targetSpecialtyId ?? null
    });
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('O banco demorou mais de 15 segundos para responder. Tente novamente.')), 15000);
  });
  const { data, error } = await Promise.race([request, timeout]);
  if (error) throw new Error(error.message);
  return data;
}

export async function createSpecialtyFromSuggestion(id: string, proposedName: string, categoryId: string) {
  const category = getCategoryById(categoryId);
  if (!category || category.id === 'outros') throw new Error('Escolha uma categoria válida.');
  const databaseName = category.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const { data: databaseCategory, error: categoryError } = await supabase
    .from('provider_categories')
    .select('id')
    .eq('name', databaseName)
    .eq('active', true)
    .maybeSingle();
  if (categoryError) throw new Error(categoryError.message);
  if (!databaseCategory) throw new Error('A categoria escolhida ainda não está disponível no banco.');

  const { error: updateError } = await supabase
    .from('service_suggestions')
    .update({ proposed_name: proposedName.trim(), suggested_category_id: databaseCategory.id })
    .eq('id', id);
  if (updateError) throw new Error(updateError.message);
  return reviewServiceSuggestion(id, 'approved');
}
