import { SiteHeader } from '@/components/site/Header';
import { SiteFooter } from '@/components/site/Footer';

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600">Contact</p>
            <h1 className="text-4xl md:text-5xl font-bold">Need help with HomeProof?</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">Reach out to our team and we’ll get back to you quickly.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">Support email</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Send your enquiry to:</p>
            <a href="mailto:thehomeproof@outlook.com" className="mt-4 inline-flex rounded-full bg-brand-600 px-5 py-3 text-white shadow hover:bg-brand-700">thehomeproof@outlook.com</a>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">What to include</h2>
            <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-400">
              <li>Brief description of the issue</li>
              <li>Your account email address</li>
              <li>Any relevant tenancy or property details</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">General enquiries</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">For business plans, partnerships, or custom onboarding, email our team and we’ll reply during normal business hours.</p>
          </div>
        </div>
      </div>
    </main>
      <SiteFooter />
    </>
  );
}
