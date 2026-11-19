import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

import { rehypeDocsCode } from '@zeroxsolutions/ui/site/lib/rehype-docs-code';

// `async`: a page's compiled body is imported only by the route that loads it, so a route reading
// frontmatter alone (the sitemap, the share images, `llms.txt`) does not bundle every page.
export const editorDocs = defineDocs({
  dir: '../../packages/editor-docs-web/content/docs',
  docs: { async: true, postprocess: { includeProcessedMarkdown: { output: 'string' } } },
});

export default defineConfig({
  mdxOptions: {
    // No fumadocs Shiki pass: `rehypeDocsCode` highlights with the registry's own highlighter and
    // theme as the page compiles, so the site has one Shiki and one theme.
    rehypeCodeOptions: false,
    rehypePlugins: (plugins) => [...plugins, rehypeDocsCode],
  },
});
