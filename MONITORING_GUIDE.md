# Monitoring Guide - No Code Changes Needed

**Everything here is READ-ONLY. You're just checking things, not changing anything.**

---

## What to Monitor (Daily - 5 minutes)

### 1. Check Vercel Dashboard for Crashes
**URL**: https://vercel.com/dashboard

- [ ] Click your project name
- [ ] Look for red icons or errors
- [ ] If you see red: Screenshot and email to developer
- [ ] If green: Everything is running fine

**What you're looking for:**
- ✅ Green checkmark next to latest deployment = working
- ❌ Red X or error message = tell developer
- ⚠️ Any other warnings = probably ok but email developer

---

### 2. Check Sentry for Errors
**URL**: https://sentry.io (login with your account)

- [ ] Click your TheHomeProof project
- [ ] Look at "Issues" tab
- [ ] Any RED (unresolved errors)?

**If you see errors:**
```
1. Click the error
2. Note:
   - Error name/message
   - How many times it happened
   - Which user it affected
3. Email developer:
   Subject: "URGENT: Sentry error - [error name]"
   Body: "[Copy the error details]"
```

**Severity guide:**
- 🔴 **Critical** (app not working): Email immediately
- 🟡 **Medium** (feature broken): Email within 2 hours
- 🟢 **Low** (cosmetic, minor issue): Log but not urgent

---

### 3. Check Vercel Analytics
**URL**: https://vercel.com/dashboard → Your Project → Analytics

- [ ] Look at real-time traffic
- [ ] Are people hitting your app right now?
- [ ] Any geographic patterns (mostly UK? Good sign)

**This is just observational - no action needed, just track.**

---

### 4. Check Email Status (Resend)
**URL**: https://resend.com/emails

- [ ] Click "Emails" tab
- [ ] Scroll down to recent emails
- [ ] Look for red/failed emails
- [ ] Check if password reset emails arrived
- [ ] Check if tenant invitation emails are being sent

**If emails are failing:**
```
1. Note which email failed
2. Note the error (shown in Resend)
3. Email developer: "Resend error: [error name]"
```

---

### 5. Check Stripe Dashboard (If Live Payments)
**URL**: https://dashboard.stripe.com

- [ ] Look at "Payments" or "Transactions"
- [ ] Are payments going through?
- [ ] Any failed payments?
- [ ] Check "Webhooks" for any red X marks

**If payments are failing:**
```
Tell developer: "Stripe payment failed for [customer email]"
```

---

## Weekly Check (30 minutes on Friday)

### 1. Review Signups & Activity
From your tracking sheet:
- [ ] How many new signups this week?
- [ ] Which features are most used?
- [ ] Are users coming back? (active users trend)
- [ ] Any feature nobody uses?

### 2. Check Error Trends
**In Sentry:**
- [ ] Total errors this week vs last week
- [ ] Is error rate going up or down?
- [ ] Same errors repeating or new errors?

**Action:**
- If errors are increasing: Email developer
- If errors stable: Good sign
- If errors decreasing: Even better

### 3. Review User Feedback
- [ ] Did anyone report bugs?
- [ ] Are people asking for features?
- [ ] Any performance complaints?
- [ ] Create list for developer

### 4. Check Costs
**In Vercel + Supabase + Stripe dashboards:**
- [ ] Hosting cost this month
- [ ] Database cost
- [ ] Any surprise expenses?
- [ ] Note for budget planning

---

## Monthly Review (1 hour on last Friday)

### 1. Growth Metrics
```
This Month:
- Signups: __
- Active users: __
- Churn: __
- Revenue: £__

Compared to Last Month:
- Signups: __ (up/down %)
- Active users: __ (up/down %)
- Churn: __ (up/down %)
- Revenue: £__ (up/down %)
```

### 2. Error Analysis
```
Top 5 Errors This Month:
1. [Error name] - occurred __ times
2. [Error name] - occurred __ times
3. [Error name] - occurred __ times
4. [Error name] - occurred __ times
5. [Error name] - occurred __ times

Total error rate: __%
Target: <1%
```

### 3. Feature Usage
```
Most used features:
1. AI Inventory - 60% of users
2. Chat - 40% of users
3. Contract - 30% of users

Least used:
1. Rent Estimator - 5% of users
2. Damage Detection - 8% of users
```

### 4. Performance
```
Page load time: __ seconds (target <2s)
Uptime: __%  (target >99%)
Any performance issues: Yes/No
```

---

## Things You DON'T Need to Check (Developer's Job)

❌ Don't look at code  
❌ Don't change any settings on Vercel  
❌ Don't modify database directly  
❌ Don't mess with environment variables  
❌ Don't try to "fix" errors yourself  

**Just observe & report to developer.**

---

## Red Flags - Email Developer ASAP

### 🔴 Critical (Email NOW)

```
Subject: CRITICAL BUG - App not working

[Your note]:
- App won't load (red screen, 500 error)
- Stripe checkout broken (can't pay)
- Users can't sign up
- Database connection failed
- Any error preventing core function

This: Email developer immediately
```

### 🟡 Important (Email within 2 hours)

```
- Feature is broken but app still works
- AI features timing out
- Specific page crashes
- Specific user action fails

This: Email developer, mark as important
```

### 🟢 Nice-to-Have (Log and email later)

```
- Typo in UI
- Button styling off
- Performance could be better
- Non-critical feature issue

This: Track but not urgent
```

---

## How to Email Developer with Issues

**Template:**

```
Subject: [CRITICAL/IMPORTANT/BUG] [Brief description]

Body:

Issue: [What's broken?]
Severity: [Critical/Important/Minor]
When: [When did it start?]
Who: [User affected? All users?]
Error: [Any error message? Copy from Sentry]
Steps to reproduce: [How to see the problem]

Sentry link: [If from Sentry]
Stripe error: [If payment issue]

Thanks!
```

---

## What Good Monitoring Looks Like

✅ You check these daily:
- Vercel (any red flags?)
- Sentry (any errors?)
- Basic stats (users, signups)

✅ You check weekly:
- Error trends
- User feedback
- Feature usage

✅ You report immediately:
- Any critical issue
- Any red flags
- Any customer problems

✅ You never:
- Touch production code (developer does)
- Modify settings (ask first)
- Make assumptions (always ask developer)

---

## Tools You Need Access To

Make sure you have logins for:
- [ ] Vercel dashboard
- [ ] Sentry
- [ ] Stripe dashboard
- [ ] Resend dashboard (email service)
- [ ] Google Sheets (tracking)

If you don't have access → ask developer for it now.

---

## Dashboard at a Glance

**Create a simple bookmark folder with:**
1. Vercel Dashboard
2. Sentry Issues
3. Tracking Sheet
4. Stripe Dashboard
5. Resend Emails

**Check order (daily, 5 min):**
1. Vercel - green? → Good
2. Sentry - errors? → Report
3. Tracking sheet - growth? → Update
4. Done

---

## Summary

**You are the "canary in the coal mine."**

You notice things. You report things. You track things.

**You do NOT fix things** - developer does.

**Daily (5 min):**
- Vercel green?
- Sentry errors?
- Emails sending?

**Weekly (30 min):**
- Growth trends
- Error trends
- User feedback

**Monthly (1 hour):**
- Full review
- Report to developer

That's it. You're the guardian of production quality.

---

## If Developer Says "Check Sentry"

**In Sentry:**

1. Go to Issues tab
2. Click the error name
3. Look for:
   - How many times it happened
   - Which user affected
   - Stack trace (technical details)
   - Breadcrumbs (what happened before error)
4. Screenshot or copy
5. Send to developer with: "Here's the full error from Sentry"

**That's all you need to do.**

---

**You've got this. Boring monitoring saves fires later.** 🔥🚒

