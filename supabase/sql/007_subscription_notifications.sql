-- Deduped Telegram subscription notifications (payment success + expiry reminders)

create table if not exists app_subscription_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  subscription_id uuid not null references app_subscriptions(id) on delete cascade,
  type text not null check (type in ('payment_success', 'expires_in_5_days', 'expires_in_1_day')),
  sent_at timestamptz not null default now(),
  unique (subscription_id, type)
);

create index if not exists idx_app_subscription_notifications_user on app_subscription_notifications(user_id);

alter table app_subscription_notifications enable row level security;
drop policy if exists app_subscription_notifications_no_client on app_subscription_notifications;
create policy app_subscription_notifications_no_client on app_subscription_notifications
  for all using (false) with check (false);
