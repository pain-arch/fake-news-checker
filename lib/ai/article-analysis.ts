import "server-only";

import { openai, type OpenAILanguageModelResponsesOptions } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { NewArticleAnalysis } from "@/lib/supabase/types";

export const ARTICLE_ANALYSIS_MODEL = "gpt-6-luna";

const MAX_ARTICLE_CHARACTERS = 24_000;
const MODEL_TIMEOUT_MS = 90_000;
const MAX_GENERATION_ATTEMPTS = 2;

const modelOutputSchema = z.object({
  summary: z.string().min(40).max(1_500)
    .describe("A neutral, factual summary of the article without adding outside claims."),
  sentimentScore: z.number().min(-1).max(1)
    .describe("Overall language sentiment from -1 (negative) to 1 (positive)."),
  sentimentLabel: z.enum(["positive", "neutral", "negative"]),
  politicalFramingLabel: z.enum(["left", "center", "right", "mixed", "unclear"])
    .describe("An AI-estimated framing label based only on evidence in the article text."),
  leftPercentage: z.number().int().min(0).max(100),
  centerPercentage: z.number().int().min(0).max(100),
  rightPercentage: z.number().int().min(0).max(100),
  confidence: z.number().min(0).max(1),
  framingNotes: z.string().min(20).max(1_500)
    .describe("Concise text-based evidence for the framing estimate and its uncertainty."),
  loadedTerms: z.array(z.string().min(1).max(80)).max(12)
    .describe("Emotionally charged or politically loaded terms present in the article text."),
  disclaimer: z.string().min(20).max(500)
    .describe("A clear note that political framing is AI-estimated and may be imperfect."),
}).strict();

type ModelAnalysis = z.infer<typeof modelOutputSchema>;
type AnalysisWithoutArticleId = Omit<NewArticleAnalysis, "article_id">;

export type ArticleForAnalysis = {
  title: string;
  raw_text: string;
};

function normalizePercentages(values: readonly [number, number, number]): [number, number, number] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) throw new Error("Framing percentages have no weight");

  const scaled = values.map((value) => (value / total) * 100);
  const normalized = scaled.map(Math.floor);
  let remainder = 100 - normalized.reduce((sum, value) => sum + value, 0);
  const order = scaled
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let index = 0; remainder > 0; index++, remainder--) {
    normalized[order[index % order.length].index]++;
  }
  return normalized as [number, number, number];
}

function assertSentimentConsistency(output: ModelAnalysis): void {
  if (output.sentimentLabel === "positive" && output.sentimentScore <= 0) {
    throw new Error("Positive sentiment requires a positive score");
  }
  if (output.sentimentLabel === "negative" && output.sentimentScore >= 0) {
    throw new Error("Negative sentiment requires a negative score");
  }
  if (output.sentimentLabel === "neutral" && Math.abs(output.sentimentScore) > 0.35) {
    throw new Error("Neutral sentiment score is too strong");
  }
}

function assertFramingConsistency(
  label: ModelAnalysis["politicalFramingLabel"],
  confidence: number,
  percentages: readonly [number, number, number],
): void {
  const labels = ["left", "center", "right"] as const;
  const ranked = percentages
    .map((value, index) => ({ label: labels[index], value }))
    .sort((a, b) => b.value - a.value);
  const lead = ranked[0].value - ranked[1].value;

  if (label === "unclear" && confidence > 0.5) {
    throw new Error("Unclear framing requires low confidence");
  }
  if (label === "mixed" && confidence > 0.5 && lead >= 15) {
    throw new Error("Mixed framing conflicts with a clear percentage lead");
  }
  if (label !== "mixed" && label !== "unclear" && confidence > 0.45 && lead >= 10 && label !== ranked[0].label) {
    throw new Error("Framing label conflicts with the strongest percentage");
  }
}

function toStoredAnalysis(output: ModelAnalysis, modelId: string): AnalysisWithoutArticleId {
  assertSentimentConsistency(output);
  const [left, center, right] = normalizePercentages([
    output.leftPercentage,
    output.centerPercentage,
    output.rightPercentage,
  ]);
  assertFramingConsistency(output.politicalFramingLabel, output.confidence, [left, center, right]);

  return {
    summary: output.summary.trim(),
    sentiment_score: output.sentimentScore,
    sentiment_label: output.sentimentLabel,
    bias_score: (right - left) / 100,
    bias_label: output.politicalFramingLabel,
    left_percentage: left,
    center_percentage: center,
    right_percentage: right,
    confidence: output.confidence,
    framing_notes: output.framingNotes.trim(),
    loaded_terms: [...new Set(output.loadedTerms.map((term) => term.trim()).filter(Boolean))],
    disclaimer: output.disclaimer.trim(),
    model: modelId.trim() || ARTICLE_ANALYSIS_MODEL,
  };
}

async function generateOnce(article: ArticleForAnalysis): Promise<AnalysisWithoutArticleId> {
  if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI is not configured");
  const articleText = article.raw_text.trim().slice(0, MAX_ARTICLE_CHARACTERS);
  if (!article.title.trim() || !articleText) throw new Error("Article content is missing");

  const result = await generateText({
    model: openai(ARTICLE_ANALYSIS_MODEL),
    output: Output.object({
      name: "ArticleAnalysis",
      description: "Neutral news summary, sentiment, and AI-estimated political framing.",
      schema: modelOutputSchema,
    }),
    system: [
      "Analyze only the supplied news article title and body.",
      "Do not infer political framing from the publisher, outlet reputation, or outside knowledge.",
      "Treat framing as an uncertain AI estimate, not objective truth.",
      "If textual evidence is weak, choose unclear and confidence no higher than 0.5.",
      "If left, center, and right evidence is close, choose mixed or unclear.",
      "Make the three framing percentages add to 100.",
      "Keep the summary neutral and list only loaded terms actually present in the article.",
    ].join(" "),
    prompt: `Article title:\n${article.title.trim()}\n\nArticle body:\n${articleText}`,
    maxOutputTokens: 1_200,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
    providerOptions: {
      openai: {
        store: false,
        reasoningEffort: "low",
        textVerbosity: "low",
      } satisfies OpenAILanguageModelResponsesOptions,
    },
  });

  return toStoredAnalysis(result.output, result.response.modelId);
}

/** Generates once and retries one model or validation failure. */
export async function generateArticleAnalysis(article: ArticleForAnalysis): Promise<AnalysisWithoutArticleId> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    try {
      return await generateOnce(article);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_GENERATION_ATTEMPTS) continue;
    }
  }
  throw new Error("Article analysis generation failed", { cause: lastError });
}
