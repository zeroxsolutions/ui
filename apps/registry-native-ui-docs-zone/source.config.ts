import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

import { nativeDemoSourceOf, rehypeDocsCode } from '@zeroxsolutions/ui/site/lib/rehype-docs-code';
import { remarkNativeDemoSource } from '@zeroxsolutions/native-ui-docs-web/lib/remark-native-demo-source';

// Every collection is `async`: a page's compiled body is imported only by the route that loads it, so a
// route reading frontmatter alone (the sitemap, the share images, `llms.txt`) does not bundle every page.
// A native page's Markdown keeps its MDX components as elements, which `nativePageMarkdown` renders for
// the engine and the style the page is read under; one compile serves every engine.
export const nativeDocs = defineDocs({
  dir: '../../packages/native-ui-docs-web/content/native/docs',
  docs: { async: true, postprocess: { includeProcessedMarkdown: { output: 'function' } } },
});

// One page per component, read under every engine: the routes serve it once per engine segment.
export const nativeComponents = defineDocs({
  dir: '../../packages/native-ui-docs-web/content/native/components',
  docs: { async: true, postprocess: { includeProcessedMarkdown: { output: 'function' } } },
});

export default defineConfig({
  mdxOptions: {
    // No fumadocs Shiki pass: `rehypeDocsCode` highlights with the registry's own highlighter and
    // theme as the page compiles, so the site has one Shiki and one theme.
    rehypeCodeOptions: false,
    remarkPlugins: (plugins) => [...plugins, [remarkNativeDemoSource, { demoSource: nativeDemoSourceOf }]],
    rehypePlugins: (plugins) => [...plugins, rehypeDocsCode],
  },
});
