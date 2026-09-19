-- Repeatable upgrade from the original three-table schema. Does not delete data.
begin;

create index if not exists sources_active_idx
  on public.sources (name, id) where is_active = true;
create index if not exists articles_analysis_queue_idx
  on public.articles (scraped_at, id);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('info', 'warn', 'error')),
  stage text not null,
  message text not null,
  source_id uuid references public.sources(id) on delete set null,
  article_id uuid references public.articles(id) on delete set null,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);
create index if not exists logs_recent_idx on public.logs (created_at desc);

create table if not exists public.oxylabs_schedules (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null unique references public.sources(id),
  oxylabs_schedule_id text not null unique check (oxylabs_schedule_id ~ '^[0-9]+$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists oxylabs_schedules_active_idx
  on public.oxylabs_schedules (source_id) where is_active = true;

create table if not exists public.oxylabs_schedule_runs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.oxylabs_schedules(id),
  oxylabs_job_id text not null check (oxylabs_job_id ~ '^[0-9]+$'),
  result_status text not null,
  started_at timestamptz,
  completed_at timestamptz,
  processed_at timestamptz,
  articles_inserted integer not null default 0 check (articles_inserted >= 0),
  error_message text,
  created_at timestamptz not null default now(),
  unique (schedule_id, oxylabs_job_id)
);
create index if not exists oxylabs_schedule_runs_recent_idx
  on public.oxylabs_schedule_runs (schedule_id, created_at desc);

alter table public.sources enable row level security;
alter table public.articles enable row level security;
alter table public.article_analyses enable row level security;
alter table public.logs enable row level security;
alter table public.oxylabs_schedules enable row level security;
alter table public.oxylabs_schedule_runs enable row level security;

revoke all on table public.sources, public.articles, public.article_analyses,
  public.logs, public.oxylabs_schedules, public.oxylabs_schedule_runs
  from public, anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.sources, public.articles,
  public.article_analyses, public.logs, public.oxylabs_schedules,
  public.oxylabs_schedule_runs to service_role;

commit;
