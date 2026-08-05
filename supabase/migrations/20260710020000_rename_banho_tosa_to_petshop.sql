update public.provider_specialties
set
  name = 'Petshop',
  aliases = array['pet shop', 'banho e tosa', 'tosa'],
  updated_at = now()
where id = 'banho_tosa';

update public.providers
set service_specialty_name = 'Petshop'
where service_specialty_id = 'banho_tosa';
