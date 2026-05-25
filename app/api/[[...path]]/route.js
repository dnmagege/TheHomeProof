import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import OpenAI from 'openai';
import Stripe from 'stripe';

export const runtime = 'nodejs';
export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' }) : null;
const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@thehomeproof.co.uk';

async function sendEmailWithResend({ to, from, replyTo, subject, text, html }) {
  if (!resendApiKey) throw new Error('Resend API key not configured');
  const payload = {
    from,
    to,
    subject,
    text,
    html,
  };
  if (replyTo) payload.reply_to = replyTo;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Resend API error: ${res.status} ${errorBody}`);
  }
  return res.json();
}

function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function getPlanFromPriceId(priceId) {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY || priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_BUSINESS_MONTHLY || priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS) return 'business';
  if (priceId === process.env.STRIPE_PRICE_FREE) return 'free';
  return null;
}

async function ensureStripeCustomer(admin, user) {
  const { data: existing } = await admin.from('user_subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
  if (existing?.stripe_customer_id) return existing.stripe_customer_id;
  if (!stripe) throw new Error('Stripe not configured');
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { supabase_user_id: user.id },
  });
  await admin.from('user_subscriptions').upsert({
    user_id: user.id,
    stripe_customer_id: customer.id,
    plan_id: 'free',
    status: 'active',
  }, { onConflict: 'user_id' });
  return customer.id;
}

async function syncStripeSubscription(admin, subscription) {
  if (!subscription) return null;
  const customerId = subscription.customer;
  const stripeSubId = subscription.id;
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const planId = getPlanFromPriceId(priceId) || 'free';
  const status = subscription.status || 'active';
  const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;
  const cancelAtPeriodEnd = !!subscription.cancel_at_period_end;
  const userIdFromMetadata = subscription.metadata?.supabase_user_id;

  let userId = null;
  if (customerId) {
    const { data: byCustomer } = await admin.from('user_subscriptions').select('user_id').eq('stripe_customer_id', customerId).maybeSingle();
    userId = byCustomer?.user_id;
  }
  if (!userId && stripeSubId) {
    const { data: bySub } = await admin.from('user_subscriptions').select('user_id').eq('stripe_subscription_id', stripeSubId).maybeSingle();
    userId = bySub?.user_id;
  }
  if (!userId && userIdFromMetadata) {
    userId = userIdFromMetadata;
  }

  if (!userId) {
    console.warn('Stripe subscription sync skipped: no matching user found', { stripeSubId, customerId });
    return null;
  }

  await admin.from('user_subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: stripeSubId,
    plan_id: planId,
    status,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: cancelAtPeriodEnd,
  }, { onConflict: 'user_id' });

  return userId;
}

async function resolveBillingAccount(admin, user, profile) {
  if (profile?.role === 'tenant') {
    const { data: tenancy, error } = await admin
      .from('tenancies')
      .select('landlord_id')
      .eq('tenant_id', user.id)
      .limit(1)
      .maybeSingle();
    if (!error && tenancy?.landlord_id) {
      return tenancy.landlord_id;
    }
  }
  return user.id;
}

const FREE_PLAN_INFO = {
  id: 'free',
  name: 'Free',
  max_properties: 1,
  max_ai_runs_per_month: 10,
};

function hasMonthChanged(lastResetAt) {
  if (!lastResetAt) return true;
  const reset = new Date(lastResetAt);
  const now = new Date();
  return reset.getUTCFullYear() !== now.getUTCFullYear() || reset.getUTCMonth() !== now.getUTCMonth();
}

async function getUserSubscriptionDetails(admin, userId) {
  const { data: sub, error: subError } = await admin.from('user_subscriptions').select('*').eq('user_id', userId).maybeSingle();
  if (subError) throw new Error(subError.message || 'Failed to load subscription');

  if (!sub) {
    const now = new Date().toISOString();
    const { error: insertError } = await admin.from('user_subscriptions').insert({
      user_id: userId,
      plan_id: 'free',
      status: 'active',
      ai_runs_used_this_month: 0,
      ai_runs_reset_at: now,
    });
    if (insertError) throw new Error(insertError.message || 'Failed to initialize subscription');
    return { ...FREE_PLAN_INFO, plan_id: 'free', status: 'active', ai_runs_used_this_month: 0, ai_runs_reset_at: now };
  }

  const planId = sub.plan_id || 'free';
  const { data: plan, error: planError } = await admin.from('subscription_plans').select('*').eq('id', planId).maybeSingle();
  if (planError) throw new Error(planError.message || 'Failed to load plan');

  const normalizedPlan = plan || FREE_PLAN_INFO;
  let usage = sub.ai_runs_used_this_month || 0;
  let resetAt = sub.ai_runs_reset_at || new Date().toISOString();

  if (hasMonthChanged(resetAt)) {
    const now = new Date().toISOString();
    const { error: resetError } = await admin.from('user_subscriptions').update({ ai_runs_used_this_month: 0, ai_runs_reset_at: now }).eq('user_id', userId);
    if (resetError) throw new Error(resetError.message || 'Failed to reset AI usage');
    usage = 0;
    resetAt = now;
  }

  return {
    plan: normalizedPlan,
    plan_id: planId,
    status: sub.status || 'active',
    stripe_customer_id: sub.stripe_customer_id,
    stripe_subscription_id: sub.stripe_subscription_id,
    current_period_end: sub.current_period_end,
    cancel_at_period_end: sub.cancel_at_period_end,
    ai_runs_used_this_month: usage,
    ai_runs_reset_at: resetAt,
  };
}

async function ensurePropertyCreationAllowed(admin, userId) {
  const subDetails = await getUserSubscriptionDetails(admin, userId);
  const maxProperties = subDetails.plan.max_properties;
  if (typeof maxProperties === 'number') {
    const { count, error: countError } = await admin.from('properties').select('id', { count: 'exact', head: true }).eq('landlord_id', userId);
    if (countError) throw new Error(countError.message || 'Failed to count properties');
    if (typeof count === 'number' && count >= maxProperties) {
      throw new Error(`Plan limit reached: ${maxProperties} properties. Upgrade your plan to add more.`);
    }
  }
}

async function chargeAiRun(admin, user, profile, amount = 1) {
  const billingUserId = await resolveBillingAccount(admin, user, profile);
  const subDetails = await getUserSubscriptionDetails(admin, billingUserId);
  const maxRuns = subDetails.plan.max_ai_runs_per_month;
  if (typeof maxRuns === 'number') {
    if (subDetails.ai_runs_used_this_month + amount > maxRuns) {
      throw new Error(`AI usage limit exceeded. ${maxRuns} runs per month allowed on this plan.`);
    }
  }

  const updatedUsage = (subDetails.ai_runs_used_this_month || 0) + amount;
  const { error } = await admin.from('user_subscriptions').update({ ai_runs_used_this_month: updatedUsage }).eq('user_id', billingUserId);
  if (error) throw new Error(error.message || 'Failed to update AI usage');
}

async function ensureAiRunAllowed(admin, user, profile) {
  const billingUserId = await resolveBillingAccount(admin, user, profile);
  await getUserSubscriptionDetails(admin, billingUserId);
}

// ---------------- RATE LIMITER (in-memory sliding window) ----------------
const RATE_BUCKETS = new Map();
function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const arr = (RATE_BUCKETS.get(key) || []).filter(t => now - t < windowMs);
  if (arr.length >= limit) return { allowed: false, retryAfter: Math.ceil((windowMs - (now - arr[0])) / 1000) };
  arr.push(now);
  RATE_BUCKETS.set(key, arr);
  // Periodic cleanup
  if (RATE_BUCKETS.size > 5000) {
    for (const [k, v] of RATE_BUCKETS) {
      const filtered = v.filter(t => now - t < windowMs);
      if (filtered.length === 0) RATE_BUCKETS.delete(k);
      else RATE_BUCKETS.set(k, filtered);
    }
  }
  return { allowed: true };
}

function getClientIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

function corsHeaders(res) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

function json(data, status = 200) {
  return corsHeaders(NextResponse.json(data, { status }));
}

export async function OPTIONS() {
  return corsHeaders(new NextResponse(null, { status: 200 }));
}

// ---------------- AI HELPERS ----------------

async function aiInventoryFromPhotos(photoUrls) {
  const content = [
    {
      type: 'text',
      text: `You are a professional UK property inventory clerk. Analyze the following property photos and produce a detailed JSON inventory.
Return STRICT JSON with this shape:
{
  "rooms": [
    {
      "name": "Living Room",
      "items": [
        {"item": "Sofa", "quantity": 1, "condition": "good", "notes": "Minor wear on left arm"}
      ],
      "walls_condition": "good",
      "floor_condition": "good",
      "overall_notes": "..."
    }
  ],
  "summary": "Overall property is in good condition..."
}
Conditions must be one of: "excellent", "good", "fair", "poor", "damaged".`,
    },
    ...photoUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
  ];

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content }],
    response_format: { type: 'json_object' },
    max_tokens: 3000,
  });
  return JSON.parse(resp.choices[0].message.content);
}

async function aiContractParse(rawText) {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a UK tenancy law expert. Extract structured info from tenancy agreements.',
      },
      {
        role: 'user',
        content: `Read the tenancy agreement below and return STRICT JSON:
{
  "tenant_rights": ["..."],
  "tenant_obligations": ["..."],
  "landlord_rights": ["..."],
  "landlord_obligations": ["..."],
  "notice_periods": {"tenant_to_landlord": "...", "landlord_to_tenant": "..."},
  "rent": {"amount": "...", "frequency": "...", "due_day": "..."},
  "deposit": {"amount": "...", "protection_scheme": "..."},
  "key_dates": [{"event": "...", "date": "..."}],
  "red_flags": ["unusual or potentially unfair clauses"],
  "plain_english_summary": "2-3 paragraph summary"
}

CONTRACT TEXT:
${rawText.slice(0, 30000)}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 3000,
  });
  return JSON.parse(resp.choices[0].message.content);
}

async function aiCompareInspection(beforeUrls, afterUrls) {
  const content = [
    {
      type: 'text',
      text: `You are a property inspector comparing BEFORE (move-in) and AFTER (move-out) photos.
Identify NEW damage, missing items, and changes in condition.
Return STRICT JSON:
{
  "damages": [
    {"location": "Kitchen wall", "type": "scratch", "severity": "minor|moderate|severe", "estimated_cost_gbp": 50, "evidence": "Photo description"}
  ],
  "missing_items": ["..."],
  "fair_wear_and_tear": ["..."],
  "overall_assessment": "...",
  "total_estimated_deduction_gbp": 0,
  "recommendation": "Suggested deposit deduction explanation"
}
The first ${beforeUrls.length} images are BEFORE; the rest are AFTER.`,
    },
    ...beforeUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
    ...afterUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
  ];

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content }],
    response_format: { type: 'json_object' },
    max_tokens: 2500,
  });
  return JSON.parse(resp.choices[0].message.content);
}

async function aiDraftIssueMessage(title, description, photoUrls = []) {
  const content = [
    {
      type: 'text',
      text: `You are helping a tenant draft a professional repair request email to their landlord.
Issue title: ${title}
Tenant description: ${description}

Return STRICT JSON:
{
  "classification": "plumbing|electrical|heating|structural|appliance|safety|other",
  "urgency": "emergency|high|medium|low",
  "subject": "Email subject line",
  "body": "Polite, clear email body (3-5 sentences) referencing tenancy rights where relevant",
  "suggested_response_window_days": 7
}`,
    },
    ...photoUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
  ];

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content }],
    response_format: { type: 'json_object' },
    max_tokens: 1200,
  });
  return JSON.parse(resp.choices[0].message.content);
}

// ---------------- ROUTER ----------------

async function handle(request, { params }) {
  const path = (params?.path || []).join('/');
  const method = request.method;
  const ip = getClientIp(request);

  // Per-IP global rate limit: 120 req / minute
  const globalRl = rateLimit(`ip:${ip}`, 120, 60_000);
  if (!globalRl.allowed) return json({ error: 'Too many requests', retry_after: globalRl.retryAfter }, 429);

  // Stricter limits for auth + AI
  if (path === 'auth/signup' && method === 'POST') {
    const r = rateLimit(`signup:${ip}`, 10, 3600_000);
    if (!r.allowed) return json({ error: 'Signup rate limit exceeded' }, 429);
  }
  if ((path.startsWith('inventories/generate') || path.startsWith('inspections/compare') || path.startsWith('contracts/') || path.startsWith('rent/') || path.startsWith('chat') || path.startsWith('disputes/build')) && method === 'POST') {
    const r = rateLimit(`ai:${ip}`, 30, 60_000);
    if (!r.allowed) return json({ error: 'AI rate limit: 30 per minute. Try again shortly.' }, 429);
  }

  try {
    // Public: Stripe webhook
    if (path === 'stripe/webhook' && method === 'POST') {
      if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return json({ error: 'Stripe webhook not configured' }, 500);
      const payload = await request.text();
      const signature = request.headers.get('stripe-signature') || '';
      let event;
      try {
        event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        return json({ error: 'Webhook signature verification failed: ' + (err.message || err) }, 400);
      }
      const admin = getSupabaseAdmin();
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription, { expand: ['items.data.price'] });
          await syncStripeSubscription(admin, subscription);
        }
      }
      if (event.type.startsWith('customer.subscription.')) {
        const subscription = event.data.object;
        await syncStripeSubscription(admin, subscription);
      }
      if (event.type === 'invoice.paid') {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription, { expand: ['items.data.price'] });
          await syncStripeSubscription(admin, subscription);
        }
      }
      return json({ received: true });
    }

    // Public: health check
    if (path === '' || path === 'root') {
      return json({ message: 'AI Tenancy Manager API ready', timestamp: new Date().toISOString() });
    }

    // Public: signup (auto-confirms email for smooth MVP UX)
    if (path === 'auth/signup' && method === 'POST') {
      const body = await request.json();
      const { email, password, name, role } = body;
      if (!email || !password) return json({ error: 'email and password required' }, 400);
      const admin = getSupabaseAdmin();
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: name || '', role: role || 'tenant' },
      });
      if (error) return json({ error: error.message }, 400);
      return json({ user: data.user });
    }

    if (path === 'auth/recover' && method === 'POST') {
      const body = await request.json();
      const email = (body?.email || '').trim().toLowerCase();
      if (!email) return json({ error: 'email required' }, 400);

      const resetUrl = process.env.NEXT_PUBLIC_RESET_PASSWORD_URL || `${getAppBaseUrl()}/reset-password`;
      const admin = getSupabaseAdmin();

      console.log('[RECOVERY] POST /api/auth/recover called');
      console.log('[RECOVERY] Email:', email);
      console.log('[RECOVERY] NEXT_PUBLIC_RESET_PASSWORD_URL env var:', process.env.NEXT_PUBLIC_RESET_PASSWORD_URL);
      console.log('[RECOVERY] getAppBaseUrl():', getAppBaseUrl());
      console.log('[RECOVERY] Final resetUrl being passed to generateLink:', resetUrl);

      let actionLink;
      try {
        console.log('[RECOVERY] Calling generateLink with:', { type: 'recovery', email, redirectTo: resetUrl });
        const result = await admin.auth.admin.generateLink({ type: 'recovery', email, redirectTo: resetUrl });
        console.log('[RECOVERY] Full Supabase response:', JSON.stringify(result, null, 2));
        if (result.error) {
          console.error('[RECOVERY] Supabase generateLink error', result.error);
          throw new Error(result.error.message || 'Failed to generate recovery link');
        }
        let generatedLink = result.data?.properties?.action_link || result.data?.action_link;
        console.log('[RECOVERY] actionLink generated from Supabase:', generatedLink);
        
        // Fix: Manually reconstruct the URL with proper URL encoding of redirect_to
        if (generatedLink) {
          const url = new URL(generatedLink);
          console.log('[RECOVERY] Original redirect_to param:', url.searchParams.get('redirect_to'));
          
          // Extract the token
          const token = url.searchParams.get('token');
          const type = url.searchParams.get('type');
          
          if (token) {
            // Manually construct the recovery link with the full reset URL properly encoded
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const encodedRedirectTo = encodeURIComponent(resetUrl);
            actionLink = `${supabaseUrl}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodedRedirectTo}`;
            console.log('[RECOVERY] Reconstructed actionLink with proper URL encoding:', actionLink);
            
            const newUrl = new URL(actionLink);
            console.log('[RECOVERY] Corrected redirect_to param:', newUrl.searchParams.get('redirect_to'));
          } else {
            actionLink = generatedLink;
          }
        }
      } catch (err) {
        console.error('[RECOVERY] generateLink failed', err);
        actionLink = null;
      }

      if (actionLink && resendApiKey) {
        try {
          console.log('[RECOVERY] Sending email via Resend...');
          await sendEmailWithResend({
            to: email,
            from: resendFromEmail,
            subject: 'HomeProof password reset',
            text: `Reset your HomeProof password by clicking this link: ${actionLink}`,
            html: `<p>Reset your HomeProof password by clicking the link below:</p><p><a href="${actionLink}">Reset password</a></p>`,
          });
          console.log('[RECOVERY] Email sent successfully via Resend');
          return json({ success: true, source: 'resend' });
        } catch (err) {
          console.error('[RECOVERY] Resend send failed, attempting Supabase fallback:', err.message);
        }
      } else {
        console.log('[RECOVERY] actionLink missing or no Resend API key, using Supabase fallback');
      }

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceKey) {
          return json({ error: 'Email recovery service is not fully configured' }, 500);
        }
        console.log('[RECOVERY] Using Supabase /auth/v1/recover fallback endpoint');
        console.log('[RECOVERY] redirect_to being sent to Supabase:', resetUrl);
        const response = await fetch(`${supabaseUrl}/auth/v1/recover`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
          },
          body: JSON.stringify({ email, redirect_to: resetUrl }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          const err = data?.error || data?.msg || data?.message || 'Supabase recovery failed';
          console.error('[RECOVERY] Supabase recovery endpoint failed:', err);
          return json({ error: err }, response.status);
        }
        console.log('[RECOVERY] Email sent successfully via Supabase fallback');
        return json({ success: true, source: 'supabase' });
      } catch (err) {
        console.error('[RECOVERY] Supabase recover request failed:', err);
        return json({ error: err?.message || 'Recovery email failed' }, 500);
      }
    }

    // All other endpoints require auth
    const auth = await getUserFromRequest(request);
    if (auth.error) return json({ error: auth.error }, auth.status);
    const { user, profile, admin } = auth;

    // ===== STRIPE: create checkout session =====
    if (path === 'stripe/create-checkout-session' && method === 'POST') {
      if (!stripe) return json({ error: 'Stripe not configured' }, 500);
      const body = await request.json();
      const price_id = body.price_id || body.priceId;
      if (!price_id) return json({ error: 'price_id required' }, 400);
      const allowedPrices = [process.env.STRIPE_PRICE_PRO_MONTHLY, process.env.STRIPE_PRICE_BUSINESS_MONTHLY];
      if (!allowedPrices.includes(price_id)) return json({ error: 'Invalid price_id' }, 400);
      const customerId = await ensureStripeCustomer(admin, user);
      const baseUrl = getAppBaseUrl();
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{ price: price_id, quantity: 1 }],
        success_url: `${baseUrl}/?checkout=success`,
        cancel_url: `${baseUrl}/?checkout=cancel`,
        subscription_data: {
          metadata: { supabase_user_id: user.id },
        },
      });
      return json({ sessionId: session.id, url: session.url });
    }

    if (path === 'stripe/customer-portal' && method === 'POST') {
      if (!stripe) return json({ error: 'Stripe not configured' }, 500);
      const { data: subscription } = await admin.from('user_subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
      if (!subscription?.stripe_customer_id) return json({ error: 'No Stripe customer found for user' }, 404);
      const baseUrl = getAppBaseUrl();
      const portal = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${baseUrl}/settings`,
      });
      return json({ url: portal.url });
    }

    // ===== PROFILE =====
    if (path === 'me' && method === 'GET') {
      return json({ user: { id: user.id, email: user.email }, profile });
    }

    // ===== PROPERTIES =====
    if (path === 'properties' && method === 'GET') {
      let q = admin.from('properties').select('*').order('created_at', { ascending: false });
      if (profile?.role === 'landlord') q = q.eq('landlord_id', user.id);
      else {
        // tenants: only properties via tenancy
        const { data: tens } = await admin.from('tenancies').select('property_id').eq('tenant_id', user.id);
        const ids = (tens || []).map((t) => t.property_id);
        if (ids.length === 0) return json({ properties: [] });
        q = q.in('id', ids);
      }
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json({ properties: data });
    }

    if (path === 'properties' && method === 'POST') {
      if (profile?.role !== 'landlord') return json({ error: 'Only landlords can create properties' }, 403);
      await ensurePropertyCreationAllowed(admin, user.id);
      const body = await request.json();
      const { data, error } = await admin
        .from('properties')
        .insert({
          landlord_id: user.id,
          address_line1: body.address_line1,
          address_line2: body.address_line2 || null,
          city: body.city || null,
          postcode: body.postcode || null,
          country: body.country || 'UK',
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ property: data }, 201);
    }

    // Single property: /properties/:id
    const propMatch = path.match(/^properties\/([^/]+)$/);
    if (propMatch && method === 'GET') {
      const id = propMatch[1];
      const { data: property } = await admin.from('properties').select('*').eq('id', id).maybeSingle();
      if (!property) return json({ error: 'Not found' }, 404);
      const { data: tenancies } = await admin.from('tenancies').select('*').eq('property_id', id);
      const { data: inventories } = await admin.from('inventories').select('*').eq('property_id', id).order('created_at', { ascending: false });
      const { data: inspections } = await admin.from('inspections').select('*').eq('property_id', id).order('created_at', { ascending: false });
      const { data: issues } = await admin.from('issues').select('*').eq('property_id', id).order('created_at', { ascending: false });
      const { data: compliance } = await admin.from('compliance_items').select('*').eq('property_id', id);
      const { data: contracts } = await admin
        .from('contracts')
        .select('*, tenancies!inner(property_id)')
        .eq('tenancies.property_id', id);
      return json({ property, tenancies: tenancies || [], inventories: inventories || [], inspections: inspections || [], issues: issues || [], compliance: compliance || [], contracts: contracts || [] });
    }

    // ===== TENANCIES =====
    if (path === 'tenancies' && method === 'POST') {
      if (profile?.role !== 'landlord') return json({ error: 'Only landlords can create tenancies' }, 403);
      const body = await request.json();
      // optional: link tenant by email
      let tenant_id = null;
      if (body.tenant_email) {
        const { data: tenantProfile } = await admin
          .from('profiles')
          .select('id')
          .eq('email', body.tenant_email)
          .maybeSingle();
        if (tenantProfile) tenant_id = tenantProfile.id;
      }
      const { data, error } = await admin
        .from('tenancies')
        .insert({
          property_id: body.property_id,
          landlord_id: user.id,
          tenant_id,
          tenant_email: body.tenant_email || null,
          start_date: body.start_date || null,
          end_date: body.end_date || null,
          rent_amount: body.rent_amount || null,
          rent_frequency: body.rent_frequency || 'monthly',
          deposit_amount: body.deposit_amount || null,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ tenancy: data }, 201);
    }

    // ===== AI: GENERATE INVENTORY =====
    if (path === 'inventories/generate' && method === 'POST') {
      const body = await request.json();
      const { property_id, tenancy_id, photo_urls } = body;
      if (!property_id || !Array.isArray(photo_urls) || photo_urls.length === 0) {
        return json({ error: 'property_id and photo_urls[] are required' }, 400);
      }
      await ensureAiRunAllowed(admin, user, profile);
      const ai = await aiInventoryFromPhotos(photo_urls);
      await chargeAiRun(admin, user, profile);
      const { data, error } = await admin
        .from('inventories')
        .insert({
          property_id,
          tenancy_id: tenancy_id || null,
          created_by: user.id,
          photos_json: photo_urls,
          ai_inventory_json: ai,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ inventory: data });
    }

    // ===== AI: UPLOAD CONTRACT PDF + PARSE =====
    if (path === 'contracts/upload-and-parse' && method === 'POST') {
      const form = await request.formData();
      const file = form.get('file');
      const tenancy_id = form.get('tenancy_id');
      if (!file || !tenancy_id) return json({ error: 'file and tenancy_id required' }, 400);
      await ensureAiRunAllowed(admin, user, profile);
      const arrayBuffer = await file.arrayBuffer();
      const buf = Buffer.from(arrayBuffer);

      // Upload to storage
      const filePath = `${user.id}/${tenancy_id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await admin.storage.from('contracts').upload(filePath, buf, {
        contentType: file.type || 'application/pdf',
        upsert: false,
      });
      if (upErr) return json({ error: 'Upload failed: ' + upErr.message }, 400);

      // Extract text
      let rawText = '';
      try {
        if (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
          const pdfParse = (await import('pdf-parse')).default;
          const result = await pdfParse(buf);
          rawText = result.text || '';
        } else {
          rawText = buf.toString('utf-8');
        }
      } catch (e) {
        console.error('PDF parse error', e);
        return json({ error: 'Failed to extract text from file: ' + e.message }, 400);
      }
      if (!rawText.trim()) return json({ error: 'No text extracted from document' }, 400);

      const ai = await aiContractParse(rawText);
      await chargeAiRun(admin, user, profile);
      const { data: signed } = await admin.storage.from('contracts').createSignedUrl(filePath, 60 * 60 * 24);
      const { data, error } = await admin
        .from('contracts')
        .insert({
          tenancy_id,
          raw_text: rawText.slice(0, 50000),
          file_path: filePath,
          file_url: signed?.signedUrl || null,
          ai_summary_json: ai,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ contract: data, ai });
    }

    // ===== AI: PARSE CONTRACT (raw text) =====
    if (path === 'contracts/parse' && method === 'POST') {
      const body = await request.json();
      const { tenancy_id, raw_text, file_path, file_url } = body;
      if (!tenancy_id || !raw_text) {
        return json({ error: 'tenancy_id and raw_text are required' }, 400);
      }
      await ensureAiRunAllowed(admin, user, profile);
      const ai = await aiContractParse(raw_text);
      await chargeAiRun(admin, user, profile);
      const { data, error } = await admin
        .from('contracts')
        .insert({
          tenancy_id,
          raw_text: raw_text.slice(0, 50000),
          file_path: file_path || null,
          file_url: file_url || null,
          ai_summary_json: ai,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ contract: data });
    }

    // ===== AI: COMPARE INSPECTION =====
    if (path === 'inspections/compare' && method === 'POST') {
      const body = await request.json();
      const { property_id, tenancy_id, before_urls, after_urls } = body;
      if (!property_id || !Array.isArray(before_urls) || !Array.isArray(after_urls)) {
        return json({ error: 'property_id, before_urls[], after_urls[] required' }, 400);
      }
      await ensureAiRunAllowed(admin, user, profile);
      const ai = await aiCompareInspection(before_urls, after_urls);
      await chargeAiRun(admin, user, profile);
      const { data, error } = await admin
        .from('inspections')
        .insert({
          property_id,
          tenancy_id: tenancy_id || null,
          created_by: user.id,
          before_photos_json: before_urls,
          after_photos_json: after_urls,
          ai_report_json: ai,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ inspection: data });
    }

    // ===== ISSUES =====
    if (path === 'issues' && method === 'POST') {
      const body = await request.json();
      const { property_id, tenancy_id, title, description, photo_urls } = body;
      if (!property_id || !title) return json({ error: 'property_id and title required' }, 400);

      await ensureAiRunAllowed(admin, user, profile);
      let aiDraft = null;
      try {
        aiDraft = await aiDraftIssueMessage(title, description || '', photo_urls || []);
        await chargeAiRun(admin, user, profile);
      } catch (e) {
        console.error('AI draft failed', e);
      }

      const { data, error } = await admin
        .from('issues')
        .insert({
          property_id,
          tenancy_id: tenancy_id || null,
          created_by: user.id,
          title,
          description: description || null,
          photos_json: photo_urls || [],
          status: 'open',
          ai_drafted_message: aiDraft ? JSON.stringify(aiDraft) : null,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ issue: data, ai_draft: aiDraft }, 201);
    }

    // Update issue status: /issues/:id (PATCH)
    const issueMatch = path.match(/^issues\/([^/]+)$/);
    if (issueMatch && method === 'PATCH') {
      const body = await request.json();
      const { data, error } = await admin
        .from('issues')
        .update({ status: body.status })
        .eq('id', issueMatch[1])
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ issue: data });
    }

    // ===== COMPLIANCE =====
    if (path === 'compliance' && method === 'GET') {
      // Get all compliance items for landlord's properties
      const { data: props } = await admin.from('properties').select('id').eq('landlord_id', user.id);
      const propIds = (props || []).map(p => p.id);
      if (propIds.length === 0) return json({ compliance: [] });
      const { data, error } = await admin
        .from('compliance_items')
        .select('*, properties(address_line1, postcode)')
        .in('property_id', propIds)
        .order('expiry_date', { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json({ compliance: data });
    }

    if (path === 'compliance' && method === 'POST') {
      const body = await request.json();
      const { data, error } = await admin
        .from('compliance_items')
        .insert({
          property_id: body.property_id,
          type: body.type,
          expiry_date: body.expiry_date,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ compliance: data }, 201);
    }

    // Delete compliance item
    const compDelMatch = path.match(/^compliance\/([^/]+)$/);
    if (compDelMatch && method === 'DELETE') {
      const { error } = await admin.from('compliance_items').delete().eq('id', compDelMatch[1]);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // ===== SEND ISSUE EMAIL VIA RESEND =====
    const sendIssueMatch = path.match(/^issues\/([^/]+)\/send$/);
    if (sendIssueMatch && method === 'POST') {
      const issueId = sendIssueMatch[1];
      const body = await request.json().catch(() => ({}));
      const recipientEmail = body.to;
      if (!recipientEmail) return json({ error: 'Recipient email required' }, 400);

      const { data: issue } = await admin.from('issues').select('*').eq('id', issueId).maybeSingle();
      if (!issue) return json({ error: 'Issue not found' }, 404);
      if (!issue.ai_drafted_message) return json({ error: 'No AI draft on this issue' }, 400);

      let draft;
      try { draft = JSON.parse(issue.ai_drafted_message); } catch { return json({ error: 'Invalid AI draft' }, 400); }

      if (!resendApiKey) return json({ error: 'Email provider not configured' }, 500);

      try {
        await sendEmailWithResend({
          to: recipientEmail,
          from: resendFromEmail,
          replyTo: user.email,
          subject: draft.subject || `Issue: ${issue.title}`,
          text: draft.body || issue.description || '',
          html: `<p>${(draft.body || issue.description || '').replace(/\n/g, '<br/>')}</p><p><em>Sent via HomeProof on behalf of ${user.email}</em></p>`,
        });
      } catch (e) {
        console.error('Resend error', e);
        return json({ error: 'Failed to send email: ' + (e.message || 'unknown') }, 500);
      }

      await admin.from('notifications').insert({
        user_id: user.id,
        message: `Email sent to ${recipientEmail} for issue: ${issue.title}`,
        type: 'issue_email_sent',
      });

      return json({ ok: true, sent_to: recipientEmail });
    }

    // ===== ISSUES list =====
    if (path === 'issues' && method === 'GET') {
      let q = admin.from('issues').select('*, properties(address_line1)').order('created_at', { ascending: false });
      if (profile?.role === 'landlord') {
        const { data: props } = await admin.from('properties').select('id').eq('landlord_id', user.id);
        const ids = (props || []).map(p => p.id);
        if (ids.length === 0) return json({ issues: [] });
        q = q.in('property_id', ids);
      } else {
        q = q.eq('created_by', user.id);
      }
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json({ issues: data });
    }

    // ===== AI: RENT PRICE ESTIMATOR =====
    if (path === 'rent/estimate' && method === 'POST') {
      const body = await request.json();
      const { city, postcode, country, bedrooms, bathrooms, property_type, condition, furnishing, extra_details, currency } = body;
      if (!city || bedrooms == null) return json({ error: 'city and bedrooms required' }, 400);
      await ensureAiRunAllowed(admin, user, profile);
      const cur = currency || 'GBP';
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a professional real estate appraiser with deep knowledge of rental markets worldwide.' },
          { role: 'user', content: `Estimate the monthly rent (in ${cur}) for this property:
- City: ${city}${postcode ? `, postcode ${postcode}` : ''}
- Country: ${country || 'United Kingdom'}
- Bedrooms: ${bedrooms}, Bathrooms: ${bathrooms || 'unknown'}
- Type: ${property_type || 'apartment'}
- Condition: ${condition || 'good'}
- Furnishing: ${furnishing || 'unfurnished'}
- Extra: ${extra_details || 'none'}

Return STRICT JSON:
{
  "currency": "${cur}",
  "conservative": <number>,
  "expected": <number>,
  "optimistic": <number>,
  "confidence": "low|medium|high",
  "comparables_basis": "Short note on what comparable properties typically rent for in this area",
  "factors_increasing_value": ["..."],
  "factors_decreasing_value": ["..."],
  "marketing_tips": ["3-5 short tips to maximize rent"]
}` },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1500,
      });
      await chargeAiRun(admin, user, profile);
      return json({ estimate: JSON.parse(resp.choices[0].message.content) });
    }

    // ===== AI: DISPUTE EVIDENCE BUILDER =====
    if (path === 'disputes/build' && method === 'POST') {
      const body = await request.json();
      const { property_id, tenancy_id, dispute_type, tenant_position, landlord_position, language = 'en' } = body;
      if (!property_id || !dispute_type) return json({ error: 'property_id and dispute_type required' }, 400);
      await ensureAiRunAllowed(admin, user, profile);

      // Pull all relevant evidence we have on file
      const [{ data: prop }, { data: tenancy }, { data: invs }, { data: insps }, { data: issues }, { data: contracts }, { data: compliance }] = await Promise.all([
        admin.from('properties').select('*').eq('id', property_id).maybeSingle(),
        tenancy_id ? admin.from('tenancies').select('*').eq('id', tenancy_id).maybeSingle() : Promise.resolve({ data: null }),
        admin.from('inventories').select('id, ai_inventory_json, created_at').eq('property_id', property_id),
        admin.from('inspections').select('id, ai_report_json, created_at').eq('property_id', property_id),
        admin.from('issues').select('id, title, description, status, ai_drafted_message, created_at').eq('property_id', property_id),
        admin.from('contracts').select('id, ai_summary_json, created_at').eq('tenancy_id', tenancy_id || '00000000-0000-0000-0000-000000000000'),
        admin.from('compliance_items').select('type, expiry_date').eq('property_id', property_id),
      ]);

      const evidenceContext = {
        property: prop ? { address: prop.address_line1, city: prop.city, postcode: prop.postcode } : null,
        tenancy: tenancy ? { start: tenancy.start_date, end: tenancy.end_date, rent: tenancy.rent_amount, deposit: tenancy.deposit_amount } : null,
        contract_summary: contracts?.[0]?.ai_summary_json || null,
        inventories: invs?.map(i => i.ai_inventory_json) || [],
        inspections: insps?.map(i => i.ai_report_json) || [],
        issues: issues || [],
        compliance: compliance || [],
      };

      const resp = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert tenancy dispute advisor (UK/international). You build evidence bundles for deposit disputes, eviction defense, repair disputes, and tribunal/court submissions. Respond in language code "' + language + '".' },
          { role: 'user', content: `Build a comprehensive evidence bundle for this dispute.

DISPUTE TYPE: ${dispute_type}
TENANT POSITION: ${tenant_position || 'not provided'}
LANDLORD POSITION: ${landlord_position || 'not provided'}

EVIDENCE ON FILE:
${JSON.stringify(evidenceContext, null, 2)}

Return STRICT JSON:
{
  "executive_summary": "2-3 paragraph summary of dispute and which party has stronger evidence",
  "strongest_evidence": [{"source":"inventory|inspection|issue|contract|compliance", "fact":"...", "supports":"tenant|landlord|neutral"}],
  "weaknesses": [{"party":"tenant|landlord", "weakness":"..."}],
  "missing_evidence": ["Things that would strengthen the case if obtained"],
  "recommended_arguments": {
    "tenant": ["..."],
    "landlord": ["..." ]
  },
  "suggested_settlement": "Pragmatic compromise (if applicable)",
  "tribunal_or_court_advice": "What to expect if escalated, including which UK scheme (TDS, DPS, MyDeposits) or court is appropriate",
  "drafted_statement": "A formal 200-400 word statement either party could submit, written in neutral professional tone"
}` },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 3500,
      });
      const ai = JSON.parse(resp.choices[0].message.content);
      await chargeAiRun(admin, user, profile);

      const { data, error } = await admin
        .from('disputes')
        .insert({
          property_id,
          tenancy_id: tenancy_id || null,
          created_by: user.id,
          title: `${dispute_type} dispute`,
          dispute_type,
          tenant_position,
          landlord_position,
          ai_evidence_bundle: ai,
          status: 'open',
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);

      // log activity
      try {
        await admin.from('activity_logs').insert({
          user_id: user.id,
          property_id,
          tenancy_id: tenancy_id || null,
          action: 'dispute_built',
          entity_type: 'dispute',
          entity_id: data.id,
        });
      } catch (e) {
        // Ignore activity log errors
      }

      return json({ dispute: data, ai });
    }

    // ===== DISPUTES list =====
    if (path === 'disputes' && method === 'GET') {
      let q = admin.from('disputes').select('*, properties(address_line1)').order('created_at', { ascending: false });
      if (profile?.role === 'landlord') {
        const { data: props } = await admin.from('properties').select('id').eq('landlord_id', user.id);
        const ids = (props || []).map(p => p.id);
        if (ids.length === 0) return json({ disputes: [] });
        q = q.in('property_id', ids);
      } else {
        q = q.eq('created_by', user.id);
      }
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json({ disputes: data });
    }

    // ===== USER PLAN (for feature gating) =====
    if (path === 'user/plan' && method === 'GET') {
      const billingUserId = await resolveBillingAccount(admin, user, profile);
      const { data: sub } = await admin.from('user_subscriptions').select('*, subscription_plans(*)').eq('user_id', billingUserId).maybeSingle();
      const plan = sub?.plan_id || 'free';
      const planMeta = sub?.subscription_plans || { ...FREE_PLAN_INFO };
      return json({
        plan,
        max_properties: planMeta.max_properties,
        max_ai_runs_per_month: planMeta.max_ai_runs_per_month,
        ai_runs_used_this_month: sub?.ai_runs_used_this_month || 0,
        ai_runs_reset_at: sub?.ai_runs_reset_at || new Date().toISOString(),
        billing_owner: billingUserId === user.id ? 'self' : 'landlord',
      });
    }

    // ===== AI: TENANCY CO-PILOT CHAT =====
    if (path === 'chat' && method === 'POST') {
      const body = await request.json();
      const { messages = [], language = 'en' } = body;
      if (!Array.isArray(messages) || messages.length === 0) return json({ error: 'messages required' }, 400);
      await ensureAiRunAllowed(admin, user, profile);

      // Build user context (their properties + tenancies + issues + compliance)
      let context = '';
      try {
        if (profile?.role === 'landlord') {
          const { data: props } = await admin.from('properties').select('id, address_line1, city, postcode').eq('landlord_id', user.id);
          context += `User is a LANDLORD named ${profile?.name || user.email}.\nThey own ${props?.length || 0} properties: ${(props||[]).map(p => `${p.address_line1}, ${p.city||''}`).join('; ') || 'none'}.\n`;
          const propIds = (props || []).map(p => p.id);
          if (propIds.length) {
            const { data: tens } = await admin.from('tenancies').select('property_id, tenant_email, rent_amount, rent_frequency, start_date, end_date').in('property_id', propIds);
            context += `Tenancies: ${(tens||[]).map(t=>`${t.tenant_email||'unnamed'} @ ${t.rent_amount}/${t.rent_frequency}`).join('; ') || 'none'}.\n`;
            const { data: iss } = await admin.from('issues').select('title, status').in('property_id', propIds);
            context += `Issues: ${(iss||[]).map(i=>`${i.title} [${i.status}]`).join('; ') || 'none'}.\n`;
            const { data: comp } = await admin.from('compliance_items').select('type, expiry_date').in('property_id', propIds);
            context += `Compliance: ${(comp||[]).map(c=>`${c.type} expires ${c.expiry_date}`).join('; ') || 'none'}.\n`;
          }
        } else {
          const { data: tens } = await admin.from('tenancies').select('property_id, rent_amount, rent_frequency, start_date, end_date, properties(address_line1, city)').eq('tenant_id', user.id);
          context += `User is a TENANT named ${profile?.name || user.email}.\nTheir tenancies: ${(tens||[]).map(t=>`${t.properties?.address_line1} @ ${t.rent_amount}/${t.rent_frequency}`).join('; ') || 'none'}.\n`;
        }
      } catch (e) { console.error('chat context err', e); }

      const sysPrompt = `You are TenantAI, an expert AI assistant for property management and tenancy law. You help landlords and tenants with practical advice, legal context (UK by default unless the user mentions another country), and document drafting. Be concise and helpful.

USER CONTEXT:
${context}

Always respond in language code "${language}".`;

      const resp = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: sysPrompt },
          ...messages.slice(-20).map(m => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 1000,
      });
      await chargeAiRun(admin, user, profile);
      return json({ reply: resp.choices[0].message.content });
    }

    return json({ error: `Route /${path} not found` }, 404);
  } catch (err) {
    console.error('API error', err);
    return json({ error: err.message || 'Internal server error' }, 500);
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
