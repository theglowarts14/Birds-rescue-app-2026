-- =============================================================================
-- Karuna · 0009 · anonymous report rate limit
-- =============================================================================
-- Public report submission lives behind the submit-anonymous-report Edge
-- Function. The function rate-limits by IP fingerprint via this table.
--
-- Window-based limiter:
--   • 5 reports per fingerprint per rolling hour → allowed
--   • > 5 in current window → soft cap (still inserted, but flagged)
--   • > 10 in current window → hard block for 24 hours
--
-- The window resets on first report after the existing window expires (1h).
--
-- Fingerprint convention: `ip:1.2.3.4` for IP-based, `phone:+91…` for WhatsApp
-- ingest, `device:expo-token` for native (future). Multiple fingerprints can
-- coexist for the same submission so we limit by the strictest.
-- =============================================================================

create table if not exists report_rate_limits (
  fingerprint        text primary key,
  count_in_window    int  not null default 1,
  window_started_at  timestamptz not null default now(),
  blocked_until      timestamptz,
  total_count        int  not null default 1,
  last_seen_at       timestamptz not null default now()
);

create index if not exists report_rate_limits_blocked_idx
  on report_rate_limits (blocked_until) where blocked_until is not null;

alter table report_rate_limits enable row level security;

-- Service-role only — the Edge Function uses service-role JWT; no client touches this.
drop policy if exists "rate-limits: service-role" on report_rate_limits;
create policy "rate-limits: service-role" on report_rate_limits for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ─── check_report_rate_limit ─────────────────────────────────────────
-- Atomically check + bump the limiter for a fingerprint.
-- Returns:
--   { allowed: bool, blocked_until: ts, count: int, soft_capped: bool, reason: text }
--
-- Uses SELECT FOR UPDATE so concurrent submissions from the same fingerprint
-- serialise correctly.

create or replace function check_report_rate_limit(
  p_fingerprint text,
  p_soft_cap int default 5,
  p_hard_cap int default 10,
  p_window_minutes int default 60,
  p_block_minutes int default 1440  -- 24h
) returns jsonb
language plpgsql security definer
as $$
declare
  r report_rate_limits%rowtype;
  now_ts timestamptz := now();
  window_end timestamptz;
begin
  -- Lock or create the row.
  select * into r from report_rate_limits
    where fingerprint = p_fingerprint
    for update;

  if not found then
    insert into report_rate_limits (fingerprint, count_in_window, total_count)
      values (p_fingerprint, 1, 1)
      returning * into r;
    return jsonb_build_object('allowed', true, 'count', 1, 'soft_capped', false);
  end if;

  -- Still blocked?
  if r.blocked_until is not null and r.blocked_until > now_ts then
    return jsonb_build_object(
      'allowed', false,
      'blocked_until', r.blocked_until,
      'count', r.count_in_window,
      'reason', 'blocked'
    );
  end if;

  -- Window expired? Reset.
  window_end := r.window_started_at + make_interval(mins => p_window_minutes);
  if now_ts > window_end then
    update report_rate_limits
      set count_in_window = 1,
          window_started_at = now_ts,
          blocked_until = null,
          total_count = total_count + 1,
          last_seen_at = now_ts
      where fingerprint = p_fingerprint;
    return jsonb_build_object('allowed', true, 'count', 1, 'soft_capped', false);
  end if;

  -- Within window. Bump.
  update report_rate_limits
    set count_in_window = count_in_window + 1,
        total_count = total_count + 1,
        last_seen_at = now_ts
    where fingerprint = p_fingerprint
    returning * into r;

  -- Hard block?
  if r.count_in_window > p_hard_cap then
    update report_rate_limits
      set blocked_until = now_ts + make_interval(mins => p_block_minutes)
      where fingerprint = p_fingerprint
      returning blocked_until into window_end;
    return jsonb_build_object(
      'allowed', false,
      'blocked_until', window_end,
      'count', r.count_in_window,
      'reason', 'hard_cap_exceeded'
    );
  end if;

  -- Soft cap warning — still allow.
  return jsonb_build_object(
    'allowed', true,
    'count', r.count_in_window,
    'soft_capped', r.count_in_window > p_soft_cap
  );
end;
$$;

comment on function check_report_rate_limit is
  'Atomic check + bump report rate limiter. SELECT FOR UPDATE serialises concurrent calls for the same fingerprint. Use SECURITY DEFINER; never accessible to anon/authenticated.';

revoke all on function check_report_rate_limit from public, anon, authenticated;
grant execute on function check_report_rate_limit to service_role;
