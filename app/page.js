'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Building2, Sparkles, FileText, Camera, Wrench, ShieldCheck, LogOut, Plus, Loader2, ArrowRight, CheckCircle2, AlertTriangle, ScanSearch, Home, ChevronLeft, Upload, Send, Trash2, Calendar, Mail, TrendingUp, Bot, Menu } from 'lucide-react';
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

function Landing({ onGetStarted, loc, updateLoc }) {
  const lang = loc.language;
  const plan = useUserPlan();
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="HomeProof" className="h-24 w-auto scale-150 origin-left"/>
          </div>
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700 dark:text-slate-300">
            <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
            <a href="#how" className="hover:text-brand-600 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-brand-600 transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-brand-600 transition-colors">Reviews</a>
            <a href="#about" className="hover:text-brand-600 transition-colors">About</a>
            <a href="#faq" className="hover:text-brand-600 transition-colors">FAQ</a>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <SettingsDialog loc={loc} onUpdate={updateLoc}/>
            <ThemeToggle/>
            <Button onClick={onGetStarted} className="bg-brand-500 hover:bg-brand-600 text-white">{t('getStarted', lang)} <ArrowRight className="ml-2 h-4 w-4"/></Button>
          </div>
          {/* Mobile menu */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle/>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon"><Menu className="h-5 w-5"/></Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-5 mt-8">
                  <img src="/logo.png" alt="HomeProof" className="h-20 w-auto scale-150 origin-left mb-2"/>
                  <a href="#features" className="text-base font-medium text-slate-800 dark:text-slate-200 hover:text-brand-600">Features</a>
                  <a href="#how" className="text-base font-medium text-slate-800 dark:text-slate-200 hover:text-brand-600">How it works</a>
                  <a href="#pricing" className="text-base font-medium text-slate-800 dark:text-slate-200 hover:text-brand-600">Pricing</a>
                  <a href="#testimonials" className="text-base font-medium text-slate-800 dark:text-slate-200 hover:text-brand-600">Reviews</a>
                  <a href="#about" className="text-base font-medium text-slate-800 dark:text-slate-200 hover:text-brand-600">About</a>
                  <a href="#faq" className="text-base font-medium text-slate-800 dark:text-slate-200 hover:text-brand-600">FAQ</a>
                  <div className="border-t pt-4 space-y-3">
                    <SettingsDialog loc={loc} onUpdate={updateLoc}/>
                    <Button onClick={onGetStarted} className="w-full bg-brand-500 hover:bg-brand-600 text-white">{t('getStarted', lang)} <ArrowRight className="ml-2 h-4 w-4"/></Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-5 bg-blue-100 text-brand-700 hover:bg-brand-100 dark:bg-brand-900 dark:text-brand-300">{t('appTagline', lang)}</Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              {t('landingHeroBefore', lang)} <span className="text-brand-600">{t('landingHeroAfter', lang)}</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-xl">{t('landingSubtitle', lang)}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button onClick={onGetStarted} size="lg" className="bg-brand-500 hover:bg-brand-600">{t('startFree', lang)} <ArrowRight className="ml-2 h-4 w-4"/></Button>
              <Button onClick={onGetStarted} variant="outline" size="lg">{t('signIn', lang)}</Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6">
              {[{n:'30s', l:t('aiInventory', lang)},{n:'1-click', l:t('aiContract', lang)},{n:'24/7', l:t('aiCopilot', lang)}].map((s,i)=>(
                <div key={i}><div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.n}</div><div className="text-sm text-slate-500">{s.l}</div></div>
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
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">Simple plans. No surprises.</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Start free. Upgrade only when your portfolio grows.</p>
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
                            body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO })
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

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} HomeProof · {t('appTagline', lang)}</div>
      </footer>
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
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
        onSuccess();
      }
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-brand-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="mb-6 inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900"><ChevronLeft className="h-4 w-4 mr-1"/>Back</button>
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <img src="/logo.png" alt="HomeProof" className="h-24 w-auto scale-150 origin-left"/>
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
              </div>
              <div>
                <Label htmlFor="password">{t('password', lang)}</Label>
                <Input id="password" type="password" minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)} required/>
              </div>
              <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : (mode === 'signup' ? t('signUp', lang) : t('signIn', lang))}
              </Button>
            </form>
            <p className="mt-4 text-sm text-center text-slate-600 dark:text-slate-400">
              {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button onClick={()=>setMode(mode==='signup'?'login':'signup')} className="text-brand-600 hover:underline font-medium">
                {mode === 'signup' ? t('signIn', lang) : t('signUp', lang)}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PropertyCreateDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ address_line1: '', address_line2: '', city: '', postcode: '', country: 'UK' });
  const [loading, setLoading] = useState(false);

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
        <Button className="bg-brand-500 hover:bg-brand-600"><Plus className="h-4 w-4 mr-2"/>Add property</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a property</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Address line 1</Label><Input value={form.address_line1} onChange={(e)=>setForm({...form,address_line1:e.target.value})}/></div>
          <div><Label>Address line 2</Label><Input value={form.address_line2} onChange={(e)=>setForm({...form,address_line2:e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>City</Label><Input value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})}/></div>
            <div><Label>Postcode</Label><Input value={form.postcode} onChange={(e)=>setForm({...form,postcode:e.target.value})}/></div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={loading || !form.address_line1} className="bg-brand-500 hover:bg-brand-600">{loading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Add property'}</Button>
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
      <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-3 w-3 mr-1"/>Add tenancy</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New tenancy</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Tenant email</Label><Input value={form.tenant_email} onChange={(e)=>setForm({...form,tenant_email:e.target.value})}/></div>
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

function Dashboard({ user, profile, onSignOut, loc, updateLoc }) {
  const lang = loc?.language || 'en';
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState({ properties: 0, tenancies: 0, openIssues: 0, expiringCompliance: 0 });
  const [loading, setLoading] = useState(true);

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
  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="HomeProof" className="h-24 w-auto scale-150 origin-left"/>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('welcome', lang)}, {profile?.name || user.email.split('@')[0]}</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{t('dashboardSubtitle', lang)}</p>
          </div>
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
            <TabsTrigger value="inventory"><Camera className="h-4 w-4 mr-2"/>{t('aiInventory', lang)}</TabsTrigger>
            <TabsTrigger value="contract"><FileText className="h-4 w-4 mr-2"/>{t('aiContract', lang)}</TabsTrigger>
            <TabsTrigger value="damage"><ScanSearch className="h-4 w-4 mr-2"/>{t('aiDamage', lang)}</TabsTrigger>
            <TabsTrigger value="rent"><TrendingUp className="h-4 w-4 mr-2"/>{t('aiRent', lang)}</TabsTrigger>
            <TabsTrigger value="copilot"><Bot className="h-4 w-4 mr-2"/>{t('aiCopilot', lang)}</TabsTrigger>
            <TabsTrigger value="disputes"><Sparkles className="h-4 w-4 mr-2"/>Disputes</TabsTrigger>
            <TabsTrigger value="issues"><Wrench className="h-4 w-4 mr-2"/>{t('issues', lang)}</TabsTrigger>
            {profile?.role === 'landlord' && <TabsTrigger value="compliance"><ShieldCheck className="h-4 w-4 mr-2"/>{t('compliance', lang)}</TabsTrigger>}
          </TabsList>

          <TabsContent value="properties">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t('properties', lang)}</h2>
              {profile?.role === 'landlord' && <PropertyCreateDialog onCreated={loadAll}/>}
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
          <TabsContent value="issues"><IssuesTab properties={properties} profile={profile}/></TabsContent>
          {profile?.role === 'landlord' && <TabsContent value="compliance"><ComplianceTab properties={properties}/></TabsContent>}
        </Tabs>
      </div>
    </div>
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
  if (view === 'landing') return <Landing loc={loc} updateLoc={updateLoc} onGetStarted={()=>{setAuthMode('signup'); setView('auth');}}/>;
  if (view === 'auth') return <AuthPage loc={loc} mode={authMode} setMode={setAuthMode} onSuccess={loadProfile} onBack={()=>setView('landing')}/>;
  if (view === 'dashboard' && user) return <Dashboard loc={loc} updateLoc={updateLoc} user={user} profile={profile} onSignOut={signOut}/>;
  return null;
}

export default App;
