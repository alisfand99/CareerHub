-- Career-Hub AI — full schema (run once in Supabase SQL Editor)
-- Enables RLS and ties all rows to auth.users(id).
--
-- If you already have on_auth_user_created on auth.users, drop or merge that
-- trigger before running the handle_new_user block below.

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Apply Hub — jobs
-- -----------------------------------------------------------------------------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  company text not null,
  status text not null default 'wishlist'
    check (status in ('wishlist', 'applied', 'interview', 'offer')),
  jd_text text,
  ai_match_score numeric(5,2),
  ai_stretch_skills jsonb default '[]'::jsonb,
  ai_gap_analysis jsonb,
  ai_insights jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_user_id_idx on public.jobs (user_id);
create index if not exists jobs_user_status_idx on public.jobs (user_id, status);

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute procedure public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Bio-Vault — structured intelligence
-- -----------------------------------------------------------------------------
create table if not exists public.master_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text,
  proficiency smallint check (proficiency is null or (proficiency between 1 and 5)),
  tools text[] default array[]::text[],
  metrics jsonb default '{}'::jsonb,
  evidence text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists master_skills_user_name_lower
  on public.master_skills (user_id, lower(name));

create index if not exists master_skills_user_id_idx on public.master_skills (user_id);

drop trigger if exists master_skills_set_updated_at on public.master_skills;
create trigger master_skills_set_updated_at
  before update on public.master_skills
  for each row execute procedure public.set_updated_at();

create table if not exists public.experience_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  organization text,
  location text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  bullets jsonb not null default '[]'::jsonb,
  raw_ingest text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists experience_blocks_user_id_idx on public.experience_blocks (user_id);

drop trigger if exists experience_blocks_set_updated_at on public.experience_blocks;
create trigger experience_blocks_set_updated_at
  before update on public.experience_blocks
  for each row execute procedure public.set_updated_at();

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  summary text,
  tech_stack text[] default array[]::text[],
  metrics jsonb default '[]'::jsonb,
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();

create table if not exists public.project_skills (
  project_id uuid not null references public.projects (id) on delete cascade,
  skill_id uuid not null references public.master_skills (id) on delete cascade,
  primary key (project_id, skill_id)
);

-- Chat-like raw dumps (Bio-Vault intake)
create table if not exists public.bio_vault_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bio_vault_messages_user_id_idx on public.bio_vault_messages (user_id);

-- -----------------------------------------------------------------------------
-- Network CRM — contacts & referral paths
-- -----------------------------------------------------------------------------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  email text,
  company text,
  role_title text,
  relationship_strength smallint not null default 3
    check (relationship_strength between 1 and 5),
  notes text,
  ai_expertise jsonb,
  ai_influence_sphere jsonb,
  referral_target_job_id uuid references public.jobs (id) on delete set null,
  last_touch_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_user_id_idx on public.contacts (user_id);
create index if not exists contacts_referral_job_idx on public.contacts (referral_target_job_id);

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute procedure public.set_updated_at();

-- Many-to-many: which contact is mapped to which target job (referral tracking)
create table if not exists public.contact_job_referrals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  status text not null default 'identified'
    check (status in ('identified', 'asked', 'referred', 'closed')),
  outreach_draft text,
  created_at timestamptz not null default now(),
  unique (contact_id, job_id)
);

create index if not exists contact_job_referrals_user_idx on public.contact_job_referrals (user_id);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.master_skills enable row level security;
alter table public.experience_blocks enable row level security;
alter table public.projects enable row level security;
alter table public.project_skills enable row level security;
alter table public.bio_vault_messages enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_job_referrals enable row level security;

-- Idempotent policy refresh (re-run safe)
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles', 'jobs', 'master_skills', 'experience_blocks', 'projects',
        'project_skills', 'bio_vault_messages', 'contacts', 'contact_job_referrals'
      )
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      pol.policyname,
      pol.tablename
    );
  end loop;
end $$;

-- Profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Jobs
create policy "jobs_select_own" on public.jobs for select using (auth.uid() = user_id);
create policy "jobs_insert_own" on public.jobs for insert with check (auth.uid() = user_id);
create policy "jobs_update_own" on public.jobs for update using (auth.uid() = user_id);
create policy "jobs_delete_own" on public.jobs for delete using (auth.uid() = user_id);

-- Master skills
create policy "master_skills_select_own" on public.master_skills for select using (auth.uid() = user_id);
create policy "master_skills_insert_own" on public.master_skills for insert with check (auth.uid() = user_id);
create policy "master_skills_update_own" on public.master_skills for update using (auth.uid() = user_id);
create policy "master_skills_delete_own" on public.master_skills for delete using (auth.uid() = user_id);

-- Experience blocks
create policy "experience_blocks_select_own" on public.experience_blocks for select using (auth.uid() = user_id);
create policy "experience_blocks_insert_own" on public.experience_blocks for insert with check (auth.uid() = user_id);
create policy "experience_blocks_update_own" on public.experience_blocks for update using (auth.uid() = user_id);
create policy "experience_blocks_delete_own" on public.experience_blocks for delete using (auth.uid() = user_id);

-- Projects
create policy "projects_select_own" on public.projects for select using (auth.uid() = user_id);
create policy "projects_insert_own" on public.projects for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on public.projects for update using (auth.uid() = user_id);
create policy "projects_delete_own" on public.projects for delete using (auth.uid() = user_id);

-- Project skills (via parent ownership)
create policy "project_skills_select_own" on public.project_skills for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy "project_skills_insert_own" on public.project_skills for insert
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
    and exists (select 1 from public.master_skills s where s.id = skill_id and s.user_id = auth.uid())
  );
create policy "project_skills_delete_own" on public.project_skills for delete
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

-- Bio vault messages
create policy "bio_vault_messages_select_own" on public.bio_vault_messages for select using (auth.uid() = user_id);
create policy "bio_vault_messages_insert_own" on public.bio_vault_messages for insert with check (auth.uid() = user_id);
create policy "bio_vault_messages_delete_own" on public.bio_vault_messages for delete using (auth.uid() = user_id);

-- Contacts
create policy "contacts_select_own" on public.contacts for select using (auth.uid() = user_id);
create policy "contacts_insert_own" on public.contacts for insert with check (auth.uid() = user_id);
create policy "contacts_update_own" on public.contacts for update using (auth.uid() = user_id);
create policy "contacts_delete_own" on public.contacts for delete using (auth.uid() = user_id);

-- Contact job referrals
create policy "cjr_select_own" on public.contact_job_referrals for select using (auth.uid() = user_id);
create policy "cjr_insert_own" on public.contact_job_referrals for insert with check (auth.uid() = user_id);
create policy "cjr_update_own" on public.contact_job_referrals for update using (auth.uid() = user_id);
create policy "cjr_delete_own" on public.contact_job_referrals for delete using (auth.uid() = user_id);
