-- =============================================================================
-- Karuna · 0007 · case.first_photo_url + photo storage column
-- =============================================================================
-- The mobile reporter uploads photos to Storage at
--   case-photos/{org_slug}/{case_id}/{timestamp}.{ext}
-- but nothing was linking those URLs back to the cases row. Donor portal,
-- impact poster, and the team Cases list all need a cheap way to render a
-- thumbnail without listing Storage.
--
-- Adds a single column: cases.first_photo_url. Populated by the mobile client
-- on a successful upload. If a case has multiple photos, the first wins; a
-- separate case_photos table can come later if/when multi-photo galleries
-- become a real feature.
-- =============================================================================

alter table cases
  add column if not exists first_photo_url text;

create index if not exists cases_first_photo_idx
  on cases (org_id) where first_photo_url is not null;
