-- Run in Supabase Dashboard > SQL Editor after schema.sql or upgrade-data-access.sql.
-- The transaction below rolls back its test rows.

select c.relname as table_name, c.relrowsecurity as rls_enabled,
  (has_table_privilege('service_role', c.oid, 'SELECT')
    and has_table_privilege('service_role', c.oid, 'INSERT')
    and has_table_privilege('service_role', c.oid, 'UPDATE')
    and has_table_privilege('service_role', c.oid, 'DELETE')) as service_role_access,
  has_table_privilege('anon', c.oid, 'SELECT') as anon_read,
  has_table_privilege('authenticated', c.oid, 'SELECT') as authenticated_read
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('sources', 'articles', 'article_analyses', 'logs',
                    'oxylabs_schedules', 'oxylabs_schedule_runs')
order by c.relname;
-- Expect six rows: rls_enabled and service_role_access true, both read columns false.

select tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename in ('sources', 'articles', 'article_analyses', 'logs',
                    'oxylabs_schedules', 'oxylabs_schedule_runs')
order by tablename, indexname;

-- Pending-analysis check deliberately ignores analyzed_at.
select a.id, a.analyzed_at
from public.articles a
left join public.article_analyses aa on aa.article_id = a.id
where aa.id is null
order by a.scraped_at
limit 20;

begin;

insert into public.sources (id, name, listing_url, is_active)
values ('e1500000-0000-4000-8000-000000000001', 'Data access verification',
        'https://data-access-check.example.invalid/', false);

insert into public.articles (id, source_id, original_url, canonical_url,
  title, image_url, published_at, raw_text)
values ('e1500000-0000-4000-8000-000000000101',
        'e1500000-0000-4000-8000-000000000001',
        'https://data-access-check.example.invalid/story/one',
        'https://data-access-check.example.invalid/story/one',
        'Verification fixture', 'https://data-access-check.example.invalid/image.png',
        now(), 'Verification fixture body.');

-- A duplicate original URL is ignored and the existing article is preserved.
insert into public.articles (source_id, original_url, title, image_url, published_at, raw_text)
values ('e1500000-0000-4000-8000-000000000001',
        'https://data-access-check.example.invalid/story/one',
        'Duplicate fixture', 'https://data-access-check.example.invalid/image.png',
        now(), 'Duplicate fixture body.')
on conflict do nothing;

-- A duplicate canonical URL is also ignored.
insert into public.articles (source_id, original_url, canonical_url,
  title, image_url, published_at, raw_text)
values ('e1500000-0000-4000-8000-000000000001',
        'https://data-access-check.example.invalid/story/two',
        'https://data-access-check.example.invalid/story/one',
        'Canonical duplicate fixture',
        'https://data-access-check.example.invalid/image.png',
        now(), 'Canonical duplicate fixture body.')
on conflict do nothing;

-- Simulate a stale timestamp; the left join must still report this row as pending.
update public.articles set analyzed_at = now()
where id = 'e1500000-0000-4000-8000-000000000101';

insert into public.logs (level, stage, message, source_id)
values ('info', 'verification', 'Temporary verification log',
        'e1500000-0000-4000-8000-000000000001');

insert into public.oxylabs_schedules (id, source_id, oxylabs_schedule_id)
values ('e1500000-0000-4000-8000-000000000201',
        'e1500000-0000-4000-8000-000000000001', '9223372036854775807');

insert into public.oxylabs_schedule_runs (schedule_id, oxylabs_job_id, result_status)
values ('e1500000-0000-4000-8000-000000000201', '9223372036854775806', 'done');

select (select count(*) from public.articles
        where source_id = 'e1500000-0000-4000-8000-000000000001') as article_count,
       (select count(*) from public.articles a
        left join public.article_analyses aa on aa.article_id = a.id
        where a.id = 'e1500000-0000-4000-8000-000000000101'
          and a.analyzed_at is not null and aa.id is null) as stale_timestamp_pending_count,
       (select count(*) from public.logs
        where stage = 'verification'
          and source_id = 'e1500000-0000-4000-8000-000000000001') as log_count,
       (select oxylabs_schedule_id from public.oxylabs_schedules
        where id = 'e1500000-0000-4000-8000-000000000201') as exact_schedule_id,
       (select oxylabs_job_id from public.oxylabs_schedule_runs
        where schedule_id = 'e1500000-0000-4000-8000-000000000201') as exact_job_id;
-- Expect article_count 1, stale_timestamp_pending_count 1, and exact 19-digit IDs.

rollback;
