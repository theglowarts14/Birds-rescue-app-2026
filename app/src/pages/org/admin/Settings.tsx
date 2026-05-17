import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrg } from '../../../lib/org';
import { updateOrg } from '../../../lib/queries';
import { PageHeader, LoadingRow } from '../../../components/ui';
import { Save, Building2 } from 'lucide-react';

export default function Settings() {
  const { org } = useOrg();
  const qc = useQueryClient();
  const [draft, setDraft] = useState({
    public_name: org?.public_name ?? '',
    tagline: org?.tagline ?? '',
    helpline_e164: org?.helpline_e164 ?? '',
    city: org?.city ?? '',
    brand_primary: org?.brand_primary ?? '#c44a1a',
  });

  const save = useMutation({
    mutationFn: async () => updateOrg(org!.id, draft),
    onSuccess: () => qc.invalidateQueries(),
  });

  if (!org) return <LoadingRow />;

  return (
    <>
      <PageHeader kicker="Admin" title="Organization" accent="settings." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card space-y-4">
          <Field label="Public-facing name" sub="Shown to donors on the white-label portal."
            value={draft.public_name} onChange={(v) => setDraft({ ...draft, public_name: v })} placeholder="Animal Warriors" />
          <Field label="Tagline" value={draft.tagline} onChange={(v) => setDraft({ ...draft, tagline: v })} placeholder="When wings fall, we answer." />
          <Field label="Helpline (E.164)" value={draft.helpline_e164} onChange={(v) => setDraft({ ...draft, helpline_e164: v })} placeholder="+919697887888" />
          <Field label="City" value={draft.city} onChange={(v) => setDraft({ ...draft, city: v })} placeholder="Hyderabad, Telangana" />

          <div>
            <label className="kicker">Brand primary</label>
            <div className="flex items-center gap-3 mt-1">
              <input type="color" value={draft.brand_primary} onChange={(e) => setDraft({ ...draft, brand_primary: e.target.value })} className="w-12 h-10 rounded-lg border border-black/10 cursor-pointer" />
              <input type="text" value={draft.brand_primary} onChange={(e) => setDraft({ ...draft, brand_primary: e.target.value })} className="px-3 py-2 bg-cream rounded-xl border border-black/10 text-sm font-mono w-32" />
              <span className="text-xs text-ink-muted">Applied to buttons + accents in the donor portal.</span>
            </div>
          </div>

          <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary mt-4">
            <Save size={14} /> {save.isPending ? 'Saving…' : 'Save changes'}
          </button>
          {save.isSuccess && <div className="text-sm text-moss mt-2">Saved ✓</div>}
        </div>

        <div className="space-y-3">
          <div className="card bg-cream">
            <div className="kicker">Live URL</div>
            <div className="font-mono text-sm mt-2">karuna.app/{org.slug}/donate</div>
            <div className="text-xs text-ink-muted mt-1">Share this with donors. CNAME your own domain for fully white-label.</div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-2"><Building2 size={16} className="text-rust" /> <span className="display text-lg">Org ID</span></div>
            <div className="font-mono text-xs text-ink-muted break-all">{org.id}</div>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, sub, value, onChange, placeholder }: {
  label: string; sub?: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="kicker block mb-1">{label}</label>
      {sub && <div className="text-xs text-ink-muted mb-2">{sub}</div>}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm" />
    </div>
  );
}
