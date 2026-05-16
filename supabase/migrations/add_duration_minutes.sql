-- Migration: add ALL missing sessions columns
-- Covers schema.sql lines 318-322 (ALTER TABLE additions never run on the live DB).
-- Run this ONCE in Supabase Dashboard → SQL Editor → New Query

alter table public.sessions
  add column if not exists unit_id uuid references public.units(id) on delete set null;

alter table public.sessions
  add column if not exists topic_id uuid references public.topics(id) on delete set null;

alter table public.sessions
  add column if not exists duration_minutes integer default 0;

alter table public.sessions
  add column if not exists mode text default 'pomodoro';

alter table public.sessions
  add column if not exists completed boolean default true;
