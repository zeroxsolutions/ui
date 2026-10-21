import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

import { rehypeDocsCode } from '@/lib/rehype-docs-code';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: { postprocess: { includeProcessedMarkdown: true } },
});

export const nativeDocs = defineDocs({
  dir: 'content/native/docs',
  docs: { postprocess: { includeProcessedMarkdown: true } },
});

// One page per component, read under every engine: the routes serve it once per engine segment.
export const nativeComponents = defineDocs({
  dir: 'content/native/components',
  docs: { postprocess: { includeProcessedMarkdown: true } },
});

export default defineConfig({
  mdxOptions: {
    // No fumadocs Shiki pass: `rehypeDocsCode` highlights with the registry's own highlighter and
    // theme (`lib/shiki.ts`) as the page compiles, so the site has one Shiki and one theme.
    rehypeCodeOptions: false,
    rehypePlugins: (plugins) => [...plugins, rehypeDocsCode],
  },
});
