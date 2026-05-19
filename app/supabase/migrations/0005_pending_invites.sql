-- =============================================================================
-- Karuna · 0005 · pending_invites
-- =============================================================================
-- An invite is created when an admin sends an OTP to a phone that isn't yet
-- a member. The invitee receives the OTP, signs in, and a reconciliation
-- trigger on profiles joins them into org_members and marks the invite
-- accepted_at.
-- =============================================================================

create table if not exists pending_invites (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  phone_e164    text not null,
  display_name  text,
  role          text not null check (role in ('owner','coordinator','vet','field','foster','awareness')),
  invited_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  unique (org_id, phone_e164)
);

create index if not exists pending_invites_org_idx on pending_invites (org_id);
create index if not exists pending_invites_phone_idx on pending_invites (phone_e164) where accepted_at is null;

alter table pending_invites enable row level security;

drop policy if exists "invites: members read" on pending_invites;
create policy "invites: members read" on pending_invites for select
  using (org_id in (select my_org_ids()));

drop policy if exists "invites: owners write" on pending_invites;
create policy "invites: owners write" on pending_invites for all
  using (
    org_id in (
      select org_id from org_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

create or replace function pending_invites_set_invited_by() returns trigger
language plpgsql security invoker as $$
begin
  if new.invited_by is null then
    new.invited_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists pending_invites_set_invited_by_tg on pending_invites;
create trigger pending_invites_set_invited_by_tg
  before insert on pending_invites
  for each row execute function pending_invites_set_invited_by();

create or replace function reconcile_pending_invites() returns trigger
language plpgsql security definer as $$
declare
  inv record;
begin
  if new.phone_e164 is null then return new; end if;
  for inv in
    select * from pending_invites
    where phone_e164 = new.phone_e164 and accepted_at is null
  loop
    insert into org_members (org_id, user_id, role, current_status)
    values (inv.org_id, new.id, inv.role, 'off-shift')
    on conflict (org_id, user_id, role) do nothing;

    update pending_invites set accepted_at = now() where id = inv.id;
  end loop;
  return new;
end;
$$;

drop trigger if exists profiles_reconcile_invites on profiles;
create trigger profiles_reconcile_invites
  after insert or update of phone_e164 on profiles
  for each row execute function reconcile_pending_invites();
