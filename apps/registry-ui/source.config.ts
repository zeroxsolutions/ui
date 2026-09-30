import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

import { rehypeCodeTitle } from '@/lib/rehype-code-title';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: { postprocess: { includeProcessedMarkdown: true } },
});

export default defineConfig({
  mdxOptions: {
    // No fumadocs Shiki pass: the MDX `pre` component highlights a fence with the registry's own
    // highlighter and theme (`lib/shiki.ts`) as the page renders at build, so the site has one Shiki
    // and one theme. The fence's title is all that is left to carry.
    rehypeCodeOptions: false,
    rehypePlugins: (plugins) => [...plugins, rehypeCodeTitle],
  },
});
