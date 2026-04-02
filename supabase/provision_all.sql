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
  headline text,
  summary text,
  phone text,
  location text,
  website text,
  public_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists headline text;
alter table public.profiles add column if not exists summary text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists public_email text;

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
  linkedin_url text,
  phone text,
  keywords text[] default array[]::text[],
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

-- Existing deployments (table created before these columns existed)
alter table public.contacts add column if not exists linkedin_url text;
alter table public.contacts add column if not exists phone text;
alter table public.contacts add column if not exists keywords text[] default array[]::text[];

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
-- Super-resume — education, certifications, languages
-- -----------------------------------------------------------------------------
create table if not exists public.education_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  school text not null,
  degree text,
  field_of_study text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists education_entries_user_id_idx on public.education_entries (user_id);

drop trigger if exists education_entries_set_updated_at on public.education_entries;
create trigger education_entries_set_updated_at
  before update on public.education_entries
  for each row execute procedure public.set_updated_at();

create table if not exists public.certification_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  issuing_org text,
  issue_date date,
  expiration_date date,
  credential_url text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists certification_entries_user_id_idx on public.certification_entries (user_id);

drop trigger if exists certification_entries_set_updated_at on public.certification_entries;
create trigger certification_entries_set_updated_at
  before update on public.certification_entries
  for each row execute procedure public.set_updated_at();

create table if not exists public.language_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  proficiency text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists language_entries_user_id_idx on public.language_entries (user_id);

drop trigger if exists language_entries_set_updated_at on public.language_entries;
create trigger language_entries_set_updated_at
  before update on public.language_entries
  for each row execute procedure public.set_updated_at();

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
alter table public.education_entries enable row level security;
alter table public.certification_entries enable row level security;
alter table public.language_entries enable row level security;

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
        'project_skills', 'bio_vault_messages', 'contacts', 'contact_job_referrals',
        'education_entries', 'certification_entries', 'language_entries'
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
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
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

-- Education / certifications / languages
create policy "education_select_own" on public.education_entries for select using (auth.uid() = user_id);
create policy "education_insert_own" on public.education_entries for insert with check (auth.uid() = user_id);
create policy "education_update_own" on public.education_entries for update using (auth.uid() = user_id);
create policy "education_delete_own" on public.education_entries for delete using (auth.uid() = user_id);

create policy "cert_select_own" on public.certification_entries for select using (auth.uid() = user_id);
create policy "cert_insert_own" on public.certification_entries for insert with check (auth.uid() = user_id);
create policy "cert_update_own" on public.certification_entries for update using (auth.uid() = user_id);
create policy "cert_delete_own" on public.certification_entries for delete using (auth.uid() = user_id);

create policy "lang_select_own" on public.language_entries for select using (auth.uid() = user_id);
create policy "lang_insert_own" on public.language_entries for insert with check (auth.uid() = user_id);
create policy "lang_update_own" on public.language_entries for update using (auth.uid() = user_id);
create policy "lang_delete_own" on public.language_entries for delete using (auth.uid() = user_id);

-- Dummy data + test auth user for Career-Hub AI
-- Run AFTER schema.sql (or use provision_all.sql).
-- Test login (email / password):
--   tester@careerhub.local / CareerHub_Test_2026!

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Remove previous seed user (cascades public rows that reference auth.users)
-- -----------------------------------------------------------------------------
delete from auth.identities
where user_id in (select id from auth.users where email = 'tester@careerhub.local');

delete from auth.users where email = 'tester@careerhub.local';

-- GoTrue expects a row in auth.instances (hosted projects may start empty before first dashboard signup)
insert into auth.instances (id, uuid, raw_base_config, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  '{}',
  now(),
  now()
)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Test user (fixed UUID so seed rows stay stable)
-- -----------------------------------------------------------------------------
do $$
declare
  v_uid uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'::uuid;
  v_instance uuid;
  v_pw text := crypt('CareerHub_Test_2026!', gen_salt('bf', 10));
begin
  select id into v_instance from auth.instances limit 1;
  if v_instance is null then
    v_instance := '00000000-0000-0000-0000-000000000000'::uuid;
  end if;

  -- Token columns must be '' not NULL or password grant returns 500 (GoTrue)
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values (
    v_uid,
    v_instance,
    'authenticated',
    'authenticated',
    'tester@careerhub.local',
    v_pw,
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"CareerHub Tester"}'::jsonb,
    now(),
    now()
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    v_uid,
    format('{"sub":"%s","email":"tester@careerhub.local"}', v_uid)::jsonb,
    'email',
    v_uid::text,
    now(),
    now(),
    now()
  );
end $$;

-- -----------------------------------------------------------------------------
-- Public seed rows (all scoped to tester user)
-- -----------------------------------------------------------------------------
insert into public.jobs (
  id, user_id, title, company, status, jd_text, ai_match_score, ai_stretch_skills, ai_gap_analysis
)
values
  (
    'e4000001-0000-4000-8000-000000000001'::uuid,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'::uuid,
    'Senior Frontend Engineer',
    'Nebula Labs',
    'wishlist',
    'We need React, Next.js, TypeScript, and strong product sense. Lead design systems work.',
    82.50,
    '["GraphQL federation","Web performance budgets"]'::jsonb,
    '{"summary":"Strong on React; deepen GraphQL and perf storytelling."}'::jsonb
  ),
  (
    'e4000002-0000-4000-8000-000000000002'::uuid,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'::uuid,
    'Staff Engineer — Platform',
    'Orbit Health',
    'interview',
    'Own internal developer platform, CI/CD, and reliability SLOs.',
    76.00,
    '["SRE practices","K8s advanced topics"]'::jsonb,
    '{"summary":"Good platform instincts; emphasize incident response examples."}'::jsonb
  );

insert into public.master_skills (
  id, user_id, name, category, proficiency, tools, metrics, evidence, metadata
)
values
  (
    'c2000001-0000-4000-8000-000000000001'::uuid,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'::uuid,
    'Product-minded frontend architecture',
    'Engineering',
    5,
    array['Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase'],
    '{"impact":"Cut LCP 38% on flagship funnel"}'::jsonb,
    'Led App Router migration and unified design tokens across 6 squads.',
    '{"origin":"acquired","source":"seed"}'::jsonb
  ),
  (
    'c2000002-0000-4000-8000-000000000002'::uuid,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'::uuid,
    'Career systems design',
    'Strategy',
    4,
    array['Notion', 'Linear', 'Gemini'],
    '{"cadence":"Weekly pipeline reviews with qualitative notes"}'::jsonb,
    'Built personal CRM + evidence vault powering tailored outreach.',
    '{"origin":"acquired","source":"seed"}'::jsonb
  );

insert into public.experience_blocks (
  id, user_id, title, organization, location, start_date, end_date, is_current, bullets, raw_ingest
)
values (
  'a6000001-0000-4000-8000-000000000001'::uuid,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'::uuid,
  'Principal Engineer',
  'Lumen Analytics',
  'Remote',
  '2021-03-01',
  null,
  true,
  '[
    "Scaled observability stack to 2B events / day",
    "Mentored 12 engineers across platform and product teams"
  ]'::jsonb,
  'Dump: promoted after leading reliability guild + hiring bar raises.'
);

insert into public.projects (
  id, user_id, name, summary, tech_stack, metrics, url
)
values (
  'd3000001-0000-4000-8000-000000000001'::uuid,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'::uuid,
  'Career-Hub AI',
  'Dynamic career intelligence workspace combining applications, skill vault, and network CRM.',
  array['Next.js', 'Supabase', 'Tailwind CSS', 'Shadcn UI'],
  '[
    {"label":"Pillars shipped","value":"3"},
    {"label":"AI touchpoints","value":"Gap analysis + resume tailoring"}
  ]'::jsonb,
  'https://github.com/local/career-hub-ai'
);

insert into public.project_skills (project_id, skill_id)
values
  ('d3000001-0000-4000-8000-000000000001'::uuid, 'c2000001-0000-4000-8000-000000000001'::uuid),
  ('d3000001-0000-4000-8000-000000000001'::uuid, 'c2000002-0000-4000-8000-000000000002'::uuid);

insert into public.bio_vault_messages (id, user_id, role, content, metadata)
values
  (
    'b7000001-0000-4000-8000-000000000001'::uuid,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'::uuid,
    'user',
    'Shipped dark-mode analytics overhaul; stakeholders praised clarity of KPI drill-downs.',
    '{"source":"chat-ingest"}'::jsonb
  ),
  (
    'b7000002-0000-4000-8000-000000000002'::uuid,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'::uuid,
    'assistant',
    'Parsed update → added evidence to master_skills + project metrics draft.',
    '{"parser":"stub"}'::jsonb
  );

insert into public.contacts (
  id, user_id, full_name, email, company, role_title, relationship_strength, notes,
  ai_expertise, ai_influence_sphere, referral_target_job_id, last_touch_at
)
values
  (
    'f5000001-0000-4000-8000-000000000001'::uuid,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'::uuid,
    'Morgan Patel',
    'morgan@nebula.test',
    'Nebula Labs',
    'Director of Engineering',
    5,
    'Champions platform investments; intro’d me to hiring manager last winter.',
    '{"domains":["frontend platform","design systems"],"seniority":"director"}'::jsonb,
    '{"warm_intros":["VP Product @ Nebula"],"communities":["SF Eng Leaders"]}'::jsonb,
    'e4000001-0000-4000-8000-000000000001'::uuid,
    now() - interval '12 days'
  ),
  (
    'f5000002-0000-4000-8000-000000000002'::uuid,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'::uuid,
    'Jamie Ortiz',
    'jamie@orbit.test',
    'Orbit Health',
    'Talent Partner',
    3,
    'Met at healthtech meetup; responsive on LinkedIn.',
    '{"focus":"staff+ eng hiring","tone":"direct"}'::jsonb,
    '{"hiring_managers":["Chief Architect"]}'::jsonb,
    'e4000002-0000-4000-8000-000000000002'::uuid,
    now() - interval '30 days'
  );

insert into public.contact_job_referrals (
  id, user_id, contact_id, job_id, status, outreach_draft
)
values (
  'c8000001-0000-4000-8000-000000000001'::uuid,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'::uuid,
  'f5000001-0000-4000-8000-000000000001'::uuid,
  'e4000001-0000-4000-8000-000000000001'::uuid,
  'identified',
  'Hi Morgan — loved our chat on design tokens. Nebula''s senior FE role lines up with the reliability work I led. Open to a short sync?'
);
