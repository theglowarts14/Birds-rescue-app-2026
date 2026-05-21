import { useQuery } from '@tanstack/react-query';
import { useOrg } from '../../../lib/org';
import { listClinics } from '../../../lib/queries';
import { PageHeader, LoadingRow, EmptyState } from '../../../components/ui';
import { Stethoscope, MapPin, Phone, Plus, Clock } from 'lucide-react';

export default function Clinics() {
  const { org } = useOrg();
  const q = useQuery({ queryKey: ['clinics', org?.id], queryFn: () => listClinics(org!.id), enabled: !!org?.id });

  return (
    <>
      <PageHeader kicker="Vet network" title="Clinics" accent="we trust.">
        <button disabled title="Coming soon" className="btn-primary opacity-60 cursor-not-allowed">
          <Plus size={14} /> Add clinic
          <span className="ml-1 text-[9px] font-mono uppercase tracking-widest opacity-70">Soon</span>
        </button>
      </PageHeader>

      {q.isLoading && <LoadingRow />}
      {!q.isLoading && q.data?.length === 0 && <EmptyState icon={<Stethoscope size={28} />} title="No clinics on file" hint="Add the vet partners that take your rescues." />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {q.data?.map((c: any) => (
          <div key={c.id} className="card">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <div className="display text-lg truncate">{c.name}</div>
                <div className="text-xs text-ink-muted flex items-center gap-1 mt-1"><MapPin size={10} /> {c.area}</div>
                <div className="text-sm mt-2 text-ink-soft">{c.specialty}</div>
                <div className="flex items-center gap-3 mt-3 text-xs text-ink-soft flex-wrap">
                  <a href={`tel:${c.phone_e164}`} className="inline-flex items-center gap-1 hover:text-rust"><Phone size={11} /> {c.phone_e164}</a>
                  <span className="inline-flex items-center gap-1"><Clock size={11} /> {c.hours}</span>
                </div>
              </div>
              {c.is_24x7 && (
                <span className="shrink-0 px-2 py-1 rounded-full bg-moss/15 text-moss text-[10px] font-mono uppercase tracking-wider">24×7</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
