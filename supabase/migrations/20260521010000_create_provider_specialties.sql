create table if not exists public.provider_specialties (
  id text primary key,
  category_id uuid not null references public.provider_categories(id) on delete cascade,
  name text not null,
  icon text,
  aliases text[] not null default '{}',
  sort_order integer not null default 0,
  active boolean not null default true,
  is_popular boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_provider_specialties_category_id on public.provider_specialties(category_id);
create index if not exists idx_provider_specialties_active_sort_order on public.provider_specialties(active, sort_order);

drop trigger if exists set_provider_specialties_updated_at on public.provider_specialties;
create trigger set_provider_specialties_updated_at
before update on public.provider_specialties
for each row execute function private.touch_updated_at();

alter table public.provider_specialties enable row level security;

drop policy if exists "members can view active provider specialties" on public.provider_specialties;
create policy "members can view active provider specialties"
on public.provider_specialties for select
to authenticated
using (
  active = true
  and exists (
    select 1
    from public.provider_categories
    where provider_categories.id = provider_specialties.category_id
      and provider_categories.active = true
      and (
        provider_categories.condominium_id is null
        or private.is_approved_member(provider_categories.condominium_id)
      )
  )
);

grant select on public.provider_specialties to authenticated;

create or replace function private.ensure_provider_category_and_specialty_scope()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  category_condominium_id uuid;
  specialty_category_id uuid;
begin
  if new.category_id is not null then
    select condominium_id
    into category_condominium_id
    from public.provider_categories
    where id = new.category_id;

    if category_condominium_id is not null and category_condominium_id <> new.condominium_id then
      raise exception 'Provider category belongs to another condominium';
    end if;
  end if;

  if new.service_specialty_id is not null then
    select category_id
    into specialty_category_id
    from public.provider_specialties
    where id = new.service_specialty_id
      and active = true;

    if specialty_category_id is null then
      raise exception 'Provider specialty not found or inactive';
    end if;

    if new.category_id is not null and specialty_category_id <> new.category_id then
      raise exception 'Provider specialty belongs to another category';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_provider_category_scope_before_write on public.providers;
create trigger ensure_provider_category_scope_before_write
before insert or update on public.providers
for each row execute function private.ensure_provider_category_and_specialty_scope();

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'diarista', id, 'Diarista', 'sparkles', array['faxina', 'limpeza', 'diaria'], 1, true
from public.provider_categories
where name = 'Limpeza'
on conflict (id) do update
set category_id = excluded.category_id,
    name = excluded.name,
    icon = excluded.icon,
    aliases = excluded.aliases,
    sort_order = excluded.sort_order,
    is_popular = excluded.is_popular,
    active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'faxina_pos_obra', id, 'Faxina pos-obra', 'sparkles', array['faxina pesada', 'pos obra', 'limpeza pos obra'], 20, false
from public.provider_categories
where name = 'Limpeza'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'passadeira', id, 'Passadeira', 'sparkles', array['passar roupa', 'roupas'], 21, false
from public.provider_categories where name = 'Limpeza'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'lavanderia', id, 'Lavanderia', 'sparkles', array['lavar roupa', 'roupas'], 22, false
from public.provider_categories where name = 'Limpeza'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'eletricista', id, 'Eletricista', 'wrench', array['eletrica', 'tomada', 'disjuntor', 'luz'], 2, true
from public.provider_categories where name = 'Manutencao'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'encanador', id, 'Encanador', 'wrench', array['hidraulica', 'vazamento', 'cano', 'torneira'], 4, true
from public.provider_categories where name = 'Manutencao'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'marido_de_aluguel', id, 'Marido de aluguel', 'wrench', array['pequenos reparos', 'faz tudo', 'manutencao'], 6, true
from public.provider_categories where name = 'Manutencao'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'ar_condicionado', id, 'Ar-condicionado', 'wrench', array['ar condicionado', 'split', 'instalacao de ar', 'limpeza de ar'], 7, true
from public.provider_categories where name = 'Manutencao'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'chaveiro', id, 'Chaveiro', 'wrench', array['fechadura', 'chave', 'porta'], 23, false
from public.provider_categories where name = 'Manutencao'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'tecnico_eletrodomesticos', id, 'Tecnico de eletrodomesticos', 'wrench', array['geladeira', 'maquina de lavar', 'fogao'], 24, false
from public.provider_categories where name = 'Manutencao'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'jardineiro', id, 'Jardineiro', 'leaf', array['jardim', 'poda', 'grama'], 3, true
from public.provider_categories where name = 'Jardim e Piscina'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'piscineiro', id, 'Piscineiro', 'leaf', array['piscina', 'limpeza de piscina'], 5, true
from public.provider_categories where name = 'Jardim e Piscina'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'paisagista', id, 'Paisagista', 'leaf', array['paisagismo', 'jardim'], 25, false
from public.provider_categories where name = 'Jardim e Piscina'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'controle_pragas', id, 'Controle de pragas', 'leaf', array['dedetizacao', 'insetos', 'pragas'], 26, false
from public.provider_categories where name = 'Jardim e Piscina'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'marmitas', id, 'Marmitas', 'utensils', array['marmita', 'comida caseira', 'almoco'], 27, false
from public.provider_categories where name = 'Alimentacao'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'bolos_doces', id, 'Bolos e doces', 'utensils', array['bolo', 'doce', 'sobremesa'], 28, false
from public.provider_categories where name = 'Alimentacao'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'churrasqueiro', id, 'Churrasqueiro', 'utensils', array['churrasco', 'evento'], 29, false
from public.provider_categories where name = 'Alimentacao'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'buffet', id, 'Buffet', 'utensils', array['festa', 'evento'], 30, false
from public.provider_categories where name = 'Alimentacao'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'congelados', id, 'Congelados', 'utensils', array['comida congelada', 'marmitas congeladas'], 31, false
from public.provider_categories where name = 'Alimentacao'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'banho_tosa', id, 'Banho e tosa', 'paw-print', array['pet shop', 'tosa'], 32, false
from public.provider_categories where name = 'Pets'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'dog_walker', id, 'Dog walker', 'paw-print', array['passeador', 'passeio com cachorro', 'caes'], 33, false
from public.provider_categories where name = 'Pets'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'pet_sitter', id, 'Pet sitter', 'paw-print', array['cuidador pet', 'petsitter', 'cuidar de pet'], 34, false
from public.provider_categories where name = 'Pets'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'veterinario', id, 'Veterinario', 'paw-print', array['vet', 'veterinaria'], 35, false
from public.provider_categories where name = 'Pets'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'pedreiro', id, 'Pedreiro', 'hammer', array['obra', 'alvenaria'], 8, true
from public.provider_categories where name = 'Reformas'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'pintor', id, 'Pintor', 'hammer', array['pintura'], 36, false
from public.provider_categories where name = 'Reformas'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'marceneiro', id, 'Marceneiro', 'hammer', array['marcenaria', 'moveis'], 37, false
from public.provider_categories where name = 'Reformas'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'gesseiro', id, 'Gesseiro', 'hammer', array['gesso', 'drywall'], 38, false
from public.provider_categories where name = 'Reformas'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'serralheiro', id, 'Serralheiro', 'hammer', array['serralheria', 'portao'], 39, false
from public.provider_categories where name = 'Reformas'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'manicure', id, 'Manicure', 'heart', array['unha', 'pedicure'], 40, false
from public.provider_categories where name = 'Beleza e Bem-estar'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'cabeleireira', id, 'Cabeleireira', 'heart', array['cabelo', 'corte'], 41, false
from public.provider_categories where name = 'Beleza e Bem-estar'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'massagista', id, 'Massagista', 'heart', array['massagem'], 42, false
from public.provider_categories where name = 'Beleza e Bem-estar'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'personal_trainer', id, 'Personal trainer', 'heart', array['personal', 'treino'], 43, false
from public.provider_categories where name = 'Beleza e Bem-estar'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select 'outros', id, 'Outros', 'circle-ellipsis', array['outro', 'diversos'], 999, false
from public.provider_categories where name = 'Outros'
on conflict (id) do update
set category_id = excluded.category_id, name = excluded.name, icon = excluded.icon, aliases = excluded.aliases, sort_order = excluded.sort_order, is_popular = excluded.is_popular, active = true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'providers_service_specialty_id_fkey'
  ) then
    alter table public.providers
    add constraint providers_service_specialty_id_fkey
    foreign key (service_specialty_id) references public.provider_specialties(id) on delete set null;
  end if;
end
$$;
