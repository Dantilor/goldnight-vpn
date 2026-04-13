# Supabase v2 (MiniApp-first)

This folder contains SQL for the fresh v2 schema used by the MiniApp-first architecture.

## Apply

1. Create a new Supabase project.
2. Open SQL Editor.
3. Run SQL files in order:
   - `sql/001_miniapp_first_v2.sql`
   - `sql/002_rls_policies_v2.sql`
   - `sql/003_seed_bootstrap_v2.sql`

## Notes

- The API can run with `DATA_LAYER=prisma` (legacy compatibility) or `DATA_LAYER=supabase`.
- For `DATA_LAYER=supabase`, set:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Table names use `app_*` prefix to keep v2 isolated from legacy schema.
- RLS baseline denies direct client access; API service role is the primary DB access path.

## Manual SQL execution order

In Supabase SQL Editor, execute file contents in this order:

1. `supabase/sql/001_miniapp_first_v2.sql`
2. `supabase/sql/002_rls_policies_v2.sql`
3. `supabase/sql/003_seed_bootstrap_v2.sql`
