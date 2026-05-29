import { SiteHeader } from '@/components/site/Header';
import { SiteFooter } from '@/components/site/Footer';

export default function CookiePolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600">Cookie Policy</p>
            <h1 className="text-4xl md:text-5xl font-bold">Cookies and tracking on HomeProof.</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">This policy explains how we use cookies and similar technologies on our website and app.</p>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">What are cookies?</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Cookies are small text files stored on your device that help the website remember your preferences and improve your experience.</p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">How we use them</h2>
            <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-400">
              <li>Authentication and session management</li>
              <li>Preferences such as theme and language</li>
              <li>Analytics to monitor website performance</li>
              <li>Third-party services required for the product</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">Managing cookies</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">You can control cookies through your browser settings. Disabling cookies may affect the usability of some features.</p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold">Questions</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">If you have questions about this policy, email <a href="mailto:thehomeproof@outlook.com" className="font-medium text-brand-600 hover:underline">thehomeproof@outlook.com</a>.</p>
          </section>
        </div>
      </div>
    </main>
      <SiteFooter />
    </>
  );
}
