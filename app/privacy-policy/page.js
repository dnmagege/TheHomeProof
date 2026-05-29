import { SiteHeader } from '@/components/site/Header';
import { SiteFooter } from '@/components/site/Footer';

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600">Privacy Policy</p>
            <h1 className="text-4xl md:text-5xl font-bold">How we handle your data.</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">HomeProof is committed to protecting your privacy. This policy explains the personal data we collect, why we use it, and how we keep it safe.</p>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">What we collect</h2>
            <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-400">
              <li>Account information: name, email, role, and profile details.</li>
              <li>Property and tenancy records that you create or upload.</li>
              <li>Usage data needed to operate the app and improve the service.</li>
              <li>Cookies and analytics data for website performance and preferences.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">Why we use it</h2>
            <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-400">
              <li>To authenticate and secure your account.</li>
              <li>To deliver tenancy management features and legal evidence tools.</li>
              <li>To respond to support requests and inquiries.</li>
              <li>To comply with legal obligations and improve the product.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">How we protect it</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">We store data in Supabase with row-level security and encrypted storage buckets. We use industry-standard authentication, and we only share data when required to fulfil service operations or legal requests.</p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">Contact</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">If you have questions about this policy or want to request access to your data, email <a href="mailto:thehomeproof@outlook.com" className="font-medium text-brand-600 hover:underline">thehomeproof@outlook.com</a>.</p>
          </section>
        </div>
      </div>
    </main>
      <SiteFooter />
    </>
  );
}
