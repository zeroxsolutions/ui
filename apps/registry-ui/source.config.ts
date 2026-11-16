import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

import { rehypeDocsCode } from '@zeroxsolutions/ui/site/lib/rehype-docs-code';

// Every collection is `async`: a page's compiled body is imported only by the route that loads it, so a
// route reading frontmatter alone (the sitemap, the share images, `llms.txt`) does not bundle every page.
// Eager, each server route group carried its own copy of every compiled page, and the worker passed
// Cloudflare's size limit.
export const docs = defineDocs({
  dir: '../../packages/ui-docs-web/content/docs',
  docs: { async: true, postprocess: { includeProcessedMarkdown: true } },
});

export default defineConfig({
  mdxOptions: {
    // No fumadocs Shiki pass: `rehypeDocsCode` highlights with the registry's own highlighter and
    // theme (`lib/shiki.ts`) as the page compiles, so the site has one Shiki and one theme.
    rehypeCodeOptions: false,
    rehypePlugins: (plugins) => [...plugins, rehypeDocsCode],
  },
});
