import type { Root } from 'fumadocs-core/page-tree';
import type { TableOfContents } from 'fumadocs-core/toc';
import type { ReactNode } from 'react';

import { DocsArticle } from '@zeroxsolutions/ui/site/components/layout/docs-article';
import type { PlatformStyle } from '@zeroxsolutions/ui/site/types/platform';

import { NativeCopyPageButton } from '../components/general/native-copy-page-button';

interface NativeDocsPageProps {
  /** The native docs page the route loaded: its URL in `tree`, and its frontmatter title and description. */
  page: { url: string; data: { title: string; description?: string } };
  /** The page as Markdown in each native style, which Copy page copies in the style the page shows. */
  markdown: Record<PlatformStyle<'native'>, string>;
  /** The native tree under the default engine, which the pager steps on through; the page itself names none. */
  tree: Root;
  /** The page's headings, listed beside it. */
  toc: TableOfContents;
  /** The page's compiled body, rendered with the native MDX components. */
  children: ReactNode;
}

/** One native docs page, whose path holds no engine. */
function NativeDocsPage({ page, markdown, tree, toc, children }: NativeDocsPageProps): ReactNode {
  return (
    <DocsArticle
      title={page.data.title}
      description={page.data.description}
      copyPage={<NativeCopyPageButton markdown={markdown} />}
      tree={tree}
      url={page.url}
      toc={toc}
    >
      {children}
    </DocsArticle>
  );
}

export { NativeDocsPage };
