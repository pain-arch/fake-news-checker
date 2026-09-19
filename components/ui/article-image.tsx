"use client";

import { useState } from "react";

export function ArticleImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return <div className="article-image-fallback" role="img" aria-label={`Image unavailable for ${alt}`}>Image unavailable</div>;

  // Stored publisher images can come from many domains, so a normal image avoids an unsafe wildcard optimizer allowlist.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
