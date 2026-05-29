import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 py-10">
      <div className="container mx-auto px-6 space-y-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <Link href="/about" className="hover:text-brand-600">About</Link>
          <Link href="/privacy-policy" className="hover:text-brand-600">Privacy Policy</Link>
          <Link href="/terms-of-service" className="hover:text-brand-600">Terms of Service</Link>
          <Link href="/contact" className="hover:text-brand-600">Contact</Link>
          <Link href="/cookie-policy" className="hover:text-brand-600">Cookie Policy</Link>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 text-sm text-slate-500 md:flex-row md:gap-6">
          <span>Support: <a href="mailto:thehomeproof@outlook.com" className="text-brand-600 hover:underline">thehomeproof@outlook.com</a></span>
          <span>Open Monday–Friday, 9am–5pm GMT</span>
        </div>
        <div className="text-xs text-slate-500 max-w-2xl mx-auto">
          HomeProof is a tenancy management tool and does not provide legal advice. Your use of the site is subject to our Terms of Service and Privacy Policy.
        </div>
        <div className="text-sm text-slate-500">© {new Date().getFullYear()} HomeProof</div>
      </div>
    </footer>
  );
}
