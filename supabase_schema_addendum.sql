-- =====================================================
-- HOMEPROOF PHASE 1 SCHEMA ADDENDUM
-- Run this in Supabase SQL Editor AFTER the original schema
-- Adds: audit_logs, email_logs, activity_logs, subscription_plans, user_settings
-- =====================================================

-- USER SETTINGS (preferences)
create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  language text default 'en',
  currency text default 'GBP',
  theme text default 'light',
  email_notifications boolean default true,
  in_app_notifications boolean default true,
  timezone text default 'Europe/London',
  updated_at timestamptz default now()
);
alter table public.user_settings enable row level security;
drop policy if exists "users_manage_own_settings" on public.user_settings;
create policy "users_manage_own_settings" on public.user_settings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ACTIVITY LOGS (in-app feed: who did what)
create table if not exists public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  property_id uuid references public.properties(id) on delete cascade,
  tenancy_id uuid references public.tenancies(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_activity_property on public.activity_logs(property_id, created_at desc);
create index if not exists idx_activity_user on public.activity_logs(user_id, created_at desc);
alter table public.activity_logs enable row level security;

-- AUDIT LOGS (security/compliance — who changed what)
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  user_email text,
  action text not null,
  resource text,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);
create index if not exists idx_audit_user on public.audit_logs(user_id, created_at desc);
create index if not exists idx_audit_resource on public.audit_logs(resource, resource_id);
alter table public.audit_logs enable row level security;

-- EMAIL LOGS (SendGrid sends)
create table if not exists public.email_logs (
  id uuid primary key default uuid_generate_v4(),
  sender_user_id uuid references public.profiles(id) on delete set null,
  recipient_email text not null,
  subject text,
  body text,
  related_entity_type text,
  related_entity_id uuid,
  provider text default 'sendgrid',
  provider_message_id text,
  status text default 'sent',
  error_message text,
  sent_at timestamptz default now()
);
create index if not exists idx_email_logs_sender on public.email_logs(sender_user_id, sent_at desc);
alter table public.email_logs enable row level security;

-- SUBSCRIPTION PLANS
create table if not exists public.subscription_plans (
  id text primary key,
  name text not null,
  description text,
  price_monthly_cents integer not null default 0,
  price_yearly_cents integer not null default 0,
  currency text default 'GBP',
  max_properties integer,
  max_ai_runs_per_month integer,
  features jsonb,
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- Seed default plans
insert into public.subscription_plans (id, name, description, price_monthly_cents, price_yearly_cents, currency, max_properties, max_ai_runs_per_month, features, display_order) values
  ('free', 'Free', 'Try HomeProof free forever', 0, 0, 'GBP', 1, 10, '["1 property", "10 AI runs / month", "All AI tools", "Multi-language UI"]', 1),
  ('pro', 'Pro', 'For active landlords', 1900, 19000, 'GBP', 10, 200, '["Up to 10 properties", "200 AI runs / month", "PDF inventory exports", "AI Dispute Evidence Builder", "Email tenant", "Priority support"]', 2),
  ('business', 'Business', 'For letting agencies & portfolio landlords', 4900, 49000, 'GBP', 100, 2000, '["Up to 100 properties", "2000 AI runs / month", "Audit logs export", "Custom branding", "API access", "Dedicated support"]', 3)
on conflict (id) do update set name = excluded.name, description = excluded.description, price_monthly_cents = excluded.price_monthly_cents, price_yearly_cents = excluded.price_yearly_cents, features = excluded.features, max_properties = excluded.max_properties, max_ai_runs_per_month = excluded.max_ai_runs_per_month;

-- USER SUBSCRIPTION
create table if not exists public.user_subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan_id text references public.subscription_plans(id),
  status text default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  ai_runs_used_this_month integer default 0,
  ai_runs_reset_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table public.user_subscriptions enable row level security;
drop policy if exists "users_read_own_sub" on public.user_subscriptions;
create policy "users_read_own_sub" on public.user_subscriptions for select to authenticated using (user_id = auth.uid());

-- DISPUTES (for the new AI Dispute Evidence Builder)
create table if not exists public.disputes (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  tenancy_id uuid references public.tenancies(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  dispute_type text,
  tenant_position text,
  landlord_position text,
  evidence_urls jsonb,
  ai_evidence_bundle jsonb,
  status text default 'open',
  created_at timestamptz default now()
);
alter table public.disputes enable row level security;

-- Add country column to profiles if missing (for localization defaults)
alter table public.profiles add column if not exists country text default 'GB';
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists avatar_url text;
