-- Extend catalog for RUB Mini App plans + local payment rows (YooKassa)

alter table app_plans add column if not exists price_rub numeric(12,2);
update app_plans set price_rub = coalesce(price_usd, 0) where price_rub is null;
alter table app_plans alter column price_rub set not null;
alter table app_plans alter column price_rub set default 0;

alter table app_plans add column if not exists device_limit integer;
update app_plans set device_limit = 1 where device_limit is null;
alter table app_plans alter column device_limit set not null;
alter table app_plans alter column device_limit set default 1;

alter table app_plans add column if not exists subtitle text;

alter table app_plans add column if not exists sort_order integer;
update app_plans set sort_order = 0 where sort_order is null;
alter table app_plans alter column sort_order set not null;
alter table app_plans alter column sort_order set default 0;

create table if not exists app_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  plan_id uuid not null references app_plans(id) on delete restrict,
  amount_usd numeric(10,2) not null default 0,
  amount_rub numeric(12,2) not null default 0,
  currency text not null,
  provider text not null,
  provider_payment_id text unique,
  status text not null check (status in ('pending','paid','failed','refunded')) default 'pending',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_app_payments_user on app_payments(user_id);
create index if not exists idx_app_payments_status on app_payments(status);

alter table app_payments enable row level security;
drop policy if exists app_payments_no_client_access on app_payments;
create policy app_payments_no_client_access on app_payments
  for all using (false) with check (false);
