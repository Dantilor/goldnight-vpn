# MiniApp-First Architecture (v2)

## Runtime boundaries

- `apps/web` — Telegram Mini App frontend runtime.
- `apps/api` — auth + business + data access runtime.
- `apps/bot` — launcher runtime only (entry UX + Mini App open actions).

`apps/web` and `apps/api` must run without `apps/bot`.

## Data layer strategy

- `DATA_LAYER=prisma` keeps legacy behavior during transition.
- `DATA_LAYER=supabase` enables v2 `app_*` tables in Supabase.
- API services use a data-layer interface (`apps/api/src/lib/data-layer.ts`) to avoid runtime coupling.

## Auth flow

1. Mini App opens in Telegram.
2. Web reads `Telegram.WebApp.initData`.
3. Web calls `POST /auth/telegram`.
4. API validates HMAC + `auth_date`.
5. API upserts user and returns auth token/session payload.
6. Web uses token for protected `/me/*` endpoints.

## Legacy note

- Prisma schema and modules remain available during cutover.
- New Supabase SQL is isolated under `supabase/sql/001_miniapp_first_v2.sql`.
- See `docs/legacy-cleanup.md` for explicit removal plan after final cutover.
