# Legacy Cleanup Notes

## Migration status by zone

- Fully migrated:
  - Auth (`/auth/telegram`, `/me`, bearer middleware)
  - Web bootstrap/fallback (outside Telegram safe path)
  - Plans/subscriptions/referrals/support read paths via DataLayer
  - Bot launcher UX (`web_app` entrypoints, menu button)
  - Deploy baseline (`/health` + `/ready`)
- Transitional:
  - Data layer dual-mode (`prisma` + `supabase`) during cutover
  - Bot summary read route (`/bot/users/:telegramUserId/summary`) remains optional dependency for richer bot UX
  - VPN read/connect uses DataLayer in `supabase` mode, provider/prisma path still active in `prisma` mode
- Legacy:
  - Admin VPN write routes in `apps/api/src/modules/admin/*` (Prisma-only, explicitly `501` in `DATA_LAYER=supabase`)
  - VPN write operations `issue/renew/revoke` in `apps/api/src/modules/vpn/vpn-service.ts` (explicitly unsupported in `DATA_LAYER=supabase`)

## What is still legacy (intentionally)

- Prisma schema/tables and Prisma-backed repositories remain available for transition mode:
  - `DATA_LAYER=prisma`
  - `apps/api/prisma/schema.prisma`
- Some API internals still use Prisma-specific logic where migration is not yet complete:
  - VPN issue/renew/revoke write-paths in `apps/api/src/modules/vpn/*`
  - Admin write operations in `apps/api/src/modules/admin/*`

## What is already cutover-ready

- Runtime boundaries are split:
  - `web` and `api` run without bot runtime.
  - `bot` is launcher runtime only.
- Auth flow is MiniApp-first (`POST /auth/telegram` + protected `/me/*`).
- Data access supports `DATA_LAYER=supabase` through `apps/api/src/lib/data-layer.ts`.
- Supabase v2 SQL chain exists:
  - `supabase/sql/001_miniapp_first_v2.sql`
  - `supabase/sql/002_rls_policies_v2.sql`
  - `supabase/sql/003_seed_bootstrap_v2.sql`

## What can be removed after final cutover

1. Prisma legacy schema and migration usage for app runtime:
   - `apps/api/prisma/*` (after full validation on v2)
2. Legacy env and docs references to transition mode:
   - `DATABASE_URL` / `DATA_LAYER=prisma` path
3. Remaining Prisma-only write paths (after rewriting on Supabase repositories):
   - `apps/api/src/modules/vpn/*` write operations
   - `apps/api/src/modules/admin/*`

## What must be migrated to remove Prisma completely

- Replace admin VPN write routes with Supabase-backed repositories:
  - `POST /admin/vpn-access`
  - `PATCH /admin/vpn-access/:accessId`
  - `POST /admin/vpn-access/:accessId/renew`
  - `POST /admin/vpn-access/:accessId/revoke`
- Replace remaining `VpnService` write-path persistence (`issue/renew/revoke`) with Supabase-backed writes.
- Remove `PrismaClient` dependency from:
  - `apps/api/src/modules/vpn/vpn-service.ts`
  - `apps/api/src/modules/admin/service.ts`
  - `apps/api/src/modules/vpn/manual-vpn-provider.ts` (or split provider storage concern)
- After parity tests on v2 schema, remove Prisma runtime path and `DATA_LAYER=prisma` mode.

## Final cutover criteria before deletion

- Production runs with `DATA_LAYER=supabase`.
- End-to-end auth + `/me/*` + bot summary flow verified on new Supabase.
- Admin/VPN write flows migrated and verified on v2 schema.
- No runtime path depends on Prisma tables.
