import { useQuery } from '@tanstack/react-query';
import { useOrg } from '../../../lib/org';
import { supabase } from '../../../lib/supabase';
import { Heart, ArrowUpRight } from 'lucide-react';

const inr = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function Portal() {
  const { org } = useOrg();

  const products = useQuery({
    queryKey: ['donation_products', org?.id],
    enabled: !!org?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from('donation_products').select('*').eq('org_id', org!.id).eq('is_active', true).order('amount_inr');
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <main className="max-w-[1320px] mx-auto px-4 sm:px-7 py-12">
      <section className="mb-12">
        <div className="kicker mb-4">Give · {org?.name}</div>
        <h1 className="display text-[clamp(36px,6vw,72px)] leading-[0.98] -tracking-[1px]">
          Not a button.
          <br />
          <em className="italic text-rust">A water bowl. A wing. A bird with a name.</em>
        </h1>
        <p className="text-ink-soft max-w-xl mt-5 leading-relaxed">Birds are less expressive than dogs — and that makes them harder to feel for. So we don't ask you to donate. We let you fund a thing you can see: one bowl, one net, one rescue, one bird through her whole recovery.</p>
      </section>

      <section>
        <div className="kicker mb-4">01 · Give a thing</div>
        <h2 className="display text-3xl mb-5">Pick what you fund, <em className="italic text-rust">not how much.</em></h2>

        {products.isLoading && <div className="text-ink-muted">Loading…</div>}
        {products.isError && (
          <div className="card bg-rust/10 text-rust">Couldn't load donation products. Have you run migration 0003 against the AWCS org?</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.data?.map((p) => (
            <div key={p.id} className="card hover:-translate-y-1 transition cursor-pointer">
              <div className="flex justify-between items-start">
                <span className="text-4xl">{p.emoji}</span>
                {p.is_recurring && <span className="text-[10px] uppercase px-2 py-1 bg-sky/15 text-sky rounded-full font-semibold tracking-wider">Monthly</span>}
              </div>
              <div className="display text-3xl mt-3">{inr(p.amount_inr)}{p.is_recurring && <span className="text-sm text-ink-muted font-sans"> / mo</span>}</div>
              <h3 className="display italic text-lg mt-2">{p.label}</h3>
              <p className="text-sm text-ink-soft mt-1">{p.detail}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-rust font-semibold text-sm">Give now <ArrowUpRight size={14} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="card bg-ink text-paper">
          <div className="kicker !text-paper/60">For companies</div>
          <h3 className="display text-2xl mt-2">CSR portal · <em className="italic text-amber">built for finance teams.</em></h3>
          <p className="text-paper/70 mt-2 max-w-md">Bulk donations, branded impact reports per quarter, employee volunteering tie-ins, audited spend ledger.</p>
          <button className="mt-5 px-5 py-2.5 bg-paper text-ink rounded-full text-sm font-semibold inline-flex items-center gap-2"><Heart size={14} /> Book a CSR call</button>
        </div>
      </section>
    </main>
  );
}
