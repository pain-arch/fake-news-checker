import "server-only";

import { load } from "cheerio";
import type { NewArticle, Source } from "@/lib/supabase/types";
import { isArticleUrl, normalizePublisherUrl } from "./article-urls";

export type ArticleParseResult = { article: NewArticle; reason: null } | { article: null; reason: string };

const removeSelector = [
  "script", "style", "noscript", "svg", "nav", "footer", "aside", "form", "button", "iframe",
  "[aria-hidden='true']", "[hidden]", "[class*='advert']", "[class*='sponsor']",
  "[class*='newsletter']", "[class*='subscribe']", "[class*='related']",
  "[class*='recommend']", "[class*='most-viewed']", "[class*='mostViewed']",
  "[class*='share']", "[class*='social']", "[class*='caption']",
  "[class*='author-bio']", "[class*='authorBio']", "[class*='article-meta']",
  "[data-testid*='related']", "[data-testid*='advert']",
].join(", ");
const debris = /^(?:advertisement|sponsored|sign up for|subscribe to|read more|share this article|follow us|load more|most viewed|related stories|click here|watch:|listen:)/i;

function text(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function jsonLdObjects(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(jsonLdObjects);
  if (!value || typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  return [object, ...jsonLdObjects(object["@graph"])];
}

function stringField(object: Record<string, unknown> | undefined, key: string): string | null {
  const value = object?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parseArticleHtml(html: string, originalUrl: string, source: Source): ArticleParseResult {
  const $ = load(html);
  const structured: Record<string, unknown>[] = [];
  $("script[type='application/ld+json']").each((_, node) => {
    try { structured.push(...jsonLdObjects(JSON.parse($(node).html() ?? ""))); } catch { /* Ignore malformed page metadata. */ }
  });
  const metadata = structured.find((item) => {
    const type = item["@type"];
    return typeof type === "string" ? /(?:NewsArticle|Article|ReportageNewsArticle)/i.test(type) :
      Array.isArray(type) && type.some((part) => typeof part === "string" && /Article/i.test(part));
  });
  const meta = (key: string): string | null => $(`meta[property='${key}'], meta[name='${key}']`).first().attr("content")?.trim() || null;
  const title = text(stringField(metadata, "headline") || meta("og:title") || $("article h1, main h1, h1").first().text());
  if (title.length < 20 || title.length > 350 || !/\s/.test(title) || /^(?:news|world|politics|business|sport|sports|live|home|latest|podcasts?)$/i.test(title)) {
    return { article: null, reason: "invalid_title" };
  }
  const canonicalRaw = $("link[rel='canonical']").attr("href") || meta("og:url");
  const canonical = canonicalRaw ? normalizePublisherUrl(canonicalRaw, originalUrl, source) : null;
  if (canonicalRaw && (!canonical || !isArticleUrl(canonical, source))) return { article: null, reason: "invalid_canonical_url" };
  const imageObject = metadata?.image;
  const structuredImage = typeof imageObject === "string" ? imageObject :
    Array.isArray(imageObject) && typeof imageObject[0] === "string" ? imageObject[0] :
    imageObject && typeof imageObject === "object" ? stringField(imageObject as Record<string, unknown>, "url") : null;
  const imageRaw = structuredImage || meta("og:image") || meta("twitter:image");
  if (!imageRaw) return { article: null, reason: "missing_image" };
  let image: string;
  try {
    const parsed = new URL(imageRaw, originalUrl);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
    image = parsed.toString();
  } catch { return { article: null, reason: "invalid_image" }; }
  const dateRaw = stringField(metadata, "datePublished") || meta("article:published_time") ||
    meta("datePublished") || $("article time[datetime], main time[datetime]").first().attr("datetime");
  if (!dateRaw || !Number.isFinite(Date.parse(dateRaw))) return { article: null, reason: "missing_published_date" };
  const published = new Date(dateRaw);
  if (published.getTime() > Date.now() + 86_400_000) return { article: null, reason: "invalid_published_date" };

  const bodyRoot = $("[itemprop='articleBody'], [data-testid='article-body'], [data-gu-name='body'], [class*='article-body'], .storytext").first();
  const root = bodyRoot.length ? bodyRoot : $("article").first().length ? $("article").first() : $("main").first();
  if (!root.length) return { article: null, reason: "missing_article_body" };
  root.find(removeSelector).remove();
  const reutersParagraphs = new URL(source.listing_url).hostname.replace(/^www\./, "") === "reuters.com"
    ? root.find("[class*='article-body-module__paragraph']").toArray() : [];
  let paragraphs = (reutersParagraphs.length ? reutersParagraphs : root.find("p").toArray())
    .map((node) => text($(node).text()))
    .filter((part) => part.length >= 60 && !debris.test(part) && !/\{[^{}]{20,}\}|\.css-[a-z0-9]|javascript:/i.test(part));
  paragraphs = paragraphs.filter((part) => !/^(?:reporting by |our standards:|[\w .'-]+ (?:joined Reuters|is a Reuters technology correspondent))/i.test(part))
    .map((part) => part.replace(/,?\s*opens new tab\b/gi, ""));
  if (paragraphs.length === 1 && paragraphs[0].length >= 900) {
    paragraphs = paragraphs[0].split(/(?<=[.!?])\s+(?=[A-Z])/).reduce<string[]>((parts, sentence) => {
      const previous = parts.at(-1);
      if (previous && previous.length < 130) parts[parts.length - 1] += ` ${sentence}`;
      else parts.push(sentence);
      return parts;
    }, []);
  }
  if (paragraphs.length < 3) {
    const blocks = root.find("[itemprop='articleBody'] > div, [class*='article-body'] > div, main > div").toArray()
      .map((node) => text($(node).text())).filter((part) => part.length >= 900);
    if (blocks.length && blocks[0].length > paragraphs.join(" ").length) {
      paragraphs = blocks[0].split(/(?<=[.!?])\s+(?=[A-Z])/).reduce<string[]>((parts, sentence) => {
        const previous = parts.at(-1);
        if (previous && previous.length < 130) parts[parts.length - 1] += ` ${sentence}`;
        else parts.push(sentence);
        return parts;
      }, []);
    }
  }
  const body = [...new Set(paragraphs)].join("\n\n");
  if (/^(?:reporting by |our standards:)/i.test(body)) return { article: null, reason: "non_article_body" };
  if ((paragraphs.filter((part) => part.length >= 80).length < 3 && body.length < 900) ||
    body.length < 400 || body.split(/\s+/).length < 80) return { article: null, reason: "low_quality_body" };
  if (paragraphs.length > 2 && paragraphs.filter((part) => part.length < 110).length > paragraphs.length * 0.7) {
    return { article: null, reason: "headline_collection" };
  }
  return {
    article: {
      source_id: source.id,
      original_url: originalUrl,
      canonical_url: canonical,
      title,
      image_url: image,
      published_at: published.toISOString(),
      category: null,
      location: null,
      raw_text: body,
    },
    reason: null,
  };
}
