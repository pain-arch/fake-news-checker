import "server-only";

import { getSupabaseServerClient } from "../server";
import type { FramingLabel, HomeArticle, SentimentLabel } from "../types";

const HOMEPAGE_LIMIT = 12;
const sentimentLabels: readonly string[] = ["positive", "neutral", "negative"];
const framingLabels: readonly string[] = ["left", "center", "right", "mixed", "unclear"];

export type HomeArticlesResult = {
  articles: HomeArticle[];
  state: "ready" | "unconfigured" | "unavailable";
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function singleRecord(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) return value;
  if (Array.isArray(value) && value.length === 1 && isRecord(value[0])) return value[0];
  return null;
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isPercentage(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function parseArticle(value: unknown): HomeArticle | null {
  if (!isRecord(value)) return null;
  const source = singleRecord(value.sources);
  const analysis = singleRecord(value.article_analyses);
  if (!source || !analysis) return null;

  const { id, original_url, title, image_url, published_at, category, location } = value;
  const { sentiment_label, bias_label, left_percentage, center_percentage, right_percentage, confidence } = analysis;
  if (
    typeof id !== "string" || !isHttpUrl(original_url) || !isHttpUrl(image_url) ||
    typeof title !== "string" || !title.trim() ||
    typeof published_at !== "string" || Number.isNaN(Date.parse(published_at)) ||
    typeof source.name !== "string" || !source.name.trim() ||
    typeof sentiment_label !== "string" || !sentimentLabels.includes(sentiment_label) ||
    typeof bias_label !== "string" || !framingLabels.includes(bias_label) ||
    !isPercentage(left_percentage) || !isPercentage(center_percentage) || !isPercentage(right_percentage) ||
    Math.abs(left_percentage + center_percentage + right_percentage - 100) > 0.01
  ) return null;

  return {
    id,
    original_url,
    title: title.trim(),
    image_url,
    published_at,
    category: typeof category === "string" ? category : null,
    location: typeof location === "string" ? location : null,
    source_name: source.name,
    sentiment_label: sentiment_label as SentimentLabel,
    bias_label: bias_label as FramingLabel,
    left_percentage,
    center_percentage,
    right_percentage,
    confidence: typeof confidence === "number" && Number.isFinite(confidence) && confidence >= 0 && confidence <= 1 ? confidence : null,
  };
}

export async function getHomeArticles(): Promise<HomeArticlesResult> {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) return { articles: [], state: "unconfigured" };

    const { data, error } = await supabase
      .from("articles")
      .select(`id, original_url, title, image_url, published_at, category, location,
        sources!inner(name),
        article_analyses!inner(sentiment_label, bias_label, left_percentage, center_percentage, right_percentage, confidence)`)
      .not("analyzed_at", "is", null)
      .not("image_url", "is", null)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(HOMEPAGE_LIMIT);

    if (error) {
      console.error("[homepage] Supabase article read failed", { code: error.code, message: error.message });
      return { articles: [], state: "unavailable" };
    }

    const rows: unknown = data;
    return {
      articles: Array.isArray(rows) ? rows.map(parseArticle).filter((article): article is HomeArticle => article !== null) : [],
      state: "ready",
    };
  } catch (error) {
    console.error("[homepage] Supabase article read failed", error);
    return { articles: [], state: "unavailable" };
  }
}
