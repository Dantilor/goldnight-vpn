# Golden Night VPN Monorepo

Production-ready monorepo skeleton for a Telegram Mini App VPN subscription product.

> Scope: product shell around an external VPN provider.  
> Out of scope: VPN infrastructure implementation.

## Monorepo Structure

```txt
apps/
  api/          # Fastify backend (DataLayer: Prisma legacy / Supabase v2)
  web/          # Telegram Mini App frontend (React + Vite + Tailwind)
  bot/          # Telegram bot (Telegraf)
packages/
  types/        # Shared domain and transport types
  config/       # Shared environment validation (Zod)
  ui/           # Shared React UI primitives
```

## Architecture

- `apps/api/src/modules/vpn/vpn-provider.ts` defines the provider contract.
- `ManualVpnProvider` is used as launch fallback for operator-managed access.
- `MockVpnProvider` is available for local/dev flow.
- `RealVpnProvider` is a strict placeholder for provider-specific implementation.
- API business logic uses `VpnService`, not provider-specific methods directly.
- UI and business flows avoid hardcoded protocol/client implementation details.
- Telegram Mini App auth is validated on backend via `initData` signature checks.
- Protected APIs use bearer token middleware and `/me/*` routes.

## Data Model

Prisma models in `apps/api/prisma/schema.prisma`:

- `users`
- `plans`
- `subscriptions`
- `vpn_access`
- `payments`
- `referrals`
- `support_requests`

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Configure env files:

- `apps/api/.env` from `apps/api/.env.example`
- `apps/web/.env` from `apps/web/.env.example`
- `apps/bot/.env` from `apps/bot/.env.example`

4. Generate Prisma client and migrate:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

5. Run Mini App stack (web + api, without bot runtime):

```bash
pnpm dev
```

If you need Telegram bot runtime separately:

```bash
pnpm dev:bot
```

Run everything together (api + web + bot):

```bash
pnpm dev:full
```

## Scripts

- `pnpm dev` - run API + web in watch mode (Mini App stack)
- `pnpm dev:bot` - run bot runtime only
- `pnpm dev:full` - run API + web + bot in watch mode
- `pnpm build` - build all packages/apps
- `pnpm lint` - lint all workspaces
- `pnpm typecheck` - type-check all workspaces
- `pnpm format` - run Prettier

## Docs

- `docs/auth-flow.md` - Telegram auth and token flow
- `docs/api-contract.md` - API endpoints and payload contracts
- `docs/vpn-provider-integration.md` - provider strategy for Path A
- `docs/manual-access-operations.md` - operator runbook for manual assignment lifecycle
- `docs/bot-flow.md` - Telegram bot entry flow and backend usage
- `docs/message-map.md` - concise bot message matrix
- `docs/miniapp-first-architecture.md` - runtime boundaries and v2 data-layer model
- `docs/cutover-checklist.md` - step-by-step migration to new bot/Render/Supabase
- `docs/data-layer-v2.md` - v2 schema decisions, legacy mapping, and SQL migration order
- `docs/legacy-cleanup.md` - what remains legacy and what to remove after cutover

## Deploy Web to GitHub Pages

`apps/web` deploys via `.github/workflows/deploy-pages.yml`.

One-time setup in GitHub:

1. Open repository **Settings -> Pages**.
2. In **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from **Actions**).

Notes:

- Workflow builds only `@goldnight/web` from monorepo root with `pnpm`.
- Vite base path is auto-set for project pages using repository name in GitHub Actions.
- Web API URL comes from Vite env:
  - local: `apps/web/.env` -> `VITE_API_BASE_URL=http://localhost:3000`
  - production: `VITE_API_BASE_URL=<your_api_url>`
  - workflow vars: `WEB_API_BASE_URL`, `TELEGRAM_BOT_USERNAME`

To trigger a new Pages deploy after env/config changes:

- push commit to `main` (or run workflow manually in GitHub Actions)

## Deploy API to Render

Deploy `apps/api` as a separate Render Web Service.

- **Root Directory**: repository root (required for pnpm workspaces)
- **Build Command**:
  - `pnpm install --frozen-lockfile && pnpm --filter @goldnight/api build:render`
- **Start Command**:
  - `pnpm --filter @goldnight/api start:render`

Required env vars:

- `NODE_ENV`
- `PORT` (provided by Render)
- `DATABASE_URL`
- `VPN_PROVIDER`
- `DATA_LAYER` (`prisma` or `supabase`)
- `SUPABASE_URL` (required when `DATA_LAYER=supabase`)
- `SUPABASE_SERVICE_ROLE_KEY` (required when `DATA_LAYER=supabase`)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBAPP_URL`
- `AUTH_JWT_SECRET`
- `AUTH_TOKEN_TTL_SECONDS`
- `TELEGRAM_INITDATA_TTL_SECONDS`
- `ADMIN_API_KEY`
- `BOT_API_KEY`

Notes:

- `apps/web` + `apps/api` do not require local bot polling runtime.
- `TELEGRAM_BOT_TOKEN` is required for real Telegram `initData` validation on `POST /auth/telegram`.
- If token is not configured, API still starts, and auth endpoint returns `503` for Telegram auth requests.
- `DATA_LAYER=supabase` uses v2 `app_*` schema from `supabase/sql/001_miniapp_first_v2.sql`.

## Mini App Smoke Test

### A) Local web + api without bot runtime

```bash
pnpm dev
```

Checks:

1. Open web app locally in browser.
2. UI renders and does not crash outside Telegram.
3. API health endpoint responds (`GET /health`).
4. Auth screen shows a clear message to open Mini App inside Telegram.

### B) Telegram auth flow

1. Set `TELEGRAM_BOT_TOKEN` in `apps/api/.env`.
2. Start API and web (`pnpm dev`).
3. Open Mini App from Telegram (`web_app` button or menu button).
4. Verify API logs contain `POST /auth/telegram`.
5. Verify protected calls (`/me`, `/me/*`) succeed after auth bootstrap.
