import "server-only";

import { load } from "cheerio";
import type { Source } from "@/lib/supabase/types";
import { isArticleUrl, normalizePublisherUrl } from "./article-urls";

export type HomepageCandidates = { urls: string[]; found: number; rejected: Record<string, number> };

export function extractHomepageCandidates(html: string, source: Source): HomepageCandidates {
  const $ = load(html);
  const urls = new Set<string>();
  const rejected: Record<string, number> = {};
  let found = 0;
  const roots = $("main, [role='main']");
  const scope = roots.length ? roots : $("body");
  scope.find("a[href]").each((_, element) => {
    const anchor = $(element);
    if (anchor.closest("header, nav, footer, aside, [aria-hidden='true'], [hidden], [style*='display:none'], [style*='display: none']").length) return;
    const card = anchor.closest("article, [class*='card'], [class*='story'], [class*='headline'], [class*='promo']");
    const headingSelector = "h1, h2, h3, h4, [data-testid='TitleHeading']";
    const ownHeading = anchor.find(headingSelector).first().text().trim();
    const heading = ownHeading || (card.length ? card.find(headingSelector).first().text().trim() : "");
    if (!heading || heading.length < 18 || (!card.length && !ownHeading) || (!ownHeading && anchor.text().trim().length < 18)) return;
    found++;
    const normalized = normalizePublisherUrl(anchor.attr("href") ?? "", source.listing_url, source);
    const reason = !normalized ? "invalid_or_external_url" : !isArticleUrl(normalized, source) ? "non_article_url" : null;
    if (reason) { rejected[reason] = (rejected[reason] ?? 0) + 1; return; }
    if (urls.size >= 100 && !urls.has(normalized!)) {
      rejected.candidate_budget = (rejected.candidate_budget ?? 0) + 1;
      return;
    }
    urls.add(normalized!);
  });
  return { urls: [...urls], found, rejected };
}
