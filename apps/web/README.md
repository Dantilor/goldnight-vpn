# Web Mini App

React + TypeScript + Vite + Tailwind Telegram Mini App shell.

## Architecture

- `src/components/layout` - app shell + bottom navigation
- `src/components/ui` - reusable cards, buttons, status badges, section headers
- `src/lib/api-client.ts` - real backend client + bearer auth
- `src/lib/telegram.ts` - Telegram WebApp bootstrap/initData access
- `src/lib/auth-store.ts` - client auth token store
- `src/lib/query-hooks.ts` - TanStack Query integration
- `src/screens/*` - route screens

## Screens

- Home (`/home`)
- Plans
- Subscription management
- VPN setup/connect flow
- Referrals
- Profile (`/profile`)

## Connect Flow

- Select platform
- Select VPN client
- Generate setup payload
- Actions:
  - Download client
  - Open client
  - Copy subscription URL
  - Show QR value
  - Download config

## Local Run

```bash
pnpm --filter @goldnight/web dev
```

For full Mini App local stack (without bot runtime), run from repo root:

```bash
pnpm dev
```

## Environments

- Local development uses `apps/web/.env` (`VITE_API_BASE_URL=http://localhost:3000`)
- Production build uses `apps/web/.env.production`
  (`VITE_API_BASE_URL=<your_api_url>`)

For GitHub Actions deploy, set repository variables:

- `WEB_API_BASE_URL`
- `TELEGRAM_BOT_USERNAME`

## Auth Boot

On app startup frontend calls `POST /auth/telegram` with Telegram `initData`,
stores returned bearer token, and then loads protected `/me/*` endpoints.

When opened outside Telegram, frontend shows a safe fallback message and does not crash.

## Auth check quick test

1. Open Mini App from Telegram (menu button or `web_app` button).
2. Confirm API receives `POST /auth/telegram`.
3. Confirm subsequent protected requests (`/me`, `/me/*`) include bearer token.
