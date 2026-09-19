-- Initial Fake or Real article schema. Apply in Supabase Dashboard > SQL Editor.
-- The homepage reads these tables with a server-only service-role client.
-- No anon/authenticated policies are created; browser clients cannot read or write them.

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  listing_url text not null unique,
  parser_strategy text,
  is_active boolean not null default true,
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id),
  original_url text not null unique,
  canonical_url text,
  title text not null,
  image_url text not null,
  published_at timestamptz not null,
  category text,
  location text,
  raw_text text not null,
  scraped_at timestamptz not null default now(),
  analyzed_at timestamptz
);

create unique index if not exists articles_canonical_url_unique
  on public.articles (canonical_url) where canonical_url is not null;
create index if not exists articles_published_at_idx
  on public.articles (published_at desc);

create table if not exists public.article_analyses (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null unique references public.articles(id) on delete cascade,
  summary text not null,
  sentiment_score numeric not null check (sentiment_score between -1 and 1),
  sentiment_label text not null check (sentiment_label in ('positive', 'neutral', 'negative')),
  bias_score numeric not null check (bias_score between -1 and 1),
  bias_label text not null check (bias_label in ('left', 'center', 'right', 'mixed', 'unclear')),
  left_percentage numeric not null check (left_percentage between 0 and 100),
  center_percentage numeric not null check (center_percentage between 0 and 100),
  right_percentage numeric not null check (right_percentage between 0 and 100),
  confidence numeric not null check (confidence between 0 and 1),
  framing_notes text not null,
  loaded_terms text[] not null default '{}',
  disclaimer text not null,
  model text not null,
  created_at timestamptz not null default now(),
  constraint framing_percentages_sum check (left_percentage + center_percentage + right_percentage = 100),
  constraint bias_score_matches_percentages check (bias_score = (right_percentage - left_percentage) / 100)
);

alter table public.sources enable row level security;
alter table public.articles enable row level security;
alter table public.article_analyses enable row level security;

-- New Supabase projects may require explicit Data API grants for these server reads.
grant usage on schema public to service_role;
grant all on table public.sources, public.articles, public.article_analyses to service_role;
