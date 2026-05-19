# TheHomeProof Production Readiness Checklist

## ✅ Completed Features

### Core App
- [x] Next.js 14 with App Router
- [x] Supabase auth (email/password + JWT)
- [x] Responsive UI (mobile, tablet, desktop)
- [x] Dark mode support
- [x] Multi-language support (8 languages)
- [x] Multi-currency support (19 currencies)

### AI Features
- [x] AI Inventory Generator (photos → structured inventory)
- [x] AI Contract Parser (PDF/text → structured summary)
- [x] AI Inspection Comparison (before/after photos → damage report)
- [x] AI Rent Estimator (property details → market rent estimate)
- [x] AI Issue Message Drafter (issue title/description → email draft)
- [x] AI Dispute Evidence Builder (all data → tribunal-ready bundle)
- [x] AI Co-Pilot Chat (tenancy law Q&A assistant)

### Payments (Stripe)
- [x] Stripe pricing page UI
- [x] Stripe checkout session creation
- [x] Stripe webhook handling (signature verification)
- [x] Subscription sync to Supabase
- [x] Customer portal link (manage subscriptions)
- [x] Plan detection endpoint (`/api/user/plan`)
- [x] Feature gating by plan

### Email (Resend)
- [x] Resend API integration
- [x] Issue email sending
- [x] Email draft generation

### Database
- [x] Supabase schema (properties, tenancies, inventories, etc.)
- [x] Row-level security (RLS) policies
- [x] Service role authentication
- [x] Indexed queries for performance

### Security & Monitoring
- [x] Rate limiting (global, AI, auth)
- [x] CORS headers
- [x] JWT auth validation
- [x] Stripe webhook signature verification
- [x] Supabase RLS policies
- [x] Input validation on API routes

### Deployment & Infrastructure
- [x] GitHub repository setup
- [x] Environment variables configured locally
- [x] `.env` file in `.gitignore` (no secrets in repo)
- [x] Vercel deployment guide created
- [x] Production-ready code committed to GitHub

---

## 📋 Pre-Launch Checklist (Before Going Live)

### 1. Vercel Setup
- [ ] Create Vercel account
- [ ] Connect GitHub repository (dnmagege/TheHomeProof)
- [ ] Configure build settings (Next.js auto-detected)
- [ ] Add all environment variables to Vercel dashboard
- [ ] Verify build succeeds
- [ ] Access preview deployment

### 2. Domain & SSL
- [ ] Verify domain `thehomeproof.co.uk` is registered
- [ ] Add Vercel CNAME record to domain DNS
- [ ] Wait for DNS propagation (24-48 hours)
- [ ] Verify SSL certificate is active
- [ ] Test HTTPS access to domain

### 3. Stripe Configuration
- [ ] Verify Stripe test account is set up
- [ ] Confirm test prices exist (Free, Pro, Business)
- [ ] Add webhook endpoint: `https://thehomeproof.co.uk/api/stripe/webhook`
- [ ] Verify webhook signature secret in Vercel env vars
- [ ] Test checkout flow with test card (4242 4242 4242 4242)
- [ ] Verify subscription created in Stripe dashboard
- [ ] Verify subscription synced to Supabase `user_subscriptions` table

### 4. Email (Resend)
- [ ] Verify Resend API key is active
- [ ] Test email sending via `/api/issues/{id}/send` endpoint
- [ ] Verify emails arrive in inbox

### 5. Database
- [ ] Verify Supabase RLS policies are active
- [ ] Test row-level security (user can only see own data)
- [ ] Verify database backups are enabled

### 6. Testing
- [ ] Test user signup/login flow
- [ ] Test all AI features:
     - [ ] Photo upload & inventory generation
     - [ ] PDF contract upload & parsing
     - [ ] Inspection photo comparison
     - [ ] Rent estimation
     - [ ] Issue email drafting
     - [ ] Dispute evidence building
     - [ ] Chat with AI co-pilot
- [ ] Test pricing page & Stripe checkout (test mode)
- [ ] Test "Manage subscription" button
- [ ] Test feature gating (free users see "Pro required" badges)
- [ ] Test issue email sending via Resend
- [ ] Test settings (language, currency, theme)
- [ ] Test dark mode
- [ ] Test mobile responsiveness

### 7. Monitoring & Analytics
- [ ] Enable Vercel analytics
- [ ] Set up error tracking (optional: Sentry)
- [ ] Create Slack notification for errors (optional)
- [ ] Test health check: `GET https://thehomeproof.co.uk/api/`

### 8. Performance & Security Audit
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Verify rate limiting works (trigger with 130+ requests/min)
- [ ] Verify CORS headers are correct
- [ ] Verify JWT validation on protected routes

### 9. Legal & Compliance
- [ ] Add Terms of Service page
- [ ] Add Privacy Policy page
- [ ] Add GDPR compliance statement
- [ ] Verify deposit protection scheme information (for UK)
- [ ] Add disclaimer: AI outputs should be reviewed by legal professionals

### 10. Documentation
- [ ] README.md with setup instructions
- [ ] API documentation
- [ ] Deployment guide (VERCEL_DEPLOYMENT.md) ✅
- [ ] Architecture diagram
- [ ] Security policies

---

## 🚀 Launch Day Checklist

### Hours Before Launch
- [ ] Final code review
- [ ] Final test of all features
- [ ] Backup current production data
- [ ] Notify team of launch time

### At Launch
- [ ] Switch Stripe to live mode (after testing thoroughly)
- [ ] Switch domain to production URL
- [ ] Monitor error logs closely
- [ ] Test a real transaction (if using live Stripe)

### Hours After Launch
- [ ] Monitor Vercel dashboard for errors
- [ ] Check Stripe logs for issues
- [ ] Verify emails are delivering
- [ ] Monitor database performance
- [ ] Check user feedback

---

## 📊 Key Metrics to Track

### Availability & Performance
- [ ] Uptime: >99.9%
- [ ] Response time: <200ms
- [ ] Error rate: <0.1%

### User Adoption
- [ ] Daily active users (DAU)
- [ ] Signup conversion rate
- [ ] Plan upgrade rate

### Revenue (Post-Launch)
- [ ] Monthly recurring revenue (MRR)
- [ ] Customer acquisition cost (CAC)
- [ ] Churn rate
- [ ] Lifetime value (LTV)

### AI Usage
- [ ] Inventory generations per day
- [ ] Contract parses per day
- [ ] Chat messages per day
- [ ] AI token usage & costs

---

## 🔄 Ongoing Maintenance (Weekly/Monthly/Quarterly)

### Weekly
- Review Vercel analytics
- Check error logs
- Monitor Stripe transactions
- Test user-reported bugs

### Monthly
- Update dependencies (`npm update`)
- Review security patches
- Analyze user feedback
- Plan next features

### Quarterly
- Conduct security audit
- Review pricing strategy
- Database optimization
- Performance tuning

---

## ⚠️ Known Limitations (v1.0)

- Stripe is in TEST mode (not accepting real payments yet)
- Email sends via Resend (free tier: 3,000 emails/day)
- AI features use OpenAI GPT-4o (costs ~$0.001-0.01 per request)
- No SMS notifications (email only)
- No video upload support (photos only)
- Single-tenant (no organization/team support)

---

## 📞 Support & Escalation

**Critical Issues** (site down, payments broken)
→ Immediately contact Vercel support + Stripe support

**High Priority** (feature not working, data loss)
→ Review logs, rollback if needed, file GitHub issue

**Normal Issues** (UI bug, typo, feature request)
→ Create GitHub issue, plan for next sprint

---

**Last Updated**: May 19, 2026  
**Version**: 1.0  
**Status**: Ready for production deployment
