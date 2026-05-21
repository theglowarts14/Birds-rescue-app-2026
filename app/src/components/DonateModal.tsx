import { useState } from 'react';
import { X, Heart, CheckCircle2, AlertTriangle, Receipt, Lock } from 'lucide-react';
import { useOrg } from '../lib/org';
import { donateViaRazorpay, type OrderInput } from '../lib/razorpay';

// Reusable donor info form + Razorpay trigger. Used by Portal (product) and
// Sponsor (case) flows. Caller passes either product_id or case_id, plus
// display amount.

interface Props {
  open: boolean;
  onClose: () => void;
  amountInr: number;
  what: string;           // "1 clay water bowl" or "Sponsor a black kite"
  description?: string;
  product_id?: string;
  case_id?: string;
  onSuccess?: (donationId: string) => void;
}

export function DonateModal({ open, onClose, amountInr, what, description, product_id, case_id, onSuccess }: Props) {
  const { org } = useOrg();
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('+91');
  const [pan, setPan]         = useState('');
  const [consent, setConsent] = useState(true);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [done, setDone]       = useState<{ donationId: string } | null>(null);

  if (!open) return null;

  const wantsPan = amountInr >= 500; // 80G needs PAN above this threshold

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError('Your name (for the receipt)');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('A valid email so we can send the receipt');
    if (wantsPan && pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(pan)) return setError('PAN looks off — format is ABCDE1234F');

    const input: OrderInput = {
      org_id: org!.id,
      product_id,
      case_id,
      donor: {
        name: name.trim(),
        email: email.trim(),
        phone_e164: phone.trim() !== '+91' ? phone.trim() : undefined,
        pan: pan.trim() ? pan.trim().toUpperCase() : undefined,
        display_consent: consent,
      },
    };

    setBusy(true);
    try {
      const result = await donateViaRazorpay(input, {
        brandColor: org?.brand_primary ?? '#c44a1a',
        description: description ?? what,
      });
      setDone({ donationId: result.donation_id });
      onSuccess?.(result.donation_id);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg !== 'CHECKOUT_DISMISSED') setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-paper rounded-2xl border border-black/10 max-w-md w-full p-6 shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="kicker">You'll fund</div>
            <h3 className="display text-xl mt-1 italic text-rust">{what}</h3>
            <div className="display text-3xl mt-3">₹{amountInr.toLocaleString('en-IN')}</div>
          </div>
          <button onClick={onClose} className="p-1.5 text-ink-soft hover:text-ink"><X size={18} /></button>
        </div>

        {done ? (
          <div className="mt-5 p-5 bg-moss/10 rounded-xl border border-moss/30">
            <div className="flex items-center gap-2 text-moss">
              <CheckCircle2 size={20} />
              <span className="display text-lg">Received — thank you.</span>
            </div>
            <p className="text-sm text-ink-soft mt-2">
              We've kicked off your 80G receipt. It'll land in <span className="font-mono">{email}</span> in the next couple of minutes.
            </p>
            <p className="text-[11px] text-ink-muted mt-2 font-mono">Donation id: {done.donationId.slice(0, 12)}…</p>
            <button onClick={onClose} className="btn-primary mt-4 w-full justify-center">Close</button>
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest text-ink-muted mb-1">Your name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="As it appears on PAN"
                  className="w-full px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm" />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest text-ink-muted mb-1">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="receipt lands here"
                  type="email" autoComplete="email"
                  className="w-full px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest text-ink-muted mb-1">Phone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9XXXXXXXXX"
                    className="w-full px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest text-ink-muted mb-1">
                    PAN {wantsPan ? <span className="text-amber">· 80G</span> : <span className="text-ink-soft">· optional</span>}
                  </label>
                  <input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10}
                    className="w-full px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm font-mono" />
                </div>
              </div>
              <label className="flex items-start gap-2 cursor-pointer mt-1">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-rust" />
                <span className="text-xs text-ink-soft leading-relaxed">
                  Show my name on the donor wall. Uncheck to give privately.
                </span>
              </label>
            </div>

            {error && (
              <div className="mt-3 text-xs text-rust inline-flex items-center gap-1.5">
                <AlertTriangle size={12} /> {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={busy}
              className="btn-primary w-full justify-center mt-5"
            >
              <Heart size={14} /> {busy ? 'Opening Razorpay…' : `Pay ₹${amountInr.toLocaleString('en-IN')} securely`}
            </button>

            <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-ink-muted">
              <span className="inline-flex items-center gap-1"><Lock size={10} /> Razorpay-secured</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1"><Receipt size={10} /> 80G receipt by email</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
