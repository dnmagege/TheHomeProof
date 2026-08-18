'use client';

import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

const supabase = getSupabaseClient();

export default function UpgradePage() {
  async function handleCheckout(priceId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to upgrade your plan.');
        return;
      }
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ price_id: priceId }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error('Checkout session failed to start');
      }
    } catch (error) {
      toast.error(error.message || 'Unable to start checkout');
    }
  }

  const pricingPlans = [
    {
      name: 'Free',
      price: '£0',
      period: 'forever',
      features: ['1 property', '10 AI runs / month', 'All AI tools', 'Multi-language UI', 'Community support'],
      ctaText: 'Start free',
      action: 'home',
    },
    {
      name: 'Pro',
      price: '£19',
      period: '/ month',
      features: ['Up to 10 properties', '200 AI runs / month', 'PDF inventory exports', 'AI Dispute Evidence Builder', 'Email tenants', 'Priority support'],
      ctaText: 'Upgrade to Pro',
      action: 'pro',
    },
    {
      name: 'Business',
      price: '£49',
      period: '/ month',
      features: ['Advanced property management', 'Custom reporting', 'Audit logs export', 'Custom compliance workflows', 'API access', 'Priority support'],
      ctaText: 'Contact sales',
      action: 'sales',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Badge className="mb-3 bg-brand-100 text-brand-700">Pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100">Choose a plan to unlock more properties.</h1>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Select the plan that fits your portfolio, then complete checkout to upgrade instantly.</p>
          <p className="mt-4 text-sm text-slate-500">If you already have an account, make sure you're signed in before checking out.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingPlans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.name === 'Pro' ? 'border-brand-500 border-2 shadow-2xl md:scale-105' : 'border-slate-200 dark:border-slate-800'}`}>
              {plan.name === 'Pro' && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2"><span className="text-4xl font-black text-slate-900 dark:text-slate-100">{plan.price}</span><span className="text-slate-500 text-sm ml-1">{plan.period}</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-brand-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.action === 'pro' ? (
                  <Button type="button" className="w-full bg-brand-500 hover:bg-brand-600 text-white" onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO)}>
                    {plan.ctaText}
                  </Button>
                ) : plan.action === 'sales' ? (
                  <Button type="button" variant="outline" className="w-full" onClick={() => { window.location.href = 'mailto:thehomeproof@outlook.com?subject=Business%20Plan%20Enquiry'; }}>
                    {plan.ctaText}
                  </Button>
                ) : (
                  <Link href="/" className="block w-full">
                    <Button type="button" variant="outline" className="w-full">{plan.ctaText}</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
