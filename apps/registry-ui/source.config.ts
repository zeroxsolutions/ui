import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

import { CODE_THEMES } from '@/constants/code-themes';
import { transformers } from '@/lib/highlight-code';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: { postprocess: { includeProcessedMarkdown: true } },
});

export default defineConfig({
  mdxOptions: {
    // fumadocs' own Shiki pass, with the highlighter module's transformers in place of its defaults, as
    // upstream hands the same module's transformers to rehype-pretty-code. `icon: false`: the MDX
    // figcaption draws the language's icon itself.
    rehypeCodeOptions: { themes: CODE_THEMES, transformers, icon: false },
  },
});
