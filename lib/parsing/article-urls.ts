import "server-only";

import type { Source } from "@/lib/supabase/types";

const blockedSegments = /(?:^|\/)(?:sections?|topics?|tags?|authors?|search|shows?|programs?|podcasts?|live|games?|products?|reviews?|shopping|shop|about|contact|help|support|newsletters?|subscribe|subscription|video|videos|watch|sport|sports)(?:\/|$)/i;
const trackingKeys = /^(?:utm_.+|fbclid|gclid|mc_.+|cmpid|ocid|at_medium|at_campaign)$/i;

function host(value: string): string {
  return value.toLowerCase().replace(/^www\./, "");
}

export function normalizePublisherUrl(value: string, base: string, source: Source): string | null {
  try {
    const sourceUrl = new URL(source.listing_url);
    const url = new URL(value, base);
    if (!["http:", "https:"].includes(sourceUrl.protocol) ||
      !["http:", "https:"].includes(url.protocol) ||
      sourceUrl.username || sourceUrl.password || url.username || url.password ||
      (url.port && !["80", "443"].includes(url.port)) ||
      !/^[a-z0-9.-]+$/i.test(sourceUrl.hostname) ||
      host(url.hostname) !== host(sourceUrl.hostname) ||
      host(url.hostname) === "localhost" || !host(url.hostname).includes(".") ||
      /^(?:\d+\.){3}\d+$/.test(url.hostname)) return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (trackingKeys.test(key)) url.searchParams.delete(key);
    }
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return null;
  }
}

export function isArticleUrl(value: string, source: Source): boolean {
  let url: URL;
  try { url = new URL(value); } catch { return false; }
  const path = url.pathname.toLowerCase();
  if (path === "/" || blockedSegments.test(path) || path === new URL(source.listing_url).pathname.replace(/\/+$/, "")) return false;
  const publisher = host(new URL(source.listing_url).hostname);
  switch (publisher) {
    case "bbc.com":
      return /^\/news\/articles\/[a-z0-9]{8,}$/.test(path) || /^\/news\/[a-z][a-z-]+-\d{6,}$/.test(path);
    case "reuters.com":
      return /^\/(?:[a-z0-9-]+\/){1,5}[a-z0-9-]{12,}-20\d{2}-\d{2}-\d{2}$/.test(path);
    case "npr.org":
      return /^\/20\d{2}\/\d{1,2}\/\d{1,2}\/(?:\d{5,}|[ng]x?-s\d+-\d+)\/[^/]{12,}$/.test(path);
    case "foxnews.com":
      return /^\/(?:[a-z0-9-]+\/){1,3}[a-z0-9-]{18,}$/.test(path);
    case "theguardian.com":
      return /^\/(?:[a-z0-9-]+\/){1,5}20\d{2}\/(?:[a-z]{3}|\d{2})\/\d{1,2}\/[a-z0-9-]{12,}$/.test(path);
    default:
      return source.parser_strategy === "dated-articles" && /\/20\d{2}\/\d{1,2}\/\d{1,2}\/[^/]{15,}$/.test(path);
  }
}
