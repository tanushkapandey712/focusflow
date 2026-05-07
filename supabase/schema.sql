-- ============================================================
-- FocusFlow — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New Query)
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

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
  field_of_study text,
  institution_start_time text,
  institution_end_time text,
  has_completed_profile_setup boolean default false,
  has_completed_syllabus_setup boolean default false,
  has_completed_schedule_setup boolean default false,
  routine jsonb,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete own profile"
  on public.profiles for delete
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

create policy "Users can view own subjects"
  on public.subjects for select
  using (auth.uid() = user_id);

create policy "Users can insert own subjects"
  on public.subjects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subjects"
  on public.subjects for update
  using (auth.uid() = user_id);

create policy "Users can delete own subjects"
  on public.subjects for delete
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

create policy "Users can view own units"
  on public.units for select
  using (auth.uid() = user_id);

create policy "Users can insert own units"
  on public.units for insert
  with check (auth.uid() = user_id);

create policy "Users can update own units"
  on public.units for update
  using (auth.uid() = user_id);

create policy "Users can delete own units"
  on public.units for delete
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

create policy "Users can view own topics"
  on public.topics for select
  using (auth.uid() = user_id);

create policy "Users can insert own topics"
  on public.topics for insert
  with check (auth.uid() = user_id);

create policy "Users can update own topics"
  on public.topics for update
  using (auth.uid() = user_id);

create policy "Users can delete own topics"
  on public.topics for delete
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

create policy "Users can view own goals"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on public.goals for update
  using (auth.uid() = user_id);

create policy "Users can delete own goals"
  on public.goals for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 6. SESSIONS
-- ============================================================
create table if not exists public.sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject_id text,
  subject_name text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  planned_minutes integer default 0,
  actual_minutes integer default 0,
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

create policy "Users can view own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.sessions for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 7. Indexes for performance
-- ============================================================
create index if not exists idx_subjects_user_id on public.subjects(user_id);
create index if not exists idx_units_user_id on public.units(user_id);
create index if not exists idx_units_subject_id on public.units(subject_id);
create index if not exists idx_topics_user_id on public.topics(user_id);
create index if not exists idx_topics_unit_id on public.topics(unit_id);
create index if not exists idx_goals_user_id on public.goals(user_id);
create index if not exists idx_sessions_user_id on public.sessions(user_id);
create index if not exists idx_sessions_started_at on public.sessions(started_at);
