-- PromptCraft Studio — database schema
-- Run with: supabase db reset  (or paste into the Supabase SQL editor)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  constraint username_length check (username is null or char_length(username) between 3 and 32)
);

-- ---------------------------------------------------------------------------
-- prompts
-- ---------------------------------------------------------------------------
create table if not exists public.prompts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  title          text not null,
  description    text,
  template_text  text not null,
  variables      jsonb not null default '[]'::jsonb,
  tags           text[] not null default '{}',
  likes_count    integer not null default 0,
  is_public      boolean not null default true,
  created_at     timestamptz not null default now(),
  constraint title_length check (char_length(title) between 1 and 200),
  constraint likes_non_negative check (likes_count >= 0)
);

create index if not exists prompts_user_id_idx    on public.prompts (user_id);
create index if not exists prompts_created_at_idx on public.prompts (created_at desc);
create index if not exists prompts_public_idx     on public.prompts (is_public) where is_public;
create index if not exists prompts_tags_idx       on public.prompts using gin (tags);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.prompts  enable row level security;

-- profiles: anyone can read, users manage only their own row
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- prompts: public read for is_public rows (owners also see their private rows)
drop policy if exists "prompts_select_public_or_own" on public.prompts;
create policy "prompts_select_public_or_own"
  on public.prompts for select
  using (is_public = true or auth.uid() = user_id);

-- prompts: write/update/delete restricted to the authenticated owner
drop policy if exists "prompts_insert_own" on public.prompts;
create policy "prompts_insert_own"
  on public.prompts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "prompts_update_own" on public.prompts;
create policy "prompts_update_own"
  on public.prompts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "prompts_delete_own" on public.prompts;
create policy "prompts_delete_own"
  on public.prompts for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Functions & triggers
-- ---------------------------------------------------------------------------

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomically increment likes on a public prompt. Callable by authenticated users
-- via supabase.rpc('increment_prompt_likes', { prompt_id }).
create or replace function public.increment_prompt_likes(prompt_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  new_count integer;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  update public.prompts
     set likes_count = likes_count + 1
   where id = prompt_id and is_public = true
  returning likes_count into new_count;

  if new_count is null then
    raise exception 'prompt not found' using errcode = 'P0002';
  end if;

  return new_count;
end;
$$;

revoke all on function public.increment_prompt_likes(uuid) from public;
grant execute on function public.increment_prompt_likes(uuid) to authenticated;
