# Vercel Deployment Guide for TheHomeProof

## Step-by-Step Deployment Instructions

### 1. **Create a Vercel Account & Connect GitHub Repository**
   - Go to https://vercel.com/dashboard
   - Sign up or log in
   - Click **"Add New Project"**
   - Select **"Import Git Repository"**
   - Paste: `https://github.com/dnmagege/TheHomeProof.git`
   - Click **"Import"**

### 2. **Configure Project Settings**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - Click **"Deploy"**

### 3. **Add Environment Variables**
After the initial deploy, go to **Settings > Environment Variables** and add:

```
NEXT_PUBLIC_BASE_URL=https://thehomeproof.co.uk
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
OPENAI_API_KEY=<your-openai-api-key>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
STRIPE_PRICE_FREE=<your-free-price-id>
STRIPE_PRICE_PRO_MONTHLY=<your-pro-price-id>
STRIPE_PRICE_BUSINESS_MONTHLY=<your-business-price-id>
NEXT_PUBLIC_STRIPE_PRICE_PRO=<your-pro-price-id>
NEXT_PUBLIC_STRIPE_PRICE_BUSINESS=<your-business-price-id>
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=noreply@thehomeproof.co.uk
```

**Get these values from:**
- **Supabase**: Dashboard > Settings > API keys
- **OpenAI**: Platform > API keys
- **Stripe**: Developers > API keys
- **Resend**: Dashboard > API tokens

### 4. **Connect Custom Domain (thehomeproof.co.uk)**
   - Go to **Settings > Domains**
   - Click **"Add Domain"**
   - Enter: `thehomeproof.co.uk`
   - Update DNS records at your domain registrar:
     - **CNAME**: `cname.vercel-dns.com.`
     - Or use Vercel's managed DNS (recommended)

### 5. **Enable SSL/TLS**
   - Automatic: Vercel provides free SSL via Let's Encrypt
   - Go to **Settings > SSL/TLS**
   - Verify "Automatic" is selected
   - Status will show "Active" once domain is verified

### 6. **Configure Stripe Webhook**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Click **"Add endpoint"**
   - Endpoint URL: `https://thehomeproof.co.uk/api/stripe/webhook`
   - Events to listen: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`
   - Copy the Webhook Secret and add to Vercel env vars as `STRIPE_WEBHOOK_SECRET`

### 7. **Set Up Monitoring & Logging**
   - Enable **Analytics** in Vercel Settings
   - Add **Error Tracking** via Sentry (optional):
     1. Create account at sentry.io
     2. Add `NEXT_PUBLIC_SENTRY_DSN` env var
   - View logs in **Settings > Deployments > Logs**

### 8. **Enable Rate Limiting**
   - Vercel provides DDoS protection by default
   - Backend implements in-memory sliding window rate limiter:
     - Global: 120 req/min per IP
     - AI/Auth: 30 req/min per IP
     - Signup: 10 req/hour per IP

### 9. **Backup & Disaster Recovery**
   - Supabase handles data backups (included in all plans)
   - Stripe handles payment data (PCI compliance)
   - Code is version-controlled on GitHub

### 10. **Post-Deployment Checklist**
   - [ ] Test signup/login flow
   - [ ] Test Stripe checkout (use test card: 4242 4242 4242 4242)
   - [ ] Verify email sending via Resend
   - [ ] Check Stripe webhooks firing correctly
   - [ ] Test all AI features (inventory, contract, chat)
   - [ ] Verify domain SSL is active
   - [ ] Monitor error logs for issues

## Production Best Practices

### Security
- ✅ All secrets in Vercel environment (not in `.env`)
- ✅ CORS configured for production domain
- ✅ JWT auth via Supabase
- ✅ Row-level security (RLS) on all Supabase tables
- ✅ Stripe webhook signature verification
- ✅ Rate limiting on all public endpoints

### Performance
- ✅ Next.js automatic code splitting
- ✅ Image optimization via Next.js Image component
- ✅ Edge middleware for auth checks
- ✅ Caching headers configured

### Reliability
- ✅ Error tracking & alerting
- ✅ Automatic rollback on deploy failure
- ✅ Health check endpoint: `/api/`
- ✅ Database backup strategy

## Troubleshooting

**Deployment fails with "Module not found"**
- Run `npm install` locally and commit `package-lock.json`

**Domain shows "ERR_TOO_MANY_REDIRECTS"**
- Wait 24-48 hours for DNS propagation
- Check CNAME record points to `cname.vercel-dns.com.`

**Stripe webhooks not firing**
- Verify endpoint URL is correct in Stripe dashboard
- Check webhook logs in Stripe dashboard
- Ensure STRIPE_WEBHOOK_SECRET is set in Vercel

**Emails not sending**
- Verify RESEND_API_KEY is set in Vercel
- Check Resend dashboard for delivery failures
- Ensure sender domain is verified in Resend

## Monitoring & Maintenance

### Weekly
- Check Vercel analytics dashboard
- Review Stripe transaction logs
- Monitor Resend email delivery rates

### Monthly
- Review Supabase database usage
- Check for failed API requests in logs
- Update dependencies: `npm update`

### Quarterly
- Review & rotate API keys if needed
- Update SSL certificates (automatic)
- Audit user data for compliance

---

**Deployed URL**: https://thehomeproof.co.uk  
**GitHub Repo**: https://github.com/dnmagege/TheHomeProof  
**Deployment Dashboard**: https://vercel.com/dnmagege/thehomeproof
