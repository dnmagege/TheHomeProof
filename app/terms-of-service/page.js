import { SiteHeader } from '@/components/site/Header';
import { SiteFooter } from '@/components/site/Footer';

export default function TermsOfServicePage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600">Terms of Service</p>
            <h1 className="text-4xl md:text-5xl font-bold">Terms for using HomeProof.</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">These terms govern your use of HomeProof. By accessing the platform, you agree to the rules below.</p>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">Using the service</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">You may use HomeProof for lawful tenancy management activities. You must not misuse the service or upload content that infringes third-party rights.</p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">Accounts and security</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">You are responsible for keeping your account credentials secure. Notify us immediately if you suspect unauthorised access.</p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">Payments and subscriptions</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Paid features are billed through Stripe. You are responsible for any charges associated with your account and for cancelling before renewals if you choose to stop.</p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">Limitation of liability</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">HomeProof is provided as-is. We are not liable for indirect, incidental, or consequential losses arising from the use of the service.</p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">Contact</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">For questions about these terms, email <a href="mailto:thehomeproof@outlook.com" className="font-medium text-brand-600 hover:underline">thehomeproof@outlook.com</a>.</p>
          </section>
        </div>
      </div>
    </main>
      <SiteFooter />
    </>
  );
}
