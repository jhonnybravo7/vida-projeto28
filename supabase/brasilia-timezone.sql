-- Keep authorization, signatures and grants unchanged; align calendar operations.
alter function public.start_project28() set timezone = 'America/Sao_Paulo';
alter function public.apply_access_grant_on_signup() set timezone = 'America/Sao_Paulo';
alter function public.get_program_week(integer) set timezone = 'America/Sao_Paulo';
alter function public.complete_program_lesson(integer,integer) set timezone = 'America/Sao_Paulo';

-- Restricted audit archive for reviewed date corrections. Never auto-rewrite history.
create table if not exists private.daily_checkin_corrections (
 id bigint generated always as identity primary key,
 archived_at timestamptz not null default now(),
 original_row jsonb not null,
 reason text not null
);
alter table private.daily_checkin_corrections enable row level security;
revoke all on private.daily_checkin_corrections from public, anon, authenticated;
