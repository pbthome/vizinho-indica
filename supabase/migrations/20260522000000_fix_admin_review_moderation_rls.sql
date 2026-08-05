create policy "admins can view condominium reviews"
on public.reviews for select
to authenticated
using (private.is_admin_or_moderator(condominium_id));

create policy "admins can view condominium review photos"
on public.review_photos for select
to authenticated
using (private.is_admin_or_moderator(condominium_id));
