export type UserStatus = 'not_logged_in' | 'pending' | 'approved' | 'rejected' | 'blocked' | 'admin';

export type Condominium = {
  id: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
  icon?: string;
  sortOrder?: number;
};

export type ServiceSpecialty = {
  id: string;
  name: string;
  categoryId: string;
  icon?: string;
  aliases: string[];
  sortOrder: number;
  isPopular?: boolean;
};

export type User = {
  id: string;
  name: string;
  phone: string;
  email: string;
  condominiumId: string;
  condominiumName: string;
  unit: string;
  status: UserStatus;
};

export type ModerationFields = {
  deletedAt?: string;
  deletedBy?: string;
  moderationReason?: string;
};

export type DeletedPhoto = ModerationFields & {
  uri: string;
  source: 'provider' | 'review';
  recommendationId: string;
  reviewId?: string;
};

export type Review = {
  id: string;
  recommendationId: string;
  residentName: string;
  reviewerName?: string;
  reviewerBlock?: string;
  reviewerLot?: string;
  servicePerformed?: string;
  usedWhen?: 'this_week' | 'last_month' | 'three_to_six_months' | 'more_than_six_months';
  wouldHireAgain?: boolean;
  realUseConfirmed?: boolean;
  rating: number;
  comment: string;
  photos?: string[];
  deletedPhotos?: DeletedPhoto[];
  createdAt: string;
  uploadedAt?: string;
  commentDeletedAt?: string;
  commentDeletedBy?: string;
  commentModerationReason?: string;
} & ModerationFields;

export type Recommendation = {
  id: string;
  condominiumId: string;
  supplierName: string;
  categoryId: string;
  categoryName: string;
  serviceSpecialtyId?: string;
  serviceSpecialtyName?: string;
  additionalServiceSpecialtyIds?: string[];
  additionalServiceSpecialtyNames?: string[];
  customServiceDescription?: string;
  businessDescription?: string;
  whatsapp: string;
  normalizedPhone: string;
  contactInfo: string;
  providerPhotos?: string[];
  averageRating: number;
  recommendedByCount: number;
  shortComment: string;
  servicePerformed?: string;
  usedWhen?: 'this_week' | 'last_month' | 'three_to_six_months' | 'more_than_six_months';
  wouldHireAgain?: boolean;
  realUseConfirmed?: boolean;
  photos?: string[];
  deletedPhotos?: DeletedPhoto[];
  createdAt: string;
  uploadedAt?: string;
  reviews: Review[];
  hidden?: boolean;
} & ModerationFields;

export type AccessRequest = {
  id: string;
  condominiumId: string;
  name: string;
  phone: string;
  email: string;
  unit: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
};

export type Report = {
  id: string;
  condominiumId: string;
  recommendationId: string;
  recommendationName: string;
  reason: string;
  reportedBy: string;
  createdAt: string;
  status: 'open' | 'kept' | 'hidden' | 'removed';
};

export type FeedbackSubject =
  | 'Problema no app'
  | 'Sugestão de melhoria'
  | 'Sugestao de melhoria'
  | 'Dados incorretos'
  | 'Recomendação/fornecedor'
  | 'Recomendacao/fornecedor'
  | 'Dúvida'
  | 'Duvida'
  | 'Outro';

export type FeedbackStatus = 'novo' | 'lido' | 'resolvido';

export type Feedback = {
  id: string;
  condominiumId: string;
  userId: string;
  userName?: string;
  subject: FeedbackSubject;
  message: string;
  createdAt: string;
  status: FeedbackStatus;
  archivedAt?: string;
};

export type SignUpPayload = {
  name: string;
  phone: string;
  email: string;
  password?: string;
  condominium: string;
  unit: string;
};

export type NewRecommendationPayload = {
  supplierName: string;
  categoryId: string;
  serviceSpecialtyId: string;
  additionalServiceSpecialtyIds?: string[];
  customServiceDescription?: string;
  suggestedCategoryId?: string;
  businessDescription?: string;
  whatsapp: string;
  servicePerformed?: string;
  usedWhen: 'this_week' | 'last_month' | 'three_to_six_months' | 'more_than_six_months';
  wouldHireAgain: boolean;
  rating: number;
  comment: string;
  photos?: string[];
  confirmedUse: boolean;
};

export type ServiceSuggestionStatus = 'pending' | 'approved' | 'linked' | 'rejected';

export type ServiceSuggestion = {
  id: string;
  condominiumId: string;
  proposedName: string;
  suggestedCategoryId?: string;
  suggestedCategoryName?: string;
  providerId?: string;
  providerName?: string;
  createdBy?: string;
  createdByName?: string;
  status: ServiceSuggestionStatus;
  resolvedSpecialtyId?: string;
  resolvedSpecialtyName?: string;
  resolvedCategoryName?: string;
  reviewedAt?: string;
  createdAt: string;
};

export type CreateFeedbackPayload = {
  subject: FeedbackSubject;
  message: string;
};
