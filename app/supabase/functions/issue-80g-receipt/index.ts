// Generate an 80G donation receipt PDF, upload to Storage, mark the donation,
// then email the donor a polished HTML receipt with a link to the PDF.
//
// Called by razorpay-webhook on payment.captured, or directly with service-role
// JWT for re-issuance. Inputs: { donation_id, force_email? }.
//
// Side effects:
//   1. derive receipt_no (KR-D-{org_initials}-{8-digit-sequence})
//   2. render PDF via pdf-lib (no headless browser needed)
//   3. upload to Storage at receipts/{org_slug}/{receipt_no}.pdf
//   4. write donations.receipt_no, .receipt_url, .receipt_issued_at
//   5. send HTML email via Resend (see _shared/email.ts)
//   6. write donations.receipt_emailed_at + .receipt_email_status (+error)
//
// Email failures don't fail the function. The receipt is in Storage regardless.
// Admin Dashboard surfaces email-failed receipts so they can be re-sent.

import { preflight, corsHeaders } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/supabase.ts';
import { sendEmail } from '../_shared/email.ts';
import { renderReceiptEmail } from '../_shared/receipt-email.ts';
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';

const APP_URL = Deno.env.get('APP_URL') ?? 'https://karuna.app';

interface OrgRow   { id: string; slug: string; name: string; public_name: string | null; city: string | null; pan: string | null; brand_primary: string | null; }
interface DonorRow { name: string | null; email: string | null; pan: string | null; phone_e164: string | null; }
interface CaseRow  { id: string; short_id: string; }
interface ProductRow { label: string; }

Deno.serve(async (req) => {
  const pre = preflight(req); if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const { donation_id, force_email } = await req.json();
  if (!donation_id) return json({ error: 'donation_id required' }, 400);

  const supa = serviceClient();

  const { data: d, error } = await supa
    .from('donations')
    .select(`
      id, amount_inr, paid_at, status, receipt_no, receipt_url, receipt_email_status,
      org:organizations(id, slug, name, public_name, city, pan, brand_primary),
      donor:donors(name, email, pan, phone_e164),
      product:donation_products(label),
      case:cases(id, short_id)
    `)
    .eq('id', donation_id)
    .single();

  if (error || !d) return json({ error: 'donation not found' }, 404);
  if (d.status !== 'paid') return json({ error: 'donation not paid' }, 400);

  const org     = d.org as OrgRow;
  const donor   = d.donor as DonorRow;
  const product = d.product as ProductRow | null;
  const sponsoredCase = d.case as CaseRow | null;

  let receiptNo = d.receipt_no as string | null;
  let receiptUrl = d.receipt_url as string | null;

  // ─── 1-4: generate + upload + record (skip if already done) ──────────────
  if (!receiptNo || !receiptUrl) {
    const { count } = await supa
      .from('donations')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .eq('status', 'paid');
    const orgInitials = (org.public_name?.[0] ?? org.name[0] ?? 'X');
    receiptNo = `KR-D-${orgInitials.toUpperCase()}-${String(count ?? 1).padStart(8, '0')}`;

    const pdf = await renderReceipt({
      receiptNo, org, donor,
      amountInr: d.amount_inr,
      paidAt: d.paid_at!,
      productLabel: product?.label,
    });

    const path = `receipts/${org.slug}/${receiptNo}.pdf`;
    const { error: upErr } = await supa.storage
      .from('receipts')
      .upload(path, pdf, { contentType: 'application/pdf', upsert: true });
    if (upErr) return json({ error: 'storage upload failed', detail: upErr.message }, 500);

    const { data: pub } = supa.storage.from('receipts').getPublicUrl(path);
    receiptUrl = pub.publicUrl;

    await supa.from('donations').update({
      receipt_no: receiptNo,
      receipt_url: receiptUrl,
      receipt_issued_at: new Date().toISOString(),
    }).eq('id', donation_id);
  }

  // ─── 5-6: email the donor ──────────────────────────────────
  const alreadyEmailed = d.receipt_email_status === 'sent' && !force_email;
  if (alreadyEmailed) {
    return json({ ok: true, receipt_no: receiptNo, receipt_url: receiptUrl, emailed: 'already-sent' });
  }

  if (!donor?.email) {
    await supa.from('donations').update({ receipt_email_status: 'no-email' }).eq('id', donation_id);
    return json({ ok: true, receipt_no: receiptNo, receipt_url: receiptUrl, emailed: 'no-donor-email' });
  }

  const { subject, html, text } = renderReceiptEmail({
    donorName: donor.name ?? 'Friend',
    donorEmail: donor.email,
    orgName: org.public_name ?? org.name,
    orgCity: org.city,
    orgPan: org.pan,
    amountInr: d.amount_inr,
    paidAt: d.paid_at!,
    receiptNo: receiptNo!,
    receiptUrl: receiptUrl!,
    productLabel: product?.label ?? null,
    caseShortId: sponsoredCase?.short_id ?? null,
    caseTrackUrl: sponsoredCase
      ? `${APP_URL}/${org.slug}/donate/sponsor`
      : null,
    brandColor: org.brand_primary ?? '#c44a1a',
  });

  const sent = await sendEmail({
    to: donor.email,
    subject, html, text,
    reply_to: 'hi@karuna.app',
    tags: [
      { name: 'kind', value: '80g-receipt' },
      { name: 'org', value: org.slug },
    ],
  });

  await supa.from('donations').update({
    receipt_emailed_at: sent.ok ? new Date().toISOString() : null,
    receipt_email_status: sent.ok ? 'sent' : 'failed',
    receipt_email_error: sent.ok ? null : (sent.error ?? 'unknown').slice(0, 500),
  }).eq('id', donation_id);

  return json({
    ok: true,
    receipt_no: receiptNo,
    receipt_url: receiptUrl,
    emailed: sent.ok ? 'sent' : 'failed',
    email_error: sent.ok ? undefined : sent.error,
    email_id: sent.id,
  });
});

// ─── PDF rendering (unchanged from before) ────────────────────────────

async function renderReceipt(input: {
  receiptNo: string;
  org: OrgRow;
  donor: DonorRow;
  amountInr: number;
  paidAt: string;
  productLabel?: string;
}): Promise<Uint8Array> {
  const { receiptNo, org, donor, amountInr, paidAt, productLabel } = input;
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font  = await pdf.embedFont(StandardFonts.Helvetica);
  const bold  = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink   = rgb(0.10, 0.08, 0.06);
  const muted = rgb(0.48, 0.43, 0.38);
  const rust  = rgb(0.77, 0.29, 0.10);

  page.drawRectangle({ x: 0, y: 760, width: 595, height: 82, color: rgb(0.94, 0.93, 0.88) });
  page.drawText('Donation receipt', { x: 40, y: 805, size: 11, font, color: muted });
  page.drawText(`${org.public_name ?? org.name}`, { x: 40, y: 778, size: 22, font: bold, color: ink });

  const paidDate = new Date(paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  drawRight(page, receiptNo, 555, 805, 10, font, muted);
  drawRight(page, paidDate, 555, 786, 12, bold, ink);

  let y = 720;
  page.drawText('Received with thanks from', { x: 40, y, size: 10, font, color: muted }); y -= 16;
  page.drawText(donor.name ?? '—', { x: 40, y, size: 16, font: bold, color: ink }); y -= 14;
  if (donor.email) { page.drawText(donor.email, { x: 40, y, size: 10, font, color: muted }); y -= 13; }
  if (donor.pan)   { page.drawText(`PAN: ${donor.pan}`, { x: 40, y, size: 10, font, color: muted }); y -= 13; }

  y -= 12;
  page.drawText('Amount donated', { x: 40, y, size: 10, font, color: muted }); y -= 22;
  page.drawText(`₹ ${amountInr.toLocaleString('en-IN')}`, { x: 40, y, size: 32, font: bold, color: rust }); y -= 24;
  page.drawText(amountInWords(amountInr), { x: 40, y, size: 10, font, color: muted }); y -= 12;
  if (productLabel) { page.drawText(`Towards: ${productLabel}`, { x: 40, y, size: 10, font, color: ink }); y -= 12; }

  y -= 28;
  page.drawText(`${org.public_name ?? org.name}`, { x: 40, y, size: 11, font: bold, color: ink }); y -= 13;
  if (org.city) { page.drawText(org.city, { x: 40, y, size: 10, font, color: muted }); y -= 12; }
  if (org.pan)  { page.drawText(`PAN: ${org.pan}`, { x: 40, y, size: 10, font, color: muted }); y -= 12; }

  page.drawText('This donation is eligible for tax exemption under Section 80G of the Income Tax Act, 1961.',
    { x: 40, y: 100, size: 9, font, color: muted });
  page.drawText('This is a computer-generated receipt. No signature required.',
    { x: 40, y: 86, size: 9, font, color: muted });
  page.drawText('Karuna', { x: 40, y: 50, size: 10, font: bold, color: rust });
  page.drawText('When wings fall, we answer.', { x: 80, y: 51, size: 9, font, color: muted });

  return pdf.save();
}

function drawRight(page: any, text: string, rightX: number, y: number, size: number, font: any, color: any) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: rightX - w, y, size, font, color });
}

function amountInWords(amount: number): string {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n/10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n/100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n/1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n/100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n/10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
  };
  return `Rupees ${inWords(amount).trim()} only`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
