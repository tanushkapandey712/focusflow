-- ============================================================
-- FocusFlow — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New Query)
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- Row Level Security model
-- ============================================================
-- FocusFlow stores every user-owned app row with a user_id column.
-- The browser must only use the public anon key plus the signed-in
-- Supabase Auth session. These policies require auth.uid() = user_id
-- for SELECT, INSERT, UPDATE, and DELETE on every app data table.
--
-- Child tables also verify parent ownership on INSERT/UPDATE so a user
-- cannot create their own row attached to another user's subject/unit/topic.

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null default 'Student',
  timezone text default 'UTC',
  preferred_mode text default 'pomodoro',
  institution_type text,
  institution_name text,
  class_or_course text,
  class_year text,
  field_of_study text,
  field text,
  institution_start_time text,
  institution_end_time text,
  has_completed_profile_setup boolean default false,
  has_completed_syllabus_setup boolean default false,
  has_completed_schedule_setup boolean default false,
  onboarding_completed boolean default false,
  preferred_study_hours text,
  routine jsonb,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

alter table public.profiles add column if not exists class_year text;
alter table public.profiles add column if not exists field text;
alter table public.profiles add column if not exists onboarding_completed boolean default false;
alter table public.profiles add column if not exists preferred_study_hours text;

-- RLS: profiles are private to the authenticated owner.
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 2. SUBJECTS
-- ============================================================
create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#6366f1',
  exam_date text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subjects enable row level security;

-- RLS: subjects are private to the authenticated owner.
drop policy if exists "Users can view own subjects" on public.subjects;
create policy "Users can view own subjects"
  on public.subjects for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own subjects" on public.subjects;
create policy "Users can insert own subjects"
  on public.subjects for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own subjects" on public.subjects;
create policy "Users can update own subjects"
  on public.subjects for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own subjects" on public.subjects;
create policy "Users can delete own subjects"
  on public.subjects for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 3. UNITS
-- ============================================================
create table if not exists public.units (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  title text not null,
  order_index integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.units enable row level security;

-- RLS: units are private to the authenticated owner and must belong
-- to a subject owned by the same authenticated user.
drop policy if exists "Users can view own units" on public.units;
create policy "Users can view own units"
  on public.units for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own units" on public.units;
create policy "Users can insert own units"
  on public.units for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.subjects parent_subject
      where parent_subject.id = subject_id
        and parent_subject.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own units" on public.units;
create policy "Users can update own units"
  on public.units for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.subjects parent_subject
      where parent_subject.id = subject_id
        and parent_subject.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own units" on public.units;
create policy "Users can delete own units"
  on public.units for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 4. TOPICS
-- ============================================================
create table if not exists public.topics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete cascade not null,
  title text not null,
  status text default 'not_started',
  studied_minutes integer default 0,
  study_sessions_count integer default 0,
  last_studied_at timestamptz,
  order_index integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.topics enable row level security;

-- RLS: topics are private to the authenticated owner and must belong
-- to a unit owned by the same authenticated user.
drop policy if exists "Users can view own topics" on public.topics;
create policy "Users can view own topics"
  on public.topics for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own topics" on public.topics;
create policy "Users can insert own topics"
  on public.topics for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.units parent_unit
      where parent_unit.id = unit_id
        and parent_unit.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own topics" on public.topics;
create policy "Users can update own topics"
  on public.topics for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.units parent_unit
      where parent_unit.id = unit_id
        and parent_unit.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own topics" on public.topics;
create policy "Users can delete own topics"
  on public.topics for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 5. GOALS
-- ============================================================
create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  type text default 'academic',
  target_minutes integer default 0,
  completed_minutes integer default 0,
  due_date text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.goals enable row level security;

-- RLS: goals are private to the authenticated owner.
drop policy if exists "Users can view own goals" on public.goals;
create policy "Users can view own goals"
  on public.goals for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own goals" on public.goals;
create policy "Users can insert own goals"
  on public.goals for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own goals" on public.goals;
create policy "Users can update own goals"
  on public.goals for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own goals" on public.goals;
create policy "Users can delete own goals"
  on public.goals for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 6. SESSIONS
-- ============================================================
create table if not exists public.sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject_id text,
  unit_id uuid references public.units(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  subject_name text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  planned_minutes integer default 0,
  actual_minutes integer default 0,
  duration_minutes integer default 0,
  mode text default 'pomodoro',
  completed boolean default true,
  distraction_count integer default 0,
  distraction_tags jsonb default '[]',
  tab_switch_count integer default 0,
  tab_away_ms integer default 0,
  inactivity_count integer default 0,
  inactivity_ms integer default 0,
  stability_score real,
  goal text,
  note text,
  syllabus_topic jsonb,
  focus_tracking jsonb,
  created_at timestamptz default now()
);

alter table public.sessions enable row level security;

alter table public.sessions add column if not exists unit_id uuid references public.units(id) on delete set null;
alter table public.sessions add column if not exists topic_id uuid references public.topics(id) on delete set null;
alter table public.sessions add column if not exists duration_minutes integer default 0;
alter table public.sessions add column if not exists mode text default 'pomodoro';
alter table public.sessions add column if not exists completed boolean default true;

-- RLS: sessions are private to the authenticated owner. Optional unit/topic
-- links must point to rows owned by the same authenticated user.
drop policy if exists "Users can view own sessions" on public.sessions;
create policy "Users can view own sessions"
  on public.sessions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own sessions" on public.sessions;
create policy "Users can insert own sessions"
  on public.sessions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      unit_id is null
      or exists (
        select 1
        from public.units session_unit
        where session_unit.id = unit_id
          and session_unit.user_id = auth.uid()
      )
    )
    and (
      topic_id is null
      or exists (
        select 1
        from public.topics session_topic
        where session_topic.id = topic_id
          and session_topic.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Users can update own sessions" on public.sessions;
create policy "Users can update own sessions"
  on public.sessions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      unit_id is null
      or exists (
        select 1
        from public.units session_unit
        where session_unit.id = unit_id
          and session_unit.user_id = auth.uid()
      )
    )
    and (
      topic_id is null
      or exists (
        select 1
        from public.topics session_topic
        where session_topic.id = topic_id
          and session_topic.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Users can delete own sessions" on public.sessions;
create policy "Users can delete own sessions"
  on public.sessions for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 7. Indexes for performance
-- ============================================================
create index if not exists idx_subjects_user_id on public.subjects(user_id);
create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_units_user_id on public.units(user_id);
create index if not exists idx_units_subject_id on public.units(subject_id);
create index if not exists idx_topics_user_id on public.topics(user_id);
create index if not exists idx_topics_unit_id on public.topics(unit_id);
create index if not exists idx_goals_user_id on public.goals(user_id);
create index if not exists idx_sessions_user_id on public.sessions(user_id);
create index if not exists idx_sessions_started_at on public.sessions(started_at);
create index if not exists idx_sessions_unit_id on public.sessions(unit_id);
create index if not exists idx_sessions_topic_id on public.sessions(topic_id);

-- ============================================================
-- 8. Realtime sync for profile, syllabus, goals, and session data
-- ============================================================
-- Full replica identity lets filtered DELETE events include enough row data
-- for cross-device data updates.
alter table public.subjects replica identity full;
alter table public.units replica identity full;
alter table public.topics replica identity full;
alter table public.goals replica identity full;
alter table public.sessions replica identity full;
alter table public.profiles replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'profiles'
    ) then
      alter publication supabase_realtime add table public.profiles;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'subjects'
    ) then
      alter publication supabase_realtime add table public.subjects;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'units'
    ) then
      alter publication supabase_realtime add table public.units;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'topics'
    ) then
      alter publication supabase_realtime add table public.topics;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'goals'
    ) then
      alter publication supabase_realtime add table public.goals;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'sessions'
    ) then
      alter publication supabase_realtime add table public.sessions;
    end if;
  end if;
end $$;
