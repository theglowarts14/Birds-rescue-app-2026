import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useOrg } from '../../../lib/org';
import { listDonationProducts, listReleases } from '../../../lib/queries';
import { ArrowUpRight, Heart } from 'lucide-react';
import { DonorNav, LoadingRow, ErrorRow } from '../../../components/ui';
import { DonateModal } from '../../../components/DonateModal';

const inr = (n: number) => '₹' + n.toLocaleString('en-IN');

interface PickedProduct {
  id: string;
  label: string;
  amount_inr: number;
  detail: string | null;
  emoji: string | null;
}

export default function Portal() {
  const { org } = useOrg();
  const { orgSlug } = useParams();
  const [picked, setPicked] = useState<PickedProduct | null>(null);

  const products = useQuery({ queryKey: ['donation_products', org?.id], queryFn: () => listDonationProducts(org!.id), enabled: !!org?.id });
  const released = useQuery({ queryKey: ['releases', org?.id], queryFn: () => listReleases(org!.id), enabled: !!org?.id });

  return (
    <main className="max-w-[1320px] mx-auto px-4 sm:px-7 py-12">
      <DonorNav />

      <section className="mb-12">
        <div className="kicker mb-4">Give · {org?.public_name ?? org?.name}</div>
        <h1 className="display text-[clamp(36px,6vw,72px)] leading-[0.98] -tracking-[1px]">
          Not a button.
          <br />
          <em className="italic text-rust">A water bowl. A wing. A bird with a name.</em>
        </h1>
        <p className="text-ink-soft max-w-xl mt-5 leading-relaxed">
          Birds are less expressive than dogs — and that makes them harder to feel for. So we don't ask you to donate.
          We let you fund a thing you can see: one bowl, one net, one rescue, one bird through her whole recovery.
        </p>
      </section>

      <section>
        <div className="kicker mb-4">01 · Give a thing</div>
        <h2 className="display text-3xl mb-5">Pick what you fund, <em className="italic text-rust">not how much.</em></h2>

        {products.isLoading && <LoadingRow />}
        {products.isError && <ErrorRow err={products.error} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.data?.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                if (p.is_recurring) {
                  alert('Monthly giving is coming in M3 (see roadmap). For now, this is a one-time gift.');
                }
                setPicked({ id: p.id, label: p.label, amount_inr: p.amount_inr, detail: p.detail, emoji: p.emoji });
              }}
              className="card hover:-translate-y-1 transition cursor-pointer text-left"
            >
              <div className="flex justify-between items-start">
                <span className="text-4xl">{p.emoji}</span>
                {p.is_recurring && (
                  <span className="text-[10px] uppercase px-2 py-1 bg-sky/15 text-sky rounded-full font-semibold tracking-wider">Monthly</span>
                )}
              </div>
              <div className="display text-3xl mt-3">{inr(p.amount_inr)}{p.is_recurring && <span className="text-sm text-ink-muted font-sans"> / mo</span>}</div>
              <h3 className="display italic text-lg mt-2">{p.label}</h3>
              <p className="text-sm text-ink-soft mt-1">{p.detail}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-rust font-semibold text-sm">
                Give now <ArrowUpRight size={14} />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="kicker mb-4">02 · Sponsor a specific bird</div>
        <h2 className="display text-3xl mb-3">Her name becomes <em className="italic text-rust">part of your day.</em></h2>
        <p className="text-sm text-ink-soft max-w-xl mb-5">A ₹2,000 sponsorship funds one bird through her full recovery. You get photo updates until release.</p>
        <Link to={`/${orgSlug}/donate/sponsor`} className="btn-primary"><Heart size={14} /> Browse birds in care</Link>
      </section>

      <section className="mt-16">
        <div className="kicker mb-4">03 · Watch the sky</div>
        <h2 className="display text-3xl mb-5">Released. <em className="italic text-sky">Back to sky.</em></h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-2">
          {released.data?.slice(0, 16).map((c) => (
            <div key={c.id} className="aspect-square rounded-xl bg-sky/10 grid place-items-center text-3xl">{c.species_emoji ?? '🪶'}</div>
          ))}
        </div>
        <Link to={`/${orgSlug}/donate/released`} className="inline-flex items-center gap-1 text-rust font-semibold text-sm mt-4">
          See the full sky-blue feed <ArrowUpRight size={14} />
        </Link>
      </section>

      <section className="mt-16">
        <div className="card bg-ink text-paper">
          <div className="kicker !text-paper/60">For companies</div>
          <h3 className="display text-2xl mt-2">CSR portal · <em className="italic text-amber">built for finance teams.</em></h3>
          <p className="text-paper/70 mt-2 max-w-md">Bulk donations, branded impact reports per quarter, employee volunteering tie-ins, audited spend ledger.</p>
          <Link to={`/${orgSlug}/donate/csr`} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-paper text-ink rounded-full text-sm font-semibold no-underline">
            <Heart size={14} /> Book a CSR call
          </Link>
        </div>
      </section>

      <DonateModal
        open={!!picked}
        onClose={() => setPicked(null)}
        amountInr={picked?.amount_inr ?? 0}
        what={picked ? `${picked.emoji ?? '🎁'} ${picked.label}` : ''}
        description={picked?.detail ?? undefined}
        product_id={picked?.id}
      />
    </main>
  );
}
