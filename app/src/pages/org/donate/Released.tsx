import { useQuery } from '@tanstack/react-query';
import { useOrg } from '../../../lib/org';
import { listReleases } from '../../../lib/queries';
import { DonorNav } from '../../../components/ui';

export default function Released() {
  const { org } = useOrg();
  const q = useQuery({ queryKey: ['releases', org?.id], queryFn: () => listReleases(org!.id), enabled: !!org?.id });

  return (
    <main className="max-w-[1320px] mx-auto px-4 sm:px-7 py-12">
      <DonorNav />

      <div className="kicker mb-4">Sky-blue feed</div>
      <h1 className="display text-[clamp(36px,6vw,64px)] leading-[0.98] -tracking-[1px]">
        Released. <em className="italic text-sky">Back to sky.</em>
      </h1>
      <p className="text-ink-soft max-w-xl mt-5 leading-relaxed">
        Every bird, every release. Some were sponsored, some weren't — they all flew. This is the quietest, slowest,
        best part of our work.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
        {q.data?.map((c) => (
          <article key={c.id} className="card bg-gradient-to-br from-sky/10 to-paper border-sky/20">
            <div className="flex items-start gap-3">
              <span className="text-4xl">{c.species_emoji ?? '🪶'}</span>
              <div className="min-w-0">
                <div className="kicker">{c.short_id}</div>
                <div className="display italic text-lg mt-1">{c.species_name ?? c.species_freetext ?? c.kind}</div>
                <div className="text-xs text-sky font-mono mt-1">
                  Released {c.released_at ? new Date(c.released_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                </div>
              </div>
            </div>
            {c.threat_summary && (
              <p className="text-sm text-ink-soft mt-3 italic">"{c.threat_summary}"</p>
            )}
          </article>
        ))}
      </div>

      {!q.isLoading && q.data?.length === 0 && (
        <div className="card text-center mt-10">
          <div className="display text-lg">First releases coming soon.</div>
          <p className="text-sm text-ink-soft mt-2">Recovery takes 2–6 weeks. We post here the minute they're released.</p>
        </div>
      )}
    </main>
  );
}
