create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.ensure_provider_category_scope()
returns trigger
language plpgsql
set search_path = public
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

create or replace function private.ensure_review_scope()
returns trigger
language plpgsql
set search_path = public
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

create or replace function private.ensure_review_photo_scope()
returns trigger
language plpgsql
set search_path = public
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

create or replace function private.ensure_report_scope()
returns trigger
language plpgsql
set search_path = public
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

create or replace function private.refresh_provider_review_stats_trigger()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform private.refresh_provider_review_stats(coalesce(new.provider_id, old.provider_id));
  return coalesce(new, old);
end;
$$;

create index if not exists idx_access_requests_reviewed_by on public.access_requests(reviewed_by);
create index if not exists idx_providers_created_by on public.providers(created_by);
create index if not exists idx_providers_deleted_by on public.providers(deleted_by);
create index if not exists idx_reports_reported_by on public.reports(reported_by);
create index if not exists idx_reports_resolved_by on public.reports(resolved_by);
create index if not exists idx_review_photos_uploaded_by on public.review_photos(uploaded_by);
create index if not exists idx_review_photos_deleted_by on public.review_photos(deleted_by);
create index if not exists idx_reviews_comment_deleted_by on public.reviews(comment_deleted_by);
create index if not exists idx_reviews_deleted_by on public.reviews(deleted_by);
