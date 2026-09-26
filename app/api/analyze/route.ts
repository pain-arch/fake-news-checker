import { timingSafeEqual } from "node:crypto";

import { z } from "zod";
import { runArticleAnalysis } from "@/lib/pipeline/analyze";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_REQUEST_BYTES = 16_384;

const requestSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  articleIds: z.array(z.uuid()).min(1).max(100).optional(),
}).strict().superRefine((value, context) => {
  if (value.articleIds && new Set(value.articleIds).size !== value.articleIds.length) {
    context.addIssue({
      code: "custom",
      path: ["articleIds"],
      message: "Article IDs must be unique",
    });
  }
});

function authorized(request: Request): boolean {
  const expected = process.env.BIASLY_ADMIN_SECRET;
  const supplied = request.headers.get("x-biasly-admin-secret");
  if (!expected || !supplied) return false;
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_REQUEST_BYTES) {
      return Response.json({ error: "Request body too large" }, { status: 413 });
    }
    body = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid analysis options", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const summary = await runArticleAnalysis(parsed.data);
    return Response.json(summary, { status: summary.status === "failed" ? 502 : 200 });
  } catch {
    console.error("[analysis] Run failed");
    return Response.json({ error: "Analysis could not be completed" }, { status: 500 });
  }
}
