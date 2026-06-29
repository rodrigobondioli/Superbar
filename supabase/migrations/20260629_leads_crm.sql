alter table leads add column if not exists follow_up_at timestamptz;
alter table leads add column if not exists origem text;
