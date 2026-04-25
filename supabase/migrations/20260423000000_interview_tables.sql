-- Run via Supabase Dashboard → SQL Editor, or Supabase CLI:
--   supabase db push

create table if not exists public.interview_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  locale            text not null check (locale in ('zh', 'en')),
  target_role       text not null,
  target_categories text[] not null default '{}',
  phase             text not null default 'intro'
                    check (phase in ('intro','behavioral','technical','wrapup','completed','aborted')),
  status            text not null default 'active'
                    check (status in ('active','completed','aborted','error')),
  started_at        timestamptz not null default now(),
  ended_at          timestamptz,
  total_turns       int not null default 0 check (total_turns >= 0),
  summary           jsonb,
  created_at        timestamptz not null default now()
);

create index idx_interview_sessions_user_date
  on public.interview_sessions (user_id, started_at desc);

create table if not exists public.interview_turns (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null
                     references public.interview_sessions(id) on delete cascade,
  turn_index         int not null,
  role               text not null check (role in ('assistant','user')),
  phase              text not null
                     check (phase in ('intro','behavioral','technical','wrapup','completed','aborted')),
  content            text not null,
  audio_duration_sec int,
  question_id        uuid,
  is_generated       boolean not null default false,
  created_at         timestamptz not null default now()
);

create unique index uniq_turn_order
  on public.interview_turns (session_id, turn_index);
