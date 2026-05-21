import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrg } from '../../../lib/org';
import { listCases } from '../../../lib/queries';
import { DonorNav } from '../../../components/ui';
import { Heart, Sparkles } from 'lucide-react';
import { DonateModal } from '../../../components/DonateModal';

const SPONSORSHIP_INR = 2000;

interface PickedCase {
  id: string;
  short_id: string;
  species: string;
  emoji: string;
}

export default function Sponsor() {
  const { org } = useOrg();
  const [picked, setPicked] = useState<PickedCase | null>(null);

  const cases = useQuery({
    queryKey: ['sponsorable', org?.id],
    queryFn: () => listCases(org!.id, { status: 'in-rescue' }),
    enabled: !!org?.id,
  });

  return (
    <main className="max-w-[1320px] mx-auto px-4 sm:px-7 py-12">
      <DonorNav />

      <div className="kicker mb-4">02 · Sponsor a specific bird</div>
      <h1 className="display text-[clamp(36px,6vw,64px)] leading-[0.98] -tracking-[1px]">
        Their name <em className="italic text-rust">becomes part of your day.</em>
      </h1>
      <p className="text-ink-soft max-w-xl mt-5 leading-relaxed">
        Pick a bird in our care. ₹2,000 funds her full recovery — surgery, meds, food, the works. You'll get her
        weekly photo updates until release. We'll name her after someone you love, if you ask.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
        {cases.data?.slice(0, 12).map((c) => (
          <div key={c.id} className="card hover:-translate-y-1 transition">
            <div className="flex items-start gap-3">
              <span className="text-4xl">{c.species_emoji ?? '🪶'}</span>
              <div className="min-w-0 flex-1">
                <div className="kicker">{c.short_id}</div>
                <div className="display italic text-lg mt-1">{c.species_name ?? c.species_freetext ?? c.kind}</div>
                <div className="text-xs text-ink-soft mt-1 line-clamp-2">{c.threat_summary}</div>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="kicker">Funds needed</div>
                <div className="display text-2xl">₹{SPONSORSHIP_INR.toLocaleString('en-IN')}</div>
              </div>
              <button
                onClick={() => setPicked({
                  id: c.id, short_id: c.short_id,
                  species: c.species_name ?? c.species_freetext ?? c.kind,
                  emoji: c.species_emoji ?? '🪶',
                })}
                className="btn-primary !text-xs"
              >
                <Heart size={12} /> Sponsor
              </button>
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-[10px] text-amber"><Sparkles size={10} /> Photo updates until release</div>
          </div>
        ))}
      </div>

      {!cases.isLoading && cases.data?.length === 0 && (
        <div className="card text-center mt-10">
          <div className="display text-lg">No birds in active care right now.</div>
          <p className="text-sm text-ink-soft mt-2">All released. Check back tomorrow.</p>
        </div>
      )}

      <DonateModal
        open={!!picked}
        onClose={() => setPicked(null)}
        amountInr={SPONSORSHIP_INR}
        what={picked ? `${picked.emoji} ${picked.species} · ${picked.short_id}` : ''}
        description={picked ? `Full recovery for ${picked.short_id}` : undefined}
        case_id={picked?.id}
      />
    </main>
  );
}
