import "server-only";

import { requireSupabaseServerClient } from "../server";
import type { Source } from "../types";

export async function getActiveSources(): Promise<Source[]> {
  const { data, error } = await requireSupabaseServerClient()
    .from("sources")
    .select("id, name, listing_url, parser_strategy, is_active, logo_url, created_at")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(`Could not load active sources (${error.code})`);
  return (data ?? []) as Source[];
}
