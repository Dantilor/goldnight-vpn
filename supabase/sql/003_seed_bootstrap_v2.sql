-- Minimal bootstrap seed data for v2 schema.
-- Safe to re-run.

insert into app_plans(code, name, price_usd, duration_days, is_active)
values
  ('starter_30', 'Starter 30 Days', 12.99, 30, true),
  ('pro_90', 'Pro 90 Days', 27.99, 90, true),
  ('elite_180', 'Elite 180 Days', 47.99, 180, true),
  ('annual_365', 'Annual 365 Days', 89.99, 365, true)
on conflict (code) do update
set
  name = excluded.name,
  price_usd = excluded.price_usd,
  duration_days = excluded.duration_days,
  is_active = excluded.is_active,
  updated_at = now();
