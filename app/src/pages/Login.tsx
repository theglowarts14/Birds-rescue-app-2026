import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Phone, Send } from 'lucide-react';

const DEV_ORG = import.meta.env.VITE_DEV_ORG_SLUG || 'awcs';

export default function Login() {
  const { sendOtp, verifyOtp, signInWithGoogle } = useAuth();
  const nav = useNavigate();
  const [phone, setPhone] = useState('+91');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onPhone() {
    setBusy(true); setErr(null);
    const { error } = await sendOtp(phone);
    setBusy(false);
    if (error) return setErr(error);
    setStep('code');
  }

  async function onCode() {
    setBusy(true); setErr(null);
    const { error } = await verifyOtp(phone, code);
    setBusy(false);
    if (error) return setErr(error);
    nav(`/${DEV_ORG}/team`);
  }

  return (
    <main className="min-h-screen grid place-items-center bg-paper px-4">
      <div className="w-full max-w-md card">
        <div className="kicker">Karuna · sign in</div>
        <h1 className="display text-3xl mt-2">Welcome <em className="italic text-rust">back.</em></h1>
        <p className="text-sm text-ink-soft mt-2">Phone OTP for India. Google for everyone else.</p>

        {step === 'phone' && (
          <>
            <label className="block mt-6 text-xs font-mono tracking-widest text-ink-muted uppercase">Phone</label>
            <div className="relative mt-1">
              <Phone size={14} className="absolute left-3 top-3.5 text-ink-muted" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9XXXXXXXXX" className="w-full pl-9 pr-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm" />
            </div>
            <button onClick={onPhone} disabled={busy} className="btn-primary mt-4 w-full justify-center"><Send size={14} /> {busy ? 'Sending OTP…' : 'Send OTP'}</button>
          </>
        )}

        {step === 'code' && (
          <>
            <label className="block mt-6 text-xs font-mono tracking-widest text-ink-muted uppercase">6-digit code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" inputMode="numeric" autoFocus className="w-full px-3 py-3 mt-1 bg-cream rounded-xl border border-black/10 text-lg font-mono tracking-[6px] text-center" />
            <button onClick={onCode} disabled={busy || code.length !== 6} className="btn-primary mt-4 w-full justify-center disabled:opacity-50">{busy ? 'Verifying…' : 'Verify & continue'}</button>
            <button onClick={() => setStep('phone')} className="btn-ghost mt-2 w-full justify-center">Wrong number?</button>
          </>
        )}

        <div className="flex items-center gap-3 my-6 text-xs text-ink-muted">
          <hr className="flex-1 border-black/10" /> or <hr className="flex-1 border-black/10" />
        </div>
        <button onClick={signInWithGoogle} className="btn-ghost w-full justify-center">Continue with Google</button>

        {err && <div className="mt-4 p-3 rounded-xl bg-rust/10 text-rust text-sm">{err}</div>}
      </div>
    </main>
  );
}
