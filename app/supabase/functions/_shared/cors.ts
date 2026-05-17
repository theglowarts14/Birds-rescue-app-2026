// CORS preflight headers for Edge Functions.
// Webhook endpoints (Razorpay) don't need this — they're server-to-server — but
// browser-facing functions (issue-80g-receipt invoked from the donor portal) do.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function preflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}
