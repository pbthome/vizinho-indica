jest.mock('../../services/supabase/client', () => ({
  supabase: {
    from: jest.fn()
  }
}));

jest.mock('../analyticsRepository', () => ({
  trackEvent: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../storageRepository', () => ({
  uploadReviewPhoto: jest.fn(),
  createReviewPhotoUrls: jest.fn()
}));

const { createProviderWithReview } = require('../providersRepository');
const { supabase } = require('../../services/supabase/client');
const { trackEvent } = require('../analyticsRepository');
const { uploadReviewPhoto, createReviewPhotoUrls } = require('../storageRepository');

const baseUser = {
  id: 'user-1',
  name: 'Maria Silva',
  phone: '+5511999991111',
  email: 'maria@email.com',
  condominiumId: 'condo-1',
  condominiumName: 'Jardins Bolonha',
  unit: 'Quadra A, Lote 12',
  status: 'approved'
};

const basePayload = {
  supplierName: 'Ana Faxina',
  categoryId: 'limpeza',
  serviceSpecialtyId: 'diarista',
  whatsapp: '+55 11 99999-8888',
  servicePerformed: 'Faxina completa',
  usedWhen: 'last_month',
  wouldHireAgain: true,
  rating: 5,
  comment: 'Servico caprichado e pontual.',
  photos: [],
  confirmedUse: true
};

function makeInsertSingleBuilder(response) {
  return {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(response)
  };
}

function makeSpecialtyLookupBuilder(response) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(response)
  };
}

function makeMaybeSingleBuilder(response) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(response)
  };
}

function makeInsertBuilder(response) {
  return {
    insert: jest.fn().mockResolvedValue(response)
  };
}

function makeSearchBuilder(response) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(response)
  };
}

function makeProviderRow(overrides = {}) {
  return {
    id: 'provider-1',
    condominium_id: 'condo-1',
    category_id: 'cat-limpeza',
    name: 'Ana Faxina',
    phone: '5511999998888',
    whatsapp: '+55 11 99999-8888',
    description: 'Faxina completa',
    service_specialty_id: 'diarista',
    service_specialty_name: 'Diarista',
    custom_service_description: null,
    average_rating: 5,
    total_reviews: 1,
    would_hire_again_rate: 100,
    created_at: '2026-05-20T10:00:00.000Z',
    updated_at: '2026-05-20T10:00:00.000Z',
    provider_categories: {
      id: 'cat-limpeza',
      name: 'Limpeza'
    },
    provider_specialties: {
      id: 'diarista',
      name: 'Diarista',
      category_id: 'cat-limpeza'
    },
    reviews: [
      {
        id: 'review-1',
        provider_id: 'provider-1',
        rating: 5,
        comment: 'Servico caprichado e pontual.',
        service_performed: 'Faxina completa',
        used_when: 'last_month',
        would_hire_again: true,
        real_use_confirmed: true,
        deleted_at: null,
        created_at: '2026-05-20T10:00:00.000Z',
        users: {
          full_name: 'Maria Silva',
          block: 'A',
          apartment: '12'
        },
        review_photos: []
      }
    ],
    ...overrides
  };
}

describe('createProviderWithReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createReviewPhotoUrls.mockResolvedValue(new Map());
    trackEvent.mockResolvedValue(undefined);
  });

  it('cria o prestador com a primeira avaliacao e retorna o perfil hidratado', async () => {
    const payload = {
      ...basePayload,
      supplierName: 'aNa fAxIna'
    };
    const specialtyLookup = makeSpecialtyLookupBuilder({ data: { id: 'diarista', name: 'Diarista', category_id: 'cat-limpeza' }, error: null });
    const duplicateLookup = makeSearchBuilder({ data: null, error: null });
    const providerInsert = makeInsertSingleBuilder({ data: { id: 'provider-1' }, error: null });
    const reviewInsert = makeInsertSingleBuilder({ data: { id: 'review-1' }, error: null });
    const providerLookup = makeMaybeSingleBuilder({ data: makeProviderRow({ name: 'aNa fAxIna' }), error: null });

    supabase.from
      .mockReturnValueOnce(duplicateLookup)
      .mockReturnValueOnce(specialtyLookup)
      .mockReturnValueOnce(providerInsert)
      .mockReturnValueOnce(reviewInsert)
      .mockReturnValueOnce(providerLookup);

    const result = await createProviderWithReview(baseUser, payload);

    expect(providerInsert.insert).toHaveBeenCalledWith({
      condominium_id: 'condo-1',
      category_id: 'cat-limpeza',
      name: 'Ana Faxina',
      phone: '+5511999998888',
      whatsapp: '+55 11 99999-8888',
      description: 'Faxina completa',
      service_specialty_id: 'diarista',
      service_specialty_name: 'Diarista',
      custom_service_description: null,
      business_description: null,
      additional_service_specialty_ids: [],
      additional_service_specialty_names: [],
      created_by: 'user-1'
    });
    expect(reviewInsert.insert).toHaveBeenCalledWith({
      condominium_id: 'condo-1',
      provider_id: 'provider-1',
      user_id: 'user-1',
      rating: 5,
      comment: 'Servico caprichado e pontual.',
      service_performed: 'Faxina completa',
      used_when: 'last_month',
      would_hire_again: true,
      real_use_confirmed: true
    });
    expect(trackEvent).toHaveBeenCalledWith({
      condominiumId: 'condo-1',
      userId: 'user-1',
      eventType: 'review_created',
      entityType: 'review',
      entityId: 'review-1',
      metadata: { provider_id: 'provider-1' }
    });
    expect(createReviewPhotoUrls).toHaveBeenCalledWith([]);
    expect(result).toMatchObject({
      id: 'provider-1',
      supplierName: 'Ana Faxina',
      categoryName: 'Limpeza',
      averageRating: 5,
      recommendedByCount: 1,
      reviews: [
        expect.objectContaining({
          id: 'review-1',
          reviewerName: 'Maria Silva',
          rating: 5
        })
      ]
    });
  });

  it('salva as fotos da primeira avaliacao quando elas existem', async () => {
    const payload = {
      ...basePayload,
      photos: ['file:///foto-1.jpg', 'file:///foto-2.jpg']
    };
    const duplicateLookup = makeSearchBuilder({ data: null, error: null });
    const specialtyLookup = makeSpecialtyLookupBuilder({ data: { id: 'diarista', name: 'Diarista', category_id: 'cat-limpeza' }, error: null });
    const providerInsert = makeInsertSingleBuilder({ data: { id: 'provider-1' }, error: null });
    const reviewInsert = makeInsertSingleBuilder({ data: { id: 'review-1' }, error: null });
    const reviewPhotosInsert = makeInsertBuilder({ error: null });
    const providerLookup = makeMaybeSingleBuilder({
      data: makeProviderRow({
        reviews: [
          {
            id: 'review-1',
            provider_id: 'provider-1',
            rating: 5,
            comment: 'Servico caprichado e pontual.',
            would_hire_again: true,
            deleted_at: null,
            created_at: '2026-05-20T10:00:00.000Z',
            users: {
              full_name: 'Maria Silva',
              block: 'A',
              apartment: '12'
            },
            review_photos: [
              { storage_path: 'condo-1/provider-1/review-1/photo-1.jpg', deleted_at: null },
              { storage_path: 'condo-1/provider-1/review-1/photo-2.jpg', deleted_at: null }
            ]
          }
        ]
      }),
      error: null
    });

    uploadReviewPhoto
      .mockResolvedValueOnce('condo-1/provider-1/review-1/photo-1.jpg')
      .mockResolvedValueOnce('condo-1/provider-1/review-1/photo-2.jpg');
    createReviewPhotoUrls.mockResolvedValue(
      new Map([
        ['condo-1/provider-1/review-1/photo-1.jpg', 'https://signed.example/photo-1'],
        ['condo-1/provider-1/review-1/photo-2.jpg', 'https://signed.example/photo-2']
      ])
    );

    supabase.from
      .mockReturnValueOnce(duplicateLookup)
      .mockReturnValueOnce(specialtyLookup)
      .mockReturnValueOnce(providerInsert)
      .mockReturnValueOnce(reviewInsert)
      .mockReturnValueOnce(reviewPhotosInsert)
      .mockReturnValueOnce(providerLookup);

    const result = await createProviderWithReview(baseUser, payload);

    expect(uploadReviewPhoto).toHaveBeenCalledTimes(2);
    expect(reviewPhotosInsert.insert).toHaveBeenCalledWith([
      {
        condominium_id: 'condo-1',
        review_id: 'review-1',
        uploaded_by: 'user-1',
        storage_path: 'condo-1/provider-1/review-1/photo-1.jpg'
      },
      {
        condominium_id: 'condo-1',
        review_id: 'review-1',
        uploaded_by: 'user-1',
        storage_path: 'condo-1/provider-1/review-1/photo-2.jpg'
      }
    ]);
    expect(result.reviews[0].photos).toEqual(['https://signed.example/photo-1', 'https://signed.example/photo-2']);
  });

  it('usa a especialidade "outros" do banco e preserva a descricao personalizada', async () => {
    const payload = {
      ...basePayload,
      serviceSpecialtyId: 'outros',
      customServiceDescription: 'Montador de moveis'
    };
    const duplicateLookup = makeSearchBuilder({ data: null, error: null });
    const specialtyLookup = makeSpecialtyLookupBuilder({ data: { id: 'outros', name: 'Outros', category_id: 'cat-outros' }, error: null });
    const providerInsert = makeInsertSingleBuilder({ data: { id: 'provider-1' }, error: null });
    const suggestionInsert = { insert: jest.fn().mockResolvedValue({ error: null }) };
    const reviewInsert = makeInsertSingleBuilder({ data: { id: 'review-1' }, error: null });
    const providerLookup = makeMaybeSingleBuilder({
      data: makeProviderRow({
        category_id: 'cat-outros',
        provider_categories: { id: 'cat-outros', name: 'Outros' },
        service_specialty_id: 'outros',
        service_specialty_name: 'Outros',
        provider_specialties: { id: 'outros', name: 'Outros', category_id: 'cat-outros' },
        custom_service_description: 'Montador de moveis',
        description: 'Montador de moveis'
      }),
      error: null
    });

    supabase.from
      .mockReturnValueOnce(duplicateLookup)
      .mockReturnValueOnce(specialtyLookup)
      .mockReturnValueOnce(providerInsert)
      .mockReturnValueOnce(suggestionInsert)
      .mockReturnValueOnce(reviewInsert)
      .mockReturnValueOnce(providerLookup);

    await createProviderWithReview(baseUser, payload);

    expect(providerInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        category_id: 'cat-outros',
        service_specialty_id: 'outros',
        description: 'Faxina completa',
        custom_service_description: 'Montador de moveis'
      })
    );
  });

  it('propaga o erro do Supabase quando o cadastro do prestador falha', async () => {
    const duplicateLookup = makeSearchBuilder({ data: null, error: null });
    const specialtyLookup = makeSpecialtyLookupBuilder({ data: { id: 'diarista', name: 'Diarista', category_id: 'cat-limpeza' }, error: null });
    const providerInsert = makeInsertSingleBuilder({ data: null, error: { message: 'duplicate key value violates unique constraint' } });

    supabase.from.mockReturnValueOnce(duplicateLookup).mockReturnValueOnce(specialtyLookup).mockReturnValueOnce(providerInsert);

    await expect(createProviderWithReview(baseUser, basePayload)).rejects.toThrow('duplicate key value violates unique constraint');
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('bloqueia o cadastro quando o telefone ja existe em um prestador ativo', async () => {
    const duplicateLookup = makeSearchBuilder({ data: makeProviderRow(), error: null });

    supabase.from.mockReturnValueOnce(duplicateLookup);

    await expect(createProviderWithReview(baseUser, basePayload)).rejects.toThrow(
      'Este prestador ja existe na comunidade. Adicione sua experiencia ao perfil existente.'
    );
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('traduz o erro do banco quando o indice unico barrar telefone duplicado', async () => {
    const duplicateLookup = makeSearchBuilder({ data: null, error: null });
    const specialtyLookup = makeSpecialtyLookupBuilder({ data: { id: 'diarista', name: 'Diarista', category_id: 'cat-limpeza' }, error: null });
    const providerInsert = makeInsertSingleBuilder({
      data: null,
      error: { message: 'duplicate key value violates unique constraint "uq_providers_condominium_phone_active"' }
    });

    supabase.from.mockReturnValueOnce(duplicateLookup).mockReturnValueOnce(specialtyLookup).mockReturnValueOnce(providerInsert);

    await expect(createProviderWithReview(baseUser, basePayload)).rejects.toThrow(
      'Este prestador ja existe na comunidade. Adicione sua experiencia ao perfil existente.'
    );
  });
});
