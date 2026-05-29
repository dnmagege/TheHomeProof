"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { ThemeToggle, SettingsDialog } from '@/lib/features';

const navLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/#how', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#testimonials', label: 'Reviews' },
  { href: '/about', label: 'About' },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteHeader({
  loc,
  onUpdate,
  onGetStarted,
  onSignIn,
  ctaLabel = 'Get started',
  ctaHref = '/',
}) {
  const showActions = Boolean(onGetStarted || onSignIn);
  const hasSettings = Boolean(loc && onUpdate);

  return (
    <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Link href="/" aria-label="Home">
            <img src="/logo.png" alt="HomeProof" className="h-24 w-auto scale-150 origin-left" />
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700 dark:text-slate-300">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand-600 transition-colors">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {hasSettings && <SettingsDialog loc={loc} onUpdate={onUpdate} />}
          <ThemeToggle />
          {showActions ? (
            <>
              <Button onClick={onGetStarted} className="bg-brand-500 hover:bg-brand-600 text-white">{ctaLabel} <span className="ml-2">→</span></Button>
              <Button onClick={onSignIn} variant="outline">Sign in</Button>
            </>
          ) : (
            <>
              <Button asChild variant="default" size="lg">
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/">Sign in</Link>
              </Button>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-5 mt-8">
                <Link href="/" aria-label="Home">
                  <img src="/logo.png" alt="HomeProof" className="h-20 w-auto scale-150 origin-left mb-2" />
                </Link>
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="text-base font-medium text-slate-800 dark:text-slate-200 hover:text-brand-600">
                    {link.label}
                  </Link>
                ))}
                <div className="border-t pt-4 space-y-3">
                  {hasSettings && <SettingsDialog loc={loc} onUpdate={onUpdate} />}
                  {showActions ? (
                    <>
                      <Button onClick={onGetStarted} className="w-full bg-brand-500 hover:bg-brand-600 text-white">{ctaLabel}</Button>
                      <Button onClick={onSignIn} className="w-full" variant="outline">Sign in</Button>
                    </>
                  ) : (
                    <>
                      <Button asChild className="w-full bg-brand-500 hover:bg-brand-600 text-white">
                        <Link href={ctaHref}>{ctaLabel}</Link>
                      </Button>
                      <Button asChild className="w-full" variant="outline">
                        <Link href="/">Sign in</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
