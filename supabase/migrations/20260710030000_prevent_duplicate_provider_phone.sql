create unique index if not exists uq_providers_condominium_phone_active
on public.providers (condominium_id, phone)
where deleted_at is null
  and phone is not null
  and btrim(phone) <> '';
