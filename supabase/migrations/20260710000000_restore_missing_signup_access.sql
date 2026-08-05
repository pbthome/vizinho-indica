create or replace function public.restore_missing_signup_access(
  input_full_name text default null,
  input_phone text default null,
  input_block text default null,
  input_apartment text default null
)
returns public.users
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  auth_record auth.users%rowtype;
  target_condominium_id uuid;
  profile_row public.users%rowtype;
  resolved_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into auth_record
  from auth.users
  where id = auth.uid();

  if auth_record.id is null then
    raise exception 'Authenticated user not found';
  end if;

  select id
  into target_condominium_id
  from public.condominiums
  where slug = coalesce(auth_record.raw_user_meta_data->>'condominium_slug', 'jardins-bolonha')
    and active = true
  limit 1;

  if target_condominium_id is null then
    raise exception 'Condominium not found for signup recovery';
  end if;

  resolved_name := coalesce(nullif(input_full_name, ''), nullif(auth_record.raw_user_meta_data->>'full_name', ''), split_part(auth_record.email, '@', 1));

  update public.users
  set condominium_id = target_condominium_id,
      full_name = resolved_name,
      email = auth_record.email,
      phone = coalesce(nullif(input_phone, ''), auth_record.raw_user_meta_data->>'phone'),
      apartment = coalesce(nullif(input_apartment, ''), auth_record.raw_user_meta_data->>'apartment'),
      block = coalesce(nullif(input_block, ''), auth_record.raw_user_meta_data->>'block'),
      role = 'resident',
      status = 'pending',
      deleted_at = null
  where auth_user_id = auth.uid()
  returning * into profile_row;

  if profile_row.id is null then
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
      auth.uid(),
      resolved_name,
      auth_record.email,
      coalesce(nullif(input_phone, ''), auth_record.raw_user_meta_data->>'phone'),
      coalesce(nullif(input_apartment, ''), auth_record.raw_user_meta_data->>'apartment'),
      coalesce(nullif(input_block, ''), auth_record.raw_user_meta_data->>'block'),
      'resident',
      'pending'
    )
    returning * into profile_row;
  end if;

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
    auth.uid(),
    resolved_name,
    auth_record.email,
    coalesce(nullif(input_phone, ''), auth_record.raw_user_meta_data->>'phone'),
    coalesce(nullif(input_apartment, ''), auth_record.raw_user_meta_data->>'apartment'),
    coalesce(nullif(input_block, ''), auth_record.raw_user_meta_data->>'block'),
    'pending'
  )
  on conflict (auth_user_id) do update
  set condominium_id = excluded.condominium_id,
      full_name = excluded.full_name,
      email = excluded.email,
      phone = excluded.phone,
      apartment = excluded.apartment,
      block = excluded.block,
      status = 'pending',
      reviewed_by = null,
      reviewed_at = null,
      updated_at = timezone('utc', now());

  return profile_row;
end;
$$;

revoke all on function public.restore_missing_signup_access() from public;
grant execute on function public.restore_missing_signup_access() to authenticated;
