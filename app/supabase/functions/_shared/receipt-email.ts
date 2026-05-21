// HTML + plain-text builder for the 80G receipt email. Editorial style with
// safe-for-Gmail/Outlook fallbacks — Georgia + Helvetica, table-based layout,
// inline styles, no web fonts. Brand color comes from the org row.

export interface ReceiptEmailInput {
  donorName: string;
  donorEmail: string;
  orgName: string;
  orgCity?: string | null;
  orgPan?: string | null;
  amountInr: number;
  paidAt: string;            // ISO
  receiptNo: string;
  receiptUrl: string;        // public PDF
  productLabel?: string | null;
  caseShortId?: string | null;
  caseTrackUrl?: string | null;
  brandColor?: string;       // hex
}

export function renderReceiptEmail(i: ReceiptEmailInput): { subject: string; html: string; text: string } {
  const brand = i.brandColor || '#c44a1a';
  const paid  = new Date(i.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const inr   = '₹' + i.amountInr.toLocaleString('en-IN');
  const subject = `Your 80G receipt · ${inr} to ${i.orgName}`;

  const what = i.caseShortId
    ? `Sponsorship of ${i.caseShortId} — full recovery covered`
    : (i.productLabel ?? 'Donation');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#faf6ef;font-family:Helvetica,Arial,sans-serif;color:#1a1410;">
<!-- preview text -->
<div style="display:none;max-height:0;overflow:hidden;color:transparent;">
  Receipt ${escape(i.receiptNo)} — thank you for your gift to ${escape(i.orgName)}.
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf6ef;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid rgba(0,0,0,0.06);">
      <!-- header strip -->
      <tr><td style="background:#eee9de;padding:24px 28px;">
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7a6e60;">
          Donation receipt
        </div>
        <div style="font-family:Georgia,serif;font-size:24px;line-height:1.15;margin-top:4px;color:#1a1410;">
          ${escape(i.orgName)}
        </div>
      </td></tr>

      <!-- greeting + amount -->
      <tr><td style="padding:28px 28px 8px 28px;">
        <p style="margin:0 0 6px 0;font-size:14px;color:#4a3f35;">
          ${escape(i.donorName)},
        </p>
        <h1 style="margin:0;font-family:Georgia,serif;font-weight:500;font-size:30px;line-height:1.15;color:#1a1410;">
          Received with thanks — <em style="color:${brand};">${inr}</em>.
        </h1>
        <p style="margin:14px 0 0 0;font-size:14px;color:#4a3f35;">
          On <strong>${escape(paid)}</strong>, you funded <em>${escape(what)}</em>.
          Your 80G receipt is attached below.
        </p>
      </td></tr>

      <!-- receipt summary card -->
      <tr><td style="padding:18px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf6ef;border-radius:12px;padding:18px;">
          <tr><td style="font-size:11px;color:#7a6e60;letter-spacing:1.5px;text-transform:uppercase;">Receipt</td>
              <td align="right" style="font-family:monospace;font-size:13px;color:#1a1410;">${escape(i.receiptNo)}</td></tr>
          <tr><td style="font-size:11px;color:#7a6e60;letter-spacing:1.5px;text-transform:uppercase;padding-top:6px;">Date</td>
              <td align="right" style="font-size:13px;color:#1a1410;padding-top:6px;">${escape(paid)}</td></tr>
          ${i.orgPan ? `
          <tr><td style="font-size:11px;color:#7a6e60;letter-spacing:1.5px;text-transform:uppercase;padding-top:6px;">${escape(i.orgName)} PAN</td>
              <td align="right" style="font-family:monospace;font-size:13px;color:#1a1410;padding-top:6px;">${escape(i.orgPan)}</td></tr>` : ''}
        </table>
      </td></tr>

      <!-- download button -->
      <tr><td align="center" style="padding:8px 28px 24px 28px;">
        <a href="${escape(i.receiptUrl)}"
           style="display:inline-block;background:${brand};color:#faf6ef;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;font-size:14px;font-family:Helvetica,Arial,sans-serif;">
          Download 80G receipt (PDF)
        </a>
      </td></tr>

      ${i.caseShortId && i.caseTrackUrl ? `
      <!-- follow your rescue -->
      <tr><td style="padding:0 28px 28px 28px;">
        <div style="background:#e6f0f7;border-radius:12px;padding:18px;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#3b6a8a;">Follow your sponsorship</div>
          <p style="margin:6px 0 12px 0;font-size:14px;color:#1a1410;">
            We'll send weekly photo updates on <strong>${escape(i.caseShortId)}</strong> until release.
          </p>
          <a href="${escape(i.caseTrackUrl)}" style="font-size:13px;color:#3b6a8a;font-weight:600;text-decoration:none;">
            Open ${escape(i.caseShortId)} →
          </a>
        </div>
      </td></tr>` : ''}

      <!-- footer -->
      <tr><td style="padding:0 28px 28px 28px;font-size:11px;color:#7a6e60;line-height:1.6;">
        This donation is eligible for tax exemption under Section 80G of the Income Tax Act, 1961.
        This is a computer-generated receipt; no signature required.
        ${i.orgCity ? `<br>${escape(i.orgName)}${i.orgCity ? ', ' + escape(i.orgCity) : ''}.` : ''}
        <br><br>
        <span style="color:${brand};font-weight:600;">Karuna</span>
        <span style="color:#7a6e60;"> — when wings fall, we answer.</span>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    `Thank you, ${i.donorName}.`,
    ``,
    `On ${paid}, you gave ${inr} to ${i.orgName} for ${what}.`,
    `Your 80G receipt is here:`,
    `  ${i.receiptUrl}`,
    ``,
    `Receipt no: ${i.receiptNo}`,
    i.orgPan ? `${i.orgName} PAN: ${i.orgPan}` : '',
    ``,
    i.caseShortId && i.caseTrackUrl
      ? `Follow ${i.caseShortId} as it recovers: ${i.caseTrackUrl}`
      : '',
    ``,
    `This donation is eligible for tax exemption under Section 80G of the Income Tax Act, 1961.`,
    `This is a computer-generated receipt; no signature required.`,
    ``,
    `Karuna — when wings fall, we answer.`,
  ].filter(Boolean).join('\n');

  return { subject, html, text };
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
