-- Email for YooKassa fiscal receipt (54-FZ); user-provided only, no server-side fakes.

alter table app_users add column if not exists email text;

comment on column app_users.email is 'User-provided email for payment receipts; nullable until collected before checkout.';
