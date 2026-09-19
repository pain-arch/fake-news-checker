import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ArticleImage } from "@/components/ui/article-image";
import { BiasMeter } from "@/components/ui/bias-meter";
import { Icon } from "@/components/ui/icon";
import { getArticleById } from "@/lib/supabase/queries/articles";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
});

function paragraphs(text: string): string[] {
  const blocks = text.replace(/\r\n?/g, "\n").split(/\n\s*\n|\n/).map((block) => block.trim()).filter(Boolean);
  if (blocks.length > 1 || text.length < 900) return blocks;

  const sentences = text.trim().split(/(?<=[.!?])\s+(?=[A-Z“"'])/);
  if (sentences.length < 6) return blocks;
  const chunks: string[] = [];
  for (let index = 0; index < sentences.length; index += 3) {
    chunks.push(sentences.slice(index, index + 3).join(" "));
  }
  return chunks;
}

function AnalysisRow({ label, value }: { label: string; value: string }) {
  return <div className="analysis-fact"><dt>{label}</dt><dd>{value}</dd></div>;
}

export default async function NewsDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const result = await getArticleById(id);
  if (result.state === "not_found") notFound();

  if (result.state !== "ready") {
    return (
      <>
        <SiteHeader />
        <main className="page-container detail-unavailable" role="status">
          <h1>Article temporarily unavailable</h1>
          <p>{result.state === "unconfigured" ? "Connect Supabase to view stored articles." : "Please try again later."}</p>
          <Link href="/">Return to Top News</Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  const { article } = result;
  const { analysis } = article;
  const published = dateFormatter.format(new Date(article.published_at));
  const eyebrow = [article.category, article.location].filter(Boolean).join(" · ");

  return (
    <>
      <SiteHeader />
      <main className="page-container detail-main">
        <div className="detail-grid">
          <article className="detail-story">
            {eyebrow ? <p className="detail-eyebrow">{eyebrow}</p> : null}
            <h1>{article.title}</h1>
            <div className="detail-meta">
              <span>From <strong>{article.source_name}</strong></span>
              <span aria-hidden="true" className="detail-meta-divider" />
              <time dateTime={article.published_at}>{published}</time>
              <a href={article.original_url} target="_blank" rel="noopener noreferrer" className="detail-original-link">
                Read original <Icon name="external" className="size-4" />
              </a>
            </div>

            <div className="detail-image"><ArticleImage src={article.image_url} alt={article.title} /></div>

            <section className="detail-distribution" aria-labelledby="distribution-title">
              <h2 id="distribution-title">AI-estimated framing distribution</h2>
              <BiasMeter left={analysis.left_percentage} center={analysis.center_percentage} right={analysis.right_percentage} />
              <p>Estimates based on this article&apos;s text</p>
            </section>

            <div className="detail-body">{paragraphs(article.raw_text).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          </article>

          <aside className="detail-aside" aria-label="Article analysis">
            <section className="detail-panel" aria-labelledby="bias-title">
              <h2 id="bias-title">Bias Analysis</h2>
              <p className="panel-overline">AI-estimated political framing</p>
              <p className={`detail-bias-label detail-bias-${analysis.bias_label}`}>{analysis.bias_label}</p>
              <p className="detail-confidence">{Math.round(analysis.confidence * 100)}% confidence</p>
              <div className="detail-percent-rows" aria-label="AI-estimated framing percentages">
                {([ ["Left", analysis.left_percentage, "left"], ["Center", analysis.center_percentage, "center"], ["Right", analysis.right_percentage, "right"] ] as const).map(([label, value, side]) => (
                  <div className="detail-percent-row" key={side}>
                    <span>{label}</span><strong>{value}%</strong><span className="detail-percent-track"><span className={`detail-percent-fill ${side}`} style={{ width: `${value}%` }} /></span>
                  </div>
                ))}
              </div>
              <dl className="analysis-facts">
                <AnalysisRow label="Bias score" value={analysis.bias_score.toFixed(2)} />
                <AnalysisRow label="Sentiment" value={`${analysis.sentiment_label} (${analysis.sentiment_score.toFixed(2)})`} />
              </dl>
              {analysis.framing_notes ? <div className="panel-copy"><h3>Framing notes</h3><p>{analysis.framing_notes}</p></div> : null}
              {analysis.loaded_terms.length > 0 ? <div className="panel-copy"><h3>Loaded terms</h3><ul className="loaded-terms">{analysis.loaded_terms.map((term, index) => <li key={`${term}-${index}`}>{term}</li>)}</ul></div> : null}
            </section>

            <section className="detail-panel" aria-labelledby="summary-title">
              <h2 id="summary-title">AI Summary</h2>
              <div className="summary-copy">{paragraphs(analysis.summary).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
              {analysis.disclaimer ? <p className="summary-disclaimer">{analysis.disclaimer}</p> : null}
              {analysis.model ? <p className="summary-model">Analysis model: {analysis.model}</p> : null}
            </section>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
