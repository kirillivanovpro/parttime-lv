-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  avatar_url text,
  bio text,
  rating_avg numeric(3,2) default 0,
  rating_count integer default 0,
  wallet_balance numeric(10,2) default 0,
  created_at timestamptz default now()
);

-- Categories enum
create type public.category_type as enum (
  'cleaning',
  'dog_walking',
  'tutoring',
  'photo_video',
  'delivery',
  'repairs'
);

-- Listing type enum
create type public.listing_type as enum ('offer', 'request');

-- Listings table
create table public.listings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type listing_type not null,
  category category_type not null,
  title text not null,
  description text,
  price numeric(10,2),
  price_unit text default 'h', -- h = per hour, job = per job
  location text,
  images text[],
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chats table
create table public.chats (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete set null,
  participant_ids uuid[] not null,
  created_at timestamptz default now(),
  last_message_at timestamptz default now()
);

-- Messages table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  chat_id uuid references public.chats(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Reviews table
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewed_id uuid references public.profiles(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now(),
  unique(reviewer_id, listing_id)
);

-- Wallet transactions
create type public.transaction_type as enum ('credit', 'debit', 'hold', 'release');

create table public.wallet_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type transaction_type not null,
  amount numeric(10,2) not null,
  description text,
  reference_id uuid,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.wallet_transactions enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Listings policies
create policy "Listings are viewable by everyone" on public.listings
  for select using (true);

create policy "Authenticated users can create listings" on public.listings
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own listings" on public.listings
  for update using (auth.uid() = user_id);

create policy "Users can delete their own listings" on public.listings
  for delete using (auth.uid() = user_id);

-- Chats policies
create policy "Chat participants can view chats" on public.chats
  for select using (auth.uid() = any(participant_ids));

create policy "Authenticated users can create chats" on public.chats
  for insert with check (auth.uid() = any(participant_ids));

-- Messages policies
create policy "Chat participants can view messages" on public.messages
  for select using (
    exists (
      select 1 from public.chats
      where id = messages.chat_id
      and auth.uid() = any(participant_ids)
    )
  );

create policy "Authenticated users can send messages" on public.messages
  for insert with check (auth.uid() = sender_id);

-- Reviews policies
create policy "Reviews are viewable by everyone" on public.reviews
  for select using (true);

create policy "Authenticated users can create reviews" on public.reviews
  for insert with check (auth.uid() = reviewer_id);

-- Wallet transactions policies
create policy "Users can view their own transactions" on public.wallet_transactions
  for select using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', new.phone)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Update rating avg when review is inserted
create or replace function public.update_profile_rating()
returns trigger as $$
begin
  update public.profiles
  set
    rating_avg = (
      select round(avg(rating)::numeric, 2)
      from public.reviews
      where reviewed_id = new.reviewed_id
    ),
    rating_count = (
      select count(*)
      from public.reviews
      where reviewed_id = new.reviewed_id
    )
  where id = new.reviewed_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_created
  after insert on public.reviews
  for each row execute function public.update_profile_rating();

-- Update listing updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.update_updated_at();

-- Realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.chats;
