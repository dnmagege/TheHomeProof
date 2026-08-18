# User Tracking & Feedback Template

**Copy this into Google Sheets. Update daily.**

---

## Daily Metrics (Top of Sheet)

```
DATE: [Today]

DAILY STATS:
- New signups today: __
- Active users (logged in): __
- AI features used: __
- Errors in Sentry: __
- Revenue today: £__

CUMULATIVE:
- Total signups: __
- Total active users: __
- Total MRR: £__
```

---

## User Tracking Table

| Name | Email | Signup Date | Source | Tried Feature? | Which Feature? | Feedback | Status | Notes |
|------|-------|------------|--------|---|---|---|---|---|
| John | john@ex.com | Jun 1 | Email | Yes | AI Inventory | "Works great" | Active | Early user, will refer |
| Sarah | sarah@re.com | Jun 2 | Reddit | Yes | Contract | "Confusing" | Need Follow-up | Ask what was confusing |
| [Name] | [email] | [date] | [source] | Y/N | [feature] | [feedback] | [Active/Churn] | [Any notes] |

---

## Source Tracking (How They Found You)

Categories to use:
- **Email**: Personal network
- **Reddit**: Which subreddit?
- **Twitter**: Direct link mention
- **Organic**: Google search (if ever)
- **Other**: Referral from existing user

**Count by source:**
```
Total signups: 47
- Email: 15 (32%)
- Reddit: 18 (38%)
- Twitter: 8 (17%)
- Referral: 6 (13%)
```

**Insight:** If Reddit is 38%, double down on Reddit.

---

## Feedback Tracking

| User | Feedback | Category | Action Taken | Priority |
|------|----------|----------|--------------|----------|
| John | "Hard to upload multiple photos" | UX Issue | Mark for later | Low |
| Sarah | "App crashed on iPhone" | Bug | TELL DEVELOPER | 🔴 Critical |
| Mike | "Love the contract parser, saves so much time!" | Positive | Use as testimonial | ⭐ Gold |
| Amy | "Would pay £19/mo if..." | Feature Request | Add to backlog | Medium |

---

## Bug Tracking

If user reports issue:

| Bug | Reported By | Date | Severity | Status | Action |
|-----|-------------|------|----------|--------|--------|
| "Stripe button not clickable on mobile" | John | Jun 2 | 🔴 Critical | OPEN | Tell developer immediately |
| "Photos take forever to upload" | Sarah | Jun 3 | 🟡 Medium | OPEN | Ask if network slow or app issue |
| "Dark mode text hard to read" | Mike | Jun 4 | 🟢 Low | CLOSED | Fixed in next release |

**CRITICAL:** Any "🔴 Critical" bug = Tell developer immediately

---

## Engagement Scoring

For each user, track engagement:

| User | Signup | Day 1 | Day 3 | Day 7 | Day 14 | Status |
|------|--------|-------|--------|-------|---------|--------|
| John | ✓ | Tried AI | Used chat | Upgraded Pro | - | 🟢 Power User |
| Sarah | ✓ | Tried AI | Inactive | Inactive | Inactive | 🔴 Likely Churn |
| Mike | ✓ | Tried AI | Tried AI | Used 3x | Active | 🟡 Engaged |

**Legend:**
- 🟢 Active/Power User: Using app multiple times per week
- 🟡 Engaged: Using app but not frequent
- 🟠 At Risk: Only tried once, hasn't returned
- 🔴 Churned: Signed up but never came back

**Action for 🟠 & 🔴:**
```
Email template:
"Hi [Name], we noticed you tried TheHomeProof but haven't come back. 
What didn't work? We'd love to fix it.

Feedback (even negative) really helps.
- The app was confusing
- It didn't solve my problem
- I forgot about it
- [Other]

Reply or let us know!"
```

---

## Feature Usage Tracking

Track which features people use most:

| Feature | Week 1 Users | Week 2 Users | Week 3 Users | Trend |
|---------|--------------|--------------|--------------|-------|
| AI Inventory | 12 | 18 | 24 | ⬆️ Up |
| AI Contract | 8 | 10 | 11 | ➡️ Flat |
| AI Damage | 5 | 6 | 7 | ⬆️ Slow |
| Chat Copilot | 3 | 4 | 5 | ⬆️ Slow |
| Rent Estimator | 2 | 3 | 4 | ⬆️ Slow |

**Insight:** AI Inventory is most popular. Feature that most.

---

## Daily Check-In (5 minutes)

Every morning, update this:

```
TODAY'S DATE: [Date]

OVERNIGHT ACTIONS:
- New signups: __ (source: ___)
- Errors in Sentry: __ (severity: ___)
- Stripe payments: £__ 
- Email opened: __ (from yesterday's sends)

TODAY'S TO-DO:
- [ ] Respond to all user emails (<2 hours)
- [ ] Check Sentry for new errors
- [ ] Engage on Reddit/Twitter
- [ ] Track any feedback
- [ ] Note any bugs
```

---

## Weekly Summary (30 min on Friday)

```
WEEK OF: [Date]

SIGNUPS:
- Total: __ 
- From Email: __
- From Reddit: __
- From Twitter: __
- Best day: __

ENGAGEMENT:
- Users active: __
- Features used: __
- Most popular feature: __

CHURN:
- Users who only tried once: __
- Users who upgraded to Pro: __

FEEDBACK THEMES (Top 3):
1. "Easy to use but..."
2. "Confused by..."
3. "Would use if..."

BUGS FOUND:
- Critical: __ (need developer)
- Medium: __
- Low: __

NEXT WEEK FOCUS:
- Fix top 2 bugs
- Double down on: [best channel]
- Test: [new idea]
```

---

## Monthly Review (Every 30 Days)

```
MONTH OF: [Month]

GROWTH:
- Started month with: __ users
- Ended month with: __ users
- Growth: __%

REVENUE:
- Free signups: __
- Pro conversions: __
- MRR: £__

TOP INSIGHTS:
1. Best channel: Reddit (38% of signups)
2. Most used feature: AI Inventory (60% of users)
3. Churn rate: __% (target: <5%/month)

WHAT WORKED:
- [Strategy that got results]
- [Tactic that worked]
- [User segment that engaged]

WHAT DIDN'T:
- [Channel that flopped]
- [Feature nobody uses]
- [Message that didn't resonate]

NEXT MONTH PLAN:
- Focus on: [best channel]
- Build: [requested feature]
- Try: [new channel]
```

---

## How to Use This

**Week 1:**
- Update "Daily Metrics" section daily (2 min)
- Log new users as they come in (1 min/user)
- Note feedback in "Feedback Tracking" (2 min/feedback)

**Week 2:**
- Do Friday Weekly Summary (30 min)
- Review "Engagement Scoring" - reach out to 🟠 users

**Week 3+:**
- Continue daily tracking
- Monthly review at month-end
- Use data to decide: where to focus next?

---

## Why This Matters

This sheet answers:
1. "Are we growing?" (Signup trend)
2. "Where do users come from?" (Source tracking)
3. "Are they actually using it?" (Feature tracking)
4. "What's broken?" (Bug tracking)
5. "Who's staying?" (Engagement scoring)
6. "What should I do next?" (Insights)

Without this, you're flying blind. With it, you make data-driven decisions.

---

## Quick Copy Template

```
Paste this into Google Sheets and fill it daily:

| Date | New Signups | Source | Features Used | Feedback | Errors | Revenue |
|------|------------|--------|---|---|---|---|
| Jun 1 | 5 | Email(3), Reddit(2) | Inventory(3), Contract(1) | "Easy!" | 0 | £0 |
| Jun 2 | 8 | Reddit(5), Twitter(3) | Inventory(5), Chat(1) | Mixed | 1 | £19 |
```

That's it. Boring but essential.
