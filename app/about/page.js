import { SiteHeader } from '@/components/site/Header';
import { SiteFooter } from '@/components/site/Footer';

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600">About HomeProof</p>
            <h1 className="text-4xl md:text-5xl font-bold">Proof for every part of your tenancy.</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">HomeProof helps landlords, agents and tenants manage tenancies with confidence. We combine AI inventory generation, contract analysis, damage tracking, secure storage, and legal evidence workflows into one platform.</p>
          </div>

          <section className="grid gap-8 md:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-2xl font-semibold">Our mission</h2>
              <p className="mt-4 text-slate-600 dark:text-slate-400">We want to make tenancy management transparent, faster, and fairer. That means removing guesswork around damage claims, rent disputes, contract terms, and move-in/move-out records.</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-2xl font-semibold">Why we built it</h2>
              <p className="mt-4 text-slate-600 dark:text-slate-400">Landlords and tenants both need more certainty. HomeProof centralises property proof, makes compliance easy, and turns legal evidence into a simple workflow backed by AI.</p>
            </article>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">What we offer</h2>
            <ul className="mt-6 grid gap-4 text-slate-600 dark:text-slate-400 sm:grid-cols-2">
              <li className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">AI-powered inventory and dispute evidence</li>
              <li className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">Secure tenant and property records</li>
              <li className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">Contract and rent offer analysis</li>
              <li className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">Custom tenancy workflows for landlords and tenants</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">Get in touch</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">If you want to learn more about HomeProof or discuss a bespoke plan, contact our team at <a href="mailto:thehomeproof@outlook.com" className="font-medium text-brand-600 hover:underline">thehomeproof@outlook.com</a>.</p>
          </section>
        </div>
      </div>
    </main>
      <SiteFooter />
    </>
  );
}
