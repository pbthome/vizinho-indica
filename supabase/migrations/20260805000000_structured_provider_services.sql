alter table public.providers
  add column if not exists business_description text,
  add column if not exists additional_service_specialty_ids text[] not null default '{}',
  add column if not exists additional_service_specialty_names text[] not null default '{}';

alter table public.providers
  drop constraint if exists providers_additional_services_limit;

alter table public.providers
  add constraint providers_additional_services_limit
  check (
    cardinality(additional_service_specialty_ids) <= 4
    and cardinality(additional_service_specialty_ids) = cardinality(additional_service_specialty_names)
  );

insert into public.provider_categories (name, icon, active)
select 'Casa e decoracao', 'home', true
where not exists (
  select 1 from public.provider_categories where name in ('Casa e decoracao', 'Casa e decoração')
);

with catalog (id, category_name, name, icon, aliases, sort_order) as (
  values
    ('construtora', 'Reformas', 'Construtora', 'hammer', array['construcao civil', 'empresa de obras', 'obra completa']::text[], 44),
    ('empreiteiro', 'Reformas', 'Empreiteiro', 'hammer', array['empreitada', 'obra']::text[], 45),
    ('arquiteto', 'Reformas', 'Arquiteto', 'hammer', array['arquitetura', 'projeto arquitetonico']::text[], 46),
    ('engenheiro_civil', 'Reformas', 'Engenheiro civil', 'hammer', array['engenharia', 'responsavel tecnico']::text[], 47),
    ('projetos', 'Reformas', 'Projetos', 'hammer', array['projeto', 'planejamento de obra']::text[], 48),
    ('obras_residenciais', 'Reformas', 'Obras residenciais', 'hammer', array['obra residencial', 'construcao de casa']::text[], 49),
    ('obras_comerciais', 'Reformas', 'Obras comerciais', 'hammer', array['obra comercial', 'loja', 'escritorio']::text[], 50),
    ('reforma_completa', 'Reformas', 'Reforma completa', 'hammer', array['reforma geral', 'reforma de casa']::text[], 51),
    ('cortinas_persianas', 'Casa e decoracao', 'Cortinas e persianas', 'home', array['cortina', 'persiana', 'producao de cortinas']::text[], 52),
    ('instalacao_cortinas', 'Casa e decoracao', 'Instalacao de cortinas', 'home', array['instalar cortina', 'instalacao de persianas']::text[], 53),
    ('manutencao_persianas', 'Casa e decoracao', 'Manutencao de persianas', 'home', array['conserto de persiana', 'reparo de persiana']::text[], 54),
    ('automacao_cortinas', 'Casa e decoracao', 'Automacao de cortinas', 'home', array['cortina automatizada', 'persiana automatizada']::text[], 55),
    ('tapeceiro', 'Casa e decoracao', 'Tapeceiro', 'home', array['tapecaria', 'reforma de sofa']::text[], 56),
    ('vidraceiro', 'Casa e decoracao', 'Vidraceiro', 'home', array['vidro', 'espelho']::text[], 57),
    ('montador_moveis', 'Casa e decoracao', 'Montador de moveis', 'home', array['montagem de moveis', 'montador']::text[], 58),
    ('moveis_planejados', 'Casa e decoracao', 'Moveis planejados', 'home', array['movel sob medida', 'marcenaria planejada']::text[], 59),
    ('decoracao', 'Casa e decoracao', 'Decoracao', 'home', array['decorador', 'design de interiores']::text[], 60)
)
insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, is_popular)
select catalog.id, categories.id, catalog.name, catalog.icon, catalog.aliases, catalog.sort_order, false
from catalog
join public.provider_categories categories on categories.name = catalog.category_name
on conflict (id) do update
set category_id = excluded.category_id,
    name = excluded.name,
    icon = excluded.icon,
    aliases = excluded.aliases,
    sort_order = excluded.sort_order,
    active = true;

create table if not exists public.service_suggestions (
  id uuid primary key default gen_random_uuid(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  proposed_name text not null check (char_length(trim(proposed_name)) between 2 and 40),
  suggested_category_id uuid references public.provider_categories(id) on delete set null,
  provider_id uuid references public.providers(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'linked', 'rejected')),
  resolved_specialty_id text references public.provider_specialties(id) on delete set null,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.service_suggestions (
  condominium_id,
  proposed_name,
  provider_id,
  created_by,
  status,
  created_at
)
select
  providers.condominium_id,
  left(trim(providers.custom_service_description), 40),
  providers.id,
  providers.created_by,
  'pending',
  providers.created_at
from public.providers
where providers.service_specialty_id = 'outros'
  and nullif(trim(providers.custom_service_description), '') is not null
  and not exists (
    select 1 from public.service_suggestions where service_suggestions.provider_id = providers.id
  );

create index if not exists idx_service_suggestions_condominium_status
  on public.service_suggestions(condominium_id, status, created_at desc);

alter table public.service_suggestions enable row level security;

create policy "members can create service suggestions"
on public.service_suggestions for insert to authenticated
with check (
  private.is_approved_member(condominium_id)
  and created_by = private.current_user_id()
  and status = 'pending'
);

create policy "admins can view service suggestions"
on public.service_suggestions for select to authenticated
using (private.is_admin_or_moderator(condominium_id));

create policy "admins can review service suggestions"
on public.service_suggestions for update to authenticated
using (private.is_admin_or_moderator(condominium_id))
with check (private.is_admin_or_moderator(condominium_id));

grant select, insert, update on public.service_suggestions to authenticated;

create or replace function public.review_service_suggestion(
  target_suggestion_id uuid,
  decision text,
  target_specialty_id text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  suggestion public.service_suggestions%rowtype;
  resolved_id text;
  resolved_name text;
  normalized_id text;
begin
  select * into suggestion from public.service_suggestions where id = target_suggestion_id for update;
  if suggestion.id is null or not private.is_admin_or_moderator(suggestion.condominium_id) then
    raise exception 'Service suggestion not found or access denied';
  end if;

  if decision = 'linked' then
    select id, name into resolved_id, resolved_name
    from public.provider_specialties where id = target_specialty_id and active = true;
    if resolved_id is null then raise exception 'Target specialty not found'; end if;
  elsif decision = 'approved' then
    normalized_id := trim(both '_' from regexp_replace(
      lower(translate(suggestion.proposed_name, 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')),
      '[^a-z0-9]+', '_', 'g'
    ));
    resolved_id := normalized_id;
    resolved_name := suggestion.proposed_name;
    insert into public.provider_specialties (id, category_id, name, icon, aliases, sort_order, active)
    values (
      resolved_id,
      coalesce(suggestion.suggested_category_id, (select id from public.provider_categories where name = 'Outros' limit 1)),
      resolved_name,
      'circle-ellipsis',
      array[lower(suggestion.proposed_name)],
      900,
      true
    )
    on conflict (id) do update set active = true
    returning id, name into resolved_id, resolved_name;
  elsif decision = 'rejected' then
    update public.service_suggestions
    set status = 'rejected', reviewed_by = private.current_user_id(), reviewed_at = now(), updated_at = now()
    where id = target_suggestion_id;
    return null;
  else
    raise exception 'Invalid review decision';
  end if;

  if suggestion.provider_id is not null then
    update public.providers
    set service_specialty_id = resolved_id,
        service_specialty_name = resolved_name,
        category_id = (select category_id from public.provider_specialties where id = resolved_id),
        custom_service_description = null,
        updated_at = now()
    where id = suggestion.provider_id;
  end if;

  update public.service_suggestions
  set status = decision,
      resolved_specialty_id = resolved_id,
      reviewed_by = private.current_user_id(),
      reviewed_at = now(),
      updated_at = now()
  where id = target_suggestion_id;

  return resolved_id;
end;
$$;

grant execute on function public.review_service_suggestion(uuid, text, text) to authenticated;
