-- Synthetic page-QA fixtures for the Home and News details pages.
-- Apply supabase/schema.sql first, then run this file in Supabase Dashboard > SQL Editor.
-- Safe to rerun: fixed UUIDs and ON CONFLICT DO NOTHING prevent duplicate fixtures.
-- This does not change real sources or articles. The QA source is inactive.

begin;

insert into public.sources (id, name, listing_url, parser_strategy, is_active)
values (
  'e1400000-0000-4000-8000-000000000001',
  'Fake or Real QA Fixtures',
  'https://fake-or-real-qa.example.invalid/',
  null,
  false
)
on conflict (id) do nothing;

insert into public.articles (
  id, source_id, original_url, canonical_url, title, image_url,
  published_at, category, location, raw_text, scraped_at, analyzed_at
)
values
(
  'e1400000-0000-4000-8000-000000000101',
  'e1400000-0000-4000-8000-000000000001',
  'https://fake-or-real-qa.example.invalid/stories/library-hours',
  'https://fake-or-real-qa.example.invalid/stories/library-hours',
  'Library extends weekend hours (QA fiction)',
  'https://placehold.co/1200x675/EBF2F0/23483F.png?text=QA+Library',
  '2026-09-18 12:00:00+00',
  'Community',
  'Fictional Northbridge',
  E'QA FICTION: The town of Northbridge and every event in this story are invented for interface testing. A fictional library board approved longer Saturday opening hours after a trial attracted steady attendance. The mock schedule adds two hours in the afternoon and starts next month.\n\nIn the invented proposal, staff would rotate weekend shifts while a small volunteer group helps visitors find books and meeting rooms. The board said it would review attendance and staffing after eight weeks. No real library, vote, or public budget is described here.\n\nThe longer schedule gives the News details page several readable paragraphs to display. This sample article is not reporting and should never be treated as a verified news event.',
  '2026-09-18 12:05:00+00',
  '2026-09-18 12:10:00+00'
),
(
  'e1400000-0000-4000-8000-000000000102',
  'e1400000-0000-4000-8000-000000000001',
  'https://fake-or-real-qa.example.invalid/stories/river-walk-plan',
  'https://fake-or-real-qa.example.invalid/stories/river-walk-plan',
  'Council reviews a proposed river walk and asks residents to compare access, cost, and flood safeguards (QA fiction)',
  'https://placehold.co/1200x675/E8EFF7/273D65.png?text=QA+River+Walk',
  '2026-09-18 11:00:00+00',
  'Local Planning',
  'Fictional Eastmere',
  E'QA FICTION: Eastmere is an invented town. Its fictional council is reviewing a proposed public path beside an invented river. The draft plan includes a continuous walking route, several access ramps, and signs showing where the bank may be closed during high water.\n\nThe mock consultation asks residents to compare the route with a shorter alternative farther from the water. In this fictional account, planners describe tradeoffs among construction cost, accessibility, maintenance, and habitat protection. No option has been selected.\n\nA third imaginary option would improve existing streets instead of building the new path. The council is depicted as gathering comments before a later meeting, with no binding decision in this sample story.\n\nThis article exists only to test a longer headline, neutral sentiment, center-weighted framing meter, and multiple body paragraphs in the Home and News details layouts.',
  '2026-09-18 11:05:00+00',
  '2026-09-18 11:10:00+00'
),
(
  'e1400000-0000-4000-8000-000000000103',
  'e1400000-0000-4000-8000-000000000001',
  'https://fake-or-real-qa.example.invalid/stories/transit-fee-debate',
  'https://fake-or-real-qa.example.invalid/stories/transit-fee-debate',
  'Debate over a fictional transit fee grows as commuters and shop owners question who would pay, how much service would improve, and whether the proposal is fair (QA fiction)',
  'https://placehold.co/1200x675/F5EBE6/6E3C30.png?text=QA+Transit+Debate',
  '2026-09-18 10:00:00+00',
  'Transport',
  'Fictional Westhaven',
  E'QA FICTION: Westhaven, its commuters, and this transit fee debate are invented for page testing. In the sample scenario, a fictional transit board proposes a small fee on downtown parking permits to help fund more frequent evening buses. The proposal has not been adopted.\n\nSome imaginary shop owners worry that an added permit cost could discourage visits. Other fictional residents argue that dependable evening buses would give workers and customers more travel choices. The sample board has not published a final budget or service timetable.\n\nAt a mock meeting, members ask for clearer estimates of the cost per permit and the number of added bus trips. They also ask whether lower-income drivers would qualify for a discount. The questions remain open in this invented account.\n\nThe deliberately long headline and stronger negative sentiment value help testers inspect text wrapping and the analysis panel. The framing percentages below are hand-written QA values, not a model judgment or a claim about real politics.',
  '2026-09-18 10:05:00+00',
  '2026-09-18 10:10:00+00'
)
on conflict (id) do nothing;

insert into public.article_analyses (
  id, article_id, summary, sentiment_score, sentiment_label, bias_score,
  bias_label, left_percentage, center_percentage, right_percentage,
  confidence, framing_notes, loaded_terms, disclaimer, model
)
values
(
  'e1400000-0000-4000-8000-000000000201',
  'e1400000-0000-4000-8000-000000000101',
  'QA FICTION: An invented library extends Saturday hours for a trial period and plans to review attendance and staffing. This is synthetic sample content.',
  0.42, 'positive', -0.50,
  'left', 60, 30, 10,
  0.72,
  'Synthetic QA framing: the sample text emphasizes public access and shared community services. These values were written by hand for UI testing.',
  array['public access', 'community services'],
  'Synthetic QA analysis only. Political framing is AI-estimated in the product and can be imperfect; these fixture values are hand-written and describe no real event.',
  'qa-fixture'
),
(
  'e1400000-0000-4000-8000-000000000202',
  'e1400000-0000-4000-8000-000000000102',
  'QA FICTION: An invented council compares river walk options, including access, cost, maintenance, and flood safeguards. No decision is reported.',
  0.00, 'neutral', 0.05,
  'center', 10, 75, 15,
  0.81,
  'Synthetic QA framing: the sample describes several options and open questions without endorsing one. These values were written by hand for UI testing.',
  array['tradeoffs', 'consultation'],
  'Synthetic QA analysis only. Political framing is AI-estimated in the product and can be imperfect; these fixture values are hand-written and describe no real event.',
  'qa-fixture'
),
(
  'e1400000-0000-4000-8000-000000000203',
  'e1400000-0000-4000-8000-000000000103',
  'QA FICTION: An invented transit board considers a parking permit fee for evening buses while residents question its cost and fairness. The proposal remains undecided.',
  -0.58, 'negative', 0.55,
  'right', 10, 25, 65,
  0.68,
  'Synthetic QA framing: the sample raises cost and fee concerns. These values were written by hand for UI testing and are not an assessment of any real article.',
  array['added permit cost', 'fairness', 'service improvement'],
  'Synthetic QA analysis only. Political framing is AI-estimated in the product and can be imperfect; these fixture values are hand-written and describe no real event.',
  'qa-fixture'
)
on conflict (article_id) do nothing;

commit;

-- Verification: expect exactly three rows, each with is_active = false,
-- analyzed_at and complete article/analysis values. Re-run the file to confirm
-- the row count stays at three. These are the fields read by the current pages.
select
  a.id, s.name as source_name, s.is_active as source_is_active,
  a.original_url, a.canonical_url, a.title, a.image_url,
  a.published_at, a.category, a.location, a.raw_text,
  a.scraped_at, a.analyzed_at,
  aa.summary, aa.sentiment_score, aa.sentiment_label, aa.bias_score,
  aa.bias_label, aa.left_percentage, aa.center_percentage,
  aa.right_percentage, aa.confidence, aa.framing_notes,
  aa.loaded_terms, aa.disclaimer, aa.model
from public.articles a
join public.sources s on s.id = a.source_id
join public.article_analyses aa on aa.article_id = a.id
where a.id in (
  'e1400000-0000-4000-8000-000000000101',
  'e1400000-0000-4000-8000-000000000102',
  'e1400000-0000-4000-8000-000000000103'
)
and s.id = 'e1400000-0000-4000-8000-000000000001'
and aa.model = 'qa-fixture'
order by a.published_at desc;

-- Optional cleanup, run separately only when QA fixtures are no longer needed.
-- The analysis rows cascade when their matching fixture articles are deleted.
-- begin;
-- delete from public.articles
-- where id in (
--   'e1400000-0000-4000-8000-000000000101',
--   'e1400000-0000-4000-8000-000000000102',
--   'e1400000-0000-4000-8000-000000000103'
-- )
-- and source_id = 'e1400000-0000-4000-8000-000000000001';
-- delete from public.sources
-- where id = 'e1400000-0000-4000-8000-000000000001'
-- and listing_url = 'https://fake-or-real-qa.example.invalid/';
-- commit;
