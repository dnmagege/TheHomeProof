# TheHomeProof - Deployment Checklist (Action Items)

**Status**: Ready to Launch | **Timeline**: This Week | **Estimated Effort**: 20 hours

---

## 🔴 CRITICAL PATH (Do This First - 6 hours)

### 1. Security Hardening
**Time: 1.5 hours**

```javascript
// next.config.js - Add security headers
const nextConfig = {
  // ... existing config
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()'
          }
        ]
      }
    ];
  }
};
```

**Tasks:**
- [ ] Update next.config.js with security headers
- [ ] Create `public/.well-known/security.txt`:
  ```
  Contact: security@thehomeproof.co.uk
  Expires: [DATE 1 YEAR FROM NOW]
  Preferred-Languages: en
  ```
- [ ] Create privacy policy at `/app/privacy/page.js` (use template from Termly/iubenda)
- [ ] Create terms of service at `/app/terms/page.js`
- [ ] Add links to footer
- [ ] Test build locally: `npm run build`

### 2. Performance Audit
**Time: 1.5 hours**

```bash
# Build and test
npm run build
npm start

# Open http://localhost:3000 in browser
# Run Lighthouse: Chrome DevTools > Lighthouse > Analyze
# Target: 75+ score
```

**Tasks:**
- [ ] Run Lighthouse on homepage (target 75+)
- [ ] Run Lighthouse on dashboard (target 70+)
- [ ] Check bundle size: `npm run build` → look at `.next/static/chunks/`
- [ ] Images should use `next/image` component (check in code)
- [ ] Optimize any images > 100KB
- [ ] Test on slow 3G network (DevTools > Network > Slow 3G)

**Expected Issues & Fixes:**
```
If Lighthouse score < 75:
1. Image optimization: Use next/image with width/height
2. Font loading: Add font-display: swap
3. Code splitting: Verify lazy loading on routes
4. Remove unused dependencies: `npm ls --depth=0`
```

### 3. QA Testing (Mobile + Desktop)
**Time: 2 hours**

**Test Checklist:**
```
Signup Flow:
- [ ] Signup with email on mobile (iPhone/Android)
- [ ] Password reset link works
- [ ] Confirm email (if verification required)
- [ ] Dashboard loads after login

Properties & Features:
- [ ] Add property with photos
- [ ] Upload AI inventory (photos)
- [ ] Upload AI contract (PDF)
- [ ] Upload damage detection (before/after)
- [ ] Run rent estimator
- [ ] Chat with copilot
- [ ] Create dispute (if feature exists)

Payments (Test Mode):
- [ ] Free plan shows correctly
- [ ] Stripe checkout button works
- [ ] Test card: 4242 4242 4242 4242 (exp: any future date, CVC: any 3 digits)
- [ ] After payment, verify subscription in dashboard
- [ ] Check Supabase user_subscriptions table

Email:
- [ ] Receive password reset email
- [ ] Receive tenant invitation email (if invited someone)
- [ ] Check email formatting on mobile

Dark Mode & Languages:
- [ ] Toggle dark mode on mobile
- [ ] Switch language to Spanish/French
- [ ] Verify all UI text translated
```

**Tools:**
- Chrome DevTools for mobile emulation
- Real device testing (borrow a phone if needed)
- https://www.responsivedesignchecker.com/ for quick checks

### 4. Environment & Deployment Setup
**Time: 1 hour**

**Vercel Setup (if not done):**
```bash
# Install Vercel CLI
npm i -g vercel

# Login & connect repo
vercel login
vercel --prod

# This will guide you through GitHub connection
```

**Vercel Dashboard:**
- [ ] Go to https://vercel.com/dashboard
- [ ] Select your project
- [ ] Settings > Environment Variables
- [ ] Add ALL variables from `.env.local`:
  ```
  NEXT_PUBLIC_BASE_URL
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  OPENAI_API_KEY
  STRIPE_SECRET_KEY
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  STRIPE_WEBHOOK_SECRET
  NEXT_PUBLIC_STRIPE_PRICE_PRO
  RESEND_API_KEY
  RESEND_FROM_EMAIL
  ```
- [ ] Settings > Domains
- [ ] Add domain: `thehomeproof.co.uk`
- [ ] Update DNS at your registrar (follow Vercel instructions)
- [ ] Wait for SSL certificate (green checkmark)

**Test Production Build:**
```bash
npm run build
npm start

# Should work exactly like dev mode
# Open http://localhost:3000
```

### 5. Stripe Configuration
**Time: 1 hour**

**In Stripe Dashboard:**
- [ ] Create/verify Free, Pro, Business plan prices (test or live)
- [ ] Copy price IDs to environment variables
- [ ] Developers > Webhooks > Add endpoint
  - URL: `https://thehomeproof.co.uk/api/stripe/webhook`
  - Events:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_succeeded`
- [ ] Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

**Test Webhook:**
```bash
# In Vercel dashboard, test event:
# Click "Send test event" > select `checkout.session.completed`
# Check Supabase user_subscriptions table for new row
```

---

## 🟡 IMPORTANT (Do After Critical Path - 8 hours)

### 6. Email Testing
**Time: 2 hours**

**Resend Setup:**
- [ ] Go to https://resend.com/api-keys
- [ ] Copy API key to `RESEND_API_KEY`
- [ ] Set `RESEND_FROM_EMAIL` to `noreply@thehomeproof.co.uk`
- [ ] Add SPF/DKIM records (Resend provides in dashboard)

**Test Email Sending:**
```javascript
// In your backend route, test:
const { data, error } = await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL,
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<p>If you see this, email works!</p>'
});
```

**Tasks:**
- [ ] Send password reset email to yourself
- [ ] Receive tenant invitation email
- [ ] Receive subscription confirmation email
- [ ] Check email formatting on mobile (Gmail, Apple Mail, Outlook)
- [ ] Verify sender name/address looks professional

### 7. Analytics & Monitoring
**Time: 2 hours**

**Sentry (Error Tracking)** - Already in code
```env
NEXT_PUBLIC_SENTRY_DSN=<your-sentry-dsn>
```
- [ ] Go to https://sentry.io
- [ ] Create project (Next.js)
- [ ] Copy DSN to env var
- [ ] Test error: Throw error in component → Verify in Sentry dashboard

**PostHog (Analytics)** - Optional but recommended
```env
NEXT_PUBLIC_POSTHOG_KEY=<key>
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```
- [ ] Create PostHog account
- [ ] Create project
- [ ] Copy key to env var
- [ ] Track events: Signup, Feature usage, Upgrade, Error
- [ ] Check dashboard for data

**Vercel Analytics:**
- [ ] Vercel dashboard > Analytics tab
- [ ] Should show real-time traffic

### 8. Legal & Compliance
**Time: 2 hours**

**Privacy Policy:**
- [ ] Use template from Termly.io or Iubenda
- [ ] Customize for:
  - Supabase (data processing)
  - Stripe (payment data)
  - OpenAI (AI data handling)
  - Resend (email)
- [ ] Publish at `/privacy`
- [ ] Add link in footer

**Terms of Service:**
- [ ] Use template (adjust for your business)
- [ ] Key sections:
  - User responsibilities
  - Acceptable use
  - Liability limitations
  - Dispute resolution
- [ ] Publish at `/terms`
- [ ] Add link in footer

**GDPR Compliance Check:**
- [ ] Data processing agreements signed (Supabase, Stripe, OpenAI, Resend)
- [ ] Privacy policy mentions data storage location
- [ ] User can export their data (optional but good)
- [ ] User can delete their account (delete cascade in DB)

**Tasks:**
- [ ] Create `/app/privacy/page.js`
- [ ] Create `/app/terms/page.js`
- [ ] Add footer links in `components/site/Footer.jsx`
- [ ] Legal review (optional: hire lawyer for £200-500)

### 9. Monitoring Setup
**Time: 1 hour**

**Create Monitoring Dashboard:**
```
Vercel Analytics:
- Traffic (daily active users)
- Performance (Core Web Vitals)

Stripe Dashboard:
- Revenue (MRR, ARR)
- Transactions (success rate)
- Failed payments

Supabase:
- Database usage
- API requests
- Active connections

Sentry:
- Error rate
- Top errors
- User impact
```

**Alert Setup (Vercel):**
- [ ] Set up email alerts for deployment failures
- [ ] Set up Slack notifications (if using Slack)

---

## 🟢 NICE-TO-HAVE (Do if Time - 6 hours)

### 10. Content Preparation
**Time: 2 hours**

- [ ] Write landing page SEO meta description (160 chars)
- [ ] Create 3-5 blog post outlines:
  - "How to Win Your Deposit Dispute"
  - "AI is Changing Tenancy Management"
  - "5 Compliance Mistakes Landlords Make"
- [ ] Prepare first week social media posts (5 posts)
- [ ] Script 2-3 minute demo video

### 11. Social Media Setup
**Time: 2 hours**

- [ ] Create Twitter/X account (@TheHomeProof or similar)
- [ ] Create LinkedIn company page
- [ ] Create Facebook business page
- [ ] Prepare 10 posts to schedule for first week
- [ ] Design simple graphics (use Canva)

### 12. Referral Program (Optional)
**Time: 2 hours**

**Implement Referral System:**
```sql
-- Add to Supabase schema
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id),
  referred_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending', -- pending, completed
  reward_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

- [ ] Create referral link generator
- [ ] Track who referred whom
- [ ] Automate reward (£5 credit or 1 free month)
- [ ] Share on landing page: "Refer a friend, both get 1 month free"

---

## 📋 LAUNCH DAY CHECKLIST

**6 Hours Before Launch:**
- [ ] Final production build test: `npm run build && npm start`
- [ ] Check all env vars in Vercel
- [ ] Test Stripe checkout one more time
- [ ] Send test email to yourself
- [ ] Monitor Sentry dashboard

**At Launch:**
- [ ] Deploy to Vercel: `git push origin main`
- [ ] Verify deployment successful (Vercel dashboard shows green)
- [ ] Test landing page: https://thehomeproof.co.uk
- [ ] Test signup flow
- [ ] Announce on Twitter/LinkedIn/Facebook

**First 24 Hours:**
- [ ] Monitor Sentry for errors (should be <1%)
- [ ] Monitor Vercel for performance (should be <1s response time)
- [ ] Respond to first users/feedback within 2 hours
- [ ] Check Stripe for test transactions
- [ ] Collect early user testimonials/screenshots

**First Week:**
- [ ] Fix any critical bugs immediately
- [ ] Gather user feedback (email, Twitter DMs)
- [ ] Post first blog post
- [ ] Share demo video
- [ ] Send weekly update email

---

## 🚀 GROWTH QUICK-START (Week 2+)

### Channel 1: Personal Network (Target: 20-30 signups)
```
Subject: "We Built Something to Solve Deposit Disputes"

Body:
Hi [Name],

We just launched TheHomeProof - an AI platform that turns property photos, contracts, and inspections into tribunal-ready evidence in minutes.

No more spreadsheets. No more disputes lost due to poor evidence.

Free during beta: [link]

Would love your feedback!
- [Your name]
```

### Channel 2: Reddit (Target: 20-40 signups)
```
Subreddits to post in:
- r/UKPersonalFinance
- r/Landlords
- r/BritishProblems (if relevant)
- Local subreddits (r/London, r/Manchester, etc.)

Post title:
"We built an AI tool to help landlords and tenants avoid deposit disputes"

Key: Don't be spammy. Answer questions first. Mention TheHomeProof only when relevant.
```

### Channel 3: Twitter Engagement (Target: 10-20 signups)
```
Daily posts:
- Tip on resolving disputes
- AI feature demo
- User testimonial
- Industry insight

Engagement: Reply to every landlord/tenant discussing disputes, mention solution
```

### Channel 4: ProductHunt (Target: 50-100 signups)
```
Timeline: 2-3 weeks from launch (wait until product is polished)
Prepare:
- Demo video (1-2 min)
- Compelling tagline
- 3-5 screenshots
- Active community during launch day
```

---

## 📞 SUPPORT & FEEDBACK LOOP

**Set Up Email Support:**
```
support@thehomeproof.co.uk → Your Gmail/Outlook
```
- [ ] Create email alias/forward
- [ ] Set auto-reply (first 24 hours): "Thanks for reaching out! We'll respond within 2 hours."
- [ ] Track all questions in spreadsheet
- [ ] Respond to EVERY message in first week

**Feedback Collection:**
- [ ] Add feedback widget (e.g., Userflow, Appcues, or simple form)
- [ ] Include "Feedback" link in footer
- [ ] Monitor Product Hunt comments
- [ ] Check Twitter mentions
- [ ] Export feedback to spreadsheet weekly

**Iterate Quickly:**
- Each week, pick 2-3 most requested features
- Small fixes go live same day
- Larger features planned for next week
- Share "What we're building" in weekly email

---

## ✅ FINAL SIGN-OFF

**Before Going Live, Verify:**

- [ ] Security headers added (HSTS, CSP, etc.)
- [ ] Privacy policy & TOS published
- [ ] Lighthouse score 75+
- [ ] Mobile signup tested
- [ ] All AI features tested end-to-end
- [ ] Stripe checkout tested (test mode)
- [ ] Email sending tested
- [ ] Production build succeeds
- [ ] Vercel deployment green
- [ ] Domain DNS updated
- [ ] SSL certificate active
- [ ] Monitoring/Sentry active
- [ ] Analytics enabled
- [ ] First marketing post scheduled

**You're Ready to Launch! 🚀**

---

**Questions?** Check:
- STRATEGIC_OVERVIEW.md (big picture)
- VERCEL_DEPLOYMENT.md (deployment details)
- PRODUCTION_CHECKLIST.md (existing checks)

**Good luck!**
