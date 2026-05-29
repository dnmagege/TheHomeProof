'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SiteHeader } from '@/components/site/Header';
import { SiteFooter } from '@/components/site/Footer';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Building2, Sparkles, FileText, Camera, Wrench, ShieldCheck, LogOut, Plus, Loader2, ArrowRight, CheckCircle2, AlertTriangle, ScanSearch, Home, ChevronLeft, Upload, Send, Trash2, Calendar, Mail, TrendingUp, Bot, MessageSquare, Menu, X } from 'lucide-react';
import { t, detectLocale, saveLocale, formatCurrency } from '@/lib/i18n';
import { useLocaleState, ThemeToggle, SettingsDialog, AIRentEstimator, AICoPilot, AIDisputeBuilder, PrintInventoryButton } from '@/lib/features';

const supabase = getSupabaseClient();

// Hook to fetch user's current subscription plan
function useUserPlan() {
  const [plan, setPlan] = useState('free');
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/user/plan', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const { plan: userPlan } = await res.json();
        if (userPlan) setPlan(userPlan);
      } catch (e) {
        console.error('Failed to fetch user plan:', e);
      }
    })();
  }, []);
  return plan;
}

async function api(path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const headers = { ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.body && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`/api/${path}`, { ...opts, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json;
}

// Upload a file directly to a public Supabase storage bucket
async function uploadToBucket(bucket, file) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  const filePath = `${session.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return { path: filePath, url: data.publicUrl };
}

function Landing({ onGetStarted, onSignIn, loc, updateLoc }) {
  const lang = loc.language;
  const plan = useUserPlan();
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <SiteHeader loc={loc} onUpdate={updateLoc} onGetStarted={onGetStarted} onSignIn={onSignIn} ctaLabel={t('getStarted', lang)} />

      <section className="container mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-5 bg-blue-100 text-brand-700 hover:bg-brand-100 dark:bg-brand-900 dark:text-brand-300">{t('appTagline', lang)}</Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              {t('landingHeroBefore', lang)} <span className="text-brand-600">{t('landingHeroAfter', lang)}</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-xl">{t('landingSubtitle', lang)}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button onClick={onGetStarted} size="lg" className="bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-200/50">
                {t('startFree', lang)} <ArrowRight className="ml-2 h-4 w-4"/>
              </Button>
              <Button onClick={onSignIn} variant="outline" size="lg">{t('signIn', lang)}</Button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {n:'Real case-ready evidence', l:'Turn photos, contracts and repair notes into tribunal-ready proof.'},
                {n:'Built for landlords & tenants', l:'Streamline inventory, disputes and compliance in one place.'},
                {n:'Free during beta', l:'No card required. Start with your first property today.'},
              ].map((s, i) => (
                <div key={i} className="rounded-3xl border border-slate-200 bg-white/90 p-5 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{s.n}</div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1511452885600-a3d2c9148a31?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eSUyMG1hbmFnZW1lbnR8ZW58MHx8fGJsdWV8MTc3ODg3OTEyNXww&ixlib=rb-4.1.0&q=85" alt="Properties" className="rounded-2xl shadow-2xl w-full h-[500px] object-cover"/>
            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 rounded-xl shadow-xl p-4 flex items-center gap-3 max-w-xs">
              <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle2 className="h-5 w-5"/></div>
              <div><div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Inventory generated</div><div className="text-xs text-slate-500">12 rooms · 84 items detected</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 dark:bg-slate-950 py-20" id="features">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge className="mb-3 bg-brand-100 text-brand-700">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">{t('featuresTitle', lang)}</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">{t('featuresSubtitle', lang)}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3 mb-10 text-center">
            {[
              {title:'Inventory & evidence in minutes', desc:'AI auto-tags rooms, items and damage for fast, tribunal-ready reporting.'},
              {title:'Tenant-friendly workflows', desc:'Invite tenants, share documents and resolve disputes together.'},
              {title:'Trusted compliance engine', desc:'Track contracts, rent offers and move-in records in one secure place.'},
            ].map((item, idx) => (
              <div key={idx} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">{item.title}</div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {icon:Camera, title:t('aiInventory', lang), desc:t('inventoryDesc', lang), color:'bg-brand-100 text-brand-600'},
              {icon:FileText, title:t('aiContract', lang), desc:t('contractDesc', lang), color:'bg-purple-100 text-purple-600'},
              {icon:ScanSearch, title:t('aiDamage', lang), desc:t('damageDesc', lang), color:'bg-amber-100 text-amber-600'},
              {icon:TrendingUp, title:t('aiRent', lang), desc:t('rentDesc', lang), color:'bg-cyan-100 text-cyan-600'},
              {icon:Bot, title:t('aiCopilot', lang), desc:t('copilotDesc', lang), color:'bg-violet-100 text-violet-600'},
              {icon:ShieldCheck, title:'Dispute Evidence Builder', desc:'AI compiles all your inventories, inspections, issues & contracts into a tribunal-ready evidence bundle.', color:'bg-rose-100 text-rose-600'},
            ].map((f, i) => (
              <Card key={i} className="border-slate-200 dark:border-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all">
                <CardContent className="pt-6">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.color} mb-4`}><f.icon className="h-6 w-6"/></div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-white dark:bg-slate-900" id="how">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge className="mb-3 bg-brand-100 text-brand-700">How it works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">From check-in to check-out, fully automated.</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Three steps. Zero spreadsheets. Bulletproof evidence.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {n:'01', t:'Add your property', d:'Sign up, add an address. Invite your tenant by email. Done in 60 seconds.'},
              {n:'02', t:'Capture proof with AI', d:'Snap photos. Upload your contract PDF. AI generates inventories, reads contracts, and tracks compliance.'},
              {n:'03', t:'Win every dispute', d:'When something goes wrong, AI builds a tribunal-ready evidence bundle from your existing data — instantly.'},
            ].map((s, i) => (
              <div key={i} className="relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="text-5xl font-black text-brand-500/20 absolute top-3 right-4">{s.n}</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 relative">{s.t}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 relative">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950" id="pricing">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge className="mb-3 bg-brand-100 text-brand-700">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">Simple plans for every portfolio.</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Choose a plan that scales with your properties and gives you AI-backed proof, dispute tools and compliance in one place.</p>
            <p className="mt-4 text-sm text-slate-500">All plans include secure tenancy storage, inventory export, tenant access and ongoing updates.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {name:'Free', price:'£0', period:'forever', features:['1 property', '10 AI runs / month', 'All AI tools', 'Multi-language UI', 'Community support'], cta:'Start free', highlight:false},
              {name:'Pro', price:'£19', period:'/ month', features:['Up to 10 properties', '200 AI runs / month', 'PDF inventory exports', 'AI Dispute Evidence Builder', 'Email tenants', 'Priority support'], cta:'Start Pro', highlight:true},
              {name:'Business', price:'£49', period:'/ month', features:['Up to 100 properties', '2000 AI runs / month', 'Audit logs export', 'Custom branding', 'API access', 'Dedicated account manager'], cta:'Contact sales', highlight:false},
            ].map((p, i) => (
              <Card key={i} className={`relative ${p.highlight ? 'border-brand-500 border-2 shadow-2xl md:scale-105' : 'border-slate-200 dark:border-slate-800'}`}>
                {p.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>}
                <CardHeader>
                  <CardTitle className="text-xl">{p.name}</CardTitle>
                  <div className="mt-2"><span className="text-4xl font-black text-slate-900 dark:text-slate-100">{p.price}</span><span className="text-slate-500 text-sm ml-1">{p.period}</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">{p.features.map((f, j) => <li key={j} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300"><CheckCircle2 className="h-4 w-4 text-brand-500 flex-shrink-0 mt-0.5"/>{f}</li>)}</ul>
                  {p.name === 'Pro' ? (
                    <Button
                      onClick={async () => {
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          if (!session) { toast.error('Please sign in first'); return; }
                          const res = await fetch('/api/stripe/create-checkout-session', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                            body: JSON.stringify({ price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO })
                          });
                          const { url, error } = await res.json();
                          if (error) throw new Error(error);
                          window.location.href = url;
                        } catch (e) {
                          toast.error(e.message || 'Failed to start checkout');
                        }
                      }}
                      className={`w-full bg-brand-500 hover:bg-brand-600 text-white`}
                    >
                      {p.cta}
                    </Button>
                  ) : p.name === 'Business' ? (
                    <Button
                      onClick={() => {
                        window.location.href = 'mailto:thehomeproof@outlook.com?subject=Business%20Plan%20Enquiry';
                      }}
                      className="w-full"
                      variant="outline"
                    >
                      {p.cta}
                    </Button>
                  ) : (
                    <Button onClick={onGetStarted} className="w-full" variant="outline">{p.cta}</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-white dark:bg-slate-900" id="testimonials">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge className="mb-3 bg-brand-100 text-brand-700">Reviews</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">Loved by landlords and tenants.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {q:'Saved me £400 in inventory clerk fees on my first property. The AI report was more detailed than any inventory I have ever paid for.', a:'Sarah W.', r:'Landlord, Manchester'},
              {q:'My landlord tried to keep my deposit for damage that was clearly there when I moved in. HomeProof\'s evidence bundle got me my full £1,200 back.', a:'James K.', r:'Tenant, London'},
              {q:'Manages our 47-property portfolio. Compliance reminders alone justify the subscription. The AI dispute builder is wizardry.', a:'Priya M.', r:'Letting Agency, Birmingham'},
            ].map((tt, i) => (
              <Card key={i} className="border-slate-200 dark:border-slate-800">
                <CardContent className="pt-6">
                  <div className="text-brand-500 text-2xl mb-3">★★★★★</div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">&ldquo;{tt.q}&rdquo;</p>
                  <div><div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{tt.a}</div><div className="text-xs text-slate-500">{tt.r}</div></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-20 bg-ink-700 text-white" id="about">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <Badge className="mb-3 bg-brand-500 text-white hover:bg-brand-500">About HomeProof</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Built by people who&apos;ve been on both sides of a deposit dispute.</h2>
            <p className="mt-4 text-slate-300">Every year, UK tenants lose over £100 million in unfair deposit deductions. Landlords lose just as much chasing repair claims and disputes that drag on for months.</p>
            <p className="mt-3 text-slate-300">HomeProof is the AI layer that solves it — turning every photo, document, and message into structured, time-stamped, tribunal-ready evidence. So when something goes wrong, the truth is already on the record.</p>
            <p className="mt-3 text-brand-400 font-semibold">Proof for every part of your tenancy.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              {n:'£100M+', l:'Lost in unfair UK deposit deductions each year'},
              {n:'67%', l:'Of tenants do not challenge — because they lack evidence'},
              {n:'30s', l:'To generate a complete AI inventory with HomeProof'},
              {n:'4.9★', l:'Average rating from our beta users'},
            ].map((s, i) => (
              <div key={i} className="p-5 rounded-xl bg-white/5 backdrop-blur border border-white/10">
                <div className="text-3xl font-black text-brand-500">{s.n}</div>
                <div className="text-xs text-slate-300 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950" id="faq">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-brand-100 text-brand-700">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {[
              {q:'Is HomeProof legally binding evidence?', a:'HomeProof generates time-stamped, AI-analyzed documentation that has been used in UK tribunals (TDS, DPS, MyDeposits) and small claims court. AI outputs should be reviewed by a qualified professional for high-value disputes.'},
              {q:'Do I need to be a landlord to use it?', a:'No — tenants get equal access to AI inventories, contract reading, damage detection, and dispute evidence. The platform is designed to be fair to both sides.'},
              {q:'How does the AI work?', a:'We use OpenAI GPT-4o with Vision. Your data stays in your private Supabase workspace; we never train on your data.'},
              {q:'Can I export my data?', a:'Yes. PDF export is built-in for inventories. Full data export is included in Pro and Business plans.'},
              {q:'What countries does it support?', a:'The app works in 8 languages and 19 currencies. AI legal advice is most accurate for UK tenancies but adapts to your country when specified.'},
              {q:'How secure is my data?', a:'All data is stored in Supabase with row-level security. Files are stored in encrypted buckets. We use industry-standard JWT authentication and follow GDPR principles.'},
            ].map((f, i) => (
              <details key={i} className="group p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-900 dark:text-slate-100">{f.q}<ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90"/></summary>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">Ready to upgrade your tenancy?</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-xl mx-auto">Free during beta. No credit card. Set up in 60 seconds.</p>
          <Button onClick={onGetStarted} size="lg" className="mt-8 bg-brand-500 hover:bg-brand-600">{t('startFree', lang)} <ArrowRight className="ml-2 h-4 w-4"/></Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function AuthPage({ mode, setMode, onSuccess, onBack, loc }) {
  const lang = loc?.language || 'en';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('landlord');
  const [loading, setLoading] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    if (!resetCooldown) return;
    const timer = window.setInterval(() => {
      setResetCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resetCooldown]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('inviteEmail')?.trim();
    if (invite) {
      setInviteEmail(invite);
      setEmail((current) => current || invite);
    }
  }, []);

  async function handle(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        // Server-side signup (auto-confirms email for smooth UX)
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, role }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Signup failed');
        // Now sign in
        const { error: siErr } = await supabase.auth.signInWithPassword({ email, password });
        if (siErr) throw siErr;
        toast.success('Welcome to HomeProof!');
        onSuccess();
      } else if (mode === 'forgot') {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) throw new Error('Please enter the email address for your account.');
        const response = await fetch('/api/auth/recover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to send recovery email.');
        toast.success('Password reset email sent. Check your inbox.');
        setResetCooldown(60);
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
        onSuccess();
      }
    } catch (err) {
      const message = err?.message || err?.error_description || err?.msg || JSON.stringify(err);
      toast.error(message || 'Unable to send recovery email.');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-brand-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="mb-6 inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900"><ChevronLeft className="h-4 w-4 mr-1"/>Back</button>
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/" aria-label="Home">
                <img src="/logo.png" alt="HomeProof" className="h-24 w-auto scale-150 origin-left"/>
              </Link>
            </div>
            <CardTitle>{mode === 'signup' ? t('createAccount', lang) : t('welcomeBack', lang)}</CardTitle>
            <CardDescription>{mode === 'signup' ? t('appTagline', lang) : t('signIn', lang)}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handle} className="space-y-4">
              {mode === 'signup' && (<>
                <div>
                  <Label htmlFor="name">{t('name', lang)}</Label>
                  <Input id="name" value={name} onChange={(e)=>setName(e.target.value)} required/>
                </div>
                <div>
                  <Label htmlFor="role">{t('iAmA', lang)}</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landlord">{t('landlord', lang)}</SelectItem>
                      <SelectItem value="tenant">{t('tenant', lang)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>)}
              <div>
                <Label htmlFor="email">{t('email', lang)}</Label>
                <Input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/>
                {mode === 'signup' && inviteEmail ? (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">You were invited with <strong>{inviteEmail}</strong>. Sign up with that email to link your tenancy automatically.</p>
                ) : null}
              </div>
              {mode !== 'forgot' && (
                <div>
                  <Label htmlFor="password">{t('password', lang)}</Label>
                  <Input id="password" type="password" minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)} required/>
                  {mode === 'login' && (
                    <button type="button" onClick={() => window.location.href = '/reset-password'} className="mt-2 text-sm text-brand-600 hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600" disabled={loading || (mode === 'forgot' && resetCooldown > 0)}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : (
                  mode === 'signup' ? t('signUp', lang) : mode === 'forgot' ? 'Send reset link' : t('signIn', lang)
                )}
              </Button>
              {mode === 'forgot' && resetCooldown > 0 && (
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">Please wait {resetCooldown} second{resetCooldown === 1 ? '' : 's'} before requesting another reset.</div>
              )}
            </form>
            <p className="mt-4 text-sm text-center text-slate-600 dark:text-slate-400">
              {mode === 'signup' ? 'Already have an account?' : mode === 'forgot' ? 'Remembered your password?' : "Don't have an account?"}{' '}
              <button onClick={() => setMode(mode === 'signup' ? 'login' : mode === 'forgot' ? 'login' : 'signup')} className="text-brand-600 hover:underline font-medium">
                {mode === 'signup' ? t('signIn', lang) : mode === 'forgot' ? t('signIn', lang) : t('signUp', lang)}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PropertyCreateDialog({ onCreated, planInfo, currentCount }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ address_line1: '', address_line2: '', city: '', postcode: '', country: 'UK' });
  const [loading, setLoading] = useState(false);
  const maxProperties = planInfo?.max_properties;
  const limitReached = typeof maxProperties === 'number' && currentCount >= maxProperties;

  async function submit() {
    setLoading(true);
    try {
      await api('properties', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Property added');
      setOpen(false);
      setForm({ address_line1: '', address_line2: '', city: '', postcode: '', country: 'UK' });
      onCreated();
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-brand-500 hover:bg-brand-600" disabled={limitReached}><Plus className="h-4 w-4 mr-2"/>{limitReached ? 'Limit reached' : 'Add property'}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a property</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {limitReached ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
              You have reached your allowed property limit for this plan. Upgrade to add more properties.
            </div>
          ) : null}
          <div><Label>Address line 1</Label><Input value={form.address_line1} onChange={(e)=>setForm({...form,address_line1:e.target.value})} disabled={limitReached}/></div>
          <div><Label>Address line 2</Label><Input value={form.address_line2} onChange={(e)=>setForm({...form,address_line2:e.target.value})} disabled={limitReached}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>City</Label><Input value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})} disabled={limitReached}/></div>
            <div><Label>Postcode</Label><Input value={form.postcode} onChange={(e)=>setForm({...form,postcode:e.target.value})} disabled={limitReached}/></div>
          </div>
        </div>
        <DialogFooter className="flex flex-col gap-3">
          {limitReached ? (
            <Button onClick={() => window.location.href = '/#pricing'} className="w-full bg-brand-500 hover:bg-brand-600 text-white">Upgrade plan</Button>
          ) : (
            <Button onClick={submit} disabled={loading || !form.address_line1} className="bg-brand-500 hover:bg-brand-600">{loading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Add property'}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AIInventoryTool({ properties, loc }) {
  const [propertyId, setPropertyId] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  function onFiles(e) {
    const arr = Array.from(e.target.files || []);
    setFiles(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
  }

  async function generate() {
    if (!propertyId || files.length === 0) { toast.error('Pick a property and at least one photo'); return; }
    setLoading(true); setResult(null);
    try {
      toast.info('Uploading photos...');
      const uploaded = [];
      for (const f of files) uploaded.push(await uploadToBucket('property-photos', f));
      toast.info('AI is analyzing photos...');
      const { inventory } = await api('inventories/generate', {
        method: 'POST',
        body: JSON.stringify({ property_id: propertyId, photo_urls: uploaded.map(u => u.url) }),
      });
      setResult(inventory.ai_inventory_json);
      toast.success('Inventory generated!');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  const lang = loc?.language || 'en';
  const selectedProperty = properties.find(p => p.id === propertyId);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5 text-brand-600"/>{t('aiInventory', lang)}</CardTitle>
        <CardDescription>{t('inventoryDesc', lang)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>{t('properties', lang)}</Label>
          <Select value={propertyId} onValueChange={setPropertyId}>
            <SelectTrigger><SelectValue placeholder={t('selectProperty', lang)}/></SelectTrigger>
            <SelectContent>
              {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.address_line1}{p.postcode ? `, ${p.postcode}` : ''}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t('photos', lang)}</Label>
          <Input type="file" accept="image/*" multiple onChange={onFiles}/>
        </div>
        {previews.length > 0 && (
          <div className="grid grid-cols-4 gap-2">{previews.map((u,i)=><img key={i} src={u} className="h-20 w-full object-cover rounded" alt=""/>)}</div>
        )}
        <Button onClick={generate} disabled={loading} className="w-full bg-brand-500 hover:bg-brand-600">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Generating...</> : <><Sparkles className="h-4 w-4 mr-2"/>{t('generateInventory', lang)}</>}
        </Button>
        {result && <>
          <div className="flex justify-end -mb-2"><PrintInventoryButton data={result} propertyAddress={selectedProperty?.address_line1}/></div>
          <InventoryResult data={result}/>
        </>}
      </CardContent>
    </Card>
  );
}

function InventoryResult({ data }) {
  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      {data.summary && <div className="p-3 rounded-lg bg-blue-50 text-sm text-blue-900"><strong>Summary:</strong> {data.summary}</div>}
      {(data.rooms || []).map((room, i) => (
        <div key={i} className="border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-slate-900">{room.name}</h4>
            <div className="flex gap-1 text-xs">
              {room.walls_condition && <Badge variant="outline">walls: {room.walls_condition}</Badge>}
              {room.floor_condition && <Badge variant="outline">floor: {room.floor_condition}</Badge>}
            </div>
          </div>
          {room.overall_notes && <p className="text-xs text-slate-600 mb-2">{room.overall_notes}</p>}
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 text-xs"><th className="py-1">Item</th><th>Qty</th><th>Condition</th><th>Notes</th></tr></thead>
            <tbody>{(room.items||[]).map((it,j) => (
              <tr key={j} className="border-t"><td className="py-1.5">{it.item}</td><td>{it.quantity}</td><td><ConditionBadge c={it.condition}/></td><td className="text-slate-600 text-xs">{it.notes}</td></tr>
            ))}</tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function ConditionBadge({ c }) {
  const map = { excellent: 'bg-green-100 text-green-700', good: 'bg-blue-100 text-brand-700', fair: 'bg-yellow-100 text-yellow-700', poor: 'bg-orange-100 text-orange-700', damaged: 'bg-red-100 text-red-700' };
  return <span className={`text-xs px-2 py-0.5 rounded ${map[c] || 'bg-slate-100 text-slate-700'}`}>{c}</span>;
}

function AIContractTool({ properties }) {
  const [tenancyId, setTenancyId] = useState('');
  const [tenancies, setTenancies] = useState([]);
  const [file, setFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      const all = [];
      for (const p of properties) {
        try { const r = await api(`properties/${p.id}`); for (const t of (r.tenancies||[])) all.push({ ...t, property: p }); } catch {}
      }
      setTenancies(all);
    })();
  }, [properties]);

  async function uploadAndParse() {
    if (!tenancyId || !file) { toast.error('Pick a tenancy and a PDF'); return; }
    setLoading(true); setResult(null);
    try {
      toast.info('Uploading & extracting text...');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tenancy_id', tenancyId);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/contracts/upload-and-parse', { method: 'POST', body: fd, headers: { 'Authorization': `Bearer ${session.access_token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setResult(json.ai);
      toast.success('Contract analyzed!');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  async function parseText() {
    if (!tenancyId || !rawText.trim()) { toast.error('Pick a tenancy and paste text'); return; }
    setLoading(true); setResult(null);
    try {
      const { contract } = await api('contracts/parse', { method: 'POST', body: JSON.stringify({ tenancy_id: tenancyId, raw_text: rawText }) });
      setResult(contract.ai_summary_json);
      toast.success('Contract analyzed!');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-purple-600"/>AI Contract Reader</CardTitle>
        <CardDescription>Upload a tenancy agreement PDF (or paste text). AI extracts rights, obligations, and red flags.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Tenancy</Label>
          <Select value={tenancyId} onValueChange={setTenancyId}>
            <SelectTrigger><SelectValue placeholder="Select a tenancy"/></SelectTrigger>
            <SelectContent>
              {tenancies.map(t => <SelectItem key={t.id} value={t.id}>{t.property.address_line1} · {t.tenant_email || 'no tenant'}</SelectItem>)}
            </SelectContent>
          </Select>
          {tenancies.length === 0 && <p className="text-xs text-slate-500 mt-1">Create a tenancy first (in Properties tab).</p>}
        </div>
        <Tabs defaultValue="pdf">
          <TabsList><TabsTrigger value="pdf">Upload PDF</TabsTrigger><TabsTrigger value="text">Paste text</TabsTrigger></TabsList>
          <TabsContent value="pdf" className="space-y-3">
            <Input type="file" accept=".pdf,application/pdf" onChange={(e)=>setFile(e.target.files?.[0]||null)}/>
            <Button onClick={uploadAndParse} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Analyzing...</> : <><Upload className="h-4 w-4 mr-2"/>Upload & analyze</>}
            </Button>
          </TabsContent>
          <TabsContent value="text" className="space-y-3">
            <Textarea rows={8} placeholder="Paste contract text here..." value={rawText} onChange={(e)=>setRawText(e.target.value)}/>
            <Button onClick={parseText} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Analyzing...</> : <><Sparkles className="h-4 w-4 mr-2"/>Analyze contract</>}
            </Button>
          </TabsContent>
        </Tabs>
        {result && <ContractResult data={result}/>}
      </CardContent>
    </Card>
  );
}

function ContractResult({ data }) {
  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      {data.plain_english_summary && <div className="p-3 rounded-lg bg-purple-50 text-sm text-purple-900">{data.plain_english_summary}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ListBlock title="Your rights" items={data.tenant_rights} color="green"/>
        <ListBlock title="Your obligations" items={data.tenant_obligations} color="blue"/>
        <ListBlock title="Landlord rights" items={data.landlord_rights} color="slate"/>
        <ListBlock title="Landlord obligations" items={data.landlord_obligations} color="slate"/>
      </div>
      {data.notice_periods && (
        <div className="p-3 border rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Notice periods</h4>
          <p className="text-sm text-slate-600">Tenant → Landlord: {data.notice_periods.tenant_to_landlord || '—'}</p>
          <p className="text-sm text-slate-600">Landlord → Tenant: {data.notice_periods.landlord_to_tenant || '—'}</p>
        </div>
      )}
      {data.red_flags && data.red_flags.length > 0 && (
        <div className="p-3 border-2 border-red-200 bg-red-50 rounded-lg">
          <h4 className="font-semibold text-sm mb-2 text-red-800 flex items-center gap-1"><AlertTriangle className="h-4 w-4"/>Red flags</h4>
          <ul className="text-sm text-red-800 list-disc pl-5 space-y-1">{data.red_flags.map((r,i)=><li key={i}>{r}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function ListBlock({ title, items, color }) {
  const c = { green: 'bg-green-50 border-green-200', blue: 'bg-blue-50 border-blue-200', slate: 'bg-slate-50 border-slate-200' }[color];
  return (
    <div className={`p-3 border rounded-lg ${c}`}>
      <h4 className="font-semibold text-sm mb-2">{title}</h4>
      <ul className="text-sm space-y-1 list-disc pl-4">{(items||[]).map((x,i)=><li key={i}>{x}</li>)}</ul>
    </div>
  );
}

function AIDamageDetector({ properties }) {
  const [propertyId, setPropertyId] = useState('');
  const [beforeFiles, setBeforeFiles] = useState([]);
  const [afterFiles, setAfterFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function compare() {
    if (!propertyId || beforeFiles.length === 0 || afterFiles.length === 0) { toast.error('Pick property and both photo sets'); return; }
    setLoading(true); setResult(null);
    try {
      toast.info('Uploading photos...');
      const beforeUrls = []; for (const f of beforeFiles) beforeUrls.push((await uploadToBucket('inspections', f)).url);
      const afterUrls = []; for (const f of afterFiles) afterUrls.push((await uploadToBucket('inspections', f)).url);
      toast.info('AI is comparing photos...');
      const { inspection } = await api('inspections/compare', { method: 'POST', body: JSON.stringify({ property_id: propertyId, before_urls: beforeUrls, after_urls: afterUrls }) });
      setResult(inspection.ai_report_json);
      toast.success('Inspection report ready!');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ScanSearch className="h-5 w-5 text-amber-600"/>AI Damage Detector</CardTitle>
        <CardDescription>Upload BEFORE (move-in) and AFTER (move-out) photos. AI flags new damage and estimates deductions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Property</Label>
          <Select value={propertyId} onValueChange={setPropertyId}>
            <SelectTrigger><SelectValue placeholder="Select a property"/></SelectTrigger>
            <SelectContent>
              {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.address_line1}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>BEFORE photos (move-in)</Label>
            <Input type="file" multiple accept="image/*" onChange={(e)=>setBeforeFiles(Array.from(e.target.files||[]))}/>
            {beforeFiles.length > 0 && <p className="text-xs text-slate-500 mt-1">{beforeFiles.length} selected</p>}
          </div>
          <div>
            <Label>AFTER photos (move-out)</Label>
            <Input type="file" multiple accept="image/*" onChange={(e)=>setAfterFiles(Array.from(e.target.files||[]))}/>
            {afterFiles.length > 0 && <p className="text-xs text-slate-500 mt-1">{afterFiles.length} selected</p>}
          </div>
        </div>
        <Button onClick={compare} disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Comparing...</> : <><Sparkles className="h-4 w-4 mr-2"/>Detect damage</>}
        </Button>
        {result && <DamageResult data={result}/>}
      </CardContent>
    </Card>
  );
}

function DamageResult({ data }) {
  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <div className="p-3 rounded-lg bg-amber-50 text-sm text-amber-900">{data.overall_assessment}</div>
      {data.total_estimated_deduction_gbp != null && (
        <div className="flex items-center justify-between p-3 border-2 border-amber-300 rounded-lg">
          <span className="font-semibold">Estimated deposit deduction</span>
          <span className="text-xl font-bold text-amber-700">£{data.total_estimated_deduction_gbp}</span>
        </div>
      )}
      {(data.damages||[]).map((d,i) => (
        <div key={i} className="p-3 border rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900">{d.location} — {d.type}</span>
            <Badge className={d.severity==='severe'?'bg-red-100 text-red-700':d.severity==='moderate'?'bg-orange-100 text-orange-700':'bg-yellow-100 text-yellow-700'}>{d.severity}</Badge>
          </div>
          <p className="text-xs text-slate-600 mt-1">{d.evidence}</p>
          {d.estimated_cost_gbp != null && <p className="text-sm font-medium mt-1">Est. cost: £{d.estimated_cost_gbp}</p>}
        </div>
      ))}
      {data.fair_wear_and_tear?.length > 0 && (
        <div className="p-3 bg-slate-50 rounded-lg">
          <h4 className="text-sm font-semibold mb-1">Fair wear & tear (no deduction)</h4>
          <ul className="text-sm text-slate-600 list-disc pl-4">{data.fair_wear_and_tear.map((x,i)=><li key={i}>{x}</li>)}</ul>
        </div>
      )}
      {data.recommendation && <div className="p-3 bg-blue-50 text-sm text-blue-900 rounded-lg">{data.recommendation}</div>}
    </div>
  );
}

function TenancyDialog({ propertyId, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tenant_email: '', start_date: '', end_date: '', rent_amount: '', rent_frequency: 'monthly', deposit_amount: '' });
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (form.tenant_email) {
      setInviteLink(`${window.location.origin}/?inviteEmail=${encodeURIComponent(form.tenant_email.trim())}`);
    } else {
      setInviteLink('');
    }
  }, [form.tenant_email]);

  async function copyInvite() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied to clipboard');
    } catch (err) {
      toast.error('Unable to copy invite link');
    }
  }

  async function submit() {
    setLoading(true);
    try {
      await api('tenancies', { method: 'POST', body: JSON.stringify({ ...form, property_id: propertyId, rent_amount: parseFloat(form.rent_amount)||null, deposit_amount: parseFloat(form.deposit_amount)||null }) });
      toast.success('Tenancy created');
      setOpen(false); onCreated();
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-3 w-3 mr-1"/>Invite tenant</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New tenancy</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tenant email</Label>
            <Input value={form.tenant_email} onChange={(e)=>setForm({...form,tenant_email:e.target.value})}/>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Enter the tenant's email to invite them and link the tenancy when they sign up.</p>
            {inviteLink ? (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400 break-words">Invite link: <code className="font-mono text-xs text-slate-900 dark:text-slate-100">{inviteLink}</code></div>
                <Button type="button" variant="outline" size="sm" onClick={copyInvite}>Copy invite link</Button>
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start date</Label><Input type="date" value={form.start_date} onChange={(e)=>setForm({...form,start_date:e.target.value})}/></div>
            <div><Label>End date</Label><Input type="date" value={form.end_date} onChange={(e)=>setForm({...form,end_date:e.target.value})}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Rent (£)</Label><Input type="number" value={form.rent_amount} onChange={(e)=>setForm({...form,rent_amount:e.target.value})}/></div>
            <div><Label>Deposit (£)</Label><Input type="number" value={form.deposit_amount} onChange={(e)=>setForm({...form,deposit_amount:e.target.value})}/></div>
          </div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={loading} className="bg-brand-500 hover:bg-brand-600">{loading?<Loader2 className="h-4 w-4 animate-spin"/>:'Create'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PropertyCard({ property, onChanged, loc }) {
  const [detail, setDetail] = useState(null);
  const load = useCallback(async () => { try { const r = await api(`properties/${property.id}`); setDetail(r); } catch(e){ toast.error(e.message); } }, [property.id]);
  useEffect(() => { load(); }, [load]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{property.address_line1}</CardTitle>
        <CardDescription>{[property.city, property.postcode].filter(Boolean).join(' · ')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">{detail?.tenancies?.length || 0} tenancies</Badge>
          <Badge variant="outline">{detail?.inventories?.length || 0} inventories</Badge>
          <Badge variant="outline">{detail?.contracts?.length || 0} contracts</Badge>
          <Badge variant="outline">{detail?.issues?.length || 0} issues</Badge>
        </div>
        <TenancyDialog propertyId={property.id} onCreated={()=>{load(); onChanged();}}/>
        {detail?.tenancies?.length > 0 && (
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            {detail.tenancies.map(t => <div key={t.id} className="border rounded p-2">Tenant: {t.tenant_email||'—'} · {formatCurrency(t.rent_amount, loc?.currency || 'GBP', loc?.locale)}/{t.rent_frequency}</div>)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ComplianceTab({ properties }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ property_id: '', type: 'Gas Safety Certificate', expiry_date: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { const r = await api('compliance'); setItems(r.compliance || []); } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!form.property_id || !form.expiry_date) { toast.error('Property and expiry date required'); return; }
    setSaving(true);
    try {
      await api('compliance', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Compliance item added');
      setOpen(false); setForm({ property_id: '', type: 'Gas Safety Certificate', expiry_date: '' });
      load();
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function remove(id) {
    try { await api(`compliance/${id}`, { method: 'DELETE' }); toast.success('Removed'); load(); }
    catch (e) { toast.error(e.message); }
  }

  function daysUntil(d) {
    if (!d) return null;
    const diff = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  }
  function urgency(days) {
    if (days == null) return 'bg-slate-100 text-slate-700';
    if (days < 0) return 'bg-red-100 text-red-700';
    if (days < 30) return 'bg-orange-100 text-orange-700';
    if (days < 90) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-rose-600"/>Compliance Tracker</CardTitle>
          <CardDescription>Gas, EPC, EICR, deposit protection — never miss an expiry.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-rose-600 hover:bg-rose-700"><Plus className="h-4 w-4 mr-2"/>Add item</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add compliance item</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Property</Label>
                <Select value={form.property_id} onValueChange={(v)=>setForm({...form,property_id:v})}>
                  <SelectTrigger><SelectValue placeholder="Select property"/></SelectTrigger>
                  <SelectContent>{properties.map(p=><SelectItem key={p.id} value={p.id}>{p.address_line1}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v)=>setForm({...form,type:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gas Safety Certificate">Gas Safety Certificate (CP12)</SelectItem>
                    <SelectItem value="EPC">Energy Performance Certificate (EPC)</SelectItem>
                    <SelectItem value="EICR">Electrical Installation (EICR)</SelectItem>
                    <SelectItem value="PAT Testing">PAT Testing</SelectItem>
                    <SelectItem value="Deposit Protection">Deposit Protection</SelectItem>
                    <SelectItem value="Landlord Insurance">Landlord Insurance</SelectItem>
                    <SelectItem value="Selective Licensing">Selective Licensing</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Expiry date</Label><Input type="date" value={form.expiry_date} onChange={(e)=>setForm({...form,expiry_date:e.target.value})}/></div>
            </div>
            <DialogFooter><Button onClick={add} disabled={saving} className="bg-rose-600 hover:bg-rose-700">{saving?<Loader2 className="h-4 w-4 animate-spin"/>:'Add'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex items-center justify-center py-8 text-slate-500"><Loader2 className="h-5 w-5 animate-spin mr-2"/>Loading...</div>
          : items.length === 0 ? <div className="text-center py-8 text-slate-500"><Calendar className="h-12 w-12 mx-auto mb-2 text-slate-300"/>No compliance items yet.</div>
          : <div className="space-y-2">{items.map(it => {
              const d = daysUntil(it.expiry_date);
              return (
                <div key={it.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{it.type}</div>
                    <div className="text-xs text-slate-500">{it.properties?.address_line1} {it.properties?.postcode && `· ${it.properties.postcode}`}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-slate-600">{it.expiry_date}</div>
                      <Badge className={urgency(d)}>{d != null ? (d < 0 ? `${Math.abs(d)}d overdue` : `in ${d}d`) : 'no date'}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={()=>remove(it.id)}><Trash2 className="h-4 w-4 text-slate-400"/></Button>
                  </div>
                </div>
              );
            })}</div>
        }
      </CardContent>
    </Card>
  );
}

function IssuesTab({ properties, profile }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ property_id: '', title: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState([]);
  const [sendOpen, setSendOpen] = useState(null);
  const [sendTo, setSendTo] = useState('');

  const load = useCallback(async () => {
    try { const r = await api('issues'); setIssues(r.issues || []); } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.property_id || !form.title) { toast.error('Property and title required'); return; }
    setSaving(true);
    try {
      const urls = [];
      for (const f of files) urls.push((await uploadToBucket('issues', f)).url);
      await api('issues', { method: 'POST', body: JSON.stringify({ ...form, photo_urls: urls }) });
      toast.success('Issue reported. AI draft ready!');
      setOpen(false); setForm({ property_id: '', title: '', description: '' }); setFiles([]);
      load();
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function updateStatus(id, status) {
    try { await api(`issues/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); load(); }
    catch (e) { toast.error(e.message); }
  }

  async function sendEmail(id) {
    try {
      await api(`issues/${id}/send`, { method: 'POST', body: JSON.stringify({ to: sendTo }) });
      toast.success(`Email sent to ${sendTo}`);
      setSendOpen(null); setSendTo('');
    } catch (e) { toast.error(e.message); }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-emerald-600"/>Repair & Issues</CardTitle>
          <CardDescription>Report issues. AI drafts professional repair emails automatically.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2"/>Report issue</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Report an issue</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Property</Label>
                <Select value={form.property_id} onValueChange={(v)=>setForm({...form,property_id:v})}>
                  <SelectTrigger><SelectValue placeholder="Select property"/></SelectTrigger>
                  <SelectContent>{properties.map(p=><SelectItem key={p.id} value={p.id}>{p.address_line1}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Title</Label><Input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="e.g. Leaking kitchen tap"/></div>
              <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} placeholder="Describe the issue..."/></div>
              <div><Label>Photos (optional)</Label><Input type="file" multiple accept="image/*" onChange={(e)=>setFiles(Array.from(e.target.files||[]))}/></div>
            </div>
            <DialogFooter><Button onClick={create} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving?<><Loader2 className="h-4 w-4 animate-spin mr-2"/>Drafting...</>:<><Sparkles className="h-4 w-4 mr-2"/>Submit & draft</>}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex items-center justify-center py-8 text-slate-500"><Loader2 className="h-5 w-5 animate-spin mr-2"/>Loading...</div>
          : issues.length === 0 ? <div className="text-center py-8 text-slate-500"><Wrench className="h-12 w-12 mx-auto mb-2 text-slate-300"/>No issues reported yet.</div>
          : <div className="space-y-3">{issues.map(i => {
              let draft = null;
              try { draft = i.ai_drafted_message ? JSON.parse(i.ai_drafted_message) : null; } catch {}
              const statusColor = i.status === 'open' ? 'bg-red-100 text-red-700' : i.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
              return (
                <div key={i.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-900">{i.title}</h4>
                      <p className="text-xs text-slate-500">{i.properties?.address_line1}</p>
                    </div>
                    <div className="flex gap-1">
                      {draft?.urgency && <Badge variant="outline" className="capitalize">{draft.urgency}</Badge>}
                      <Badge className={`capitalize ${statusColor}`}>{i.status}</Badge>
                    </div>
                  </div>
                  {i.description && <p className="text-sm text-slate-600 mb-2">{i.description}</p>}
                  {draft && (
                    <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded">
                      <div className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1"><Sparkles className="h-3 w-3"/>AI-drafted email</div>
                      <div className="text-xs text-slate-700"><strong>Subject:</strong> {draft.subject}</div>
                      <pre className="text-xs text-slate-700 mt-1 whitespace-pre-wrap font-sans">{draft.body}</pre>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    {i.status !== 'closed' && (
                      <Select value={i.status} onValueChange={(v)=>updateStatus(i.id, v)}>
                        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In progress</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {draft && (
                      <Dialog open={sendOpen === i.id} onOpenChange={(o)=>setSendOpen(o?i.id:null)}>
                        <DialogTrigger asChild><Button size="sm" variant="outline"><Mail className="h-3 w-3 mr-1"/>Email this</Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Send issue email</DialogTitle></DialogHeader>
                          <div className="space-y-3">
                            <div><Label>Recipient email</Label><Input type="email" value={sendTo} onChange={(e)=>setSendTo(e.target.value)} placeholder="landlord@example.com"/></div>
                            <p className="text-xs text-slate-500">The AI-drafted email below will be sent via Resend with reply-to set to your email.</p>
                          </div>
                          <DialogFooter><Button onClick={()=>sendEmail(i.id)} disabled={!sendTo} className="bg-emerald-600 hover:bg-emerald-700"><Send className="h-3 w-3 mr-1"/>Send</Button></DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              );
            })}</div>
        }
      </CardContent>
    </Card>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}><Icon className="h-5 w-5"/></div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicationsTab({ api, profile, properties }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ property_id: '', rent_offer: '', move_in_date: '', message: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await api('applications');
      setApplications(result.applications || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  async function apply() {
    if (!form.property_id) { toast.error('Select a property'); return; }
    if (!form.rent_offer) { toast.error('Rent offer required'); return; }
    setSaving(true);
    try {
      await api('applications', { method: 'POST', body: JSON.stringify({
        property_id: form.property_id,
        applicant_email: profile?.email,
        applicant_name: profile?.name || '',
        rent_offer: Number(form.rent_offer),
        move_in_date: form.move_in_date || null,
        message: form.message || null,
      })});
      toast.success('Application submitted');
      setForm({ property_id: '', rent_offer: '', move_in_date: '', message: '' });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally { setSaving(false); }
  }

  async function updateStatus(applicationId, status) {
    try {
      await api(`applications/${applicationId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      load();
      toast.success('Application updated');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications</CardTitle>
        <CardDescription>Track tenant applications and approve or decline them.</CardDescription>
      </CardHeader>
      <CardContent>
        {profile?.role !== 'landlord' ? (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Property</Label>
                <Select value={form.property_id} onValueChange={(value) => setForm({ ...form, property_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Choose property"/></SelectTrigger>
                  <SelectContent>{properties.map((property) => <SelectItem key={property.id} value={property.id}>{property.address_line1}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rent offer</Label>
                <Input type="number" value={form.rent_offer} onChange={(e) => setForm({ ...form, rent_offer: e.target.value })} placeholder="Amount in GBP" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Move-in date</Label>
                <Input type="date" value={form.move_in_date} onChange={(e) => setForm({ ...form, move_in_date: e.target.value })} />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell the landlord why you are a strong tenant." />
              </div>
            </div>
            <Button onClick={apply} disabled={saving} className="bg-brand-500 hover:bg-brand-600 text-white">
              {saving ? 'Submitting...' : 'Submit application'}
            </Button>
          </div>
        ) : null}

        {loading ? (
          <div className="text-center py-8 text-slate-500"><Loader2 className="inline-block h-5 w-5 animate-spin mr-2"/>Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No applications yet.</div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id} className="border-slate-200">
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div>
                      <div className="text-sm text-slate-500">{app.properties?.address_line1 || 'Property'}</div>
                      <div className="font-semibold text-slate-900">{app.applicant_name || app.applicant_email}</div>
                      <div className="text-xs text-slate-500">{app.status}</div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm text-slate-700">Rent offer: £{app.rent_offer || '—'}</div>
                      <div className="text-sm text-slate-700">Move-in: {app.move_in_date || 'TBD'}</div>
                    </div>
                  </div>
                  {app.message ? <p className="mt-3 text-sm text-slate-600">{app.message}</p> : null}
                  {profile?.role === 'landlord' && (
                    <div className="mt-4 flex gap-2 flex-wrap">
                      {['approved','declined','reviewing'].map((next) => (
                        <Button key={next} size="sm" variant={app.status === next ? 'secondary' : 'outline'} onClick={() => updateStatus(app.id, next)}>{next}</Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PropertyLinksTab({ api, properties }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await api('property-links');
      setLinks(result.property_links || []);
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  async function saveLink() {
    if (!url) { toast.error('Link URL required'); return; }
    setSaving(true);
    try {
      await api('property-links', { method: 'POST', body: JSON.stringify({ url, title, property_id: propertyId || null }) });
      toast.success('Link saved');
      setUrl(''); setTitle(''); setPropertyId('');
      load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved property links</CardTitle>
        <CardDescription>Save and track property listings from any pathway. No scraping or provider keys required.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 mb-6">
          <div><Label>URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.example.com/listing" /></div>
          <div><Label>Title (optional)</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="3-bed house, London" /></div>
          <div>
            <Label>Link to property (optional)</Label>
            <Select value={propertyId} onValueChange={(value) => setPropertyId(value)}>
              <SelectTrigger><SelectValue placeholder="Select property"/></SelectTrigger>
              <SelectContent>{properties.map((property) => <SelectItem key={property.id} value={property.id}>{property.address_line1}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={saveLink} disabled={saving} className="bg-brand-500 hover:bg-brand-600 text-white">{saving ? 'Saving...' : 'Save link'}</Button>
        </div>
        {loading ? <div className="text-center py-8 text-slate-500"><Loader2 className="inline-block h-5 w-5 animate-spin mr-2"/>Loading links...</div>
          : links.length === 0 ? <div className="text-center py-8 text-slate-500">No links saved yet.</div>
          : <div className="space-y-3">{links.map((link) => (
              <Card key={link.id} className="border-slate-200">
                <CardContent>
                  <a href={link.url} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:underline">{link.title || link.url}</a>
                  <div className="text-xs text-slate-500">{link.url}</div>
                  {link.property_id && <div className="text-xs text-slate-500">Linked property ID: {link.property_id}</div>}
                </CardContent>
              </Card>
            ))}</div>}
      </CardContent>
    </Card>
  );
}

function PaymentsTab({ api, profile, properties }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ tenancy_id: '', amount: '', payment_date: '', reference: '', proof_text: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await api('payments');
      setPayments(result.payments || []);
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  async function submitPayment() {
    if (!form.tenancy_id || !form.amount) { toast.error('Tenancy and amount required'); return; }
    setSaving(true);
    try {
      await api('payments', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Payment proof uploaded');
      setForm({ tenancy_id: '', amount: '', payment_date: '', reference: '', proof_text: '' });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally { setSaving(false); }
  }

  async function approve(paymentId) {
    try {
      await api(`payments/${paymentId}`, { method: 'PATCH', body: JSON.stringify({ status: 'approved' }) });
      toast.success('Payment approved');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <CardDescription>Upload proof of payment and approve tenant payment claims.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 mb-6">
          <div><Label>Tenancy ID</Label><Input value={form.tenancy_id} onChange={(e) => setForm({ ...form, tenancy_id: e.target.value })} placeholder="Enter tenancy ID" /></div>
          <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount in GBP" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Payment date</Label><Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} /></div>
            <div><Label>Reference</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Bank ref or invoice ref" /></div>
          </div>
          <div><Label>Proof text</Label><Textarea rows={3} value={form.proof_text} onChange={(e) => setForm({ ...form, proof_text: e.target.value })} placeholder="Paste bank text, receipt notes or payment description" /></div>
          <Button onClick={submitPayment} disabled={saving} className="bg-brand-500 hover:bg-brand-600 text-white">{saving ? 'Uploading...' : 'Upload payment proof'}</Button>
        </div>
        {loading ? <div className="text-center py-8 text-slate-500"><Loader2 className="inline-block h-5 w-5 animate-spin mr-2"/>Loading payments...</div>
          : payments.length === 0 ? <div className="text-center py-8 text-slate-500">No payment records yet.</div>
          : <div className="space-y-3">{payments.map((payment) => (
              <Card key={payment.id} className="border-slate-200">
                <CardContent>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="text-sm text-slate-500">Tenancy {payment.tenancy_id}</div>
                      <div className="font-semibold text-slate-900">£{payment.amount}</div>
                    </div>
                    <div className="text-right text-xs text-slate-500">{payment.status}</div>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">Date: {payment.payment_date || 'N/A'}</div>
                  {payment.reference ? <div className="text-sm text-slate-600">Reference: {payment.reference}</div> : null}
                  {profile?.role === 'landlord' && payment.status === 'pending' ? (
                    <Button className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => approve(payment.id)}>Approve payment</Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}</div>}
      </CardContent>
    </Card>
  );
}

function ChatTab({ api, profile, properties }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || '');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');

  const activeProperty = properties.find((property) => property.id === selectedPropertyId);

  useEffect(() => {
    if (!selectedPropertyId && properties.length) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const loadMessages = useCallback(async () => {
    if (!selectedPropertyId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await api(`messages?property_id=${encodeURIComponent(selectedPropertyId)}`);
      setMessages((result.messages || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [api, selectedPropertyId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!selectedPropertyId) return;
    const channel = supabase.channel(`chat-messages-${selectedPropertyId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `property_id=eq.${selectedPropertyId}` }, (payload) => {
        setMessages((prev) => {
          if (prev.some((message) => message.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPropertyId]);

  async function sendMessage() {
    if (!selectedPropertyId) {
      toast.error('Select a property before sending a message');
      return;
    }
    if (!input.trim()) {
      toast.error('Message text required');
      return;
    }
    setSending(true);
    try {
      await api('messages', { method: 'POST', body: JSON.stringify({ property_id: selectedPropertyId, content: input.trim() }) });
      setInput('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realtime chat</CardTitle>
        <CardDescription>Chat with the landlord or tenant for this property in real time.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 mb-6">
          <div>
            <Label>Property</Label>
            <Select value={selectedPropertyId} onValueChange={(value) => setSelectedPropertyId(value)}>
              <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>{property.address_line1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!selectedPropertyId ? (
          <div className="text-center py-8 text-slate-500">Select a property to start the chat.</div>
        ) : loading ? (
          <div className="text-center py-8 text-slate-500"><Loader2 className="inline-block h-5 w-5 animate-spin mr-2"/>Loading messages...</div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Chat for</div>
              <div className="font-semibold text-slate-900">{activeProperty?.address_line1 || 'Selected property'}</div>
              {activeProperty?.postcode ? <div className="text-xs text-slate-500">{activeProperty.postcode}</div> : null}
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto px-2 pb-2">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No messages yet for this property.</div>
              ) : messages.map((message) => {
                const isMine = message.sender?.id === profile?.id;
                return (
                  <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 ${isMine ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-900'}`}>
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">{isMine ? 'You' : message.sender?.name || message.sender?.email || 'Partner'}</div>
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      <div className="mt-2 text-[11px] text-slate-500 text-right">{new Date(message.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-3">
              <Textarea rows={3} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message here..." />
              <div className="flex justify-end">
                <Button onClick={sendMessage} disabled={sending} className="bg-brand-500 hover:bg-brand-600 text-white">
                  {sending ? 'Sending...' : 'Send message'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Dashboard({ user, profile, onSignOut, loc, updateLoc }) {
  const lang = loc?.language || 'en';
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState({ properties: 0, tenancies: 0, openIssues: 0, expiringCompliance: 0 });
  const [planInfo, setPlanInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copilotOpen, setCopilotOpen] = useState(false);

  const loadPlanInfo = useCallback(async () => {
    try {
      const plan = await api('user/plan');
      setPlanInfo(plan);
    } catch (e) {
      console.error('Failed to load plan info', e);
    }
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [pr, iss, comp] = await Promise.all([
        api('properties').catch(() => ({ properties: [] })),
        api('issues').catch(() => ({ issues: [] })),
        api('compliance').catch(() => ({ compliance: [] })),
      ]);
      setProperties(pr.properties || []);
      let totalTen = 0;
      for (const p of pr.properties || []) {
        try { const r = await api(`properties/${p.id}`); totalTen += (r.tenancies || []).length; } catch {}
      }
      const openIssues = (iss.issues || []).filter(i => i.status !== 'closed').length;
      const expiring = (comp.compliance || []).filter(c => {
        if (!c.expiry_date) return false;
        const d = Math.ceil((new Date(c.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        return d < 60;
      }).length;
      setStats({ properties: (pr.properties || []).length, tenancies: totalTen, openIssues, expiringCompliance: expiring });
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);
  useEffect(() => { loadAll(); loadPlanInfo(); }, [loadAll, loadPlanInfo]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Link href="/" aria-label="Home">
              <img src="/logo.png" alt="HomeProof" className="h-24 w-auto scale-150 origin-left"/>
            </Link>
            <Badge variant="outline" className="ml-2 capitalize">{profile?.role === 'landlord' ? t('landlord', lang) : t('tenant', lang)}</Badge>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 hidden sm:inline">{user.email}</span>
            <SettingsDialog loc={loc} onUpdate={updateLoc}/>
            <ThemeToggle/>
            <Button variant="outline" size="sm" onClick={onSignOut}><LogOut className="h-4 w-4 mr-1"/>{t('signOut', lang)}</Button>
          </div>
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle/>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon"><Menu className="h-5 w-5"/></Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-4 mt-8">
                  <div className="text-sm text-slate-700 dark:text-slate-300 truncate">{user.email}</div>
                  <Badge variant="outline" className="w-fit capitalize">{profile?.role}</Badge>
                  <div className="border-t pt-4 space-y-3">
                    <SettingsDialog loc={loc} onUpdate={updateLoc}/>
                    <Button variant="outline" className="w-full" onClick={onSignOut}><LogOut className="h-4 w-4 mr-1"/>{t('signOut', lang)}</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('welcome', lang)}, {profile?.name || user.email.split('@')[0]}</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{t('dashboardSubtitle', lang)}</p>
          </div>
          {planInfo && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 py-3 shadow-sm text-sm text-slate-700 dark:text-slate-200">
              <div className="font-semibold text-slate-900 dark:text-slate-100">Plan: {planInfo.plan}</div>
              <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2 text-xs text-slate-600 dark:text-slate-400">
                <div>Properties: {properties.length}/{planInfo.max_properties ?? '∞'}</div>
                <div>AI runs: {planInfo.ai_runs_used_this_month}/{planInfo.max_ai_runs_per_month ?? '∞'} this month</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Building2} label={t('properties', lang)} value={stats.properties} color="bg-blue-100 text-brand-600"/>
          <StatCard icon={Home} label={t('activeTenancies', lang)} value={stats.tenancies} color="bg-indigo-100 text-indigo-600"/>
          <StatCard icon={Wrench} label={t('openIssues', lang)} value={stats.openIssues} color="bg-emerald-100 text-emerald-600"/>
          <StatCard icon={ShieldCheck} label={t('expiringIn60', lang)} value={stats.expiringCompliance} color="bg-rose-100 text-rose-600"/>
        </div>

        <Tabs defaultValue="properties">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="properties"><Home className="h-4 w-4 mr-2"/>{t('properties', lang)}</TabsTrigger>
            <TabsTrigger value="profile"><Mail className="h-4 w-4 mr-2"/>Profile</TabsTrigger>
            <TabsTrigger value="documents"><FileText className="h-4 w-4 mr-2"/>Documents</TabsTrigger>
            <TabsTrigger value="maintenance"><Wrench className="h-4 w-4 mr-2"/>Maintenance</TabsTrigger>
            <TabsTrigger value="receipts"><CheckCircle2 className="h-4 w-4 mr-2"/>Receipts</TabsTrigger>
            <TabsTrigger value="inventory"><Camera className="h-4 w-4 mr-2"/>{t('aiInventory', lang)}</TabsTrigger>
            <TabsTrigger value="contract"><FileText className="h-4 w-4 mr-2"/>{t('aiContract', lang)}</TabsTrigger>
            <TabsTrigger value="damage"><ScanSearch className="h-4 w-4 mr-2"/>{t('aiDamage', lang)}</TabsTrigger>
            <TabsTrigger value="rent"><TrendingUp className="h-4 w-4 mr-2"/>{t('aiRent', lang)}</TabsTrigger>
            <TabsTrigger value="copilot"><Bot className="h-4 w-4 mr-2"/>{t('aiCopilot', lang)}</TabsTrigger>
            <TabsTrigger value="disputes"><Sparkles className="h-4 w-4 mr-2"/>Disputes</TabsTrigger>
            <TabsTrigger value="applications"><FileText className="h-4 w-4 mr-2"/>Applications</TabsTrigger>
            <TabsTrigger value="links"><ScanSearch className="h-4 w-4 mr-2"/>Saved links</TabsTrigger>
            <TabsTrigger value="payments"><Calendar className="h-4 w-4 mr-2"/>Payments</TabsTrigger>
            <TabsTrigger value="chat"><MessageSquare className="h-4 w-4 mr-2"/>Chat</TabsTrigger>
            <TabsTrigger value="issues"><Wrench className="h-4 w-4 mr-2"/>{t('issues', lang)}</TabsTrigger>
            {profile?.role === 'landlord' && <TabsTrigger value="compliance"><ShieldCheck className="h-4 w-4 mr-2"/>{t('compliance', lang)}</TabsTrigger>}
          </TabsList>

          <TabsContent value="properties">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t('properties', lang)}</h2>
              {profile?.role === 'landlord' && <PropertyCreateDialog onCreated={loadAll} planInfo={planInfo} currentCount={properties.length}/>}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-500"><Loader2 className="h-5 w-5 animate-spin mr-2"/>Loading...</div>
            ) : properties.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-slate-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-300"/>
                <p>{profile?.role === 'landlord' ? 'No properties yet. Add your first one above.' : 'You have no tenancies yet. Ask your landlord to add you.'}</p>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map(p => <PropertyCard key={p.id} property={p} onChanged={loadAll} loc={loc}/>)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inventory"><AIInventoryTool properties={properties} loc={loc}/></TabsContent>
          <TabsContent value="contract"><AIContractTool properties={properties}/></TabsContent>
          <TabsContent value="damage"><AIDamageDetector properties={properties} loc={loc}/></TabsContent>
          <TabsContent value="rent"><AIRentEstimator properties={properties} loc={loc} api={api}/></TabsContent>
          <TabsContent value="copilot"><AICoPilot loc={loc} api={api}/></TabsContent>
          <TabsContent value="disputes"><AIDisputeBuilder properties={properties} loc={loc} api={api}/></TabsContent>
          <TabsContent value="applications"><ApplicationsTab api={api} profile={profile} properties={properties} /></TabsContent>
          <TabsContent value="links"><PropertyLinksTab api={api} properties={properties} /></TabsContent>
          <TabsContent value="payments"><PaymentsTab api={api} profile={profile} properties={properties} /></TabsContent>
          <TabsContent value="receipts"><ReceiptsTab api={api} profile={profile} /></TabsContent>
          <TabsContent value="chat"><ChatTab api={api} profile={profile} properties={properties} /></TabsContent>
          <TabsContent value="documents"><DocumentsTab api={api} profile={profile} properties={properties} /></TabsContent>
          <TabsContent value="maintenance"><MaintenanceTab api={api} profile={profile} properties={properties} /></TabsContent>
          <TabsContent value="receipts"><ReceiptsTab api={api} profile={profile} /></TabsContent>
          <TabsContent value="profile"><ProfileTab api={api} profile={profile} /></TabsContent>
          <TabsContent value="issues"><IssuesTab properties={properties} profile={profile}/></TabsContent>
          {profile?.role === 'landlord' && <TabsContent value="compliance"><ComplianceTab properties={properties}/></TabsContent>}
        </Tabs>
      </div>
      <div className="fixed right-6 bottom-6 z-50 flex flex-col items-end">
        <Button onClick={() => setCopilotOpen((open) => !open)} className="rounded-full bg-violet-600 p-4 shadow-2xl shadow-violet-500/20 text-white hover:bg-violet-700">
          <Bot className="h-5 w-5"/>
          <span className="sr-only">Toggle AI assistant</span>
        </Button>
      </div>
      {copilotOpen ? (
        <div className="fixed right-6 bottom-24 z-50 w-[380px] h-[620px] rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Bot className="h-4 w-4 text-violet-600"/> AI assistant
            </div>
            <Button variant="ghost" size="icon" onClick={() => setCopilotOpen(false)}><X className="h-4 w-4"/></Button>
          </div>
          <div className="h-[calc(100%-52px)] overflow-hidden">
            <AICoPilot loc={loc} api={api}/>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DocumentsTab({ api, profile, properties }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    document_type: 'id_card',
    property_id: '',
    tenancy_id: '',
    description: '',
    raw_text: '',
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api('documents');
      setDocuments(result.documents || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  async function uploadDocument() {
    if (!form.name || !file) {
      toast.error('Name and file are required.');
      return;
    }
    setSaving(true);
    try {
      const uploaded = await uploadToBucket('documents', file);
      await api('documents', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          file_url: uploaded.url,
          file_path: uploaded.path,
        }),
      });
      toast.success('Document uploaded successfully');
      setFile(null);
      setForm({ name: '', document_type: 'id_card', property_id: '', tenancy_id: '', description: '', raw_text: '' });
      setMetadata(null);
      loadDocuments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function extractMetadata() {
    if (!form.raw_text.trim()) {
      toast.error('Paste text or document content to extract metadata.');
      return;
    }
    setSaving(true);
    try {
      const result = await api('documents/extract', {
        method: 'POST',
        body: JSON.stringify({ document_type: form.document_type, raw_text: form.raw_text }),
      });
      setMetadata(result.metadata || {});
      toast.success('Metadata extracted');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document vault</CardTitle>
        <CardDescription>Store tenancy documents, ID, proof of income and certificates in one place.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Passport, Payslip" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.document_type} onValueChange={(value) => setForm({ ...form, document_type: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="id_card">ID document</SelectItem>
                <SelectItem value="income_proof">Income proof</SelectItem>
                <SelectItem value="tenancy_agreement">Tenancy agreement</SelectItem>
                <SelectItem value="certificate">Certificate</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Label>Property</Label>
            <Select value={form.property_id} onValueChange={(value) => setForm({ ...form, property_id: value })}>
              <SelectTrigger><SelectValue placeholder="Optional property" /></SelectTrigger>
              <SelectContent>
                {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.address_line1}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tenancy ID</Label>
            <Input value={form.tenancy_id} onChange={(e) => setForm({ ...form, tenancy_id: e.target.value })} placeholder="Optional tenancy ID" />
          </div>
        </div>
        <div>
          <Label>File</Label>
          <Input type="file" accept="application/pdf,image/*,text/plain" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div>
          <Label>Description or pasted text</Label>
          <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes about the document" />
        </div>
        <div>
          <Label>Raw text for AI extraction</Label>
          <Textarea rows={3} value={form.raw_text} onChange={(e) => setForm({ ...form, raw_text: e.target.value })} placeholder="Paste receipt content, ID text or income proof text" />
          <Button onClick={extractMetadata} disabled={saving} className="mt-3 bg-brand-500 hover:bg-brand-600 text-white">Extract metadata</Button>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button onClick={uploadDocument} disabled={saving} className="bg-brand-500 hover:bg-brand-600 text-white">{saving ? 'Saving…' : 'Upload document'}</Button>
        </div>
        {metadata && (
          <div className="rounded-lg border bg-slate-50 p-4">
            <h3 className="font-semibold mb-2">AI metadata</h3>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{JSON.stringify(metadata, null, 2)}</pre>
          </div>
        )}
        {loading ? (
          <div className="text-center py-8 text-slate-500"><Loader2 className="inline-block h-5 w-5 animate-spin mr-2"/>Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No documents uploaded yet.</div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="border-slate-200">
                <CardContent>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{doc.name}</div>
                      <div className="text-xs text-slate-500">{doc.document_type || 'Document'}</div>
                    </div>
                    <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-sm text-brand-600 hover:underline">Download</a>
                  </div>
                  {doc.description ? <div className="mt-2 text-sm text-slate-600">{doc.description}</div> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MaintenanceTab({ api, profile, properties }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ property_id: '', tenancy_id: '', title: '', description: '', photos: [] });

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api('maintenance');
      setRequests(result.maintenance_requests || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  async function createRequest() {
    if (!form.property_id || !form.title) {
      toast.error('Property and title are required.');
      return;
    }
    setSaving(true);
    try {
      const photo_urls = [];
      for (const file of form.photos) {
        const uploaded = await uploadToBucket('maintenance', file);
        photo_urls.push(uploaded.url);
      }
      await api('maintenance', {
        method: 'POST',
        body: JSON.stringify({
          property_id: form.property_id,
          tenancy_id: form.tenancy_id || null,
          title: form.title,
          description: form.description || null,
          photo_urls,
        }),
      });
      toast.success('Maintenance request created');
      setForm({ property_id: '', tenancy_id: '', title: '', description: '', photos: [] });
      loadRequests();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function resolveRequest(id) {
    try {
      await api(`maintenance/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'resolved' }) });
      toast.success('Request resolved');
      loadRequests();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance requests</CardTitle>
        <CardDescription>Track repairs, attach photos, and resolve issues with your landlord or tenant.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Label>Property</Label>
            <Select value={form.property_id} onValueChange={(value) => setForm({ ...form, property_id: value })}>
              <SelectTrigger><SelectValue placeholder="Select a property" /></SelectTrigger>
              <SelectContent>
                {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.address_line1}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tenancy ID</Label>
            <Input value={form.tenancy_id} onChange={(e) => setForm({ ...form, tenancy_id: e.target.value })} placeholder="Optional tenancy ID" />
          </div>
        </div>
        <div>
          <Label>Issue title</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Leaking sink, broken window, etc." />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the problem and urgency." />
        </div>
        <div>
          <Label>Photos</Label>
          <Input type="file" accept="image/*" multiple onChange={(e) => setForm({ ...form, photos: Array.from(e.target.files || []) })} />
          {form.photos.length > 0 && <p className="text-xs text-slate-500 mt-1">{form.photos.length} photo(s) selected</p>}
        </div>
        <Button onClick={createRequest} disabled={saving} className="bg-brand-500 hover:bg-brand-600 text-white">{saving ? 'Saving…' : 'Submit request'}</Button>

        {loading ? (
          <div className="text-center py-8 text-slate-500"><Loader2 className="inline-block h-5 w-5 animate-spin mr-2"/>Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No maintenance requests yet.</div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <Card key={request.id} className="border-slate-200">
                <CardContent>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900">{request.title}</div>
                      <div className="text-xs text-slate-500">{request.status}</div>
                    </div>
                    {profile?.role === 'landlord' && request.status !== 'resolved' ? (
                      <Button size="sm" onClick={() => resolveRequest(request.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white">Resolve</Button>
                    ) : null}
                  </div>
                  {request.description ? <div className="mt-2 text-sm text-slate-600">{request.description}</div> : null}
                  {Array.isArray(request.photo_urls) && request.photo_urls.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {request.photo_urls.map((url, index) => <img key={index} src={url} className="h-24 w-full object-cover rounded" alt="Maintenance" />)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReceiptsTab({ api, profile }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api('receipts');
      setReceipts(result.receipts || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { loadReceipts(); }, [loadReceipts]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipts</CardTitle>
        <CardDescription>Download official payment receipts and keep tenancy accounts up to date.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-slate-500"><Loader2 className="inline-block h-5 w-5 animate-spin mr-2"/>Loading receipts...</div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No receipts have been generated yet.</div>
        ) : (
          <div className="space-y-3">
            {receipts.map((receipt) => (
              <Card key={receipt.id} className="border-slate-200">
                <CardContent>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900">Receipt {receipt.id.slice(0, 8)}</div>
                      <div className="text-xs text-slate-500">Amount: £{receipt.amount} · Date: {receipt.date}</div>
                    </div>
                    {receipt.pdf_url ? (
                      <a href={receipt.pdf_url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">Download PDF</a>
                    ) : (
                      <span className="text-xs text-slate-400">PDF pending</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProfileTab({ api, profile }) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    country: profile?.country || 'UK',
    job_title: profile?.job_title || '',
    income_range: profile?.income_range || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      country: profile?.country || 'UK',
      job_title: profile?.job_title || '',
      income_range: profile?.income_range || '',
    });
  }, [profile]);

  async function saveProfile() {
    setSaving(true);
    try {
      const { profile: updated } = await api('me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          country: form.country,
          job_title: form.job_title,
          income_range: form.income_range,
        }),
      });
      setForm({ ...form, ...updated });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal profile</CardTitle>
        <CardDescription>Keep your tenant or landlord profile up to date and save application details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email} disabled />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>Country</Label>
            <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Label>Job title</Label>
            <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="e.g. Software engineer" />
          </div>
          <div>
            <Label>Income range</Label>
            <Input value={form.income_range} onChange={(e) => setForm({ ...form, income_range: e.target.value })} placeholder="e.g. £40k-£50k" />
          </div>
        </div>
        <Button onClick={saveProfile} disabled={saving} className="bg-brand-500 hover:bg-brand-600 text-white">{saving ? 'Saving…' : 'Save profile'}</Button>
      </CardContent>
    </Card>
  );
}

function App() {
  const [view, setView] = useState('loading');
  const [authMode, setAuthMode] = useState('signup');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const { loc, update: updateLoc } = useLocaleState();

  const loadProfile = useCallback(async () => {
    try {
      const { user: u, profile: p } = await api('me');
      setUser(u); setProfile(p);
      setView('dashboard');
    } catch (e) {
      console.error('me error', e);
      setView('landing');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadProfile();
      else setView('landing');
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) loadProfile();
      else { setUser(null); setProfile(null); setView('landing'); }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  async function signOut() { await supabase.auth.signOut(); }

  if (view === 'loading') return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-600"/></div>;
  if (view === 'landing') return <Landing loc={loc} updateLoc={updateLoc} onGetStarted={()=>{setAuthMode('signup'); setView('auth');}} onSignIn={()=>{setAuthMode('login'); setView('auth');}}/>;
  if (view === 'auth') return <AuthPage loc={loc} mode={authMode} setMode={setAuthMode} onSuccess={loadProfile} onBack={()=>setView('landing')}/>;
  if (view === 'dashboard' && user) return <Dashboard loc={loc} updateLoc={updateLoc} user={user} profile={profile} onSignOut={signOut}/>;
  return null;
}

export default App;
