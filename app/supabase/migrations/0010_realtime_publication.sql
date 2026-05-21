-- =============================================================================
-- Karuna · 0010 · enable Realtime on the operational tables
-- =============================================================================
-- Supabase Realtime requires explicit opt-in per table by adding it to the
-- supabase_realtime publication. Without this, useRealtimeCases() returns
-- nothing and the Overview dashboard stays static.
--
-- RLS still applies — subscribers only receive changes for rows they could
-- have SELECT'd. Coordinators see their org's cases; donors see public
-- releases; nothing leaks across orgs.
-- =============================================================================

do $$
declare
  t text;
begin
  for t in
    select unnest(array['cases', 'case_events', 'case_comments', 'donations', 'shifts'])
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end$$;

alter table cases replica identity full;
alter table case_events replica identity full;
alter table case_comments replica identity full;
