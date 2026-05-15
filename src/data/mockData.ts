import { AccessRequest, Condominium, Recommendation, Report, User } from '../types';
import { normalizePhoneNumber } from '../utils/phone';

export const condominiums: Condominium[] = [
  { id: 'condo-vila-verde', name: 'Jardins Bolonha' }
];

export const users: User[] = [
  {
    id: 'user-approved',
    name: 'Pedro Almeida',
    phone: '+5511999991111',
    email: 'pedro@vizinho.com',
    condominiumId: 'condo-vila-verde',
    condominiumName: 'Jardins Bolonha',
    unit: 'Bloco B, 204',
    status: 'approved'
  },
  {
    id: 'user-pending',
    name: 'Marina Costa',
    phone: '+5511999992222',
    email: 'pendente@vizinho.com',
    condominiumId: 'condo-vila-verde',
    condominiumName: 'Jardins Bolonha',
    unit: 'Casa 18',
    status: 'pending'
  },
  {
    id: 'user-rejected',
    name: 'Rafael Lima',
    phone: '+5511999993333',
    email: 'rejeitado@vizinho.com',
    condominiumId: 'condo-vila-verde',
    condominiumName: 'Jardins Bolonha',
    unit: 'Lote 03',
    status: 'rejected'
  },
  {
    id: 'user-admin',
    name: 'Ana Síndica',
    phone: '+5511999994444',
    email: 'admin@vizinho.com',
    condominiumId: 'condo-vila-verde',
    condominiumName: 'Jardins Bolonha',
    unit: 'Administração',
    status: 'admin'
  }
];

export const recommendations: Recommendation[] = [
  {
    id: 'rec-1',
    condominiumId: 'condo-vila-verde',
    supplierName: 'Dona Cida Diarista',
    categoryId: 'limpeza',
    categoryName: 'Limpeza',
    serviceSpecialtyId: 'diarista',
    serviceSpecialtyName: 'Diarista',
    whatsapp: '+5511987654321',
    normalizedPhone: normalizePhoneNumber('+5511987654321'),
    providerPhotos: [],
    contactInfo: 'Atende de segunda a sábado por WhatsApp.',
    averageRating: 4.9,
    recommendedByCount: 18,
    shortComment: 'Pontual, cuidadosa e deixa tudo muito organizado.',
    createdAt: '2026-05-01',
    reviews: [
      {
        id: 'rev-1',
        recommendationId: 'rec-1',
        residentName: 'Luiza, Bloco A',
        rating: 5,
        comment: 'Usei duas vezes e recomendo. Muito caprichosa.',
        wouldHireAgain: true,
        photos: ['https://picsum.photos/seed/vicini-cida-qa/640/480'],
        createdAt: '2026-05-02'
      },
      { id: 'rev-2', recommendationId: 'rec-1', residentName: 'João, Casa 12', rating: 5, comment: 'Chegou no horário e trouxe os próprios produtos.', wouldHireAgain: true, createdAt: '2026-05-03' },
      { id: 'rev-qa-cida-3', recommendationId: 'rec-1', residentName: 'Marina, Casa 18', rating: 5, comment: 'Deixou a casa pronta antes da visita da família.', wouldHireAgain: true, createdAt: '2026-05-06' }
    ]
  },
  {
    id: 'rec-2',
    condominiumId: 'condo-vila-verde',
    supplierName: 'VerdeMais Jardinagem',
    categoryId: 'jardim_piscina',
    categoryName: 'Jardim e Piscina',
    serviceSpecialtyId: 'jardineiro',
    serviceSpecialtyName: 'Jardineiro',
    whatsapp: '+5511977772222',
    normalizedPhone: normalizePhoneNumber('+5511977772222'),
    providerPhotos: [],
    contactInfo: 'Jardinagem, poda e manutenção leve de piscina.',
    averageRating: 4.7,
    recommendedByCount: 12,
    shortComment: 'Resolve jardim e piscina sem enrolação.',
    createdAt: '2026-04-28',
    reviews: [
      { id: 'rev-3', recommendationId: 'rec-2', residentName: 'Fernanda, Lote 09', rating: 5, comment: 'Fez a poda e limpou tudo depois.', wouldHireAgain: true, createdAt: '2026-04-29' }
    ]
  },
  {
    id: 'rec-3',
    condominiumId: 'condo-vila-verde',
    supplierName: 'Elétrica Santos',
    categoryId: 'manutencao',
    categoryName: 'Manutenção',
    serviceSpecialtyId: 'eletricista',
    serviceSpecialtyName: 'Eletricista',
    whatsapp: '+5511966663333',
    normalizedPhone: normalizePhoneNumber('+5511966663333'),
    providerPhotos: [],
    contactInfo: 'Elétrica residencial e pequenos reparos.',
    averageRating: 4.8,
    recommendedByCount: 15,
    shortComment: 'Bom para emergência e instalação de luminárias.',
    createdAt: '2026-04-25',
    reviews: [
      { id: 'rev-4', recommendationId: 'rec-3', residentName: 'Pedro, Bloco B', rating: 5, comment: 'Trocou disjuntor e explicou o problema com clareza.', wouldHireAgain: true, createdAt: '2026-04-26' }
    ]
  },
  {
    id: 'rec-4',
    condominiumId: 'condo-vila-verde',
    supplierName: 'Marmitas da Nanda',
    categoryId: 'alimentacao',
    categoryName: 'Alimentação',
    serviceSpecialtyId: 'marmitas',
    serviceSpecialtyName: 'Marmitas',
    whatsapp: '+5511955554444',
    normalizedPhone: normalizePhoneNumber('+5511955554444'),
    providerPhotos: [],
    contactInfo: 'Cardápio semanal por WhatsApp.',
    averageRating: 4.6,
    recommendedByCount: 9,
    shortComment: 'Marmita caseira, entrega rápida na portaria.',
    createdAt: '2026-05-04',
    reviews: [
      { id: 'rev-5', recommendationId: 'rec-4', residentName: 'Camila, Bloco C', rating: 4, comment: 'Comida gostosa e porção boa.', createdAt: '2026-05-04' }
    ]
  },
  {
    id: 'rec-5',
    condominiumId: 'condo-vila-verde',
    supplierName: 'Dog Walker do Bruno',
    categoryId: 'pets',
    categoryName: 'Pets',
    serviceSpecialtyId: 'dog_walker',
    serviceSpecialtyName: 'Dog walker',
    whatsapp: '+5511944445555',
    normalizedPhone: normalizePhoneNumber('+5511944445555'),
    providerPhotos: [],
    contactInfo: 'Passeio com cães e pet sitter.',
    averageRating: 4.8,
    recommendedByCount: 7,
    shortComment: 'Cuidadoso com cães idosos e filhotes.',
    createdAt: '2026-04-21',
    reviews: [
      { id: 'rev-6', recommendationId: 'rec-5', residentName: 'Renata, Casa 07', rating: 5, comment: 'Mandou fotos do passeio e foi muito atencioso.', wouldHireAgain: true, createdAt: '2026-04-22' }
    ]
  },
  {
    id: 'rec-6',
    condominiumId: 'condo-vila-verde',
    supplierName: 'Bolos da Márcia',
    categoryId: 'alimentacao',
    categoryName: 'Alimentação',
    serviceSpecialtyId: 'bolos_doces',
    serviceSpecialtyName: 'Bolos e doces',
    whatsapp: '+5511933336666',
    normalizedPhone: normalizePhoneNumber('+5511933336666'),
    providerPhotos: [],
    contactInfo: 'Bolos sob encomenda feitos por moradora.',
    averageRating: 4.9,
    recommendedByCount: 11,
    shortComment: 'Bolo de cenoura é o mais pedido do bloco.',
    createdAt: '2026-04-19',
    reviews: [
      { id: 'rev-7', recommendationId: 'rec-6', residentName: 'Bianca, Bloco A', rating: 5, comment: 'Encomendei para aniversário e chegou perfeito.', createdAt: '2026-04-20' }
    ]
  },
  {
    id: 'rec-7',
    condominiumId: 'condo-vila-verde',
    supplierName: 'Reforma Fácil',
    categoryId: 'reformas',
    categoryName: 'Reformas',
    serviceSpecialtyId: 'pintor',
    serviceSpecialtyName: 'Pintor',
    whatsapp: '+5511922227777',
    normalizedPhone: normalizePhoneNumber('+5511922227777'),
    providerPhotos: [],
    contactInfo: 'Pintura, gesso e pequenos acabamentos.',
    averageRating: 4.4,
    recommendedByCount: 6,
    shortComment: 'Boa opção para pintura rápida de apartamento.',
    createdAt: '2026-04-12',
    reviews: [
      { id: 'rev-8', recommendationId: 'rec-7', residentName: 'Sérgio, Bloco D', rating: 4, comment: 'Pintou dois quartos dentro do prazo combinado.', createdAt: '2026-04-14' }
    ]
  },
  {
    id: 'rec-8',
    condominiumId: 'condo-vila-verde',
    supplierName: 'Chaveiro 24h Vila',
    categoryId: 'manutencao',
    categoryName: 'Manutenção',
    serviceSpecialtyId: 'chaveiro',
    serviceSpecialtyName: 'Chaveiro',
    whatsapp: '+5511911118888',
    normalizedPhone: normalizePhoneNumber('+5511911118888'),
    providerPhotos: [],
    contactInfo: 'Atendimento emergencial para fechaduras.',
    averageRating: 4.5,
    recommendedByCount: 8,
    shortComment: 'Atendeu rápido em uma emergência à noite.',
    createdAt: '2026-05-05',
    reviews: [
      { id: 'rev-9', recommendationId: 'rec-8', residentName: 'Daniela, Casa 04', rating: 5, comment: 'Chegou em 25 minutos e resolveu.', wouldHireAgain: true, createdAt: '2026-05-05' }
    ]
  },
  {
    id: 'rec-9',
    condominiumId: 'condo-vila-verde',
    supplierName: 'Aulas de Inglês Clara',
    categoryId: 'beleza_bem_estar',
    categoryName: 'Beleza e Bem-estar',
    serviceSpecialtyId: 'outros',
    serviceSpecialtyName: 'Outros',
    customServiceDescription: 'Aulas de Inglês',
    whatsapp: '+5511900009999',
    normalizedPhone: normalizePhoneNumber('+5511900009999'),
    providerPhotos: [],
    contactInfo: 'Aulas online para crianças e adultos.',
    averageRating: 4.7,
    recommendedByCount: 5,
    shortComment: 'Didática tranquila para crianças.',
    createdAt: '2026-04-09',
    reviews: [
      { id: 'rev-10', recommendationId: 'rec-9', residentName: 'Patrícia, Bloco C', rating: 5, comment: 'Meu filho gostou muito das aulas.', createdAt: '2026-04-10' }
    ]
  },
  {
    id: 'rec-10',
    condominiumId: 'condo-vila-verde',
    supplierName: 'Piscina Azul',
    categoryId: 'jardim_piscina',
    categoryName: 'Jardim e Piscina',
    serviceSpecialtyId: 'piscineiro',
    serviceSpecialtyName: 'Piscineiro',
    whatsapp: '+5511899990000',
    normalizedPhone: normalizePhoneNumber('+5511899990000'),
    providerPhotos: [],
    contactInfo: 'Limpeza e tratamento de água.',
    averageRating: 4.3,
    recommendedByCount: 4,
    shortComment: 'Bom para manutenção mensal da piscina.',
    createdAt: '2026-04-06',
    reviews: [
      { id: 'rev-11', recommendationId: 'rec-10', residentName: 'Marcelo, Casa 21', rating: 4, comment: 'Deixou a piscina pronta para o fim de semana.', wouldHireAgain: false, createdAt: '2026-04-07' }
    ]
  }
];

export const accessRequests: AccessRequest[] = [
  { id: 'req-1', condominiumId: 'condo-vila-verde', name: 'Carla Menezes', phone: '+5511888881111', email: 'carla@email.com', unit: 'Bloco A, 101', requestDate: '2026-05-06', status: 'pending' },
  { id: 'req-2', condominiumId: 'condo-vila-verde', name: 'Thiago Rocha', phone: '+5511888882222', email: 'thiago@email.com', unit: 'Casa 33', requestDate: '2026-05-06', status: 'pending' }
];

export const reports: Report[] = [
  { id: 'rep-1', condominiumId: 'condo-vila-verde', recommendationId: 'rec-7', recommendationName: 'Reforma Fácil', reason: 'Atrasou a visita combinada', reportedBy: 'Sérgio, Bloco D', createdAt: '2026-05-02', status: 'open' },
  { id: 'rep-2', condominiumId: 'condo-vila-verde', recommendationId: 'rec-10', recommendationName: 'Piscinas Limpas SP', reason: 'Preço informado mudou no atendimento', reportedBy: 'Marcelo, Casa 21', createdAt: '2026-05-03', status: 'open' }
];
