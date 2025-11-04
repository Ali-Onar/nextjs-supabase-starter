-- user_profiles table
create table public.user_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- set_updated_at function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

-- trigger to update updated_at column
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row 
execute function public.set_updated_at();

-- handle_new_user function
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (user_id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end$$;

-- trigger to handle new user creation
create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- enable row level security for user_profiles table
alter table public.user_profiles enable row level security;

create policy "profile_select_own"
on public.user_profiles
for select
using (user_id = (select auth.uid()));

create policy "profile_insert_self"
on public.user_profiles
for insert
with check (user_id = (select auth.uid()));

create policy "profile_update_own"
on public.user_profiles
for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- notes table
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text,
  image_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- index on user_id column
create index if not exists idx_notes_user_id on public.notes(user_id);

-- trigger to update updated_at column
create trigger trg_notes_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

-- enable row level security for notes table
alter table public.notes enable row level security;

create policy "notes_select_own"
on public.notes
for select
using (user_id = (select auth.uid()));

create policy "notes_insert_own"
on public.notes
for insert
with check (user_id = (select auth.uid()));

create policy "notes_update_own"
on public.notes
for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "notes_delete_own"
on public.notes
for delete
using (user_id = (select auth.uid()));