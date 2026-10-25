-- Account tables for notes, threads, messages, and reading position.
-- Delete account runs as public.delete_own_account(), called with the
-- signed-in user's session. The function is security definer so it can
-- remove auth.users after deleting that user's rows. Direct table access
-- stays under row level security. Clients receive no insert or update
-- grant on quota_usage or entitlements.

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key
);

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.installs (
  install_id uuid primary key,
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  section_id text,
  instrument_id text,
  body text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists public.threads (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  section_id text,
  title text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists public.messages (
  id uuid primary key,
  thread_id uuid not null references public.threads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  content text not null,
  citations jsonb,
  created_at timestamptz not null
);

create table if not exists public.reading_positions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  section_id text not null,
  anchor text,
  updated_at timestamptz not null
);

create table if not exists public.quota_usage (
  subject_id uuid not null,
  subject_kind text not null check (subject_kind in ('install', 'user')),
  lagos_date date not null,
  hosted_count integer not null default 0,
  primary key (subject_id, subject_kind, lagos_date)
);

create table if not exists public.entitlements (
  subject_id uuid not null,
  subject_kind text not null check (subject_kind in ('install', 'user')),
  lane text not null,
  source text not null,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (subject_id, subject_kind, lane)
);

alter table public.profiles enable row level security;
alter table public.installs enable row level security;
alter table public.notes enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.reading_positions enable row level security;
alter table public.quota_usage enable row level security;
alter table public.entitlements enable row level security;

alter table public.profiles force row level security;
alter table public.installs force row level security;
alter table public.notes force row level security;
alter table public.threads force row level security;
alter table public.messages force row level security;
alter table public.reading_positions force row level security;
alter table public.quota_usage force row level security;
alter table public.entitlements force row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.installs to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.threads to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
grant select, insert, update, delete on public.reading_positions to authenticated;
grant select on public.quota_usage to authenticated;
grant select on public.entitlements to authenticated;

revoke insert, update, delete on public.quota_usage from anon, authenticated, public;
revoke insert, update, delete on public.entitlements from anon, authenticated, public;

create policy profiles_own on public.profiles
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy installs_own on public.installs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notes_own on public.notes
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy threads_own on public.threads
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy messages_own on public.messages
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy positions_own on public.reading_positions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy quota_read_own on public.quota_usage
  for select to authenticated
  using (subject_kind = 'user' and subject_id = auth.uid());

create policy entitlements_read_own on public.entitlements
  for select to authenticated
  using (subject_kind = 'user' and subject_id = auth.uid());

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  delete from public.messages where user_id = uid;
  delete from public.threads where user_id = uid;
  delete from public.notes where user_id = uid;
  delete from public.reading_positions where user_id = uid;
  delete from public.installs where user_id = uid;
  delete from public.profiles where user_id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
