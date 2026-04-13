# Cutover Checklist (New Bot + New Render + New Supabase)

## What is already ready in code

- Runtime separation is implemented:
  - `web` and `api` run without `bot` process.
  - `bot` is launcher-only runtime.
- API supports Mini App auth via `POST /auth/telegram`.
- Data layer supports `DATA_LAYER=supabase`.
- Supabase v2 SQL files are prepared under `supabase/sql/`.

## 1) Create new Supabase project

1. Create project in Supabase.
2. Run SQL from `supabase/sql/001_miniapp_first_v2.sql`.
3. Copy:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 2) Configure API (Render)

Set env:

- `NODE_ENV=production`
- `PORT` (Render managed)
- `DATA_LAYER=supabase`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBAPP_URL`
- `AUTH_JWT_SECRET`
- `AUTH_TOKEN_TTL_SECONDS`
- `TELEGRAM_INITDATA_TTL_SECONDS`
- `ADMIN_API_KEY`
- `BOT_API_KEY`
- `VPN_PROVIDER`

## 3) Configure Web (Pages/Static host)

- `VITE_API_BASE_URL=<new_api_url>`
- `VITE_TELEGRAM_BOT_USERNAME=<new_bot_username>`
- GitHub Actions repository variables:
  - `WEB_API_BASE_URL=<new_api_url>`
  - `TELEGRAM_BOT_USERNAME=<new_bot_username>`

## 4) Configure Bot runtime

Set env:

- `TELEGRAM_BOT_TOKEN`
- `API_BASE_URL=<new_api_url>`
- `MINI_APP_URL=<new_web_url>`
- `BOT_API_KEY`

## 5) BotFather manual setup

1. Set bot menu button / Main Mini App URL to new web URL.
2. Ensure launch path uses `web_app` behavior.
3. Verify `/start` opens Mini App.

## 6) What you create manually

- New Telegram bot in BotFather.
- New Render API service.
- New Supabase project.
- New env values for all runtimes.

## 7) Deploy order

1. Create Supabase project and apply SQL (`001` -> `002` -> `003`).
2. Configure and deploy new API service on Render.
3. Configure web variables (`WEB_API_BASE_URL`, `TELEGRAM_BOT_USERNAME`) and deploy web.
4. Configure bot runtime env and start bot process.
5. Run verification flow end-to-end in Telegram.

## 8) Verification

- Outside Telegram: web shows fallback state, no crash.
- API readiness probe `GET /ready` returns `ok: true` for the selected data layer.
- Inside Telegram: `POST /auth/telegram` succeeds.
- Protected endpoints (`/me`, `/me/*`) succeed after bootstrap.
- Bot launcher opens Mini App and summary requests work.
- API has no runtime dependency on Telegraf/polling/webhook process.
- `web` + `api` continue to run if bot runtime is stopped.

## Unsupported in DATA_LAYER=supabase

- Admin VPN paths not supported yet:
  - `POST /admin/vpn-access`
  - `GET /admin/vpn-access/user/:userId`
  - `PATCH /admin/vpn-access/:accessId`
  - `POST /admin/vpn-access/:accessId/renew`
  - `POST /admin/vpn-access/:accessId/revoke`
- In `DATA_LAYER=supabase`, these admin paths return `501` by design (legacy Prisma-only write path).
- `VpnService` write operations explicitly unsupported in supabase mode:
  - `issueAccess`
  - `renewAccess`
  - `revokeAccess`
- Operator action instead:
  - use supported app flows for auth/profile/plans/subscription/referrals/support;
  - use `/me/vpn-access` and `/me/vpn/connect-payload` for Mini App VPN read/connect UX;
  - keep admin/manual VPN mutation workflows on legacy Prisma mode until migrated.
- Normal behavior (not a bug):
  - `501` on admin VPN paths in supabase mode;
  - explicit `UNSUPPORTED_IN_SUPABASE_MODE` errors on legacy `VpnService` write operations.
- Fully supported in supabase mode:
  - `POST /auth/telegram`, `GET /me`, `GET /plans`, `GET /me/subscription`,
    `GET /me/vpn-access`, `POST /me/vpn/connect-payload`, `GET /me/referrals`, `GET /me/support`,
    `GET /health`, `GET /ready`.
