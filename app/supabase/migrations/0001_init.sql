-- =============================================================================
-- Karuna · 0001 · initial schema
-- =============================================================================
-- Multi-tenant SaaS for animal-rescue NGOs.
-- Every domain row carries org_id and is gated by Row-Level Security policies.
-- Public reporter submissions land in `cases` with reporter_id = anon user id.
-- Team + donor surfaces query through org_id with RLS auto-scoping by membership.
--
-- Run order:  0001_init.sql  → 0002_seed_global.sql  → 0003_seed_awcs.sql
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ORGANIZATIONS
create table organizations (
  id              uuid primary key default uuid_generate_v4(),
  slug            text unique not null check (slug ~ '^[a-z0-9-]{2,40}$'),
  name            text not null,
  public_name     text,
  tagline         text default 'When wings fall, we answer.',
  helpline_e164   text,
  city            text,
  founded_year    int,
  pan             text,
  brand_primary   text default '#c44a1a',
  brand_logo_url  text,
  is_active       boolean default true,
  created_at      timestamptz default now()
);
create index on organizations using gin (slug gin_trgm_ops);

-- PROFILES (mirror of auth.users)
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  phone_e164      text,
  email           text,
  pan             text,
  preferred_lang  text default 'en' check (preferred_lang in ('en','te','hi')),
  created_at      timestamptz default now()
);

-- ORG MEMBERSHIPS
create type org_role as enum ('owner','coordinator','vet','field','foster','awareness');

create table org_members (
  org_id          uuid references organizations(id) on delete cascade,
  user_id         uuid references profiles(id) on delete cascade,
  role            org_role not null,
  on_shift        boolean default false,
  current_status  text default 'off-duty'
                  check (current_status in ('on-duty','in-field','on-call','off-duty')),
  joined_at       timestamptz default now(),
  primary key (org_id, user_id, role)
);
create index on org_members (user_id);
create index on org_members (org_id, current_status);

create or replace function my_org_ids() returns setof uuid
language sql stable security definer as $$
  select org_id from org_members where user_id = auth.uid();
$$;

-- SPECIES (global)
create table species (
  id              uuid primary key default uuid_generate_v4(),
  common_name     text not null unique,
  emoji           text,
  habitat         text,
  common_injury   text,
  first_aid       text,
  accepted_status text default 'always' check (accepted_status in ('always','conditional','never')),
  is_wildlife     boolean default false
);

-- CASES
create type case_status as enum ('critical','in-rescue','recovering','released','closed-unrescued');
create type case_urgency as enum ('critical','moderate','low');
create type case_kind as enum ('bird','animal','wildlife');
create type case_problem as enum ('injured','stuck','orphaned','cruelty');

create table cases (
  id                uuid primary key default uuid_generate_v4(),
  org_id            uuid not null references organizations(id) on delete cascade,
  short_id          text not null,
  kind              case_kind not null,
  problem           case_problem not null,
  status            case_status not null default 'critical',
  urgency           case_urgency not null,
  species_id        uuid references species(id),
  species_freetext  text,
  threat_summary    text,
  notes             text,
  location_text     text,
  area              text,
  lat               double precision,
  lng               double precision,
  reporter_id       uuid references profiles(id),
  reporter_anon     boolean default false,
  assigned_to       uuid references profiles(id),
  sponsor_id        uuid,
  cost_inr          int default 0,
  received_at       timestamptz default now(),
  rescued_at        timestamptz,
  released_at       timestamptz,
  closed_reason     text,
  unique (org_id, short_id)
);
create index on cases (org_id, status, received_at desc);
create index on cases (assigned_to);
create index on cases using gin (to_tsvector('english', coalesce(notes,'') || ' ' || coalesce(threat_summary,'')));

-- CASE EVENTS (audit trail)
create type event_kind as enum (
  'received','dispatched','en-route','rescued','handover',
  'treatment','status-change','note','photo','release',
  'sponsored','auto-routed','duplicate-merged','flagged'
);
create table case_events (
  id            uuid primary key default uuid_generate_v4(),
  case_id       uuid not null references cases(id) on delete cascade,
  org_id        uuid not null references organizations(id) on delete cascade,
  kind          event_kind not null,
  payload       jsonb default '{}'::jsonb,
  photo_url     text,
  created_by    uuid references profiles(id),
  created_at    timestamptz default now()
);
create index on case_events (case_id, created_at desc);
create index on case_events (org_id, created_at desc);

-- TREATMENTS
create table treatments (
  id              uuid primary key default uuid_generate_v4(),
  case_id         uuid not null references cases(id) on delete cascade,
  org_id          uuid not null references organizations(id) on delete cascade,
  day_label       text,
  vet_id          uuid references profiles(id),
  note            text,
  photo_url       text,
  weight_grams    int,
  created_at      timestamptz default now()
);
create index on treatments (case_id, created_at);

-- PARTNERS
create type partner_kind as enum ('cruelty','cattle','wildlife','snakes','borewell','overflow');
create table partners (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid not null references organizations(id) on delete cascade,
  name          text not null,
  kind          partner_kind not null,
  contact_name  text,
  contact_phone text,
  is_flag_only  boolean default false,
  notes         text
);
create index on partners (org_id, kind);

-- VET CLINICS
create table vet_clinics (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid not null references organizations(id) on delete cascade,
  name          text not null,
  area          text,
  specialty     text,
  phone_e164    text,
  hours         text,
  is_24x7       boolean default false
);
create index on vet_clinics (org_id);

-- FOSTERS
create table fosters (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid not null references organizations(id) on delete cascade,
  profile_id    uuid references profiles(id),
  area          text,
  accepts       text,
  capacity_max  int default 4,
  capacity_now  int default 0,
  is_active     boolean default true
);

-- INVENTORY
create table inventory (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid not null references organizations(id) on delete cascade,
  item          text not null,
  unit          text not null,
  stock         int default 0,
  low_threshold int default 0,
  updated_at    timestamptz default now()
);

-- DONATION PRODUCTS
create table donation_products (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid not null references organizations(id) on delete cascade,
  code          text not null,
  emoji         text,
  label         text not null,
  detail        text,
  amount_inr    int not null,
  is_recurring  boolean default false,
  is_active     boolean default true,
  unique (org_id, code)
);

-- DONORS / DONATIONS
create table donors (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid references profiles(id),
  name          text,
  email         text,
  phone_e164    text,
  pan           text,
  display_consent boolean default false,
  created_at    timestamptz default now()
);

create type donation_status as enum ('created','paid','failed','refunded','recurring-active','recurring-cancelled');
create table donations (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations(id) on delete cascade,
  donor_id        uuid references donors(id),
  product_id      uuid references donation_products(id),
  case_id         uuid references cases(id),
  amount_inr      int not null,
  qty             int default 1,
  status          donation_status default 'created',
  razorpay_order  text,
  razorpay_payment text,
  razorpay_sub    text,
  receipt_no      text,
  receipt_url     text,
  receipt_issued_at timestamptz,
  created_at      timestamptz default now(),
  paid_at         timestamptz
);
create index on donations (org_id, status, created_at desc);
create index on donations (case_id) where case_id is not null;

-- INCOMING QUEUE
create type incoming_source as enum ('whatsapp','call','sms','web-anon');
create table incoming_queue (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations(id) on delete cascade,
  source          incoming_source not null,
  from_e164       text,
  raw_text        text,
  photo_url       text,
  audio_url       text,
  detected_lang   text,
  auto_kind       case_kind,
  auto_problem    case_problem,
  auto_urgency    case_urgency,
  auto_area       text,
  auto_confidence numeric(3,2),
  accepted_case_id uuid references cases(id),
  accepted_at     timestamptz,
  accepted_by     uuid references profiles(id),
  created_at      timestamptz default now()
);
create index on incoming_queue (org_id, accepted_at, created_at desc);

-- FESTIVAL ALERTS
create table festival_alerts (
  id              uuid primary key default uuid_generate_v4(),
  code            text unique not null,
  title           text not null,
  starts_on       date,
  ends_on         date,
  severity        text default 'moderate' check (severity in ('critical','moderate','low')),
  detail          text
);

-- TRAINING
create table training_modules (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid references organizations(id) on delete cascade,
  title           text not null,
  level           text,
  minutes         int,
  body_md         text,
  unlocks_dispatch boolean default false
);
create table training_completions (
  user_id         uuid references profiles(id) on delete cascade,
  module_id       uuid references training_modules(id) on delete cascade,
  completed_at    timestamptz default now(),
  primary key (user_id, module_id)
);

-- REQUESTS (workshop / audit / foster / volunteer)
create table requests (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations(id),
  kind            text not null check (kind in ('workshop','audit','foster','volunteer')),
  payload         jsonb,
  status          text default 'new' check (status in ('new','accepted','scheduled','done','declined')),
  created_at      timestamptz default now()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table org_members enable row level security;
alter table cases enable row level security;
alter table case_events enable row level security;
alter table treatments enable row level security;
alter table partners enable row level security;
alter table vet_clinics enable row level security;
alter table fosters enable row level security;
alter table inventory enable row level security;
alter table donation_products enable row level security;
alter table donors enable row level security;
alter table donations enable row level security;
alter table incoming_queue enable row level security;
alter table festival_alerts enable row level security;
alter table training_modules enable row level security;
alter table training_completions enable row level security;
alter table requests enable row level security;
alter table species enable row level security;

create policy "org public read"   on organizations for select using (is_active = true);
create policy "org owner write"   on organizations for update using (id in (select org_id from org_members where user_id = auth.uid() and role = 'owner'));

create policy "own profile read"  on profiles for select using (id = auth.uid());
create policy "own profile write" on profiles for update using (id = auth.uid());
create policy "self insert"       on profiles for insert with check (id = auth.uid());

create policy "members can read same org" on org_members for select using (org_id in (select my_org_ids()));
create policy "owner can write members"   on org_members for all using (org_id in (select org_id from org_members where user_id = auth.uid() and role = 'owner'));

create policy "members read org cases"    on cases for select using (org_id in (select my_org_ids()));
create policy "members write org cases"   on cases for all using (org_id in (select my_org_ids()));
create policy "anon report"               on cases for insert with check (reporter_anon = true or reporter_id = auth.uid());
create policy "reporter reads own"        on cases for select using (reporter_id = auth.uid());

create policy "members rw org events"     on case_events for all using (org_id in (select my_org_ids()));
create policy "members rw org treatments" on treatments  for all using (org_id in (select my_org_ids()));
create policy "members rw partners"       on partners    for all using (org_id in (select my_org_ids()));
create policy "members rw clinics"        on vet_clinics for all using (org_id in (select my_org_ids()));
create policy "members rw fosters"        on fosters     for all using (org_id in (select my_org_ids()));
create policy "members rw inventory"      on inventory   for all using (org_id in (select my_org_ids()));
create policy "members rw requests"       on requests    for all using (org_id in (select my_org_ids()));
create policy "public submits request"    on requests    for insert with check (true);

create policy "products public read"      on donation_products for select using (is_active = true);
create policy "products members write"    on donation_products for all using (org_id in (select my_org_ids()));

create policy "members read donations"    on donations for select using (org_id in (select my_org_ids()));
create policy "donor reads own"           on donations for select using (donor_id in (select id from donors where profile_id = auth.uid()));
create policy "donations insert"          on donations for insert with check (true);

create policy "own donor row"             on donors for all using (profile_id = auth.uid() or profile_id is null);
create policy "members rw incoming"       on incoming_queue for all using (org_id in (select my_org_ids()));

create policy "training read all"         on training_modules for select using (true);
create policy "training write org"        on training_modules for all using (org_id in (select my_org_ids()));
create policy "training completions own"  on training_completions for all using (user_id = auth.uid());

create policy "species public read"       on species for select using (true);
create policy "festivals public read"     on festival_alerts for select using (true);

-- =============================================================================
-- HELPER VIEWS
-- =============================================================================
create or replace view cases_with_species as
  select c.*, s.common_name as species_name, s.emoji as species_emoji
  from cases c left join species s on s.id = c.species_id;

create or replace view active_cases_per_area as
  select org_id, area, count(*) as active_count,
         count(*) filter (where status = 'critical') as critical_count
  from cases
  where status in ('critical','in-rescue','recovering')
  group by org_id, area;

-- =============================================================================
-- TRIGGERS
-- =============================================================================
create or replace function gen_short_id() returns trigger
language plpgsql as $$
declare
  prefix text;
  next_num int;
begin
  if new.short_id is not null then return new; end if;
  select coalesce(substr(public_name, 1, 1), substr(name, 1, 1), 'K') into prefix
  from organizations where id = new.org_id;
  select coalesce(max(substring(short_id from '\d+$')::int), 2400) + 1 into next_num
  from cases where org_id = new.org_id;
  new.short_id := upper(prefix) || 'R-' || next_num;
  return new;
end;
$$;
create trigger cases_short_id before insert on cases for each row execute function gen_short_id();

create or replace function log_case_status_change() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into case_events (case_id, org_id, kind, payload, created_by)
    values (new.id, new.org_id, 'status-change',
            jsonb_build_object('to', new.status, 'from', case when tg_op='UPDATE' then old.status::text else null end),
            auth.uid());
  end if;
  return new;
end;
$$;
create trigger cases_log_status after insert or update of status on cases
  for each row execute function log_case_status_change();
