import { timingSafeEqual } from "node:crypto";

import { z } from "zod";
import { runManualScrape } from "@/lib/pipeline/scrape";
import { getActiveSources } from "@/lib/supabase/queries/sources";

export const runtime = "nodejs";
export const maxDuration = 300;

const requestSchema = z.object({
  sourceIds: z.array(z.uuid()).min(1).max(20).optional(),
  sourceNames: z.array(z.string().min(1).max(100)).min(1).max(20).optional(),
  limitPerSource: z.number().int().min(1).max(20).default(5),
}).strict().refine((value) => !value.sourceIds || !value.sourceNames, "Select source IDs or names, not both");

function authorized(request: Request): boolean {
  const expected = process.env.BIASLY_ADMIN_SECRET;
  const supplied = request.headers.get("x-biasly-admin-secret");
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return Response.json({ error: "Request body too large" }, { status: 413 });
    body = raw.trim() ? JSON.parse(raw) : {};
  } catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid scrape options", issues: parsed.error.issues }, { status: 400 });
  try {
    const active = await getActiveSources();
    const { sourceIds, sourceNames, limitPerSource } = parsed.data;
    const sources = active.filter((source) =>
      sourceIds ? sourceIds.includes(source.id) : sourceNames ? sourceNames.includes(source.name) : true);
    const requested = sourceIds ?? sourceNames;
    if (requested && (sources.length !== new Set(requested).size || requested.length !== new Set(requested).size)) {
      return Response.json({ error: "One or more selected sources are unknown or inactive" }, { status: 400 });
    }
    if (!sources.length) return Response.json({ error: "No active sources configured" }, { status: 400 });
    const summary = await runManualScrape(sources, limitPerSource);
    return Response.json(summary, { status: summary.status === "failed" ? 502 : 200 });
  } catch (error) {
    console.error("[scrape] Run failed", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "Scrape could not be completed" }, { status: 500 });
  }
}
