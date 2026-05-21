drop policy if exists "approved members can record searches" on public.searches;

create policy "approved members can record searches"
on public.searches for insert
to authenticated
with check (
  private.is_approved_member(condominium_id)
  and (user_id is null or user_id = private.current_user_id())
);
