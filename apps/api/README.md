# API Service

Backend-first Fastify + TypeScript service for the Telegram Mini App VPN product shell.

## Module Structure

```txt
src/modules/
  admin/
  auth/
  plans/
  subscription/
  vpn/
  payments/
  referrals/
  support/
```

## Implemented Endpoints

- `GET /health`
- `GET /ready` (light readiness probe for Render)
- `POST /auth/telegram` (real Telegram initData validation)
- `GET /plans`
- `GET /me`
- `GET /me/subscription`
- `GET /me/vpn-access`
- `POST /me/vpn/provision` (requires active subscription; persists access via DataLayer)
- `POST /me/vpn/revoke`
- `POST /me/vpn/connect-payload`
- `GET /me/referrals`
- `GET /me/support`
- `POST /admin/vpn-access`
- `GET /admin/vpn-access/user/:userId`
- `PATCH /admin/vpn-access/:accessId`
- `POST /admin/vpn-access/:accessId/renew`
- `POST /admin/vpn-access/:accessId/revoke`
- `GET /bot/users/:telegramUserId/summary` (bot service route)

Notes for `DATA_LAYER=supabase`:

- `/me/vpn-access`, `/me/vpn/connect-payload`, `/me/vpn/provision`, and `/me/vpn/revoke` use Supabase `app_vpn_access_records` via DataLayer.
- `/admin/vpn-access*` still returns `501` (legacy Prisma-only admin write path).
- `GET /ready` is the operational readiness probe for Render and checks selected data-layer availability.

### 3x-ui / Xray (`VPN_PROVIDER=xui`)

Env is validated in `@goldnight/config`. When `VPN_PROVIDER=xui`, these are required: `XUI_HOST`, `XUI_USER`, `XUI_PASS`, `XUI_INBOUND_ID`, `XUI_DOMAIN`, `XUI_PORT`.

**How URLs are built** (`apps/api/src/modules/vpn/xui/xui-client.ts`):

- Login: `{XUI_HOST}{XUI_BASE_PATH}/login`
- API: `{XUI_HOST}{XUI_BASE_PATH}/panel/api/...`

`XUI_BASE_PATH` defaults to empty. Trailing slashes on `XUI_HOST` are stripped; `XUI_BASE_PATH` is normalized with a leading `/` and without a trailing `/`.

**Two valid layouts:**

1. **Full prefix in `XUI_HOST`** (no trailing slash):  
   `XUI_HOST=https://example.com:19002/admin/source` and `XUI_BASE_PATH=`  
   → login at `https://example.com:19002/admin/source/login`, API under `.../admin/source/panel/api/`.

2. **Split origin and path:**  
   `XUI_HOST=https://example.com:19002` and `XUI_BASE_PATH=/admin/source`  
   → same final URLs as (1).

**Client-facing VLESS URI** uses `XUI_DOMAIN` + `XUI_PORT` + `XUI_VLESS_EXTRA_QUERY` and optionally `XUI_VLESS_FLOW` (see `build-vless-uri.ts`). **`encryption=none` is always set**; `encryption` / `flow` inside `XUI_VLESS_EXTRA_QUERY` are stripped to avoid duplicates. If `XUI_VLESS_EXTRA_QUERY` contains **`type=xhttp`**, **`flow` is not appended** (XHTTP+TLS is not Vision/TCP). Copy the full query string from the 3x-ui share dialog for the inbound you use; after changing env, users should **re-provision** so `app_vpn_access_records.value` is rebuilt.

**TLS vs REALITY:** if the inbound uses **REALITY**, the share link must use `security=reality` and the panel’s `pbk` / `sid` / `sni` (copy the full query from 3x-ui). A URI with `security=tls` against a REALITY inbound (or the opposite) can show a connection in the app while **no usable internet traffic** passes — that is a **panel / Xray config mismatch**, not Mini App logic.

**Routing / DNS / firewall** (Xray `outbounds`, server NAT, `iptables`, provider blocking 443) are **only on the VPS**; this repo does not deploy or validate them.

**3x-ui `limitIp` (IPs per VLESS UUID)** — New clients use `limitIp` from `XUI_CLIENT_LIMIT_IP` (default **1**). Set `XUI_CLIENT_LIMIT_IP=0` for unlimited distinct source IPs per link. Existing panel clients keep their old `limitIp` until re-issued or edited in the panel.

**Subscription expiry + VPN** — A periodic job (`SUBSCRIPTION_EXPIRY_SWEEP_INTERVAL_MS`, default **10 minutes**) marks `app_subscriptions` with `ends_at <= now()` as `expired`, revokes all VPN access in 3x-ui + `app_vpn_access_records`, and sends an optional Telegram notice (type `subscription_expired_vpn_stopped`; run `supabase/sql/010_subscription_notification_expired_vpn.sql` on Supabase). `getActiveSubscriptionByUserId` only returns subscriptions with `ends_at > now()`, so `/me/vpn-access`, `/me/vpn/provision`, and `/me/vpn/connect-payload` do not serve VPN without a valid period. On successful YooKassa payment, VPN is revoked **before** the new subscription row is created so the user must **provision again** (new panel client / link).

**Plan device slots** — Enforced by `app_plans.device_limit` and `provision` slot counting.

## Not Implemented Yet

- Broader admin automation beyond current modules.

## Architecture Rules

- VPN provider logic is abstracted behind `VpnProvider`.
- `ManualVpnProvider` is launch fallback for operator-managed access.
- User-scoped endpoints are protected by bearer middleware.
- Route handlers derive user identity from token, not URL params.
- Admin routes are isolated and guarded via `x-admin-key`.
- Bot service routes are isolated and guarded via `x-bot-key`.
- UI/business modules must never hardcode protocol/provider-specific logic.
- Zod is used for request validation.
- Env is validated with `@goldnight/config`.

## Database

- Legacy schema (transition): Prisma `prisma/schema.prisma`.
- v2 target schema (Supabase): `supabase/sql/001_miniapp_first_v2.sql`.
- Seed bootstrap for v2 plans: `supabase/sql/003_seed_bootstrap_v2.sql`.

## Local Run

```bash
pnpm --filter @goldnight/api dev
```

This starts API only. Telegram bot runtime is not required for Mini App local development.

Data layer mode:

- `DATA_LAYER=prisma` (legacy-compatible default)
- `DATA_LAYER=supabase` (v2 `app_*` schema)

## DB Bootstrap

```bash
docker compose up -d
pnpm --filter @goldnight/api prisma:generate
pnpm --filter @goldnight/api prisma:migrate
pnpm --filter @goldnight/api prisma:seed
```

## Deploy to Render

Create a **Web Service** for `apps/api` from this monorepo.

- **Root Directory**: repository root (leave empty)
- **Build Command**:
  - `pnpm install --frozen-lockfile && pnpm --filter @goldnight/api build:render`
- **Start Command**:
  - `pnpm --filter @goldnight/api start:render`

Required environment variables:

- `NODE_ENV=production`
- `PORT` (Render injects this automatically)
- `DATABASE_URL`
- `DATA_LAYER`
- `SUPABASE_URL` (required for `DATA_LAYER=supabase`)
- `SUPABASE_SERVICE_ROLE_KEY` (required for `DATA_LAYER=supabase`)
- `VPN_PROVIDER` (`mock` | `manual` | `real` | `xui`)
- If `VPN_PROVIDER=xui`: `XUI_HOST`, `XUI_BASE_PATH` (optional), `XUI_USER`, `XUI_PASS`, `XUI_INBOUND_ID`, `XUI_DOMAIN`, `XUI_PORT`, optionally `XUI_VLESS_FLOW`, `XUI_VLESS_EXTRA_QUERY`
- `TELEGRAM_BOT_TOKEN` (required for real Telegram `initData` validation on `/auth/telegram`)
- `TELEGRAM_WEBAPP_URL`
- `AUTH_JWT_SECRET`
- `AUTH_TOKEN_TTL_SECONDS`
- `TELEGRAM_INITDATA_TTL_SECONDS`
- `ADMIN_API_KEY`
- `BOT_API_KEY`
- Optional: `SUBSCRIPTION_REMINDER_INTERVAL_MS`, `SUBSCRIPTION_EXPIRY_SWEEP_INTERVAL_MS`

If `TELEGRAM_BOT_TOKEN` is not set, API still starts, but `POST /auth/telegram` returns `503`.
