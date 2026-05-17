import { useState } from 'react';
import { useOrg } from '../../../lib/org';
import { DonorNav } from '../../../components/ui';
import { Briefcase, FileSpreadsheet, Users, Award } from 'lucide-react';

export default function CSR() {
  const { org } = useOrg();
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="max-w-[1320px] mx-auto px-4 sm:px-7 py-12">
      <DonorNav />

      <div className="kicker mb-4">For companies</div>
      <h1 className="display text-[clamp(36px,6vw,64px)] leading-[0.98] -tracking-[1px]">
        CSR, <em className="italic text-rust">built for your finance team.</em>
      </h1>
      <p className="text-ink-soft max-w-xl mt-5 leading-relaxed">
        Bulk donations, branded quarterly impact reports, employee-volunteering tie-ins, and an audited spend ledger.
        80G receipts auto-issued by your CFO's deadline. Direct line to {org?.public_name ?? org?.name}.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-10">
        <Card icon={<FileSpreadsheet size={20} />} title="Quarterly impact reports" body="Branded PDF with your logo. Numbers, photos, named birds. Built from live case data." />
        <Card icon={<Users size={20} />} title="Employee volunteering days" body="We host your team for a half-day at the rehab center. Hands-on, photographed, ready for your internal comms." />
        <Card icon={<Briefcase size={20} />} title="Audited spend ledger" body="Every rupee traced to a case ID. We give your auditors the CSV they want, the way they want it." />
        <Card icon={<Award size={20} />} title="Recognition" body="Logo on the recognition wall + named birds + named clay-bowl initiatives. Optional, never required." />
      </div>

      <div className="card mt-10 max-w-2xl">
        <h2 className="display text-2xl">Book a CSR call</h2>
        <p className="text-sm text-ink-soft mt-1">15 minutes. We'll send a deck + sample report after.</p>
        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <input required placeholder="Your name" className="px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm" />
          <input required placeholder="Company" className="px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm" />
          <input required type="email" placeholder="Work email" className="px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm sm:col-span-2" />
          <textarea placeholder="CSR budget range (optional)" rows={3} className="px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm sm:col-span-2" />
          <button type="submit" className="btn-primary justify-center sm:col-span-2">Request a meeting</button>
        </form>
        {submitted && <p className="text-sm text-moss mt-3">Thanks. Someone will reach out within 48 hours.</p>}
      </div>
    </main>
  );
}

function Card({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-rust">{icon} <span className="display text-lg">{title}</span></div>
      <p className="text-sm text-ink-soft mt-2">{body}</p>
    </div>
  );
}
