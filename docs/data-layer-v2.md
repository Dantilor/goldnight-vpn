# Data Layer v2 (Supabase-ready)

## Design decisions

### Keep

- Core entities and statuses from legacy domain:
  - users
  - plans
  - subscriptions
  - vpn access
  - referrals
  - support requests
  - billing events

### Migrate / rewrite

- Move to clean `app_*` table namespace in new Supabase DB:
  - `app_users`
  - `app_sessions`
  - `app_plans`
  - `app_subscriptions`
  - `app_vpn_access_records`
  - `app_vpn_devices`
  - `app_referrals`
  - `app_support_requests`
  - `app_billing_events`

### Legacy

- Legacy Prisma tables (`users`, `plans`, `subscriptions`, `vpn_access`, `payments`, `referrals`, `support_requests`) remain for compatibility during cutover.
- Legacy relation `users.referredById` is not carried into v2 physical schema by default; referral tracking is handled via `app_referrals`.
- Legacy `vpn_access.issuedAt` and free-form notes stay legacy unless explicitly needed in v2.

## v2 table summary

- `app_users`: Telegram identity + profile fields + referral code.
- `app_sessions`: application session tracking (`token_id`, issue/expiry, revoke marker).
- `app_plans`: commercial plans.
- `app_subscriptions`: user subscription lifecycle and period.
- `app_vpn_access_records`: active/expired/revoked access snapshots per provider.
- `app_vpn_devices`: optional device registration/fingerprint table.
- `app_referrals`: invite relationships and reward state.
- `app_support_requests`: support queue records.
- `app_billing_events`: payment/provider event stream.

## SQL migration files

1. `supabase/sql/001_miniapp_first_v2.sql` — schema and constraints.
2. `supabase/sql/002_rls_policies_v2.sql` — RLS baseline (deny client direct access, API via service role).
3. `supabase/sql/003_seed_bootstrap_v2.sql` — minimal bootstrap plans.

## RLS notes

- In this architecture, direct client DB access is not required.
- API (`service_role`) is the only data path.
- Baseline policies deny anon/authenticated access by default.
- If later introducing direct client reads (e.g. Supabase auth + RLS), add scoped per-user policies in a new migration.
