import { supabase } from '../services/supabase/client';
import { CreateFeedbackPayload, User } from '../types';
import { trackEvent } from './analyticsRepository';
import { mapDbFeedback } from './mappers';

export async function createFeedback(user: User, payload: CreateFeedbackPayload) {
  const { data, error } = await supabase
    .from('feedbacks')
    .insert({
      condominium_id: user.condominiumId,
      user_id: user.id,
      subject: payload.subject,
      message: payload.message,
      status: 'new'
    })
    .select('*, users(full_name)')
    .single();

  if (error) throw new Error(error.message);
  const feedback = data as any;

  await trackEvent({
    condominiumId: user.condominiumId,
    userId: user.id,
    eventType: 'feedback_sent',
    entityType: 'feedback',
    entityId: feedback.id
  }).catch(() => undefined);

  return mapDbFeedback(feedback);
}
