-- =============================================================================
-- Karuna · 0004 · storage buckets, push tokens, receipts wiring
-- =============================================================================

alter table profiles add column if not exists push_token text;
create index if not exists profiles_push_token_idx on profiles (push_token) where push_token is not null;

create index if not exists donations_razorpay_order_idx on donations (razorpay_order) where razorpay_order is not null;

insert into storage.buckets (id, name, public) values ('case-photos', 'case-photos', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', true)
  on conflict (id) do nothing;

drop policy if exists "case-photos public read" on storage.objects;
create policy "case-photos public read" on storage.objects for select
  using (bucket_id = 'case-photos');

drop policy if exists "case-photos authenticated insert" on storage.objects;
create policy "case-photos authenticated insert" on storage.objects for insert
  with check (
    bucket_id = 'case-photos'
    and (auth.role() = 'authenticated' or auth.role() = 'anon')
  );

drop policy if exists "case-photos members delete" on storage.objects;
create policy "case-photos members delete" on storage.objects for delete
  using (
    bucket_id = 'case-photos'
    and split_part(name, '/', 1) in (
      select o.slug from organizations o
      join org_members m on m.org_id = o.id
      where m.user_id = auth.uid()
    )
  );

drop policy if exists "receipts public read" on storage.objects;
create policy "receipts public read" on storage.objects for select
  using (bucket_id = 'receipts');

drop policy if exists "receipts service-role write" on storage.objects;
create policy "receipts service-role write" on storage.objects for insert
  with check (bucket_id = 'receipts' and auth.role() = 'service_role');

create or replace function note_pushable_event() returns trigger
language plpgsql as $$
begin
  return new;
end;
$$;

drop trigger if exists case_events_note_pushable on case_events;
create trigger case_events_note_pushable after insert on case_events
  for each row when (new.kind in ('dispatched','rescued','release','status-change'))
  execute function note_pushable_event();
