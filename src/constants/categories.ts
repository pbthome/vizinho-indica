import { Category, ServiceSpecialty } from '../types';

export const categories: Category[] = [
  { id: 'limpeza', name: 'Limpeza', icon: 'sparkles', sortOrder: 1 },
  { id: 'manutencao', name: 'Manutenção', icon: 'wrench', sortOrder: 2 },
  { id: 'jardim_piscina', name: 'Jardim e Piscina', icon: 'leaf', sortOrder: 3 },
  { id: 'alimentacao', name: 'Alimentação', icon: 'utensils', sortOrder: 4 },
  { id: 'pets', name: 'Pets', icon: 'paw', sortOrder: 5 },
  { id: 'reformas', name: 'Reformas', icon: 'paintbrush', sortOrder: 6 },
  { id: 'beleza_bem_estar', name: 'Beleza e Bem-estar', icon: 'heart', sortOrder: 7 },
  { id: 'casa_decoracao', name: 'Casa e decoração', icon: 'home', sortOrder: 8 },
  { id: 'automotivo', name: 'Automotivo', icon: 'car', sortOrder: 9 },
  { id: 'outros', name: 'Outros', icon: 'more', sortOrder: 10 }
];

export const serviceSpecialties: ServiceSpecialty[] = [
  { id: 'diarista', name: 'Diarista', categoryId: 'limpeza', icon: 'sparkles', aliases: ['faxina', 'limpeza', 'diária'], sortOrder: 1, isPopular: true },
  { id: 'faxina_pos_obra', name: 'Faxina pós-obra', categoryId: 'limpeza', icon: 'sparkles', aliases: ['faxina pesada', 'pós obra', 'limpeza pós obra'], sortOrder: 20 },
  { id: 'passadeira', name: 'Passadeira', categoryId: 'limpeza', icon: 'sparkles', aliases: ['passar roupa', 'roupas'], sortOrder: 21 },
  { id: 'lavanderia', name: 'Lavanderia', categoryId: 'limpeza', icon: 'sparkles', aliases: ['lavar roupa', 'roupas'], sortOrder: 22 },

  { id: 'eletricista', name: 'Eletricista', categoryId: 'manutencao', icon: 'wrench', aliases: ['elétrica', 'tomada', 'disjuntor', 'luz'], sortOrder: 2, isPopular: true },
  { id: 'encanador', name: 'Encanador', categoryId: 'manutencao', icon: 'wrench', aliases: ['hidráulica', 'vazamento', 'cano', 'torneira'], sortOrder: 4, isPopular: true },
  { id: 'marido_de_aluguel', name: 'Marido de aluguel', categoryId: 'manutencao', icon: 'wrench', aliases: ['pequenos reparos', 'faz tudo', 'manutenção'], sortOrder: 6, isPopular: true },
  { id: 'ar_condicionado', name: 'Ar-condicionado', categoryId: 'manutencao', icon: 'wrench', aliases: ['ar condicionado', 'split', 'instalação de ar', 'limpeza de ar'], sortOrder: 7, isPopular: true },
  { id: 'chaveiro', name: 'Chaveiro', categoryId: 'manutencao', icon: 'wrench', aliases: ['fechadura', 'chave', 'porta'], sortOrder: 23 },
  { id: 'tecnico_eletrodomesticos', name: 'Técnico de eletrodomésticos', categoryId: 'manutencao', icon: 'wrench', aliases: ['geladeira', 'máquina de lavar', 'fogão'], sortOrder: 24 },

  { id: 'jardineiro', name: 'Jardineiro', categoryId: 'jardim_piscina', icon: 'leaf', aliases: ['jardim', 'poda', 'grama'], sortOrder: 3, isPopular: true },
  { id: 'piscineiro', name: 'Piscineiro', categoryId: 'jardim_piscina', icon: 'leaf', aliases: ['piscina', 'limpeza de piscina'], sortOrder: 5, isPopular: true },
  { id: 'paisagista', name: 'Paisagista', categoryId: 'jardim_piscina', icon: 'leaf', aliases: ['paisagismo', 'jardim'], sortOrder: 25 },
  { id: 'controle_pragas', name: 'Controle de pragas', categoryId: 'jardim_piscina', icon: 'leaf', aliases: ['dedetização', 'insetos', 'pragas'], sortOrder: 26 },

  { id: 'marmitas', name: 'Marmitas', categoryId: 'alimentacao', icon: 'utensils', aliases: ['marmita', 'comida caseira', 'almoço'], sortOrder: 27 },
  { id: 'bolos_doces', name: 'Bolos e doces', categoryId: 'alimentacao', icon: 'utensils', aliases: ['bolo', 'doce', 'sobremesa'], sortOrder: 28 },
  { id: 'churrasqueiro', name: 'Churrasqueiro', categoryId: 'alimentacao', icon: 'utensils', aliases: ['churrasco', 'evento'], sortOrder: 29 },
  { id: 'buffet', name: 'Buffet', categoryId: 'alimentacao', icon: 'utensils', aliases: ['festa', 'evento'], sortOrder: 30 },
  { id: 'congelados', name: 'Congelados', categoryId: 'alimentacao', icon: 'utensils', aliases: ['comida congelada', 'marmitas congeladas'], sortOrder: 31 },

  { id: 'banho_tosa', name: 'Petshop', categoryId: 'pets', icon: 'paw', aliases: ['pet shop', 'banho e tosa', 'tosa'], sortOrder: 32 },
  { id: 'dog_walker', name: 'Dog walker', categoryId: 'pets', icon: 'paw', aliases: ['passeador', 'passeio com cachorro', 'cães'], sortOrder: 33 },
  { id: 'pet_sitter', name: 'Pet sitter', categoryId: 'pets', icon: 'paw', aliases: ['cuidador pet', 'petsitter', 'cuidar de pet'], sortOrder: 34 },
  { id: 'veterinario', name: 'Veterinário', categoryId: 'pets', icon: 'paw', aliases: ['vet', 'veterinária'], sortOrder: 35 },

  { id: 'pedreiro', name: 'Pedreiro', categoryId: 'reformas', icon: 'paintbrush', aliases: ['obra', 'alvenaria'], sortOrder: 8, isPopular: true },
  { id: 'pintor', name: 'Pintor', categoryId: 'reformas', icon: 'paintbrush', aliases: ['pintura'], sortOrder: 36 },
  { id: 'marceneiro', name: 'Marceneiro', categoryId: 'reformas', icon: 'paintbrush', aliases: ['marcenaria', 'móveis'], sortOrder: 37 },
  { id: 'gesseiro', name: 'Gesseiro', categoryId: 'reformas', icon: 'paintbrush', aliases: ['gesso', 'drywall'], sortOrder: 38 },
  { id: 'serralheiro', name: 'Serralheiro', categoryId: 'reformas', icon: 'paintbrush', aliases: ['serralheria', 'portão'], sortOrder: 39 },
  { id: 'construtora', name: 'Construtora', categoryId: 'reformas', icon: 'paintbrush', aliases: ['construção civil', 'empresa de obras', 'obra completa'], sortOrder: 44 },
  { id: 'empreiteiro', name: 'Empreiteiro', categoryId: 'reformas', icon: 'paintbrush', aliases: ['empreitada', 'obra'], sortOrder: 45 },
  { id: 'arquiteto', name: 'Arquiteto', categoryId: 'reformas', icon: 'paintbrush', aliases: ['arquitetura', 'projeto arquitetônico'], sortOrder: 46 },
  { id: 'engenheiro_civil', name: 'Engenheiro civil', categoryId: 'reformas', icon: 'paintbrush', aliases: ['engenharia', 'responsável técnico'], sortOrder: 47 },
  { id: 'projetos', name: 'Projetos', categoryId: 'reformas', icon: 'paintbrush', aliases: ['projeto', 'planejamento de obra'], sortOrder: 48 },
  { id: 'obras_residenciais', name: 'Obras residenciais', categoryId: 'reformas', icon: 'paintbrush', aliases: ['obra residencial', 'construção de casa'], sortOrder: 49 },
  { id: 'obras_comerciais', name: 'Obras comerciais', categoryId: 'reformas', icon: 'paintbrush', aliases: ['obra comercial', 'loja', 'escritório'], sortOrder: 50 },
  { id: 'reforma_completa', name: 'Reforma completa', categoryId: 'reformas', icon: 'paintbrush', aliases: ['reforma geral', 'reforma de casa'], sortOrder: 51 },

  { id: 'manicure', name: 'Manicure', categoryId: 'beleza_bem_estar', icon: 'heart', aliases: ['unha', 'pedicure'], sortOrder: 40 },
  { id: 'cabeleireira', name: 'Cabeleireira', categoryId: 'beleza_bem_estar', icon: 'heart', aliases: ['cabelo', 'corte'], sortOrder: 41 },
  { id: 'massagista', name: 'Massagista', categoryId: 'beleza_bem_estar', icon: 'heart', aliases: ['massagem'], sortOrder: 42 },
  { id: 'personal_trainer', name: 'Personal trainer', categoryId: 'beleza_bem_estar', icon: 'heart', aliases: ['personal', 'treino'], sortOrder: 43 },

  { id: 'cortinas_persianas', name: 'Cortinas e persianas', categoryId: 'casa_decoracao', icon: 'home', aliases: ['cortina', 'persiana', 'produção de cortinas'], sortOrder: 52 },
  { id: 'instalacao_cortinas', name: 'Instalação de cortinas', categoryId: 'casa_decoracao', icon: 'home', aliases: ['instalar cortina', 'instalação de persianas'], sortOrder: 53 },
  { id: 'manutencao_persianas', name: 'Manutenção de persianas', categoryId: 'casa_decoracao', icon: 'home', aliases: ['conserto de persiana', 'reparo de persiana'], sortOrder: 54 },
  { id: 'automacao_cortinas', name: 'Automação de cortinas', categoryId: 'casa_decoracao', icon: 'home', aliases: ['cortina automatizada', 'persiana automatizada'], sortOrder: 55 },
  { id: 'tapeceiro', name: 'Tapeceiro', categoryId: 'casa_decoracao', icon: 'home', aliases: ['tapeçaria', 'reforma de sofá'], sortOrder: 56 },
  { id: 'vidraceiro', name: 'Vidraceiro', categoryId: 'casa_decoracao', icon: 'home', aliases: ['vidro', 'espelho'], sortOrder: 57 },
  { id: 'montador_moveis', name: 'Montador de móveis', categoryId: 'casa_decoracao', icon: 'home', aliases: ['montagem de móveis', 'montador'], sortOrder: 58 },
  { id: 'moveis_planejados', name: 'Móveis planejados', categoryId: 'casa_decoracao', icon: 'home', aliases: ['móvel sob medida', 'marcenaria planejada'], sortOrder: 59 },
  { id: 'decoracao', name: 'Decoração', categoryId: 'casa_decoracao', icon: 'home', aliases: ['decorador', 'design de interiores'], sortOrder: 60 },

  { id: 'lava_jato', name: 'Lava-jato', categoryId: 'automotivo', icon: 'car', aliases: ['lava jato', 'lavagem de carro', 'lavagem automotiva', 'lavar carro'], sortOrder: 61 },

  { id: 'outros', name: 'Outros', categoryId: 'outros', icon: 'more', aliases: ['outro', 'diversos'], sortOrder: 999 }
];

export const popularServiceSpecialties = serviceSpecialties
  .filter((specialty) => specialty.isPopular && specialty.id !== 'outros')
  .sort((a, b) => a.sortOrder - b.sortOrder);

export const serviceSpecialtiesForPicker = [...serviceSpecialties].sort((a, b) => {
  if (a.id === 'outros') return 1;
  if (b.id === 'outros') return -1;
  if (!!a.isPopular !== !!b.isPopular) return a.isPopular ? -1 : 1;
  return a.name.localeCompare(b.name, 'pt-BR');
});

export function getCategoryById(id?: string) {
  return categories.find((category) => category.id === id);
}

export function getServiceSpecialtyById(id?: string) {
  return serviceSpecialties.find((specialty) => specialty.id === id);
}
