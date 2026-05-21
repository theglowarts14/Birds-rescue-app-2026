import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useOrg } from '../../lib/org';
import { submitAnonymousReport } from '../../lib/queries';
import { AlertCircle, Camera, MapPin, Phone, Send, ChevronLeft, ShieldCheck } from 'lucide-react';
import type { CaseKind, CaseProblem, CaseUrgency } from '../../lib/database.types';
import { TurnstileWidget } from '../../components/TurnstileWidget';

const KINDS: { v: CaseKind; emoji: string; label: string }[] = [
  { v: 'bird', emoji: '🪶', label: 'Bird' },
  { v: 'animal', emoji: '🐾', label: 'Cat / dog / cattle' },
  { v: 'wildlife', emoji: '🦉', label: 'Wildlife' },
];

const PROBLEMS: { v: CaseProblem; emoji: string; label: string }[] = [
  { v: 'injured',  emoji: '🩹', label: 'Injured' },
  { v: 'stuck',    emoji: '🪤', label: 'Stuck / trapped' },
  { v: 'orphaned', emoji: '🥺', label: 'Orphaned baby' },
  { v: 'cruelty',  emoji: '🚨', label: 'Cruelty / abuse' },
];

const URGENCIES: { v: CaseUrgency; label: string; sub: string; tone: string }[] = [
  { v: 'critical', label: 'Bleeding / cannot move', sub: 'Needs help in minutes', tone: 'bg-rust/15 text-rust border-rust/30' },
  { v: 'moderate', label: 'Alive, struggling',      sub: 'Needs help today',     tone: 'bg-amber/15 text-amber border-amber/30' },
  { v: 'low',      label: 'Alert, just stuck',      sub: 'Needs help soon',      tone: 'bg-moss/15 text-moss border-moss/30' },
];

export default function Report() {
  const { orgSlug } = useParams();
  const { org } = useOrg();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<{ kind?: CaseKind; problem?: CaseProblem; urgency?: CaseUrgency; area?: string; notes?: string }>({});
  const [captchaToken, setCaptchaToken] = useState<string>('');

  const submit = useMutation({
    mutationFn: async () => submitAnonymousReport({
      org_slug: orgSlug!,
      kind: draft.kind!,
      problem: draft.problem!,
      urgency: draft.urgency!,
      area: draft.area,
      notes: draft.notes,
      turnstile_token: captchaToken || undefined,
    }),
    onSuccess: (c) => nav(`/${orgSlug}/r/${c.case_id}`),
  });

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-black/10 bg-paper sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1 text-sm text-ink-soft"><ChevronLeft size={16} /> Back</button>
          ) : <span />}
          <div className="kicker">Report · {step + 1} of 4</div>
          <a href={`tel:${org?.helpline_e164}`} className="inline-flex items-center gap-1 text-sm text-rust font-semibold"><Phone size={14} /> Call instead</a>
        </div>
        <div className="h-1 bg-cream"><div className="h-full bg-rust transition-all" style={{ width: `${((step + 1) / 4) * 100}%` }} /></div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8">
        {step === 0 && (
          <>
            <h1 className="display text-3xl">What did you find?</h1>
            <div className="grid grid-cols-1 gap-3 mt-6">
              {KINDS.map((k) => (
                <button key={k.v} onClick={() => { setDraft({ ...draft, kind: k.v }); setStep(1); }}
                  className="card text-left hover:-translate-y-0.5 transition flex items-center gap-3">
                  <span className="text-3xl">{k.emoji}</span>
                  <span className="display text-lg">{k.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="display text-3xl">What's wrong?</h1>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {PROBLEMS.map((p) => (
                <button key={p.v} onClick={() => { setDraft({ ...draft, problem: p.v }); setStep(2); }}
                  className="card text-left flex flex-col items-start gap-2">
                  <span className="text-3xl">{p.emoji}</span>
                  <span className="display">{p.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="display text-3xl">How bad?</h1>
            <div className="grid grid-cols-1 gap-3 mt-6">
              {URGENCIES.map((u) => (
                <button key={u.v} onClick={() => { setDraft({ ...draft, urgency: u.v }); setStep(3); }}
                  className={`card text-left border-2 ${u.tone}`}>
                  <div className="display text-lg">{u.label}</div>
                  <div className="text-sm opacity-80 mt-1">{u.sub}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="display text-3xl">Where & a note</h1>
            <div className="space-y-4 mt-6">
              <div>
                <label className="kicker"><MapPin size={11} className="inline mr-1" /> Area</label>
                <input value={draft.area ?? ''} onChange={(e) => setDraft({ ...draft, area: e.target.value })} placeholder="Banjara Hills, near Road no 3" className="w-full mt-1 px-3 py-3 bg-cream rounded-xl border border-black/10" />
              </div>
              <div>
                <label className="kicker"><Camera size={11} className="inline mr-1" /> Photo (optional)</label>
                <button
                  disabled
                  title="Use the Karuna mobile app to attach photos"
                  className="w-full mt-1 px-3 py-6 bg-cream rounded-xl border border-dashed border-black/20 text-sm text-ink-muted opacity-60 cursor-not-allowed"
                >
                  Photos available in the Karuna mobile app
                  <span className="block mt-1 text-[9px] font-mono uppercase tracking-widest opacity-70">Web upload · soon</span>
                </button>
              </div>
              <div>
                <label className="kicker">A note (optional)</label>
                <textarea value={draft.notes ?? ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2.5 bg-cream rounded-xl border border-black/10" placeholder="Bird seems to have a hurt wing, can't fly…" />
              </div>

              {/* CAPTCHA — Cloudflare Turnstile */}
              <div className="pt-2">
                <TurnstileWidget onToken={setCaptchaToken} action="anonymous-report" />
              </div>

              <button onClick={() => submit.mutate()} disabled={submit.isPending || !draft.area || !captchaToken} className="btn-primary w-full justify-center !py-3">
                <Send size={16} /> {submit.isPending ? 'Sending…' : 'Send to helpline'}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-ink-muted">
                <ShieldCheck size={10} /> Karuna verifies you're not a bot before alerting the team.
              </div>

              {submit.isError && (
                <div className="bg-rust/10 text-rust text-sm p-3 rounded-xl flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {(submit.error as Error)?.message ?? 'Could not send. Try again or call the helpline.'}
                </div>
              )}
              <p className="text-xs text-ink-muted text-center">Or call <a href={`tel:${org?.helpline_e164}`} className="text-rust font-semibold">{org?.helpline_e164}</a></p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
