-- Allow Telegram dedupe row for "subscription ended, VPN stopped" notification

alter table app_subscription_notifications drop constraint if exists app_subscription_notifications_type_check;

alter table app_subscription_notifications
  add constraint app_subscription_notifications_type_check
  check (
    type in (
      'payment_success',
      'expires_in_5_days',
      'expires_in_1_day',
      'subscription_expired_vpn_stopped'
    )
  );
