-- GoldNight VPN v2 (MiniApp-first) schema for Supabase Postgres
-- Apply in a new Supabase project during cutover.

create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id text not null unique,
  username text,
  first_name text,
  last_name text,
  referral_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  token_id text not null unique,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
create index if not exists idx_app_sessions_user_id on app_sessions(user_id);

create table if not exists app_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  price_usd numeric(10,2) not null check (price_usd >= 0),
  duration_days integer not null check (duration_days > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  plan_id uuid not null references app_plans(id) on delete restrict,
  status text not null check (status in ('active','pending','expired','cancelled')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_app_subscriptions_user_status on app_subscriptions(user_id, status);
create index if not exists idx_app_subscriptions_ends_at on app_subscriptions(ends_at);

create table if not exists app_vpn_access_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  plan_id uuid references app_plans(id) on delete set null,
  provider text not null,
  access_type text not null,
  status text not null check (status in ('active','expired','revoked')),
  external_access_id text,
  value text,
  qr_value text,
  config_file_url text,
  deep_link_template text,
  expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, provider)
);
create index if not exists idx_app_vpn_access_user_status on app_vpn_access_records(user_id, status);

create table if not exists app_vpn_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  device_fingerprint text not null,
  platform text not null,
  label text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, device_fingerprint)
);

create table if not exists app_referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references app_users(id) on delete cascade,
  invited_user_id text not null,
  reward_granted boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_app_referrals_inviter on app_referrals(inviter_user_id);

create table if not exists app_support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  subject text not null,
  message text not null default '',
  status text not null check (status in ('open','in_progress','closed')) default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_app_support_user_status on app_support_requests(user_id, status);

create table if not exists app_billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete set null,
  subscription_id uuid references app_subscriptions(id) on delete set null,
  event_type text not null,
  provider text,
  amount_usd numeric(10,2),
  currency text,
  payload jsonb,
  created_at timestamptz not null default now()
);
