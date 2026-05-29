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
  provider text default 'resend',
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
alter table public.profiles add column if not exists job_title text;
alter table public.profiles add column if not exists income_range text;

-- LANDLORD TOGGLE SETTINGS
alter table public.user_settings add column if not exists allow_employer_reference boolean default true;
alter table public.user_settings add column if not exists allow_previous_landlord_reference boolean default true;
alter table public.user_settings add column if not exists allow_certificate_uploads boolean default true;
alter table public.user_settings add column if not exists require_payment_proof boolean default true;

-- APPLICATIONS
create table if not exists public.applications (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  tenancy_id uuid references public.tenancies(id) on delete set null,
  applicant_id uuid references public.profiles(id) on delete set null,
  applicant_email text not null,
  applicant_name text,
  status text default 'submitted' check (status in ('submitted','reviewing','approved','declined')),
  rent_offer numeric,
  move_in_date date,
  message text,
  source text default 'link_importer',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.applications enable row level security;
create policy "applications_select" on public.applications for select to authenticated using (
  applicant_id = auth.uid() or property_id in (select id from public.properties where landlord_id = auth.uid())
);
create policy "applications_insert" on public.applications for insert to authenticated with check (
  applicant_id = auth.uid() or applicant_id is null
);
create policy "applications_update" on public.applications for update to authenticated using (
  applicant_id = auth.uid() or property_id in (select id from public.properties where landlord_id = auth.uid())
) with check (
  applicant_id = auth.uid() or property_id in (select id from public.properties where landlord_id = auth.uid())
);

-- MESSAGES
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references public.properties(id) on delete set null,
  tenancy_id uuid references public.tenancies(id) on delete set null,
  sender_id uuid references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete set null,
  content text not null,
  message_type text default 'message',
  metadata jsonb,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;
create policy "messages_select" on public.messages for select to authenticated using (
  sender_id = auth.uid()
  or recipient_id = auth.uid()
  or property_id in (select id from public.properties where landlord_id = auth.uid())
  or tenancy_id in (select id from public.tenancies where tenant_id = auth.uid() or landlord_id = auth.uid())
);
create policy "messages_insert" on public.messages for insert to authenticated with check (
  sender_id = auth.uid()
);
create policy "messages_update" on public.messages for update to authenticated using (
  sender_id = auth.uid()
) with check (
  sender_id = auth.uid()
);

-- PAYMENTS
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  tenancy_id uuid references public.tenancies(id) on delete set null,
  payer_id uuid references public.profiles(id) on delete cascade,
  landlord_id uuid references public.profiles(id) on delete cascade,
  amount numeric,
  payment_date date,
  reference text,
  proof_text text,
  proof_url text,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.payments enable row level security;
create policy "payments_select" on public.payments for select to authenticated using (
  payer_id = auth.uid()
  or landlord_id = auth.uid()
  or tenancy_id in (select id from public.tenancies where tenant_id = auth.uid() or landlord_id = auth.uid())
);
create policy "payments_insert" on public.payments for insert to authenticated with check (
  payer_id = auth.uid()
);
create policy "payments_update" on public.payments for update to authenticated using (
  payer_id = auth.uid() or landlord_id = auth.uid()
) with check (
  payer_id = auth.uid() or landlord_id = auth.uid()
);

-- RECEIPTS
create table if not exists public.receipts (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid references public.payments(id) on delete cascade,
  tenancy_id uuid references public.tenancies(id) on delete set null,
  issuer_id uuid references public.profiles(id) on delete set null,
  recipient_id uuid references public.profiles(id) on delete set null,
  amount numeric,
  date date,
  pdf_url text,
  file_path text,
  metadata jsonb,
  created_at timestamptz default now()
);
alter table public.receipts enable row level security;
create policy "receipts_select" on public.receipts for select to authenticated using (
  issuer_id = auth.uid() or recipient_id = auth.uid() or tenancy_id in (select id from public.tenancies where tenant_id = auth.uid() or landlord_id = auth.uid())
);
create policy "receipts_insert" on public.receipts for insert to authenticated with check (
  issuer_id = auth.uid()
);

-- REFERENCES
create table if not exists public.references (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid references public.applications(id) on delete cascade,
  requester_id uuid references public.profiles(id) on delete set null,
  provider_email text,
  provider_name text,
  status text default 'pending' check (status in ('pending','completed','declined')),
  reference_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.references enable row level security;
create policy "references_select" on public.references for select to authenticated using (
  requester_id = auth.uid()
  or application_id in (select id from public.applications where applicant_id = auth.uid())
  or application_id in (select id from public.applications where property_id in (select id from public.properties where landlord_id = auth.uid()))
);
create policy "references_insert" on public.references for insert to authenticated with check (
  requester_id = auth.uid()
);
create policy "references_update" on public.references for update to authenticated using (
  requester_id = auth.uid()
) with check (
  requester_id = auth.uid()
);

-- DOCUMENTS
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  tenancy_id uuid references public.tenancies(id) on delete set null,
  name text not null,
  description text,
  document_type text,
  file_path text,
  file_url text,
  ai_metadata jsonb,
  created_at timestamptz default now()
);
alter table public.documents enable row level security;
create policy "documents_select" on public.documents for select to authenticated using (
  user_id = auth.uid()
  or property_id in (select id from public.properties where landlord_id = auth.uid())
  or tenancy_id in (select id from public.tenancies where tenant_id = auth.uid() or landlord_id = auth.uid())
);
create policy "documents_insert" on public.documents for insert to authenticated with check (
  user_id = auth.uid()
);

-- MAINTENANCE REQUESTS
create table if not exists public.maintenance_requests (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  tenancy_id uuid references public.tenancies(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  photo_urls jsonb,
  status text default 'open' check (status in ('open','in_progress','resolved','closed')),
  priority text default 'medium',
  ai_suggested_action text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.maintenance_requests enable row level security;
create policy "maintenance_select" on public.maintenance_requests for select to authenticated using (
  created_by = auth.uid()
  or property_id in (select id from public.properties where landlord_id = auth.uid())
  or tenancy_id in (select id from public.tenancies where tenant_id = auth.uid() or landlord_id = auth.uid())
);
create policy "maintenance_insert" on public.maintenance_requests for insert to authenticated with check (
  created_by = auth.uid()
);
create policy "maintenance_update" on public.maintenance_requests for update to authenticated using (
  created_by = auth.uid() or property_id in (select id from public.properties where landlord_id = auth.uid())
) with check (
  created_by = auth.uid() or property_id in (select id from public.properties where landlord_id = auth.uid())
);

-- PROPERTY LINKS
create table if not exists public.property_links (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  url text not null,
  title text,
  source text default 'link_importer',
  status text default 'active',
  created_at timestamptz default now()
);
alter table public.property_links enable row level security;
create policy "property_links_select" on public.property_links for select to authenticated using (
  user_id = auth.uid()
  or property_id in (select id from public.properties where landlord_id = auth.uid())
);
create policy "property_links_insert" on public.property_links for insert to authenticated with check (
  user_id = auth.uid()
);
create policy "property_links_update" on public.property_links for update to authenticated using (
  user_id = auth.uid() or property_id in (select id from public.properties where landlord_id = auth.uid())
) with check (
  user_id = auth.uid() or property_id in (select id from public.properties where landlord_id = auth.uid())
);

-- RECEIPTS STORAGE BUCKET
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values
  ('documents', 'documents', true),
  ('contracts', 'contracts', false),
  ('property_photos', 'property_photos', true),
  ('inspections', 'inspections', true),
  ('maintenance', 'maintenance', true)
on conflict (id) do nothing;

drop policy if exists "auth_upload_receipts" on storage.objects;
create policy "auth_upload_receipts" on storage.objects for insert to authenticated
with check (bucket_id = 'receipts');

drop policy if exists "auth_read_receipts" on storage.objects;
create policy "auth_read_receipts" on storage.objects for select to authenticated
using (bucket_id = 'receipts');

drop policy if exists "auth_upload_documents" on storage.objects;
create policy "auth_upload_documents" on storage.objects for insert to authenticated
with check (bucket_id = 'documents');

drop policy if exists "auth_read_documents" on storage.objects;
create policy "auth_read_documents" on storage.objects for select to authenticated
using (bucket_id = 'documents');

drop policy if exists "auth_upload_contracts" on storage.objects;
create policy "auth_upload_contracts" on storage.objects for insert to authenticated
with check (bucket_id = 'contracts');

drop policy if exists "auth_read_contracts" on storage.objects;
create policy "auth_read_contracts" on storage.objects for select to authenticated
using (bucket_id = 'contracts');

drop policy if exists "auth_upload_property_photos" on storage.objects;
create policy "auth_upload_property_photos" on storage.objects for insert to authenticated
with check (bucket_id = 'property_photos');

drop policy if exists "auth_read_property_photos" on storage.objects;
create policy "auth_read_property_photos" on storage.objects for select to authenticated
using (bucket_id = 'property_photos');

drop policy if exists "auth_upload_inspections" on storage.objects;
create policy "auth_upload_inspections" on storage.objects for insert to authenticated
with check (bucket_id = 'inspections');

drop policy if exists "auth_read_inspections" on storage.objects;
create policy "auth_read_inspections" on storage.objects for select to authenticated
using (bucket_id = 'inspections');

drop policy if exists "auth_upload_maintenance" on storage.objects;
create policy "auth_upload_maintenance" on storage.objects for insert to authenticated
with check (bucket_id = 'maintenance');

drop policy if exists "auth_read_maintenance" on storage.objects;
create policy "auth_read_maintenance" on storage.objects for select to authenticated
using (bucket_id = 'maintenance');
