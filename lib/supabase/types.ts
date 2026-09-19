export type SentimentLabel = "positive" | "neutral" | "negative";
export type FramingLabel = "left" | "center" | "right" | "mixed" | "unclear";

export type Source = {
  id: string;
  name: string;
  listing_url: string;
  parser_strategy: string | null;
  is_active: boolean;
  logo_url: string | null;
  created_at: string;
};

export type Article = {
  id: string;
  source_id: string;
  original_url: string;
  canonical_url: string | null;
  title: string;
  image_url: string;
  published_at: string;
  category: string | null;
  location: string | null;
  raw_text: string;
  scraped_at: string;
  analyzed_at: string | null;
};

export type ArticleAnalysis = {
  id: string;
  article_id: string;
  summary: string;
  sentiment_score: number;
  sentiment_label: SentimentLabel;
  bias_score: number;
  bias_label: FramingLabel;
  left_percentage: number;
  center_percentage: number;
  right_percentage: number;
  confidence: number;
  framing_notes: string;
  loaded_terms: string[];
  disclaimer: string;
  model: string;
  created_at: string;
};

export type NewArticle = Pick<Article,
  "source_id" | "original_url" | "canonical_url" | "title" | "image_url" |
  "published_at" | "category" | "location" | "raw_text">;

export type NewArticleAnalysis = Pick<ArticleAnalysis,
  "article_id" | "summary" | "sentiment_score" | "sentiment_label" |
  "bias_score" | "bias_label" | "left_percentage" | "center_percentage" |
  "right_percentage" | "confidence" | "framing_notes" | "loaded_terms" |
  "disclaimer" | "model">;

export type LogLevel = "info" | "warn" | "error";

export type PipelineLog = {
  id: string;
  level: LogLevel;
  stage: string;
  message: string;
  source_id: string | null;
  article_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export type NewPipelineLog = Pick<PipelineLog, "level" | "stage" | "message"> &
  Partial<Pick<PipelineLog, "source_id" | "article_id" | "details">>;

export type OxylabsSchedule = {
  id: string;
  source_id: string;
  oxylabs_schedule_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OxylabsScheduleRun = {
  id: string;
  schedule_id: string;
  oxylabs_job_id: string;
  result_status: string;
  started_at: string | null;
  completed_at: string | null;
  processed_at: string | null;
  articles_inserted: number;
  error_message: string | null;
  created_at: string;
};

export type ScheduleWrite = Pick<OxylabsSchedule,
  "source_id" | "oxylabs_schedule_id" | "is_active">;

export type ScheduleRunWrite = Pick<OxylabsScheduleRun,
  "schedule_id" | "oxylabs_job_id" | "result_status"> &
  Partial<Pick<OxylabsScheduleRun,
    "started_at" | "completed_at" | "processed_at" | "articles_inserted" | "error_message">>;

export type HomeArticle = Pick<Article, "id" | "original_url" | "title" | "image_url" | "published_at" | "category" | "location"> & {
  source_name: Source["name"];
  sentiment_label: ArticleAnalysis["sentiment_label"];
  bias_label: ArticleAnalysis["bias_label"];
  left_percentage: number;
  center_percentage: number;
  right_percentage: number;
  confidence: number | null;
};

export type DetailArticle = Pick<Article, "id" | "original_url" | "title" | "image_url" | "published_at" | "category" | "location" | "raw_text"> & {
  source_name: Source["name"];
  analysis: Pick<ArticleAnalysis,
    "summary" | "sentiment_score" | "sentiment_label" | "bias_score" | "bias_label" |
    "left_percentage" | "center_percentage" | "right_percentage" | "confidence" |
    "framing_notes" | "loaded_terms" | "disclaimer" | "model">;
};
