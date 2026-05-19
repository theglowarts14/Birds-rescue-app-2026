-- =============================================================================
-- Karuna · 0006 · shifts, case comments, service areas, member metrics
-- =============================================================================
-- Closes four roster/operations gaps the v1 PRD flagged for after launch:
--
--   1. shifts                 — replaces the org_members.current_status flag
--                                with a real schedule
--   2. case_comments          — team-internal thread per case (was: WhatsApp)
--   3. org_members.service_areas + dispatch_priority   — area-aware routing
--   4. member_metrics view    — accept rate, response time, last active
--
-- All RLS uses my_org_ids(); view uses security_invoker so callers see only
-- their org's data.
-- =============================================================================

-- ─── 1) shifts ──────────────────────────────────────────────────────────────

create table if not exists shifts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,
  planned_end timestamptz,
  area_focus  text[],
  notes       text,
  created_at  timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create unique index if not exists shifts_one_active_idx
  on shifts (org_id, user_id) where ends_at is null;

create index if not exists shifts_org_active_idx
  on shifts (org_id, starts_at desc) where ends_at is null;

create index if not exists shifts_user_idx on shifts (user_id, starts_at desc);

alter table shifts enable row level security;

drop policy if exists "shifts: members read" on shifts;
create policy "shifts: members read" on shifts for select
  using (org_id in (select my_org_ids()));

drop policy if exists "shifts: own write" on shifts;
create policy "shifts: own write" on shifts for insert
  with check (user_id = auth.uid() and org_id in (select my_org_ids()));

drop policy if exists "shifts: own update" on shifts;
create policy "shifts: own update" on shifts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "shifts: owners manage" on shifts;
create policy "shifts: owners manage" on shifts for all
  using (
    org_id in (
      select org_id from org_members
      where user_id = auth.uid() and role in ('owner','coordinator')
    )
  );

create or replace function start_shift(p_org_id uuid, p_area_focus text[] default null, p_planned_end timestamptz default null, p_notes text default null)
returns shifts language plpgsql security invoker as $$
declare
  s shifts;
begin
  update shifts set ends_at = now()
    where org_id = p_org_id and user_id = auth.uid() and ends_at is null;
  insert into shifts (org_id, user_id, area_focus, planned_end, notes)
    values (p_org_id, auth.uid(), p_area_focus, p_planned_end, p_notes)
    returning * into s;
  return s;
end;
$$;

create or replace function end_shift(p_org_id uuid)
returns shifts language plpgsql security invoker as $$
declare
  s shifts;
begin
  update shifts set ends_at = now()
    where org_id = p_org_id and user_id = auth.uid() and ends_at is null
    returning * into s;
  return s;
end;
$$;

-- ─── 2) case_comments ───────────────────────────────────────────────────────

create table if not exists case_comments (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references cases(id) on delete cascade,
  org_id      uuid not null references organizations(id) on delete cascade,
  author_id   uuid not null references auth.users(id) on delete set null,
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now(),
  edited_at   timestamptz
);

create index if not exists case_comments_case_idx on case_comments (case_id, created_at);
create index if not exists case_comments_org_idx  on case_comments (org_id, created_at desc);

alter table case_comments enable row level security;

drop policy if exists "comments: members read" on case_comments;
create policy "comments: members read" on case_comments for select
  using (org_id in (select my_org_ids()));

drop policy if exists "comments: members write" on case_comments;
create policy "comments: members write" on case_comments for insert
  with check (
    org_id in (select my_org_ids())
    and author_id = auth.uid()
  );

drop policy if exists "comments: own edit" on case_comments;
create policy "comments: own edit" on case_comments for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "comments: own delete" on case_comments;
create policy "comments: own delete" on case_comments for delete
  using (author_id = auth.uid());

create or replace function comments_stamp_edited() returns trigger
language plpgsql as $$
begin
  if new.body is distinct from old.body then
    new.edited_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists comments_stamp_edited_tg on case_comments;
create trigger comments_stamp_edited_tg before update on case_comments
  for each row execute function comments_stamp_edited();

-- ─── 3) service_areas + dispatch_priority on org_members ────────────────────

alter table org_members
  add column if not exists service_areas text[] not null default '{}';

alter table org_members
  add column if not exists dispatch_priority int not null default 50
    check (dispatch_priority between 0 and 100);

create index if not exists org_members_service_areas_idx on org_members using gin (service_areas);

create or replace function suggest_volunteers(p_org_id uuid, p_area text default null, p_limit int default 10)
returns table (
  user_id uuid,
  display_name text,
  phone_e164 text,
  role text,
  on_shift boolean,
  area_match boolean,
  dispatch_priority int,
  accept_rate numeric
)
language sql stable security invoker as $$
  select
    om.user_id,
    p.display_name,
    p.phone_e164,
    om.role,
    exists (select 1 from shifts s
            where s.org_id = om.org_id
              and s.user_id = om.user_id
              and s.ends_at is null) as on_shift,
    case when p_area is null then false
         else p_area = any (om.service_areas) end as area_match,
    om.dispatch_priority,
    coalesce(mm.accept_rate, 0) as accept_rate
  from org_members om
  join profiles p on p.id = om.user_id
  left join member_metrics mm on mm.user_id = om.user_id and mm.org_id = om.org_id
  where om.org_id = p_org_id
    and om.role in ('field','coordinator','vet')
  order by
    on_shift desc,
    area_match desc,
    om.dispatch_priority desc,
    coalesce(mm.accept_rate, 0) desc,
    p.display_name nulls last
  limit p_limit;
$$;

-- ─── 4) member_metrics view ─────────────────────────────────────────────────

create or replace view member_metrics
with (security_invoker = true) as
select
  om.org_id,
  om.user_id,
  om.role,
  (
    select count(*) from case_events ce
    where ce.org_id = om.org_id
      and ce.kind = 'dispatched'
      and (ce.payload->>'to') = om.user_id::text
  ) as dispatches_offered,
  (
    select count(*) from case_events ce
    where ce.org_id = om.org_id
      and ce.created_by = om.user_id
      and ce.kind = 'en-route'
  ) as dispatches_accepted,
  (
    select count(*) from cases c
    where c.org_id = om.org_id and c.assigned_to = om.user_id
  ) as cases_handled,
  (
    select count(*) from cases c
    where c.org_id = om.org_id
      and c.assigned_to = om.user_id
      and c.status = 'released'
  ) as cases_released,
  (
    select max(ce.created_at) from case_events ce
    where ce.org_id = om.org_id and ce.created_by = om.user_id
  ) as last_active_at,
  (
    select avg(extract(epoch from (er.created_at - dx.created_at)))::int
    from case_events er
    join case_events dx
      on dx.case_id = er.case_id
     and dx.kind = 'dispatched'
     and (dx.payload->>'to') = om.user_id::text
    where er.org_id = om.org_id
      and er.created_by = om.user_id
      and er.kind = 'en-route'
      and er.created_at > now() - interval '90 days'
  ) as avg_response_seconds,
  case
    when (
      select count(*) from case_events ce
      where ce.org_id = om.org_id
        and ce.kind = 'dispatched'
        and (ce.payload->>'to') = om.user_id::text
    ) = 0 then null
    else round(100.0 * (
      select count(*) from case_events ce
      where ce.org_id = om.org_id
        and ce.created_by = om.user_id
        and ce.kind = 'en-route'
    ) / (
      select count(*) from case_events ce
      where ce.org_id = om.org_id
        and ce.kind = 'dispatched'
        and (ce.payload->>'to') = om.user_id::text
    ), 1)
  end as accept_rate
from org_members om;

comment on view member_metrics is
  'Per-member operational metrics. Inherits RLS via security_invoker. Read by the volunteer profile + roster pages.';
