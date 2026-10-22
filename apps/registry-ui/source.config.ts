import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

import { rehypeDocsCode } from '@/lib/rehype-docs-code';
import { remarkNativeDemoSource } from '@/lib/remark-native-demo-source';

// Every collection is `async`: a page's compiled body is imported only by the route that loads it, so a
// route reading frontmatter alone (the sitemap, the share images, `llms.txt`) does not bundle every page.
// Eager, each server route group carried its own copy of every compiled page, and the worker passed
// Cloudflare's size limit.
export const docs = defineDocs({
  dir: 'content/docs',
  docs: { async: true, postprocess: { includeProcessedMarkdown: true } },
});

// A native page's Markdown keeps its MDX components as elements, which `nativePageMarkdown` renders for
// the engine and the style the page is read under; one compile serves every engine.
export const nativeDocs = defineDocs({
  dir: 'content/native/docs',
  docs: { async: true, postprocess: { includeProcessedMarkdown: { output: 'function' } } },
});

// One page per component, read under every engine: the routes serve it once per engine segment.
export const nativeComponents = defineDocs({
  dir: 'content/native/components',
  docs: { async: true, postprocess: { includeProcessedMarkdown: { output: 'function' } } },
});

export default defineConfig({
  mdxOptions: {
    // No fumadocs Shiki pass: `rehypeDocsCode` highlights with the registry's own highlighter and
    // theme (`lib/shiki.ts`) as the page compiles, so the site has one Shiki and one theme.
    rehypeCodeOptions: false,
    remarkPlugins: (plugins) => [...plugins, remarkNativeDemoSource],
    rehypePlugins: (plugins) => [...plugins, rehypeDocsCode],
  },
});
