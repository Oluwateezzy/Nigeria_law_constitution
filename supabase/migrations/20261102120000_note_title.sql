-- Add title column to public.notes for user-specified note names (V2-Phase 4)
alter table public.notes add column if not exists title text;
