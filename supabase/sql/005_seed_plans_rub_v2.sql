-- GoldNight tariff matrix (12 plans). Safe to re-run.

insert into app_plans(code, name, price_usd, price_rub, duration_days, device_limit, subtitle, sort_order, is_active)
values
  ('basic_30', 'Базовый 30 дней', 0, 149, 30, 1, 'Для одного устройства', 1, true),
  ('basic_90', 'Базовый 90 дней', 0, 399, 90, 1, 'Для одного устройства', 2, true),
  ('basic_180', 'Базовый 180 дней', 0, 699, 180, 1, 'Для одного устройства', 3, true),
  ('basic_365', 'Базовый 365 дней', 0, 1490, 365, 1, 'Для одного устройства', 4, true),
  ('standard_30', 'Стандарт 30 дней', 0, 249, 30, 3, 'Телефон, ПК и ещё одно устройство', 5, true),
  ('standard_90', 'Стандарт 90 дней', 0, 649, 90, 3, 'Телефон, ПК и ещё одно устройство', 6, true),
  ('standard_180', 'Стандарт 180 дней', 0, 1190, 180, 3, 'Телефон, ПК и ещё одно устройство', 7, true),
  ('standard_365', 'Стандарт 365 дней', 0, 2290, 365, 3, 'Телефон, ПК и ещё одно устройство', 8, true),
  ('premium_30', 'Премиум 30 дней', 0, 349, 30, 5, 'Для нескольких устройств', 9, true),
  ('premium_90', 'Премиум 90 дней', 0, 899, 90, 5, 'Для нескольких устройств', 10, true),
  ('premium_180', 'Премиум 180 дней', 0, 1590, 180, 5, 'Для нескольких устройств', 11, true),
  ('premium_365', 'Премиум 365 дней', 0, 2990, 365, 5, 'Для нескольких устройств', 12, true)
on conflict (code) do update
set
  name = excluded.name,
  price_usd = excluded.price_usd,
  price_rub = excluded.price_rub,
  duration_days = excluded.duration_days,
  device_limit = excluded.device_limit,
  subtitle = excluded.subtitle,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

update app_plans set is_active = false
where code in ('starter_30', 'pro_90', 'elite_180', 'annual_365', 'starter_monthly', 'standard_monthly', 'pro_quarterly', 'ultimate_yearly');
