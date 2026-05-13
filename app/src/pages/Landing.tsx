import { Link } from 'react-router-dom';
import { AlertCircle, Heart, Phone } from 'lucide-react';

const DEV_ORG = import.meta.env.VITE_DEV_ORG_SLUG || 'awcs';

export default function Landing() {
  return (
    <main className="max-w-[1320px] mx-auto px-4 py-16">
      <section className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
        <div className="md:col-span-7">
          <div className="kicker mb-6">Karuna · multi-NGO rescue platform · India</div>
          <h1 className="display text-[clamp(40px,7vw,92px)] leading-[0.98] -tracking-[1.5px]">
            When wings fall,
            <br />
            <em className="italic text-rust font-medium">we answer.</em>
          </h1>
          <p className="text-ink-soft text-lg max-w-xl mt-6 leading-relaxed">
            A WhatsApp-first rescue line for the city — built once, used by every animal-rescue NGO that wants it.
            Hyderabad first. Hyderabad's <strong>Animal Warriors</strong> as the first deployment.
          </p>
          <div className="flex gap-3 flex-wrap mt-8">
            <Link to={`/${DEV_ORG}/donate`} className="btn-primary">
              <Heart size={16} /> Donate to Animal Warriors
            </Link>
            <a href="https://wa.me/919697887888" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 bg-ink text-paper rounded-full font-semibold text-sm no-underline">
              <Phone size={16} /> Report on WhatsApp +91 96978 87888
            </a>
            <Link to="/login" className="btn-ghost">
              <AlertCircle size={16} /> Team sign in
            </Link>
          </div>
        </div>
        <div className="md:col-span-5">
          <div className="card bg-paper shadow-[0_30px_60px_-36px_rgba(26,20,16,0.25)]">
            <div className="kicker">Now live</div>
            <h2 className="display text-2xl mt-2">For NGOs adopting Karuna</h2>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              <li>· Multi-tenant data model — your org, your data, your URL.</li>
              <li>· White-label donor portal at <code className="font-mono text-xs bg-cream px-1.5 py-0.5 rounded">karuna.app/your-slug</code></li>
              <li>· 80G receipts auto-issued via Razorpay.</li>
              <li>· Push to volunteers, Realtime to coordinators, photo storage for donors.</li>
            </ul>
            <Link to="/login" className="btn-primary mt-5">Set up your NGO</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
