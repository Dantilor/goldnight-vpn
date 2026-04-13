-- Temporarily: no per-plan device slot cap (0 = unlimited in API). Re-run seed 005 after editing values, or keep this one-off.

update app_plans set device_limit = 0;

alter table app_plans alter column device_limit set default 0;
