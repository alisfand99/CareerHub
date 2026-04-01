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
  id, user_id, name, category, proficiency, tools, metrics, evidence
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
    'Led App Router migration and unified design tokens across 6 squads.'
  ),
  (
    'c2000002-0000-4000-8000-000000000002'::uuid,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'::uuid,
    'Career systems design',
    'Strategy',
    4,
    array['Notion', 'Linear', 'Gemini'],
    '{"cadence":"Weekly pipeline reviews with qualitative notes"}'::jsonb,
    'Built personal CRM + evidence vault powering tailored outreach.'
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
