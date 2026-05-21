import { supabase } from '../services/supabase/client';
import { Json } from '../types/database';

export async function trackEvent(params: {
  condominiumId: string;
  userId?: string | null;
  eventType: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Json;
}) {
  await supabase.from('app_events').insert({
    condominium_id: params.condominiumId,
    user_id: params.userId ?? null,
    event_type: params.eventType,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {}
  });
}
