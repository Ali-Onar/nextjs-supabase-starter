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

-- =====================================================
-- GENERATED IMAGES TABLE
-- Stores text-to-image generation results from fal.ai
-- =====================================================

-- Create ENUM type for aspect ratio (matching fal.ai API)
create type public.aspect_ratio_enum as enum (
  '21:9', '16:9', '3:2', '4:3', '5:4', 
  '1:1', 
  '4:5', '3:4', '2:3', '9:16'
);

-- Create ENUM type for output format (matching fal.ai API)
create type public.output_format_enum as enum (
  'jpeg', 'png', 'webp'
);

-- Create ENUM type for generation status
create type public.generation_status_enum as enum (
  'pending', 'processing', 'completed', 'failed'
);

-- generated_images table
create table if not exists public.generated_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Input parameters (from user request)
  prompt text not null,
  aspect_ratio public.aspect_ratio_enum not null default '1:1',
  output_format public.output_format_enum not null default 'png',
  num_images integer not null default 1,
  
  -- Generation status
  status public.generation_status_enum not null default 'pending',
  error_message text,
  
  -- Output data (from fal.ai response)
  fal_request_id text, -- fal.ai request ID for tracking
  fal_image_url text, -- Original URL from fal.ai (temporary)
  
  -- Supabase Storage data
  storage_path text, -- Path in Supabase bucket (e.g., "user_id/image_name.png")
  
  -- Image metadata (from fal.ai response)
  width integer,
  height integer,
  file_size integer,
  content_type text,
  
  -- AI-generated description (from fal.ai response)
  description text,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index on user_id for faster queries
create index if not exists idx_generated_images_user_id 
  on public.generated_images(user_id);

-- Index on status for filtering
create index if not exists idx_generated_images_status 
  on public.generated_images(status);

-- Index on created_at for sorting (descending - newest first)
create index if not exists idx_generated_images_created_at 
  on public.generated_images(created_at desc);

-- Trigger to update updated_at column
create trigger trg_generated_images_updated_at
  before update on public.generated_images
  for each row 
  execute function public.set_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
alter table public.generated_images enable row level security;

-- Select policy: Users can only view their own generated images
create policy "generated_images_select_own"
  on public.generated_images
  for select
  using (user_id = (select auth.uid()));

-- Insert policy: Users can only insert their own generated images
create policy "generated_images_insert_own"
  on public.generated_images
  for insert
  with check (user_id = (select auth.uid()));

-- Update policy: Users can only update their own generated images
create policy "generated_images_update_own"
  on public.generated_images
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Delete policy: Users can only delete their own generated images
create policy "generated_images_delete_own"
  on public.generated_images
  for delete
  using (user_id = (select auth.uid()));

-- =====================================================
-- STORAGE BUCKET CONFIGURATION
-- =====================================================

-- Create the storage bucket for generated images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generated-images',
  'generated-images',
  false, -- Public bucket (images are publicly accessible)
  10485760, -- 10MB max file size
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- =====================================================
-- STORAGE BUCKET POLICIES
-- =====================================================

-- Policy: Users can upload images to their own folder
create policy "generated_images_bucket_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'generated-images' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can view their own images
create policy "generated_images_bucket_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'generated-images' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Public can view all images (since bucket is public)
create policy "generated_images_bucket_select_public"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'generated-images');

-- Policy: Users can update their own images
create policy "generated_images_bucket_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'generated-images' 
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'generated-images' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own images
create policy "generated_images_bucket_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'generated-images' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );