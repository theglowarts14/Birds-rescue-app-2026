-- =============================================================================
-- Karuna · 0008 · 80G receipt email tracking
-- =============================================================================
-- issue-80g-receipt now emails the donor a polished HTML receipt with a link
-- to the PDF in Storage. These columns track whether that delivery happened,
-- so the admin dashboard can flag stuck receipts and we can re-send on demand.
--
-- receipt_email_status values:
--   sent      — Resend accepted the message
--   failed    — Resend returned an error (see receipt_email_error)
--   no-email  — donor row has no email (shouldn't happen post-checkout but safe)
--   null      — never attempted
-- =============================================================================

alter table donations
  add column if not exists receipt_emailed_at  timestamptz,
  add column if not exists receipt_email_status text
    check (receipt_email_status is null
      or receipt_email_status in ('sent','failed','no-email')),
  add column if not exists receipt_email_error  text;

create index if not exists donations_receipt_email_status_idx
  on donations (org_id, receipt_email_status)
  where receipt_email_status is null or receipt_email_status = 'failed';
