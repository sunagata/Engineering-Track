-- Daily Engineering Log — schema for Supabase
-- Jalankan ini di Supabase Dashboard > SQL Editor

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  progress int not null default 0 check (progress between 0 and 100),
  status text not null default 'berjalan' check (status in ('berjalan','menunggu','review','selesai')),
  priority text not null default 'sedang' check (priority in ('tinggi','sedang','rendah')),
  created_at timestamptz not null default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  project_id uuid references projects on delete set null,
  log_date date not null default current_date,
  start_time time,
  end_time time,
  title text not null,
  category text not null check (category in ('design','drawing','assembly','revisi','meeting','lainnya')),
  duration_hours numeric not null default 0,
  done boolean not null default false,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  project_id uuid references projects on delete set null,
  target_date date not null default (current_date + 1),
  title text not null,
  priority text not null default 'sedang' check (priority in ('tinggi','sedang','rendah')),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists daily_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  log_date date not null default current_date,
  mood text,
  achievements text[] not null default '{}',
  obstacles text[] not null default '{}',
  personal_notes text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table projects enable row level security;
alter table activities enable row level security;
alter table targets enable row level security;
alter table daily_reflections enable row level security;

create policy "owns projects" on projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owns activities" on activities for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owns targets" on targets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owns reflections" on daily_reflections for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
