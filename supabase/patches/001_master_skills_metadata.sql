-- Idempotent: add metadata for skill origin tagging (e.g. market_demand vs acquired).
-- Needed for DBs created before schema.sql included this column (CREATE TABLE IF NOT EXISTS
-- does not add new columns to existing tables).
alter table public.master_skills
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Ask PostgREST to reload its schema cache so the API sees the column (avoids PGRST204).
notify pgrst, 'reload schema';
