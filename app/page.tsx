import { connection } from "next/server";
import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";
import { Chip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { NewsCard } from "@/components/ui/news-card";
import { MobileNav } from "@/components/ui/mobile-nav";
import { getHomeArticles } from "@/lib/supabase/queries/articles";

const topics = [
  "World Cup", "IPL", "Social Media", "Business & Markets", "Health & Medicine",
  "Soccer", "Artificial Intelligence", "Arsenal FC", "Extreme Weather and Disasters",
];

function SiteHeader({ today }: { today: string }) {
  return (
    <header className="site-header">
      <div className="utility-strip">
        <div className="page-container utility-strip-inner">
          <div className="utility-group"><span>Browser Extension</span><span className="utility-divider" /><span>Theme: Light</span><span>Dark</span><span>Auto</span></div>
          <div className="utility-group utility-right"><span>{today}</span><span className="utility-divider" /><span>Set Location</span><span className="utility-divider" /><span>◎&nbsp; International Edition</span><span aria-hidden="true">⌄</span></div>
        </div>
      </div>
      <div className="primary-strip">
        <div className="page-container primary-strip-inner">
          <MobileNav />
          <Link className="brand-link" href="/" aria-label="Fake or Real home"><BrandMark compact /></Link>
          <nav aria-label="Primary navigation" className="primary-nav">
            <Link href="/" aria-current="page" className="active">Home</Link>
            <span>For You</span><span>Local</span><span>Blindspot</span>
          </nav>
          <div className="header-actions" aria-label="Future account options">
            <span className="subscribe-label">Subscribe</span>
            <span className="login-label">Login</span>
          </div>
        </div>
      </div>
      <div className="topic-strip">
        <div className="page-container topic-rail" aria-label="Topics">
          {topics.map((topic) => <Chip key={topic} label={topic} />)}
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-container footer-main">
        <div className="footer-brand"><BrandMark inverted compact /><p>Balanced news coverage<br />powered by AI.</p></div>
        <div><h2>Company</h2><p>About</p><p>Careers</p><p>Press</p><p>Contact</p></div>
        <div><h2>Help</h2><p>Help Center</p><p>Guides</p><p>Privacy Policy</p><p>Terms of Service</p></div>
        <div><h2>Connect</h2><div className="social-labels" aria-label="Social channels"><span>𝕏</span><span>in</span><span>◎</span><span>▶</span></div></div>
      </div>
      <div className="footer-bottom"><div className="page-container">© {new Date().getUTCFullYear()} Fake or Real. All rights reserved.</div></div>
    </footer>
  );
}

export default async function Home() {
  await connection();
  const { articles, state } = await getHomeArticles();
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date());

  return (
    <>
      <SiteHeader today={today} />
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
