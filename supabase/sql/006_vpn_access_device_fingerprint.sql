-- Per-device VPN access (unique user + provider + device fingerprint)

alter table app_vpn_access_records add column if not exists device_fingerprint text;
update app_vpn_access_records set device_fingerprint = '__default__' where device_fingerprint is null;
alter table app_vpn_access_records alter column device_fingerprint set not null;
alter table app_vpn_access_records alter column device_fingerprint set default '__default__';

alter table app_vpn_access_records drop constraint if exists app_vpn_access_records_user_id_provider_key;

alter table app_vpn_access_records
  add constraint app_vpn_access_records_user_provider_device_key
  unique (user_id, provider, device_fingerprint);
