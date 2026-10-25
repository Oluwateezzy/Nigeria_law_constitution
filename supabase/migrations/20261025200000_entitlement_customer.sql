alter table public.entitlements
  add column if not exists provider_customer text;

revoke insert, update, delete on public.entitlements from anon, authenticated, public;
