alter table public.quota_usage drop constraint if exists quota_usage_subject_kind_check;

alter table public.quota_usage
  add constraint quota_usage_subject_kind_check
  check (subject_kind in ('install', 'user', 'ip'));

create table if not exists public.quota_folds (
  user_id uuid not null,
  install_id uuid not null,
  lagos_date date not null,
  primary key (user_id, install_id, lagos_date)
);

alter table public.quota_folds enable row level security;
alter table public.quota_folds force row level security;

revoke all on public.quota_folds from anon, authenticated, public;
