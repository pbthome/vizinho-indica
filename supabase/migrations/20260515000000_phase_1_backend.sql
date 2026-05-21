create extension if not exists pgcrypto;

create schema if not exists private;

create table if not exists public.condominiums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  city text,
  state text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  condominium_id uuid not null references public.condominiums(id) on delete restrict,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  apartment text,
  block text,
  avatar_url text,
  role text not null default 'resident' check (role in ('resident', 'admin', 'moderator')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'blocked')),
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.provider_categories (
  id uuid primary key default gen_random_uuid(),
  condominium_id uuid references public.condominiums(id) on delete cascade,
  name text not null,
  icon text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  category_id uuid references public.provider_categories(id) on delete set null,
  name text not null,
  phone text,
  whatsapp text,
  instagram text,
  description text,
  service_specialty_id text,
  service_specialty_name text,
  custom_service_description text,
  average_rating numeric not null default 0,
  total_reviews integer not null default 0,
  would_hire_again_rate numeric not null default 0,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.users(id) on delete set null,
  moderation_reason text
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  service_performed text,
  used_when text check (used_when in ('this_week', 'last_month', 'three_to_six_months', 'more_than_six_months')),
  would_hire_again boolean not null,
  real_use_confirmed boolean not null default false,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  comment_deleted_at timestamptz,
  comment_deleted_by uuid references public.users(id) on delete set null,
  comment_moderation_reason text,
  deleted_at timestamptz,
  deleted_by uuid references public.users(id) on delete set null,
  moderation_reason text
);

create table if not exists public.review_photos (
  id uuid primary key default gen_random_uuid(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  review_id uuid not null references public.reviews(id) on delete cascade,
  uploaded_by uuid references public.users(id) on delete set null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.users(id) on delete set null,
  moderation_reason text
);

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'resolved', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  apartment text,
  block text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'blocked')),
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete cascade,
  reported_by uuid references public.users(id) on delete set null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'kept', 'hidden', 'removed')),
  resolved_by uuid references public.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  query text not null,
  results_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_condominium_id on public.users(condominium_id);
create index if not exists idx_users_auth_user_id on public.users(auth_user_id);
create index if not exists idx_users_status on public.users(status);
create index if not exists idx_provider_categories_condominium_id on public.provider_categories(condominium_id);
create index if not exists idx_providers_condominium_id on public.providers(condominium_id);
create index if not exists idx_providers_category_id on public.providers(category_id);
create index if not exists idx_providers_created_at on public.providers(created_at desc);
create index if not exists idx_reviews_condominium_id on public.reviews(condominium_id);
create index if not exists idx_reviews_provider_id on public.reviews(provider_id);
create index if not exists idx_reviews_user_id on public.reviews(user_id);
create index if not exists idx_reviews_created_at on public.reviews(created_at desc);
create index if not exists idx_review_photos_condominium_id on public.review_photos(condominium_id);
create index if not exists idx_review_photos_review_id on public.review_photos(review_id);
create index if not exists idx_feedbacks_condominium_id on public.feedbacks(condominium_id);
create index if not exists idx_feedbacks_user_id on public.feedbacks(user_id);
create index if not exists idx_feedbacks_status on public.feedbacks(status);
create index if not exists idx_feedbacks_created_at on public.feedbacks(created_at desc);
create index if not exists idx_access_requests_condominium_id on public.access_requests(condominium_id);
create index if not exists idx_access_requests_status on public.access_requests(status);
create index if not exists idx_access_requests_created_at on public.access_requests(created_at desc);
create index if not exists idx_reports_condominium_id on public.reports(condominium_id);
create index if not exists idx_reports_provider_id on public.reports(provider_id);
create index if not exists idx_reports_review_id on public.reports(review_id);
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_reports_created_at on public.reports(created_at desc);
create index if not exists idx_searches_condominium_id on public.searches(condominium_id);
create index if not exists idx_searches_user_id on public.searches(user_id);
create index if not exists idx_searches_created_at on public.searches(created_at desc);
create index if not exists idx_app_events_condominium_id on public.app_events(condominium_id);
create index if not exists idx_app_events_user_id on public.app_events(user_id);
create index if not exists idx_app_events_created_at on public.app_events(created_at desc);

create or replace function private.current_app_user()
returns public.users
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.users
  where auth_user_id = auth.uid()
    and deleted_at is null
  limit 1
$$;

create or replace function private.current_user_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from private.current_app_user()
$$;

create or replace function private.current_condominium_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select condominium_id from private.current_app_user()
$$;

create or replace function private.is_approved_member(target_condominium_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users
    where auth_user_id = auth.uid()
      and condominium_id = target_condominium_id
      and status = 'approved'
      and deleted_at is null
  )
$$;

create or replace function private.is_admin_or_moderator(target_condominium_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users
    where auth_user_id = auth.uid()
      and condominium_id = target_condominium_id
      and status = 'approved'
      and role in ('admin', 'moderator')
      and deleted_at is null
  )
$$;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_providers_updated_at
before update on public.providers
for each row execute function private.touch_updated_at();

create trigger set_reviews_updated_at
before update on public.reviews
for each row execute function private.touch_updated_at();

create trigger set_users_updated_at
before update on public.users
for each row execute function private.touch_updated_at();

create trigger set_provider_categories_updated_at
before update on public.provider_categories
for each row execute function private.touch_updated_at();

create trigger set_review_photos_updated_at
before update on public.review_photos
for each row execute function private.touch_updated_at();

create trigger set_feedbacks_updated_at
before update on public.feedbacks
for each row execute function private.touch_updated_at();

create trigger set_access_requests_updated_at
before update on public.access_requests
for each row execute function private.touch_updated_at();

create trigger set_reports_updated_at
before update on public.reports
for each row execute function private.touch_updated_at();

create or replace function private.ensure_provider_category_scope()
returns trigger
language plpgsql
as $$
declare
  category_condominium_id uuid;
begin
  if new.category_id is null then
    return new;
  end if;

  select condominium_id
  into category_condominium_id
  from public.provider_categories
  where id = new.category_id;

  if category_condominium_id is not null and category_condominium_id <> new.condominium_id then
    raise exception 'Provider category belongs to another condominium';
  end if;

  return new;
end;
$$;

create trigger ensure_provider_category_scope_before_write
before insert or update on public.providers
for each row execute function private.ensure_provider_category_scope();

create or replace function private.ensure_review_scope()
returns trigger
language plpgsql
as $$
declare
  provider_condominium_id uuid;
  review_user_condominium_id uuid;
begin
  select condominium_id
  into provider_condominium_id
  from public.providers
  where id = new.provider_id
    and deleted_at is null;

  if provider_condominium_id is null or provider_condominium_id <> new.condominium_id then
    raise exception 'Review provider belongs to another condominium';
  end if;

  select condominium_id
  into review_user_condominium_id
  from public.users
  where id = new.user_id
    and deleted_at is null;

  if review_user_condominium_id is null or review_user_condominium_id <> new.condominium_id then
    raise exception 'Review user belongs to another condominium';
  end if;

  return new;
end;
$$;

create trigger ensure_review_scope_before_write
before insert or update on public.reviews
for each row execute function private.ensure_review_scope();

create or replace function private.ensure_review_photo_scope()
returns trigger
language plpgsql
as $$
declare
  target_review record;
begin
  select condominium_id, user_id
  into target_review
  from public.reviews
  where id = new.review_id;

  if target_review.condominium_id is null or target_review.condominium_id <> new.condominium_id then
    raise exception 'Review photo belongs to another condominium';
  end if;

  if new.uploaded_by is not null and new.uploaded_by <> target_review.user_id then
    raise exception 'Review photo uploader must be the review author';
  end if;

  return new;
end;
$$;

create trigger ensure_review_photo_scope_before_write
before insert or update on public.review_photos
for each row execute function private.ensure_review_photo_scope();

create or replace function private.ensure_report_scope()
returns trigger
language plpgsql
as $$
declare
  provider_condominium_id uuid;
  review_condominium_id uuid;
begin
  select condominium_id
  into provider_condominium_id
  from public.providers
  where id = new.provider_id;

  if provider_condominium_id is null or provider_condominium_id <> new.condominium_id then
    raise exception 'Reported provider belongs to another condominium';
  end if;

  if new.review_id is not null then
    select condominium_id
    into review_condominium_id
    from public.reviews
    where id = new.review_id
      and provider_id = new.provider_id;

    if review_condominium_id is null or review_condominium_id <> new.condominium_id then
      raise exception 'Reported review belongs to another condominium';
    end if;
  end if;

  return new;
end;
$$;

create trigger ensure_report_scope_before_write
before insert or update on public.reports
for each row execute function private.ensure_report_scope();

create or replace function private.sync_access_request_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> old.status and new.auth_user_id is not null then
    update public.users
    set status = new.status
    where auth_user_id = new.auth_user_id
      and condominium_id = new.condominium_id
      and deleted_at is null;
  end if;

  return new;
end;
$$;

create trigger sync_access_request_status_after_update
after update of status on public.access_requests
for each row execute function private.sync_access_request_status();

create or replace function private.refresh_provider_review_stats(target_provider_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.providers p
  set
    average_rating = coalesce(stats.average_rating, 0),
    total_reviews = coalesce(stats.total_reviews, 0),
    would_hire_again_rate = coalesce(stats.would_hire_again_rate, 0),
    updated_at = now()
  from (
    select
      provider_id,
      round(avg(rating)::numeric, 2) as average_rating,
      count(*)::integer as total_reviews,
      round((avg(case when would_hire_again then 1 else 0 end) * 100)::numeric, 2) as would_hire_again_rate
    from public.reviews
    where provider_id = target_provider_id
      and deleted_at is null
    group by provider_id
  ) stats
  where p.id = target_provider_id
    and p.id = stats.provider_id;

  update public.providers
  set average_rating = 0,
      total_reviews = 0,
      would_hire_again_rate = 0,
      updated_at = now()
  where id = target_provider_id
    and not exists (
      select 1 from public.reviews
      where provider_id = target_provider_id
        and deleted_at is null
    );
end;
$$;

create or replace function private.refresh_provider_review_stats_trigger()
returns trigger
language plpgsql
as $$
begin
  perform private.refresh_provider_review_stats(coalesce(new.provider_id, old.provider_id));
  return coalesce(new, old);
end;
$$;

create trigger refresh_provider_review_stats_after_reviews
after insert or update or delete on public.reviews
for each row execute function private.refresh_provider_review_stats_trigger();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_condominium_id uuid;
  profile_id uuid;
begin
  select id
  into target_condominium_id
  from public.condominiums
  where slug = coalesce(new.raw_user_meta_data->>'condominium_slug', 'jardins-bolonha')
    and active = true
  limit 1;

  if target_condominium_id is null then
    raise exception 'Condominium not found for signup';
  end if;

  insert into public.users (
    condominium_id,
    auth_user_id,
    full_name,
    email,
    phone,
    apartment,
    block,
    role,
    status
  )
  values (
    target_condominium_id,
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'apartment',
    new.raw_user_meta_data->>'block',
    'resident',
    'pending'
  )
  returning id into profile_id;

  insert into public.access_requests (
    condominium_id,
    auth_user_id,
    full_name,
    email,
    phone,
    apartment,
    block,
    status
  )
  values (
    target_condominium_id,
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'apartment',
    new.raw_user_meta_data->>'block',
    'pending'
  )
  on conflict (auth_user_id) do nothing;

  insert into public.app_events (condominium_id, user_id, event_type, entity_type, entity_id, metadata)
  values (target_condominium_id, profile_id, 'signup', 'user', profile_id, '{}'::jsonb);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function private.handle_new_auth_user();

insert into public.condominiums (name, slug, city, state)
values ('Jardins Bolonha', 'jardins-bolonha', 'Sao Paulo', 'SP')
on conflict (slug) do nothing;

insert into public.provider_categories (name, icon, active)
values
  ('Limpeza', 'sparkles', true),
  ('Jardim e Piscina', 'leaf', true),
  ('Manutencao', 'wrench', true),
  ('Alimentacao', 'utensils', true),
  ('Pets', 'paw-print', true),
  ('Reformas', 'hammer', true),
  ('Beleza e Bem-estar', 'heart', true),
  ('Outros', 'circle-ellipsis', true)
on conflict do nothing;

alter table public.condominiums enable row level security;
alter table public.users enable row level security;
alter table public.provider_categories enable row level security;
alter table public.providers enable row level security;
alter table public.reviews enable row level security;
alter table public.review_photos enable row level security;
alter table public.feedbacks enable row level security;
alter table public.access_requests enable row level security;
alter table public.reports enable row level security;
alter table public.searches enable row level security;
alter table public.app_events enable row level security;

create policy "approved members can view own condominium"
on public.condominiums for select
to authenticated
using (private.is_approved_member(id));

create policy "users can view their own profile"
on public.users for select
to authenticated
using ((select auth.uid()) = auth_user_id);

create policy "admins can view condominium users"
on public.users for select
to authenticated
using (private.is_admin_or_moderator(condominium_id));

create policy "users can update their own last active"
on public.users for update
to authenticated
using ((select auth.uid()) = auth_user_id)
with check (
  (select auth.uid()) = auth_user_id
  and role = (select role from public.users where auth_user_id = auth.uid())
  and status = (select status from public.users where auth_user_id = auth.uid())
  and condominium_id = private.current_condominium_id()
);

create policy "admins can update condominium users"
on public.users for update
to authenticated
using (private.is_admin_or_moderator(condominium_id))
with check (private.is_admin_or_moderator(condominium_id));

create policy "members can view global and condominium categories"
on public.provider_categories for select
to authenticated
using (
  active = true
  and (
    condominium_id is null
    or private.is_approved_member(condominium_id)
  )
);

create policy "members can view condominium providers"
on public.providers for select
to authenticated
using (deleted_at is null and private.is_approved_member(condominium_id));

create policy "approved members can create providers"
on public.providers for insert
to authenticated
with check (
  private.is_approved_member(condominium_id)
  and created_by = private.current_user_id()
  and deleted_at is null
  and deleted_by is null
  and moderation_reason is null
);

create policy "admins can update providers"
on public.providers for update
to authenticated
using (private.is_admin_or_moderator(condominium_id))
with check (private.is_admin_or_moderator(condominium_id));

create policy "members can view condominium reviews"
on public.reviews for select
to authenticated
using (deleted_at is null and private.is_approved_member(condominium_id));

create policy "approved members can create reviews"
on public.reviews for insert
to authenticated
with check (
  private.is_approved_member(condominium_id)
  and user_id = private.current_user_id()
  and deleted_at is null
  and deleted_by is null
  and moderation_reason is null
  and exists (
    select 1
    from public.providers
    where providers.id = reviews.provider_id
      and providers.condominium_id = reviews.condominium_id
      and providers.deleted_at is null
  )
);

create policy "admins can moderate reviews"
on public.reviews for update
to authenticated
using (private.is_admin_or_moderator(condominium_id))
with check (private.is_admin_or_moderator(condominium_id));

create policy "members can view condominium review photos"
on public.review_photos for select
to authenticated
using (deleted_at is null and private.is_approved_member(condominium_id));

create policy "approved members can create review photos"
on public.review_photos for insert
to authenticated
with check (
  private.is_approved_member(condominium_id)
  and uploaded_by = private.current_user_id()
  and deleted_at is null
  and deleted_by is null
  and moderation_reason is null
  and exists (
    select 1
    from public.reviews
    where reviews.id = review_photos.review_id
      and reviews.condominium_id = review_photos.condominium_id
      and reviews.user_id = private.current_user_id()
      and reviews.deleted_at is null
  )
);

create policy "admins can moderate review photos"
on public.review_photos for update
to authenticated
using (private.is_admin_or_moderator(condominium_id))
with check (private.is_admin_or_moderator(condominium_id));

create policy "users can create feedback"
on public.feedbacks for insert
to authenticated
with check (
  private.is_approved_member(condominium_id)
  and user_id = private.current_user_id()
);

create policy "users can view own feedback"
on public.feedbacks for select
to authenticated
using (user_id = private.current_user_id());

create policy "admins can manage feedback"
on public.feedbacks for all
to authenticated
using (private.is_admin_or_moderator(condominium_id))
with check (private.is_admin_or_moderator(condominium_id));

create policy "users can view own access request"
on public.access_requests for select
to authenticated
using ((select auth.uid()) = auth_user_id);

create policy "admins can manage access requests"
on public.access_requests for all
to authenticated
using (private.is_admin_or_moderator(condominium_id))
with check (private.is_admin_or_moderator(condominium_id));

create policy "approved members can report condominium content"
on public.reports for insert
to authenticated
with check (
  private.is_approved_member(condominium_id)
  and reported_by = private.current_user_id()
  and status = 'open'
);

create policy "users can view own reports"
on public.reports for select
to authenticated
using (reported_by = private.current_user_id());

create policy "admins can manage reports"
on public.reports for all
to authenticated
using (private.is_admin_or_moderator(condominium_id))
with check (private.is_admin_or_moderator(condominium_id));

create policy "approved members can record searches"
on public.searches for insert
to authenticated
with check (
  private.is_approved_member(condominium_id)
  and user_id = private.current_user_id()
);

create policy "admins can view searches"
on public.searches for select
to authenticated
using (private.is_admin_or_moderator(condominium_id));

create policy "approved members can record app events"
on public.app_events for insert
to authenticated
with check (
  private.is_approved_member(condominium_id)
  and (user_id is null or user_id = private.current_user_id())
);

create policy "admins can view app events"
on public.app_events for select
to authenticated
using (private.is_admin_or_moderator(condominium_id));

grant usage on schema public to anon, authenticated;
grant usage on schema private to authenticated;
grant select on public.condominiums to authenticated;
grant select on public.users to authenticated;
grant update (full_name, phone, apartment, block, avatar_url, last_active_at) on public.users to authenticated;
grant select on public.provider_categories to authenticated;
grant select, insert on public.providers to authenticated;
grant update (deleted_at, deleted_by, moderation_reason) on public.providers to authenticated;
grant select, insert on public.reviews to authenticated;
grant update (comment, comment_deleted_at, comment_deleted_by, comment_moderation_reason, deleted_at, deleted_by, moderation_reason) on public.reviews to authenticated;
grant select, insert on public.review_photos to authenticated;
grant update (deleted_at, deleted_by, moderation_reason) on public.review_photos to authenticated;
grant select, insert on public.feedbacks to authenticated;
grant update (status, resolved_at) on public.feedbacks to authenticated;
grant select on public.access_requests to authenticated;
grant update (status, reviewed_by, reviewed_at) on public.access_requests to authenticated;
grant select, insert on public.reports to authenticated;
grant update (status, resolved_by, resolved_at) on public.reports to authenticated;
grant select, insert on public.searches to authenticated;
grant select, insert on public.app_events to authenticated;
grant execute on all functions in schema private to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "members can view review photos in own condominium"
on storage.objects for select
to authenticated
using (
  bucket_id = 'review-photos'
  and private.is_approved_member((storage.foldername(name))[1]::uuid)
);

create policy "approved members can upload review photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'review-photos'
  and private.is_approved_member((storage.foldername(name))[1]::uuid)
);

create policy "admins can manage review photo objects"
on storage.objects for update
to authenticated
using (
  bucket_id = 'review-photos'
  and private.is_admin_or_moderator((storage.foldername(name))[1]::uuid)
)
with check (
  bucket_id = 'review-photos'
  and private.is_admin_or_moderator((storage.foldername(name))[1]::uuid)
);
