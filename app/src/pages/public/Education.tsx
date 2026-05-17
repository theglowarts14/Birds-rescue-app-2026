import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../lib/org';
import { listFestivalAlerts } from '../../lib/queries';
import { Bell, BookOpen, Stethoscope, AlertTriangle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export default function Education() {
  const { orgSlug } = useParams();
  const { org } = useOrg();

  const species = useQuery({
    queryKey: ['species'],
    queryFn: async () => {
      const { data, error } = await supabase.from('species').select('*').order('common_name');
      if (error) throw error;
      return data ?? [];
    },
  });
  const festivals = useQuery({ queryKey: ['festivals'], queryFn: listFestivalAlerts });

  const activeFestivals = (festivals.data ?? []).filter((f: any) => {
    const today = new Date().toISOString().slice(0, 10);
    return (!f.starts_on || f.starts_on <= today) && (!f.ends_on || f.ends_on >= today);
  });

  return (
    <main className="max-w-[1320px] mx-auto px-4 sm:px-7 py-12">
      <div className="kicker mb-4">Community hub · {org?.public_name ?? org?.name}</div>
      <h1 className="display text-[clamp(36px,6vw,64px)] leading-[0.98] -tracking-[1px]">
        Field guide. <em className="italic text-moss">First aid.</em> Alerts.
      </h1>
      <p className="text-ink-soft max-w-xl mt-5 leading-relaxed">
        What to do before help arrives. What to watch for, season by season. Knowledge from 2,000+ rescues, distilled.
      </p>

      {activeFestivals.length > 0 && (
        <section className="mt-10">
          <div className="kicker mb-3 inline-flex items-center gap-1"><Bell size={11} /> Active alerts</div>
          {activeFestivals.map((f: any) => (
            <div key={f.id} className={`card mb-3 ${f.severity === 'critical' ? 'bg-rust/10 border-rust/30' : 'bg-amber/10 border-amber/30'}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className={f.severity === 'critical' ? 'text-rust' : 'text-amber'} />
                <h3 className="display text-lg">{f.title}</h3>
              </div>
              <p className="text-sm text-ink-soft mt-2">{f.detail}</p>
            </div>
          ))}
        </section>
      )}

      <section className="mt-12">
        <div className="kicker mb-4 inline-flex items-center gap-1"><BookOpen size={11} /> Field guide</div>
        <h2 className="display text-3xl mb-5">Birds you'll meet <em className="italic text-rust">first.</em></h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {species.data?.map((s: any) => (
            <article key={s.id} className="card">
              <div className="flex items-start gap-3">
                <span className="text-4xl">{s.emoji}</span>
                <div className="min-w-0">
                  <h3 className="display italic text-lg">{s.common_name}</h3>
                  <div className="text-xs text-ink-muted">{s.habitat}</div>
                  <div className="text-xs text-rust mt-2"><AlertTriangle size={10} className="inline mr-1" />{s.common_injury}</div>
                  <div className="text-sm mt-2 text-ink-soft">{s.first_aid}</div>
                </div>
              </div>
              {s.is_wildlife && <div className="kicker mt-3 text-moss">Wildlife · do not handle barehand</div>}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 card bg-cream text-center">
        <Stethoscope size={28} className="text-rust mx-auto" />
        <h3 className="display text-2xl mt-3">Need help right now?</h3>
        <p className="text-sm text-ink-soft mt-1">Don't rely on the guide. Call us.</p>
        <Link to={`/${orgSlug}/r`} className="btn-primary mt-4">Report on web</Link>
        <a href={`tel:${org?.helpline_e164}`} className="ml-2 btn-ghost">Call {org?.helpline_e164}</a>
      </section>
    </main>
  );
}
