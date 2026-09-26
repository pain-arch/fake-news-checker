import "server-only";

import { generateArticleAnalysis } from "@/lib/ai/article-analysis";
import {
  getPendingAnalysisArticles,
  repairAnalyzedTimestamps,
  saveArticleAnalysis,
} from "@/lib/supabase/queries/analyses";
import { writeLog } from "@/lib/supabase/queries/logs";

const DEFAULT_BATCH_SIZE = 5;
const MAX_BATCH_SIZE = 20;

export type AnalysisRunOptions = {
  limit?: number;
  articleIds?: readonly string[];
};

export type AnalysisSummary = {
  status: "completed" | "partial" | "failed";
  analyzed: number;
  skipped: number;
  failed: number;
  batches: number;
  timestampsRepaired: number;
  durationMs: number;
  failedArticleIds: string[];
};

function configuredBatchSize(): number {
  const value = Number.parseInt(process.env.ANALYSIS_BATCH_SIZE ?? "", 10);
  return Number.isSafeInteger(value) && value >= 1 && value <= MAX_BATCH_SIZE
    ? value
    : DEFAULT_BATCH_SIZE;
}

async function log(
  level: "info" | "error",
  stage: string,
  message: string,
  details?: Record<string, unknown>,
  articleId?: string,
): Promise<void> {
  const consoleMethod = level === "error" ? console.error : console.info;
  consoleMethod(`[analysis] ${message}`, details ?? {});
  try {
    await writeLog({
      level,
      stage: `analysis.${stage}`,
      message,
      article_id: articleId,
      details,
    });
  } catch {
    console.error("[analysis] Could not persist progress log", { stage });
  }
}

/** Runs the server-only analysis queue without exposing article or model content. */
export async function runArticleAnalysis(options: AnalysisRunOptions = {}): Promise<AnalysisSummary> {
  const started = Date.now();
  const batchSize = configuredBatchSize();
  const attemptedIds = new Set<string>();
  const skippedIds = new Set<string>();
  const failedArticleIds: string[] = [];
  let analyzed = 0;
  let failed = 0;
  let batches = 0;

  await log("info", "started", "Analysis run started", {
    batchSize,
    limit: options.limit ?? null,
    selectedArticleCount: options.articleIds?.length ?? null,
  });

  const timestampsRepaired = await repairAnalyzedTimestamps(options.articleIds);
  if (timestampsRepaired) {
    await log("info", "repair", "Repaired analyzed timestamps", { count: timestampsRepaired });
  }

  while (options.limit === undefined || attemptedIds.size < options.limit) {
    const remaining = options.limit === undefined ? batchSize : options.limit - attemptedIds.size;
    const currentBatchSize = Math.min(batchSize, remaining);
    if (currentBatchSize < 1) break;

    const excluded = new Set([...attemptedIds, ...skippedIds]);
    const batch = await getPendingAnalysisArticles({
      limit: currentBatchSize,
      articleIds: options.articleIds,
      excludeIds: excluded,
    });
    for (const articleId of batch.skippedArticleIds) skippedIds.add(articleId);
    if (!batch.articles.length) break;

    batches++;
    await log("info", "batch", `Starting analysis batch ${batches}`, {
      size: batch.articles.length,
      skippedSoFar: skippedIds.size,
    });

    for (const article of batch.articles) attemptedIds.add(article.id);
    const results = await Promise.all(batch.articles.map(async (article) => {
      try {
        const generated = await generateArticleAnalysis(article);
        await saveArticleAnalysis({ article_id: article.id, ...generated });
        console.info("[analysis] Article analyzed", { articleId: article.id });
        return { articleId: article.id, status: "analyzed" as const };
      } catch {
        await log(
          "error",
          "article_failed",
          "Article analysis failed after retry",
          { articleId: article.id },
          article.id,
        );
        return { articleId: article.id, status: "failed" as const };
      }
    }));
    for (const result of results) {
      if (result.status === "analyzed") analyzed++;
      else {
        failed++;
        failedArticleIds.push(result.articleId);
      }
    }

    await log("info", "batch", `Completed analysis batch ${batches}`, {
      analyzed,
      failed,
      skipped: skippedIds.size,
    });
  }

  let skipped = skippedIds.size;
  const reachedLimit = options.limit !== undefined && attemptedIds.size >= options.limit;
  if (options.articleIds && !reachedLimit) {
    const accounted = attemptedIds.size + skippedIds.size;
    skipped += Math.max(0, options.articleIds.length - accounted);
  }

  const status: AnalysisSummary["status"] = failed === 0
    ? "completed"
    : analyzed === 0
      ? "failed"
      : "partial";
  const summary: AnalysisSummary = {
    status,
    analyzed,
    skipped,
    failed,
    batches,
    timestampsRepaired,
    durationMs: Date.now() - started,
    failedArticleIds,
  };

  await log("info", "completed", `Analysis run ${status}`, { ...summary });
  console.info("[analysis] final summary", summary);
  return summary;
}
