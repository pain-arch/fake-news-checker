import "server-only";

import { requireSupabaseServerClient } from "../server";
import type { Article, NewArticle } from "../types";

const URL_CHUNK_SIZE = 15;

function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function validateArticle(article: NewArticle): void {
  const body = article.raw_text.trim();
  const meaningfulParagraphs = body.split(/\n\s*\n|\n/)
    .filter((paragraph) => paragraph.trim().length >= 80).length;
  if (!article.source_id || !isHttpUrl(article.original_url) ||
    (article.canonical_url !== null && !isHttpUrl(article.canonical_url)) ||
    !article.title.trim() || !isHttpUrl(article.image_url) ||
    (meaningfulParagraphs < 3 && body.length < 900) ||
    !Number.isFinite(Date.parse(article.published_at))) {
    throw new Error("Article is missing a valid source, URL, title, image, date, or body");
  }
}

/** Returns input URLs already present in either URL column. Each .in() has at most 15 values. */
export async function getExistingArticleUrls(urls: readonly string[]): Promise<Set<string>> {
  const unique = [...new Set(urls)];
  const existing = new Set<string>();
  const client = requireSupabaseServerClient();

  for (let offset = 0; offset < unique.length; offset += URL_CHUNK_SIZE) {
    const chunk = unique.slice(offset, offset + URL_CHUNK_SIZE);
    const [originals, canonicals] = await Promise.all([
      client.from("articles").select("original_url, canonical_url").in("original_url", chunk),
      client.from("articles").select("original_url, canonical_url").in("canonical_url", chunk),
    ]);
    if (originals.error) throw new Error(`Article URL lookup failed (${originals.error.code})`);
    if (canonicals.error) throw new Error(`Article URL lookup failed (${canonicals.error.code})`);

    for (const row of [...(originals.data ?? []), ...(canonicals.data ?? [])]) {
      if (chunk.includes(row.original_url)) existing.add(row.original_url);
      if (row.canonical_url && chunk.includes(row.canonical_url)) existing.add(row.canonical_url);
    }
  }

  return existing;
}

export type InsertArticleResult =
  | { status: "inserted"; article: Article }
  | { status: "duplicate"; article: null };

/** Inserts a valid article once. Existing articles are never overwritten. */
export async function insertArticle(article: NewArticle): Promise<InsertArticleResult> {
  validateArticle(article);
  const urls = [article.original_url, article.canonical_url].filter((url): url is string => url !== null);
  if ((await getExistingArticleUrls(urls)).size > 0) {
    return { status: "duplicate", article: null };
  }

  const { data, error } = await requireSupabaseServerClient()
    .from("articles")
    .insert(article)
    .select("*")
    .single();

  if (error?.code === "23505") return { status: "duplicate", article: null };
  if (error || !data) throw new Error(`Article insert failed (${error?.code ?? "no row"})`);
  return { status: "inserted", article: data as Article };
}
