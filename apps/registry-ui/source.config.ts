import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

import { CODE_THEMES } from '@/constants/code-themes';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: { postprocess: { includeProcessedMarkdown: true } },
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: { themes: CODE_THEMES },
  },
});
