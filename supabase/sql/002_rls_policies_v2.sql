-- RLS baseline for MiniApp-first v2 schema.
-- Assumption: API uses SUPABASE_SERVICE_ROLE_KEY for server-side access.
-- Client-side direct DB access is not part of this architecture.

alter table app_users enable row level security;
alter table app_sessions enable row level security;
alter table app_plans enable row level security;
alter table app_subscriptions enable row level security;
alter table app_vpn_access_records enable row level security;
alter table app_vpn_devices enable row level security;
alter table app_referrals enable row level security;
alter table app_support_requests enable row level security;
alter table app_billing_events enable row level security;

-- Deny-by-default for anon/authenticated roles.
-- API server (service_role) bypasses RLS and remains the only write/read path.

create policy app_users_no_client_access on app_users
for all to anon, authenticated
using (false)
with check (false);

create policy app_sessions_no_client_access on app_sessions
for all to anon, authenticated
using (false)
with check (false);

create policy app_plans_no_client_access on app_plans
for all to anon, authenticated
using (false)
with check (false);

create policy app_subscriptions_no_client_access on app_subscriptions
for all to anon, authenticated
using (false)
with check (false);

create policy app_vpn_access_no_client_access on app_vpn_access_records
for all to anon, authenticated
using (false)
with check (false);

create policy app_vpn_devices_no_client_access on app_vpn_devices
for all to anon, authenticated
using (false)
with check (false);

create policy app_referrals_no_client_access on app_referrals
for all to anon, authenticated
using (false)
with check (false);

create policy app_support_no_client_access on app_support_requests
for all to anon, authenticated
using (false)
with check (false);

create policy app_billing_no_client_access on app_billing_events
for all to anon, authenticated
using (false)
with check (false);
