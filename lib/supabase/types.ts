export type SentimentLabel = "positive" | "neutral" | "negative";
export type FramingLabel = "left" | "center" | "right" | "mixed" | "unclear";

export type Source = {
  id: string;
  name: string;
  listing_url: string;
  parser_strategy: string | null;
  is_active: boolean;
  logo_url: string | null;
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
};

export type HomeArticle = Pick<Article, "id" | "original_url" | "title" | "image_url" | "published_at" | "category" | "location"> & {
  source_name: Source["name"];
  sentiment_label: ArticleAnalysis["sentiment_label"];
  bias_label: ArticleAnalysis["bias_label"];
  left_percentage: number;
  center_percentage: number;
  right_percentage: number;
  confidence: number | null;
};
