-- =====================================================
-- AI LANDLORD-TENANT MANAGEMENT SYSTEM - SUPABASE SCHEMA
-- Run this entire file in Supabase Dashboard > SQL Editor
-- =====================================================

create extension if not exists "uuid-ossp";

-- PROFILES (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  name text,
  role text check (role in ('landlord', 'tenant')) default 'tenant',
  created_at timestamptz default now()
);

-- PROPERTIES
create table if not exists public.properties (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  address_line1 text not null,
  address_line2 text,
  city text,
  postcode text,
  country text default 'UK',
  created_at timestamptz default now()
);

-- TENANCIES
create table if not exists public.tenancies (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id uuid references public.profiles(id) on delete set null,
  tenant_email text,
  start_date date,
  end_date date,
  rent_amount numeric,
  rent_frequency text default 'monthly',
  deposit_amount numeric,
  created_at timestamptz default now()
);

-- CONTRACTS
create table if not exists public.contracts (
  id uuid primary key default uuid_generate_v4(),
  tenancy_id uuid not null references public.tenancies(id) on delete cascade,
  file_url text,
  file_path text,
  raw_text text,
  ai_summary_json jsonb,
  created_at timestamptz default now()
);

-- INVENTORIES
create table if not exists public.inventories (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  tenancy_id uuid references public.tenancies(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  photos_json jsonb,
  ai_inventory_json jsonb,
  created_at timestamptz default now()
);

-- INSPECTIONS
create table if not exists public.inspections (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  tenancy_id uuid references public.tenancies(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  before_photos_json jsonb,
  after_photos_json jsonb,
  ai_report_json jsonb,
  created_at timestamptz default now()
);

-- ISSUES
create table if not exists public.issues (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  tenancy_id uuid references public.tenancies(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  photos_json jsonb,
  status text default 'open',
  ai_drafted_message text,
  created_at timestamptz default now()
);

-- COMPLIANCE ITEMS
create table if not exists public.compliance_items (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  type text not null,
  expiry_date date,
  created_at timestamptz default now()
);

-- NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  type text,
  sent_at timestamptz default now()
);

-- =====================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'tenant')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY
-- (API routes use service_role to manage data; these basic policies allow logged-in users to read their own data)
-- =====================================================
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.tenancies enable row level security;
alter table public.contracts enable row level security;
alter table public.inventories enable row level security;
alter table public.inspections enable row level security;
alter table public.issues enable row level security;
alter table public.compliance_items enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "users_read_own_profile" on public.profiles;
create policy "users_read_own_profile" on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists "users_update_own_profile" on public.profiles;
create policy "users_update_own_profile" on public.profiles for update to authenticated using (id = auth.uid());

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('inspections', 'inspections', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('issues', 'issues', true)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "auth_upload_property_photos" on storage.objects;
create policy "auth_upload_property_photos" on storage.objects for insert to authenticated
with check (bucket_id in ('property-photos', 'inspections', 'issues'));

drop policy if exists "public_read_property_photos" on storage.objects;
create policy "public_read_property_photos" on storage.objects for select to public
using (bucket_id in ('property-photos', 'inspections', 'issues'));

drop policy if exists "auth_upload_contracts" on storage.objects;
create policy "auth_upload_contracts" on storage.objects for insert to authenticated
with check (bucket_id = 'contracts');

drop policy if exists "auth_read_contracts" on storage.objects;
create policy "auth_read_contracts" on storage.objects for select to authenticated
using (bucket_id = 'contracts');
