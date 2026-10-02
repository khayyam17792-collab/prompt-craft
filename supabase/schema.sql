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
-- prompt_likes (one row per user per prompt; likes_count is kept in sync)
-- ---------------------------------------------------------------------------
create table if not exists public.prompt_likes (
  prompt_id   uuid not null references public.prompts (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (prompt_id, user_id)
);

create index if not exists prompt_likes_user_id_idx on public.prompt_likes (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.prompts  enable row level security;
alter table public.prompt_likes enable row level security;

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

-- prompt_likes: anyone can read, users manage only their own likes
drop policy if exists "prompt_likes_select_public" on public.prompt_likes;
create policy "prompt_likes_select_public"
  on public.prompt_likes for select
  using (true);

drop policy if exists "prompt_likes_insert_own" on public.prompt_likes;
create policy "prompt_likes_insert_own"
  on public.prompt_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "prompt_likes_delete_own" on public.prompt_likes;
create policy "prompt_likes_delete_own"
  on public.prompt_likes for delete
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

-- Toggle the caller's like on a public prompt and keep prompts.likes_count in sync.
-- Callable via supabase.rpc('toggle_prompt_like', { prompt_id }).
create or replace function public.toggle_prompt_like(prompt_id uuid)
returns table (liked boolean, likes_count integer)
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  target_id uuid := prompt_id;
  removed boolean;
begin
  if uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.prompts p
     where p.id = target_id and (p.is_public = true or p.user_id = uid)
  ) then
    raise exception 'prompt not found' using errcode = 'P0002';
  end if;

  delete from public.prompt_likes pl
   where pl.prompt_id = target_id and pl.user_id = uid;
  removed := found;

  if removed then
    update public.prompts p
       set likes_count = greatest(p.likes_count - 1, 0)
     where p.id = target_id;
  else
    insert into public.prompt_likes (prompt_id, user_id) values (target_id, uid);
    update public.prompts p
       set likes_count = p.likes_count + 1
     where p.id = target_id;
  end if;

  return query
    select not removed, p.likes_count
      from public.prompts p
     where p.id = target_id;
end;
$$;

revoke all on function public.toggle_prompt_like(uuid) from public;
grant execute on function public.toggle_prompt_like(uuid) to authenticated;
