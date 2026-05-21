with specialties (id, category_name, name, icon, aliases, sort_order, is_popular) as (
  values
    ('diarista', 'Limpeza', 'Diarista', 'sparkles', array['faxina', 'limpeza', 'diaria']::text[], 1, true),
    ('faxina_pos_obra', 'Limpeza', 'Faxina pos-obra', 'sparkles', array['faxina pesada', 'pos obra', 'limpeza pos obra']::text[], 20, false),
    ('passadeira', 'Limpeza', 'Passadeira', 'sparkles', array['passar roupa', 'roupas']::text[], 21, false),
    ('lavanderia', 'Limpeza', 'Lavanderia', 'sparkles', array['lavar roupa', 'roupas']::text[], 22, false),
    ('eletricista', 'Manutencao', 'Eletricista', 'wrench', array['eletrica', 'tomada', 'disjuntor', 'luz']::text[], 2, true),
    ('encanador', 'Manutencao', 'Encanador', 'wrench', array['hidraulica', 'vazamento', 'cano', 'torneira']::text[], 4, true),
    ('marido_de_aluguel', 'Manutencao', 'Marido de aluguel', 'wrench', array['pequenos reparos', 'faz tudo', 'manutencao']::text[], 6, true),
    ('ar_condicionado', 'Manutencao', 'Ar-condicionado', 'wrench', array['ar condicionado', 'split', 'instalacao de ar', 'limpeza de ar']::text[], 7, true),
    ('chaveiro', 'Manutencao', 'Chaveiro', 'wrench', array['fechadura', 'chave', 'porta']::text[], 23, false),
    ('tecnico_eletrodomesticos', 'Manutencao', 'Tecnico de eletrodomesticos', 'wrench', array['geladeira', 'maquina de lavar', 'fogao']::text[], 24, false),
    ('jardineiro', 'Jardim e Piscina', 'Jardineiro', 'leaf', array['jardim', 'poda', 'grama']::text[], 3, true),
    ('piscineiro', 'Jardim e Piscina', 'Piscineiro', 'leaf', array['piscina', 'limpeza de piscina']::text[], 5, true),
    ('paisagista', 'Jardim e Piscina', 'Paisagista', 'leaf', array['paisagismo', 'jardim']::text[], 25, false),
    ('controle_pragas', 'Jardim e Piscina', 'Controle de pragas', 'leaf', array['dedetizacao', 'insetos', 'pragas']::text[], 26, false),
    ('marmitas', 'Alimentacao', 'Marmitas', 'utensils', array['marmita', 'comida caseira', 'almoco']::text[], 27, false),
    ('bolos_doces', 'Alimentacao', 'Bolos e doces', 'utensils', array['bolo', 'doce', 'sobremesa']::text[], 28, false),
    ('churrasqueiro', 'Alimentacao', 'Churrasqueiro', 'utensils', array['churrasco', 'evento']::text[], 29, false),
    ('buffet', 'Alimentacao', 'Buffet', 'utensils', array['festa', 'evento']::text[], 30, false),
    ('congelados', 'Alimentacao', 'Congelados', 'utensils', array['comida congelada', 'marmitas congeladas']::text[], 31, false),
    ('banho_tosa', 'Pets', 'Banho e tosa', 'paw-print', array['pet shop', 'tosa']::text[], 32, false),
    ('dog_walker', 'Pets', 'Dog walker', 'paw-print', array['passeador', 'passeio com cachorro', 'caes']::text[], 33, false),
    ('pet_sitter', 'Pets', 'Pet sitter', 'paw-print', array['cuidador pet', 'petsitter', 'cuidar de pet']::text[], 34, false),
    ('veterinario', 'Pets', 'Veterinario', 'paw-print', array['vet', 'veterinaria']::text[], 35, false),
    ('pedreiro', 'Reformas', 'Pedreiro', 'hammer', array['obra', 'alvenaria']::text[], 8, true),
    ('pintor', 'Reformas', 'Pintor', 'hammer', array['pintura']::text[], 36, false),
    ('marceneiro', 'Reformas', 'Marceneiro', 'hammer', array['marcenaria', 'moveis']::text[], 37, false),
    ('gesseiro', 'Reformas', 'Gesseiro', 'hammer', array['gesso', 'drywall']::text[], 38, false),
    ('serralheiro', 'Reformas', 'Serralheiro', 'hammer', array['serralheria', 'portao']::text[], 39, false),
    ('manicure', 'Beleza e Bem-estar', 'Manicure', 'heart', array['unha', 'pedicure']::text[], 40, false),
    ('cabeleireira', 'Beleza e Bem-estar', 'Cabeleireira', 'heart', array['cabelo', 'corte']::text[], 41, false),
    ('massagista', 'Beleza e Bem-estar', 'Massagista', 'heart', array['massagem']::text[], 42, false),
    ('personal_trainer', 'Beleza e Bem-estar', 'Personal trainer', 'heart', array['personal', 'treino']::text[], 43, false),
    ('outros', 'Outros', 'Outros', 'circle-ellipsis', array['outro', 'diversos']::text[], 999, false)
)
insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select
  specialties.id,
  provider_categories.id,
  specialties.name,
  specialties.icon,
  specialties.aliases,
  specialties.sort_order,
  specialties.is_popular
from specialties
join public.provider_categories
  on provider_categories.name = specialties.category_name
on conflict (id) do update
set category_id = excluded.category_id,
    name = excluded.name,
    icon = excluded.icon,
    aliases = excluded.aliases,
    sort_order = excluded.sort_order,
    is_popular = excluded.is_popular,
    active = true;
