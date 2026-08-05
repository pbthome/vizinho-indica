insert into public.provider_categories (name, icon, active)
select 'Automotivo', 'car', true
where not exists (
  select 1
  from public.provider_categories
  where condominium_id is null
    and lower(name) = 'automotivo'
);

update public.provider_categories
set icon = 'car', active = true, updated_at = now()
where condominium_id is null
  and lower(name) = 'automotivo';

insert into public.provider_specialties (
  id,
  category_id,
  name,
  icon,
  aliases,
  sort_order,
  is_popular,
  active
)
select
  'lava_jato',
  id,
  'Lava-jato',
  'car',
  array['lava jato', 'lavagem de carro', 'lavagem automotiva', 'lavar carro']::text[],
  61,
  false,
  true
from public.provider_categories
where condominium_id is null
  and lower(name) = 'automotivo'
limit 1
on conflict (id) do update
set category_id = excluded.category_id,
    name = excluded.name,
    icon = excluded.icon,
    aliases = excluded.aliases,
    sort_order = excluded.sort_order,
    is_popular = excluded.is_popular,
    active = true,
    updated_at = now();
