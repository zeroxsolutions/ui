// A URL may hold `&`, which XML reads as the start of an entity.
function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function xmlResponse(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}\n`, {
    headers: { 'content-type': 'application/xml' },
  });
}

/** A sitemap listing `urls`, each absolute, as the sitemaps.org protocol's `urlset`. */
export function sitemapResponse(urls: readonly string[]): Response {
  const entries = urls.map((url) => `<url>\n<loc>${escapeXml(url)}</loc>\n</url>`);
  return xmlResponse(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`);
}

/** A sitemap index naming the sitemaps at `urls`, each absolute, as the sitemaps.org protocol's `sitemapindex`. */
export function sitemapIndexResponse(urls: readonly string[]): Response {
  const entries = urls.map((url) => `<sitemap>\n<loc>${escapeXml(url)}</loc>\n</sitemap>`);
  return xmlResponse(
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</sitemapindex>`,
  );
}
