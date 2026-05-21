-- =============================================================================
-- Karuna · bootstrap-owner.sql
-- =============================================================================
-- Promote a Supabase auth user to `owner` of an organization.
--
-- Use this once, right after the schema migrations + the awcs seed have run
-- and you've signed in to /login at least once to create your auth.users row.
-- After this, you can hit /:org_slug/admin/dashboard and see real data.
--
-- HOW TO USE
--   1. Open the Supabase project → SQL Editor → New query.
--   2. Paste the whole file.
--   3. Edit the two `:=` lines below (`v_org_slug`, `v_identifier`).
--   4. Run. The script will:
--        · locate (or upsert) the matching profiles row
--        · insert the org_members row with role='owner'
--        · print a NOTICE confirming the result
--        · raise an EXCEPTION with a helpful message if something is missing
--
-- IDEMPOTENT — safe to re-run; existing rows get updated, not duplicated.
-- =============================================================================

do $$
declare
  -- ⤵ EDIT THESE TWO LINES ⤵
  v_org_slug   text := 'awcs';                            -- the org you're joining
  v_identifier text := 'theglowarts14@gmail.com';         -- your auth email OR phone in E.164 (e.g. '+919876543210')
  -- ⤴ EDIT THESE TWO LINES ⤴

  v_role    org_role := 'owner';
  v_org_id  uuid;
  v_user_id uuid;
  v_user_email text;
  v_user_phone text;
begin
  -- 1. Find the org by slug.
  select id into v_org_id from organizations where slug = v_org_slug;
  if v_org_id is null then
    raise exception 'No organization with slug "%". Did the seed migration (0003_seed_awcs.sql) run?', v_org_slug;
  end if;

  -- 2. Find the user in auth.users. Match on email OR phone — whichever the caller passed.
  select id, email, phone
    into v_user_id, v_user_email, v_user_phone
    from auth.users
   where email = v_identifier or phone = trim(leading '+' from v_identifier) or phone = v_identifier
   order by created_at desc
   limit 1;

  if v_user_id is null then
    raise exception 'No auth.users row for "%". Sign in once at /login (phone OTP or Google) before running this.', v_identifier;
  end if;

  -- 3. Make sure a profiles row exists (FK target for org_members.user_id).
  --    The app has no auto-create trigger, so we upsert here.
  insert into profiles (id, email, phone_e164)
  values (v_user_id, v_user_email, case when v_user_phone is not null then '+' || v_user_phone else null end)
  on conflict (id) do update
    set email      = coalesce(profiles.email,      excluded.email),
        phone_e164 = coalesce(profiles.phone_e164, excluded.phone_e164);

  -- 4. Insert the owner membership.
  insert into org_members (org_id, user_id, role)
  values (v_org_id, v_user_id, v_role)
  on conflict (org_id, user_id, role) do nothing;

  raise notice 'OK · user % is now % of org "%". Visit /%/admin/dashboard.',
    coalesce(v_user_email, '+' || v_user_phone), v_role, v_org_slug, v_org_slug;
end
$$;

-- =============================================================================
-- Verify (run separately if you want to double-check)
-- =============================================================================
-- select m.role, p.email, p.phone_e164, o.slug, o.public_name
--   from org_members m
--   join organizations o on o.id = m.org_id
--   join profiles      p on p.id = m.user_id
--  where o.slug = 'awcs';
