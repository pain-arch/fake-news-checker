import "server-only";

import { fetchPageHtml, OxylabsRequestError } from "@/lib/oxylabs/client";
import { normalizePublisherUrl } from "@/lib/parsing/article-urls";
import { parseArticleHtml } from "@/lib/parsing/article";
import { extractHomepageCandidates } from "@/lib/parsing/homepage";
import { writeLog } from "@/lib/supabase/queries/logs";
import { getExistingArticleUrls, insertArticle } from "@/lib/supabase/queries/persistence";
import type { Source } from "@/lib/supabase/types";

const MAX_DETAIL_FETCHES_PER_SOURCE = 30;

export type ScrapeSummary = {
  status: "completed" | "partial" | "failed";
  sourcesChecked: number;
  candidatesFound: number;
  candidatesRejected: number;
  duplicatesSkipped: number;
  detailPagesScraped: number;
  articlesInserted: number;
  articlesRejected: number;
  articlesFailed: number;
  durationMs: number;
  rejectionReasons: Record<string, number>;
};

function count(summary: ScrapeSummary, reason: string, candidate: boolean): void {
  summary.rejectionReasons[reason] = (summary.rejectionReasons[reason] ?? 0) + 1;
  if (candidate) summary.candidatesRejected++;
  else summary.articlesRejected++;
}

async function log(stage: string, message: string, sourceId?: string, details?: Record<string, unknown>): Promise<void> {
  console.info(`[scrape] ${message}`, details ?? {});
  try {
    await writeLog({ level: stage === "error" ? "error" : "info", stage: `scrape.${stage}`, message, source_id: sourceId, details });
  } catch (error) {
    console.error("[scrape] Could not persist progress log", error instanceof Error ? error.message : "unknown error");
  }
}

/** Homepage HTML is injected so scheduled results can reuse this article pipeline later. */
export async function processSourceHomepage(source: Source, html: string, limit: number, summary: ScrapeSummary): Promise<void> {
  const candidates = extractHomepageCandidates(html, source);
  summary.candidatesFound += candidates.found;
  for (const [reason, amount] of Object.entries(candidates.rejected)) {
    summary.candidatesRejected += amount;
    summary.rejectionReasons[reason] = (summary.rejectionReasons[reason] ?? 0) + amount;
  }
  await log("candidates", `${source.name}: found ${candidates.found} story cards; rejected ${Object.values(candidates.rejected).reduce((a, b) => a + b, 0)} candidates`, source.id);
  const existing = await getExistingArticleUrls(candidates.urls);
  summary.duplicatesSkipped += existing.size;
  const newCandidates = candidates.urls.filter((url) => !existing.has(url));
  const pending = newCandidates.slice(0, MAX_DETAIL_FETCHES_PER_SOURCE);
  for (let index = pending.length; index < newCandidates.length; index++) count(summary, "detail_fetch_budget", true);
  console.info(`[scrape] ${source.name}: ${existing.size} duplicates skipped; ${pending.length} detail candidates`);
  let inserted = 0;
  const rejectedBefore = summary.articlesRejected;
  const failedBefore = summary.articlesFailed;
  for (const url of pending) {
    if (inserted >= limit) break;
    try {
      const html = await fetchPageHtml(url);
      summary.detailPagesScraped++;
      const parsed = parseArticleHtml(html, url, source);
      if (!parsed.article) { count(summary, parsed.reason, false); console.info(`[scrape] ${source.name}: article rejected`, { reason: parsed.reason }); continue; }
      const result = await insertArticle(parsed.article);
      if (result.status === "duplicate") summary.duplicatesSkipped++;
      else { inserted++; summary.articlesInserted++; console.info(`[scrape] ${source.name}: inserted article`, { url }); }
    } catch (error) {
      summary.articlesFailed++;
      console.error(`[scrape] ${source.name}: detail failed`, { url, error: error instanceof Error ? error.message : "unknown error" });
      if (error instanceof OxylabsRequestError && [401, 403, 429].includes(error.status ?? 0)) throw error;
    }
  }
  await log("source", `${source.name}: ${inserted} articles inserted`, source.id, {
    found: candidates.found, duplicates: existing.size, rejected: summary.articlesRejected - rejectedBefore,
    failed: summary.articlesFailed - failedBefore,
  });
}

export async function runManualScrape(sources: Source[], limit: number): Promise<ScrapeSummary> {
  const started = Date.now();
  const summary: ScrapeSummary = {
    status: "completed", sourcesChecked: 0, candidatesFound: 0, candidatesRejected: 0,
    duplicatesSkipped: 0, detailPagesScraped: 0, articlesInserted: 0, articlesRejected: 0,
    articlesFailed: 0, durationMs: 0, rejectionReasons: {},
  };
  await log("started", `Scrape started for ${sources.length} sources`, undefined, { sources: sources.map((source) => source.name), limitPerSource: limit });
  let sourceFailures = 0;
  for (const source of sources) {
    summary.sourcesChecked++;
    await log("source", `Starting ${source.name}`, source.id);
    try {
      if (!normalizePublisherUrl(source.listing_url, source.listing_url, source)) throw new Error("Source homepage URL is invalid");
      const html = await fetchPageHtml(source.listing_url);
      await log("homepage", `${source.name}: homepage fetched`, source.id);
      await processSourceHomepage(source, html, limit, summary);
    } catch (error) {
      sourceFailures++;
      await log("error", `${source.name}: source failed`, source.id, { error: error instanceof Error ? error.message : "unknown error" });
    }
  }
  summary.status = sourceFailures === sources.length ? "failed" : sourceFailures || summary.articlesFailed ? "partial" : "completed";
  summary.durationMs = Date.now() - started;
  await log("completed", `Scrape ${summary.status}`, undefined, { ...summary });
  console.info("[scrape] final summary", summary);
  return summary;
}
