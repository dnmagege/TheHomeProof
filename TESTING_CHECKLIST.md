# Testing Checklist - Full Verification (60 minutes)

**Purpose**: Verify all critical features are working before Week 1 user acquisition  
**Time**: 60 minutes total  
**Success Criteria**: All 5 tests pass with no critical errors

---

## Test 1: Stripe Webhook Verification (15 minutes)

**Objective**: Verify Stripe webhook is connected and firing correctly

### Step 1.1: Go to Stripe Dashboard
- [ ] Open browser
- [ ] Go to https://dashboard.stripe.com/login
- [ ] Sign in with your Stripe account
- [ ] Make sure you're in **TEST MODE** (toggle in top-left corner)

### Step 1.2: Find Your Webhook
- [ ] Left sidebar → Click **"Webhooks"** (under Developers)
- [ ] Look for endpoint ending in `/api/stripe/webhook`
- [ ] Click on it to open details
- [ ] You should see:
  - Status: **Active** ✅
  - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`

### Step 1.3: Send Test Webhook
- [ ] Click **"Send test event"** (top-right button)
- [ ] Select event type: **`checkout.session.completed`**
- [ ] Click **"Send event"**
- [ ] You should see:
  - Response status: **200** (green checkmark) ✅
  - Message: "Event sent successfully"

### Step 1.4: Verify in Vercel Logs
- [ ] Open https://vercel.com/dashboard → Your Project
- [ ] Click **"Deployments"** → Latest deployment (green checkmark)
- [ ] Click **"Runtime logs"** tab
- [ ] Look for logs from last 5 minutes
- [ ] You should see:
  - `✅ Stripe webhook received: checkout.session.completed`
  - No error messages

**✅ Test 1 PASS**: Webhook returns 200, logs show no errors  
**❌ Test 1 FAIL**: Webhook returns non-200, or no logs appear → Email developer

---

## Test 2: End-to-End Payment Flow (30 minutes)

**Objective**: Verify complete payment signup → subscription flow works

### Step 2.1: Clean Slate (Use Fresh Email)
- [ ] Create a new email for testing (e.g., `test.user.aug14@gmail.com`)
  - OR use existing test email you haven't used before
- [ ] Keep this email handy - you'll need it multiple times

### Step 2.2: Signup on App
- [ ] Go to https://thehomeproof.co.uk
- [ ] Click **"Get Started"** button (top-right)
- [ ] Fill signup form:
  - **Name**: "Test User"
  - **I am a**: "Landlord"
  - **Email**: `test.user.aug14@gmail.com`
  - **Password**: `Test123456!` (must be >6 chars)
- [ ] Click **"Sign Up"**
- [ ] **Expected result**: ✅ Dashboard loads (shows empty "Properties" tab)

**If signup fails**:
- Check error message
- Try again with different password
- If still fails → Check Sentry for error

### Step 2.3: Go to Pricing
- [ ] Dashboard loads successfully
- [ ] Look for **Pricing** or **Upgrade** section
  - Usually: Top-right menu → "Settings" or "Billing"
  - OR: Main dashboard has pricing cards
- [ ] You should see 3 plans:
  - Free (£0) - Current plan ✅
  - Pro (£19/month)
  - Business (£49/month)

### Step 2.4: Click "Pro" Plan
- [ ] On **Pro** card, click **"Upgrade"** or **"Choose Plan"**
- [ ] **Expected result**: Stripe checkout page loads
  - Shows: "Pro" plan details
  - Shows: £19.00 per month
  - Payment form with email field (should be pre-filled)

### Step 2.5: Enter Test Card Details
- [ ] Fill payment form:
  - **Card Number**: `4242 4242 4242 4242`
  - **Expiry**: `12 / 34`
  - **CVC**: `123`
  - **Name**: "Test User"
  - **Country**: "United Kingdom"
- [ ] Click **"Pay now"** or **"Subscribe"**
- [ ] **Expected result**: 
  - ✅ Page shows "Payment successful" or redirects to dashboard
  - OR: Shows "Subscription created"

**If payment fails**:
- Stripe might reject test card (shouldn't happen with 4242 4242...)
- Try again
- If it fails 2x → Check Sentry for payment processing error

### Step 2.6: Verify in Dashboard
- [ ] After payment, you're back on dashboard
- [ ] Look for **Plan indicator**:
  - Should show: "Pro" or "£19/month" somewhere
  - Previously showed "Free"
- [ ] Click **Settings** (if visible)
- [ ] Should show: Plan = "Pro" ✅

### Step 2.7: Verify in Supabase (Optional - Advanced)
- [ ] Go to https://app.supabase.com → Your project
- [ ] Left sidebar → SQL Editor
- [ ] Run this query:
```sql
SELECT user_id, plan_id, stripe_subscription_id, current_period_end 
FROM user_subscriptions 
ORDER BY created_at DESC 
LIMIT 1;
```
- [ ] **Expected result**: 
  - `plan_id`: "pro" ✅
  - `stripe_subscription_id`: Starts with "sub_" ✅
  - `current_period_end`: Date ~30 days from now ✅

**✅ Test 2 PASS**: Payment succeeds, dashboard shows Pro plan  
**❌ Test 2 FAIL**: Payment rejected or plan doesn't update → Email developer with error message

---

## Test 3: AI Features - Rent Estimator (15 minutes)

**Objective**: Verify at least 1 AI feature works (Rent Estimator is fastest to test)

### Step 3.1: Navigate to AI Feature
- [ ] You're logged in on dashboard (from Test 2)
- [ ] Look for tabs at top or sidebar
- [ ] Click **"AI Rent"** tab
- [ ] **Expected result**: Rent Estimator form loads with fields

### Step 3.2: Fill Form
- [ ] Fill the form:
  - **Property**: Select from dropdown (create one first if needed)
  - **City**: "London"
  - **Bedrooms**: "2"
  - **Bathrooms**: "1"
  - **Type**: "Apartment"
  - **Condition**: "Good"
  - **Furnishing**: "Unfurnished"
- [ ] Leave Notes blank (optional)
- [ ] Click **"Estimate Rent"** button

### Step 3.3: Wait for AI Response
- [ ] Button shows loading spinner: "Analyzing market..."
- [ ] **⏱️ TIME THIS**: Start stopwatch
- [ ] Wait for response...
- [ ] **⏱️ Response should arrive within: 15-20 seconds**

### Step 3.4: Verify Response
- [ ] After ~15-20s, result displays:
```
Conservative    Expected    Optimistic
£1,200/month   £1,450/mo   £1,650/mo
confidence: high
```
- [ ] Should show:
  - ✅ Three price ranges
  - ✅ Confidence level (high/medium/low)
  - ✅ Factors increasing/decreasing value
  - ✅ Marketing tips (optional)

**✅ Test 3 PASS**: Response within 20s, shows proper format  
**❌ Test 3 FAIL**: Error message, or response >30s → Check Sentry

### Step 3.5 (Optional): Test Another AI Feature
**If you want bonus points**, also test:
- **Inventory Generator**: Create property → Upload 3 photos → AI analyzes them (~20s)
- **Chat**: Click "Chat" tab → Type "What is fair wear and tear?" → AI responds (~10s)

---

## Test 4: Email Verification (10 minutes)

**Objective**: Verify emails are sending from Resend

### Step 4.1: Check Signup Email
- [ ] Go to email inbox for `test.user.aug14@gmail.com`
- [ ] Look for emails from: `no-reply@thehomeproof.co.uk`
- [ ] You should have received:
  - [ ] Signup confirmation (if sent)
  - [ ] Welcome email

**Expected**:
- ✅ Email arrives within 2 minutes
- ✅ Subject line is clear
- ✅ Links work (don't click unless testing password reset)

**If no email**:
- [ ] Check spam folder
- [ ] Wait 2 more minutes
- [ ] If still nothing → Check Sentry for email sending error

### Step 4.2: Request Password Reset (Test Email Sending)
- [ ] Go to https://thehomeproof.co.uk → "Sign In"
- [ ] Click "Forgot password?"
- [ ] Enter email: `test.user.aug14@gmail.com`
- [ ] Click "Send reset link"
- [ ] You should see: "Check your email for reset instructions"

### Step 4.3: Verify Reset Email
- [ ] Check inbox again
- [ ] Look for: "Reset your password" or similar
- [ ] **Expected**:
  - ✅ Email arrives within 2 minutes
  - ✅ Contains reset link
  - ✅ Link starts with `https://thehomeproof.co.uk`

**✅ Test 4 PASS**: Emails arrive within 2 min, links work  
**❌ Test 4 FAIL**: No emails or links broken → Email developer with which email failed

---

## Test 5: Sentry Error Checking (10 minutes)

**Objective**: Verify no critical errors occurred during testing

### Step 5.1: Go to Sentry Dashboard
- [ ] Open https://sentry.io
- [ ] Sign in with your Sentry account
- [ ] Click **"TheHomeProof"** project
- [ ] You should see dashboard with "Issues" tab

### Step 5.2: Review Issues Tab
- [ ] Click **"Issues"** tab (should be default)
- [ ] Look at list of errors

**Expected scenarios**:

#### Scenario A: No errors (IDEAL) ✅
- [ ] List is empty or says "No issues found"
- [ ] **Result**: PERFECT - Zero errors

#### Scenario B: Some errors but all LOW priority ✅
- [ ] List shows errors like:
  - "User clicked button too fast"
  - "Image failed to load"
  - "Browser extension interfered"
- [ ] **Result**: OK - Non-critical issues
- [ ] **Action**: Ignore these

#### Scenario C: CRITICAL errors ❌
- [ ] List shows:
  - "Payment processing failed"
  - "Database connection error"
  - "Authentication failed"
  - "API rate limit exceeded"
- [ ] **Result**: PROBLEM - Need to fix
- [ ] **Action**: Email developer with error details

### Step 5.3: Check Error Details (If Any)
- [ ] Click on any error
- [ ] You'll see details:
  - Error name
  - How many times it occurred
  - Stack trace (technical details)
  - Affected user
  - Timestamp

### Step 5.4: Filter by Severity
- [ ] Look for filter: **"Level"** or **"Severity"**
- [ ] Filter to show only: **"Error"** and **"Fatal"**
- [ ] Any results?
  - **No**: ✅ Great - no critical errors
  - **Yes**: Note the error names and send to developer

**✅ Test 5 PASS**: 0-2 non-critical errors, no Fatal/Error level issues  
**❌ Test 5 FAIL**: Multiple critical errors → Contact developer immediately

---

## Summary Sheet (Copy & Fill)

```
TEST RESULTS - Date: ___________

[ ] Test 1: Stripe Webhook
    Status: PASS / FAIL
    Details: ___________________________________________

[ ] Test 2: Payment End-to-End  
    Status: PASS / FAIL
    Plan after payment: Free / Pro / Business
    Details: ___________________________________________

[ ] Test 3: AI Feature (Rent Estimator)
    Status: PASS / FAIL
    Response time: _____ seconds
    Result format: Correct / Incorrect
    Details: ___________________________________________

[ ] Test 4: Email Verification
    Status: PASS / FAIL
    Signup email received: Yes / No
    Reset email received: Yes / No
    Details: ___________________________________________

[ ] Test 5: Sentry Errors
    Status: PASS / FAIL
    Number of critical errors: _____
    Error types (if any): ___________________________________________

OVERALL: [ ] ALL PASS - Ready to Launch
         [ ] SOME FAIL - See details below
         [ ] CRITICAL FAIL - Do not launch

NOTES:
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________
```

---

## What to Do Based on Results

### ✅ All 5 Tests Pass
**Congratulations!** Your app is production-ready.

**Next step**: Execute FIRST_100_USERS_PLAN.md Week 1 Day 1 actions:
1. Send emails to 20-30 personal contacts
2. Post to r/Landlords
3. Monitor tracking sheet

---

### 🟡 1-2 Tests Fail
**These are minor issues.** Identify which test failed:

**Test 1 failed** (Webhook):
- Likely: Webhook URL misconfigured in Stripe
- Action: Email developer "Stripe webhook not firing"

**Test 2 failed** (Payment):
- Likely: Stripe API keys missing or incorrect
- Action: Email developer with error message from checkout page

**Test 3 failed** (AI):
- Likely: OpenAI API key missing or rate limited
- Action: Email developer "AI endpoint timeout"

**Test 4 failed** (Email):
- Likely: Resend API key missing or email address bounced
- Action: Email developer "Emails not sending from Resend"

**Test 5 failed** (Sentry):
- Likely: Non-critical errors from your tests
- Action: Review which errors appeared, email developer only if "Fatal" or "Error" level

**Decision**: If only 1-2 fail and they're NOT payments or auth, you can still launch but fix within 48 hours.

---

### ❌ 3+ Tests Fail or Payment/Auth Fails
**Do NOT launch yet.** 

**Action**:
1. Screenshot all failed tests
2. Note exact error messages
3. Email developer with details
4. Do NOT share your app publicly until fixed

---

## Email Template for Developer

**If tests fail, use this template:**

```
Subject: Post-Launch Testing Results - Issues Found

Hi [Developer],

I ran the smoke tests from SMOKE_TEST_REPORT.md. Here's what failed:

TEST 1: Stripe Webhook
Status: [PASS/FAIL]
Error: [Copy exact error or "No error"]

TEST 2: Payment
Status: [PASS/FAIL]  
Error: [Copy exact error or "Payment rejected at step..."]

TEST 3: AI Feature
Status: [PASS/FAIL]
Error: [Copy exact error or "Response timeout"]

TEST 4: Email
Status: [PASS/FAIL]
Error: [Copy exact error or "No email received"]

TEST 5: Sentry
Status: [PASS/FAIL]
Critical Errors: [List any Fatal/Error level issues]

SENTRY LINK: [Paste link to error]

Please fix these so I can launch Week 1 user acquisition.

Thanks,
[Your name]
```

---

## Tips for Success

1. **Do tests in order** (1→2→3→4→5)
   - Each test builds on previous ones
   - If signup fails, you can't test payment

2. **Use FRESH email** for testing
   - Prevents interference from previous tests
   - Easier to track which email you're testing

3. **Wait for full responses**
   - AI features take 15-20 seconds
   - Don't refresh/close tab before response arrives

4. **Check browser console** if something breaks
   - Right-click → Inspect → Console tab
   - Look for red error messages
   - Copy and send to developer

5. **Take screenshots** of any errors
   - Makes debugging much faster
   - Developer can see exact error message

---

## Estimated Timeline

| Test | Time | Complexity |
|------|------|-----------|
| 1. Webhook | 15 min | Easy (mostly waiting) |
| 2. Payment | 30 min | Medium (requires real payment) |
| 3. AI Feature | 15 min | Medium (waiting for AI response) |
| 4. Email | 10 min | Easy (check inbox) |
| 5. Sentry | 10 min | Easy (dashboard review) |
| **TOTAL** | **80 min** | **Overall: Medium** |

---

**Good luck! You've got this. 🚀**

After these tests pass, you're ready to launch Week 1 user acquisition.
