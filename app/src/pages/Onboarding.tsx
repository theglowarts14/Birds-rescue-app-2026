import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Send, ChevronLeft } from 'lucide-react';

export default function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({
    name: '', public_name: '', slug: '',
    helpline_e164: '+91', city: '',
    founded_year: new Date().getFullYear(),
    brand_primary: '#c44a1a',
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from('organizations').insert(draft).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (org) => nav(`/${org.slug}/team`),
  });

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-black/10 sticky top-0 bg-paper z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1 text-sm text-ink-soft"><ChevronLeft size={16} /> Back</button>
          ) : <span />}
          <div className="kicker">NGO setup · {step + 1} of 3</div>
          <span />
        </div>
        <div className="h-1 bg-cream"><div className="h-full bg-rust" style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {step === 0 && (
          <>
            <div className="kicker mb-4">01 · Tell us who you are</div>
            <h1 className="display text-4xl">Your NGO, <em className="italic text-rust">in two names.</em></h1>
            <p className="text-ink-soft mt-3">The official legal name, and the warmer name donors will see.</p>
            <div className="space-y-4 mt-8">
              <Field label="Legal NGO name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v, slug: slugify(v) })} placeholder="Animal Warriors Conservation Society" />
              <Field label="Public name" sub="What you call yourselves casually." value={draft.public_name} onChange={(v) => setDraft({ ...draft, public_name: v })} placeholder="Animal Warriors" />
              <Field label="URL slug" sub={`Your portal will live at karuna.app/${draft.slug || 'your-slug'}`} value={draft.slug} onChange={(v) => setDraft({ ...draft, slug: slugify(v) })} placeholder="awcs" />
              <button onClick={() => setStep(1)} disabled={!draft.name || !draft.slug} className="btn-primary disabled:opacity-50">Continue</button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="kicker mb-4">02 · How people reach you</div>
            <h1 className="display text-4xl">The numbers <em className="italic text-rust">that route the calls.</em></h1>
            <div className="space-y-4 mt-8">
              <Field label="Helpline (E.164)" value={draft.helpline_e164} onChange={(v) => setDraft({ ...draft, helpline_e164: v })} placeholder="+919697887888" />
              <Field label="City" value={draft.city} onChange={(v) => setDraft({ ...draft, city: v })} placeholder="Hyderabad, Telangana" />
              <Field label="Founded year" value={String(draft.founded_year)} onChange={(v) => setDraft({ ...draft, founded_year: parseInt(v) || new Date().getFullYear() })} placeholder="2019" />
              <button onClick={() => setStep(2)} className="btn-primary">Continue</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="kicker mb-4">03 · Your brand</div>
            <h1 className="display text-4xl">Pick a colour <em className="italic text-rust">that's yours.</em></h1>
            <p className="text-ink-soft mt-3">We'll use this on buttons and accents in the donor portal. You can change it later.</p>
            <div className="space-y-4 mt-8">
              <div>
                <label className="kicker block mb-2">Brand primary</label>
                <div className="flex gap-3 items-center">
                  <input type="color" value={draft.brand_primary} onChange={(e) => setDraft({ ...draft, brand_primary: e.target.value })} className="w-16 h-12 rounded-xl cursor-pointer" />
                  <input value={draft.brand_primary} onChange={(e) => setDraft({ ...draft, brand_primary: e.target.value })} className="px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm font-mono w-32" />
                </div>
              </div>
              <div className="card" style={{ borderColor: draft.brand_primary }}>
                <div className="kicker">Preview</div>
                <div className="display text-2xl mt-2">{draft.public_name || 'Your NGO'}</div>
                <button className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-paper rounded-full text-sm font-semibold" style={{ backgroundColor: draft.brand_primary }}>
                  Donate ₹500
                </button>
              </div>
              <button onClick={() => create.mutate()} disabled={create.isPending} className="btn-primary">
                <Send size={14} /> {create.isPending ? 'Setting up…' : 'Create my NGO'}
              </button>
              {create.isError && <p className="text-rust text-sm">{(create.error as Error).message}</p>}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

function Field({ label, sub, value, onChange, placeholder }: { label: string; sub?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="kicker block mb-1">{label}</label>
      {sub && <div className="text-xs text-ink-muted mb-2">{sub}</div>}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm" />
    </div>
  );
}
