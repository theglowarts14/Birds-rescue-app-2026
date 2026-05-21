import { useQuery } from '@tanstack/react-query';
import { useOrg } from '../../../lib/org';
import { useAuth } from '../../../lib/auth';
import { listTrainingModules, listMyCompletions } from '../../../lib/queries';
import { PageHeader, LoadingRow, EmptyState } from '../../../components/ui';
import { GraduationCap, CheckCircle2, Lock } from 'lucide-react';

export default function Training() {
  const { org } = useOrg();
  const { user } = useAuth();

  const modules = useQuery({ queryKey: ['training', org?.id], queryFn: () => listTrainingModules(org!.id), enabled: !!org?.id });
  const done    = useQuery({ queryKey: ['my-completions', user?.id], queryFn: () => listMyCompletions(user!.id), enabled: !!user?.id });
  const doneIds = new Set(done.data?.map((d: any) => d.module_id) ?? []);

  return (
    <>
      <PageHeader kicker="Volunteer onboarding" title="Training" accent="modules." />

      <p className="text-sm text-ink-soft mb-5 max-w-xl">
        Core modules must be completed before a volunteer can be auto-dispatched. New volunteers get the curated playlist;
        veterans can dip into specifics.
      </p>

      {modules.isLoading && <LoadingRow />}
      {!modules.isLoading && modules.data?.length === 0 && <EmptyState icon={<GraduationCap size={28} />} title="No modules published yet" />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {modules.data?.map((m: any) => {
          const isDone = doneIds.has(m.id);
          return (
            <div key={m.id} className={`card ${isDone ? 'bg-moss/5 border-moss/30' : ''}`}>
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="kicker">{m.level} · {m.minutes} min</div>
                  <div className="display text-lg mt-1">{m.title}</div>
                </div>
                {isDone ? (
                  <CheckCircle2 size={20} className="text-moss shrink-0" />
                ) : m.unlocks_dispatch ? (
                  <Lock size={16} className="text-rust shrink-0" />
                ) : null}
              </div>
              {m.unlocks_dispatch && !isDone && (
                <div className="text-xs text-rust mt-2">Required to be dispatched.</div>
              )}
              <button
                disabled
                title="Module player coming soon"
                className={`mt-3 text-sm font-semibold opacity-60 cursor-not-allowed inline-flex items-center gap-2 ${isDone ? 'text-moss' : 'text-rust'}`}
              >
                {isDone ? 'Review' : 'Start →'}
                <span className="text-[9px] font-mono uppercase tracking-widest opacity-70">Soon</span>
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
