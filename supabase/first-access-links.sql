create table if not exists public.first_access_links (
 token_hash text primary key check (length(token_hash)=64),
 user_id uuid not null references auth.users(id) on delete cascade,
 email text not null,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '24 hours',
 consumed_at timestamptz,
 created_by uuid references auth.users(id)
);
alter table public.first_access_links enable row level security;
revoke all on public.first_access_links from public, anon, authenticated;
grant select, insert, update, delete on public.first_access_links to service_role;
alter table public.first_access_links add column if not exists purpose text not null default 'first_access' check (purpose in ('first_access','recovery'));

