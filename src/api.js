/* ============================================================
   Karuna · API client stub
   ------------------------------------------------------------
   This is the seam where the real backend slots in.
   Replace with fetch/axios calls to your server (Supabase,
   Firebase, your own Node/Postgres, etc).

   Every function here mirrors what the in-memory demo does
   in App.jsx, so swapping is mechanical: hand each function
   over to a backend call and remove the in-memory setCases
   plumbing from App.jsx.
   ============================================================ */

const API_BASE = import.meta.env.VITE_API_BASE || '';
const TOKEN_KEY = 'karuna_token';

function authHeaders() {
  // TODO(auth): replace with real session JWT from your auth provider.
  // For MVP, gate /team and /donor admin routes behind this header.
  const token = typeof window !== 'undefined' ? window.sessionStorage.getItem(TOKEN_KEY) : '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function call(path, init = {}) {
  if (!API_BASE) return { _stub: true, path };
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  return res.json();
}

/* ----- Cases ----- */
export const cases = {
  list: () => call('/cases'),
  get: (id) => call(`/cases/${id}`),
  create: (payload) => call('/cases', { method: 'POST', body: JSON.stringify(payload) }),
  addTreatment: (id, note) => call(`/cases/${id}/treatment`, { method: 'POST', body: JSON.stringify(note) }),
  handover: (id, payload) => call(`/cases/${id}/handover`, { method: 'POST', body: JSON.stringify(payload) }),
  assignVolunteer: (id, volunteerId) => call(`/cases/${id}/assign`, { method: 'POST', body: JSON.stringify({ volunteerId }) }),
};

/* ----- Auto-routing ----- */
export const router = {
  // Called server-side on case create. Returns { partner, reason } or null.
  partnerFor: (kind, threat) => call(`/router/partner?kind=${kind}&threat=${encodeURIComponent(threat)}`),
};

/* ----- Volunteers ----- */
export const volunteers = {
  list: () => call('/volunteers'),
  nearest: (lat, lng) => call(`/volunteers/nearest?lat=${lat}&lng=${lng}`),
  signup: (payload) => call('/volunteers/signup', { method: 'POST', body: JSON.stringify(payload) }),
};

/* ----- Donors ----- */
export const donors = {
  initPayment: (payload) => call('/donate/init', { method: 'POST', body: JSON.stringify(payload) }),
  // Razorpay / Stripe verify webhook hits the server, not this stub.
  receipts: () => call('/donate/receipts'),
  sponsorCase: (caseId, donor) => call(`/donate/sponsor/${caseId}`, { method: 'POST', body: JSON.stringify(donor) }),
};

/* ----- WhatsApp integration ----- */
export const whatsapp = {
  // Server-side cron: fetch new WA Business messages, auto-classify,
  // create draft cases. UI just renders them in the dashboard.
  inbox: () => call('/whatsapp/inbox'),
  sendUpdate: (caseId, text) => call(`/whatsapp/send`, { method: 'POST', body: JSON.stringify({ caseId, text }) }),
};

/* ----- Phone helpline ----- */
export const helpline = {
  // Twilio / Exotel call-log webhook hits the server; this fetches the
  // resulting auto-created case drafts for review.
  pendingCalls: () => call('/helpline/pending'),
};

/* ----- Impact poster + grants ----- */
export const impact = {
  monthly: (month) => call(`/impact/${month}`),
  grantPrefill: (templateId) => call(`/grants/${templateId}/prefill`),
};

export default {
  cases,
  router,
  volunteers,
  donors,
  whatsapp,
  helpline,
  impact,
};
