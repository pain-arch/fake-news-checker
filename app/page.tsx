import { connection } from "next/server";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { NewsCard } from "@/components/ui/news-card";
import { getHomeArticles } from "@/lib/supabase/queries/articles";

export default async function Home() {
  await connection();
  const { articles, state } = await getHomeArticles();

  return (
    <>
      <SiteHeader showTopics />
      <main className="page-container home-main">
        <h1>Top News</h1>
        {articles.length > 0 ? (
          <div className="news-grid">{articles.map((article) => <NewsCard key={article.id} article={article} />)}</div>
        ) : (
          <div className="news-empty" role="status">
            <h2>{state === "unavailable" ? "News is temporarily unavailable" : "No articles to show yet"}</h2>
            <p>{state === "unconfigured" ? "Connect Supabase to show analyzed news here." : state === "unavailable" ? "Please try again later." : "Analyzed articles will appear here when they are ready."}</p>
          </div>
        )}
        <p className="framing-disclaimer">Political framing shown on cards is AI-estimated and may be imperfect.</p>
      </main>
      <SiteFooter />
    </>
  );
}
