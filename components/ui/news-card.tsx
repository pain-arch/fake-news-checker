import { ArticleImage } from "./article-image";
import { BiasMeter } from "./bias-meter";
import { Icon } from "./icon";
import type { HomeArticle } from "@/lib/supabase/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function NewsCard({ article }: { article: HomeArticle }) {
  const published = dateFormatter.format(new Date(article.published_at));
  const details = [article.category, article.location].filter(Boolean).join(" · ");

  return (
    <article className="news-card">
      <a href={article.original_url} target="_blank" rel="noopener noreferrer" className="news-card-link" aria-label={`Read ${article.title} at ${article.source_name} (opens in a new tab)`}>
        <div className="news-card-image">
          <ArticleImage src={article.image_url} alt={article.title} />
          <span className="image-info" aria-hidden="true"><Icon name="info" className="size-4" /></span>
        </div>
        <div className="news-card-content">
          <p className="news-card-kicker"><strong>{article.source_name}</strong>{details ? ` · ${details}` : ""}</p>
          <h2>{article.title}</h2>
          <div className="news-card-bottom">
            <BiasMeter left={article.left_percentage} center={article.center_percentage} right={article.right_percentage} compact />
            <div className="news-card-insights">
              <span>{article.sentiment_label} sentiment</span>
              <span>AI-estimated {article.bias_label} framing</span>
              {article.confidence !== null ? <span>{Math.round(article.confidence * 100)}% confidence</span> : null}
            </div>
            <p className="news-card-date">Published {published}</p>
          </div>
        </div>
      </a>
    </article>
  );
}
