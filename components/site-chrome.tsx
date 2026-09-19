import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";
import { Chip } from "@/components/ui/chip";
import { MobileNav } from "@/components/ui/mobile-nav";

const topics = [
  "World Cup", "IPL", "Social Media", "Business & Markets", "Health & Medicine",
  "Soccer", "Artificial Intelligence", "Arsenal FC", "Extreme Weather and Disasters",
];

export function SiteHeader({ showTopics = false }: { showTopics?: boolean }) {
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(new Date());

  return (
    <header className="site-header">
      <div className="utility-strip">
        <div className="page-container utility-strip-inner">
          <div className="utility-group"><span>Browser Extension</span><span className="utility-divider" /><span>Theme: Light</span><span>Dark</span><span>Auto</span></div>
          <div className="utility-group utility-right"><span>{today}</span><span className="utility-divider" /><span>Set Location</span><span className="utility-divider" /><span>International Edition</span></div>
        </div>
      </div>
      <div className="primary-strip">
        <div className="page-container primary-strip-inner">
          <MobileNav />
          <Link className="brand-link" href="/" aria-label="Fake or Real home"><BrandMark compact /></Link>
          <nav aria-label="Primary navigation" className="primary-nav">
            <Link href="/" className={showTopics ? "active" : undefined} aria-current={showTopics ? "page" : undefined}>Home</Link>
            <span>For You</span><span>Local</span><span>Blindspot</span>
          </nav>
          <div className="header-actions" aria-label="Future account options">
            <span className="subscribe-label">Subscribe</span>
            <span className="login-label">Login</span>
          </div>
        </div>
      </div>
      {showTopics ? <div className="topic-strip"><div className="page-container topic-rail" aria-label="Topics">{topics.map((topic) => <Chip key={topic} label={topic} />)}</div></div> : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-container footer-main">
        <div className="footer-brand"><BrandMark inverted compact /><p>Balanced news coverage<br />powered by AI.</p></div>
        <div><h2>Company</h2><p>About</p><p>Careers</p><p>Press</p><p>Contact</p></div>
        <div><h2>Help</h2><p>Help Center</p><p>Guides</p><p>Privacy Policy</p><p>Terms of Service</p></div>
        <div><h2>Connect</h2><div className="social-labels" aria-label="Social channels"><span>in</span></div></div>
      </div>
      <div className="footer-bottom"><div className="page-container">© {new Date().getUTCFullYear()} Fake or Real. All rights reserved.</div></div>
    </footer>
  );
}
