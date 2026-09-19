import "server-only";

import { requireSupabaseServerClient } from "../server";
import type { Article, ArticleAnalysis, NewArticleAnalysis } from "../types";

const SCAN_PAGE_SIZE = 200;

export type PendingAnalysisArticle = Pick<Article,
  "id" | "source_id" | "original_url" | "canonical_url" | "title" |
  "image_url" | "published_at" | "raw_text" | "scraped_at" | "analyzed_at">;

/** A missing analysis row is pending even when analyzed_at has a stale value. */
export async function getPendingAnalysisArticles(limit = 5): Promise<PendingAnalysisArticle[]> {
  if (!Number.isSafeInteger(limit) || limit < 1) throw new Error("Analysis limit must be a positive integer");
  const client = requireSupabaseServerClient();
  const pending: PendingAnalysisArticle[] = [];

  for (let offset = 0; pending.length < limit; offset += SCAN_PAGE_SIZE) {
    const { data, error } = await client.from("articles")
      .select(`id, source_id, original_url, canonical_url, title, image_url,
        published_at, raw_text, scraped_at, analyzed_at, article_analyses(id)`)
      .order("scraped_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + SCAN_PAGE_SIZE - 1);

    if (error) throw new Error(`Pending analysis lookup failed (${error.code})`);
    if (!data?.length) break;
    for (const row of data) {
      // The embedded relation is a left join. Do not filter on a joined column in PostgREST.
      const analysis = row.article_analyses;
      if (analysis && (!Array.isArray(analysis) || analysis.length > 0)) continue;
      if (!row.image_url || !row.published_at || !row.raw_text?.trim()) continue;
      const { article_analyses: _analysis, ...article } = row;
      void _analysis;
      pending.push(article as PendingAnalysisArticle);
      if (pending.length === limit) break;
    }
    if (data.length < SCAN_PAGE_SIZE) break;
  }
  return pending;
}

function validateAnalysis(input: NewArticleAnalysis): void {
  const percentages = [input.left_percentage, input.center_percentage, input.right_percentage];
  if (!input.article_id || !input.summary.trim() || !input.framing_notes.trim() ||
    !input.disclaimer.trim() || !input.model.trim() ||
    !["positive", "neutral", "negative"].includes(input.sentiment_label) ||
    !["left", "center", "right", "mixed", "unclear"].includes(input.bias_label) ||
    !Number.isFinite(input.sentiment_score) || Math.abs(input.sentiment_score) > 1 ||
    !Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1 ||
    !Number.isFinite(input.bias_score) ||
    percentages.some((value) => !Number.isFinite(value) || value < 0 || value > 100) ||
    Math.abs(percentages.reduce((sum, value) => sum + value, 0) - 100) > 0.000001 ||
    Math.abs(input.bias_score - (input.right_percentage - input.left_percentage) / 100) > 0.000001 ||
    !Array.isArray(input.loaded_terms) || input.loaded_terms.some((term) => typeof term !== "string")) {
    throw new Error("Article analysis failed validation");
  }
}

/** Persists analysis first, then marks the article analyzed. A retry can finish a partial save. */
export async function saveArticleAnalysis(input: NewArticleAnalysis): Promise<ArticleAnalysis> {
  validateAnalysis(input);
  const client = requireSupabaseServerClient();
  const inserted = await client.from("article_analyses").insert(input).select("*").single();
  let analysis: ArticleAnalysis;

  if (inserted.error?.code === "23505") {
    const existing = await client.from("article_analyses")
      .select("*").eq("article_id", input.article_id).single();
    if (existing.error || !existing.data) {
      throw new Error(`Analysis lookup failed (${existing.error?.code ?? "no row"})`);
    }
    analysis = existing.data as ArticleAnalysis;
  } else {
    if (inserted.error || !inserted.data) {
      throw new Error(`Analysis insert failed (${inserted.error?.code ?? "no row"})`);
    }
    analysis = inserted.data as ArticleAnalysis;
  }

  await markAnalyzedIfSaved(input.article_id);
  return analysis;
}

/** Repairs an analysis that was stored before an analyzed_at update failed. */
export async function markAnalyzedIfSaved(articleId: string): Promise<void> {
  const client = requireSupabaseServerClient();
  const existing = await client.from("article_analyses")
    .select("id").eq("article_id", articleId).maybeSingle();
  if (existing.error || !existing.data) {
    throw new Error(`Analysis required before timestamp update (${existing.error?.code ?? "no row"})`);
  }
  const marked = await client.from("articles")
    .update({ analyzed_at: new Date().toISOString() })
    .eq("id", articleId)
    .is("analyzed_at", null)
    .select("id");
  if (marked.error) throw new Error(`Analyzed timestamp update failed (${marked.error.code})`);
}
