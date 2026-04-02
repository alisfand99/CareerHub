-- Idempotent: add metadata for skill origin tagging (e.g. market_demand vs acquired)
alter table public.master_skills
  add column if not exists metadata jsonb not null default '{}'::jsonb;
