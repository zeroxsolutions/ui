import type { Root } from 'fumadocs-core/page-tree';
import type { TableOfContents } from 'fumadocs-core/toc';
import type { ReactNode } from 'react';

import { DocsArticle } from '@zeroxsolutions/ui/site/components/layout/docs-article';
import type { PlatformStyle } from '@zeroxsolutions/ui/site/types/platform';

import { NativeCopyPageButton } from '../components/general/native-copy-page-button';
import { EngineSwitcher } from '../components/navigation/engine-switcher';

interface NativeComponentPageProps {
  /** The native component page the route loaded: its URL in `tree`, and its frontmatter title and description. */
  page: { url: string; data: { title: string; description?: string } };
  /** The page as Markdown in each native style, under the page's engine. */
  markdown: Record<PlatformStyle<'native'>, string>;
  /** The native tree under the page's engine, which the pager steps through. */
  tree: Root;
  /** The page's headings, listed beside it. */
  toc: TableOfContents;
  /** The page's compiled body, rendered with the native MDX components bound to the page's engine. */
  children: ReactNode;
}

/** One native component's page under one engine, the engine tabs under its description. */
function NativeComponentPage({ page, markdown, tree, toc, children }: NativeComponentPageProps): ReactNode {
  return (
    <DocsArticle
      title={page.data.title}
      description={page.data.description}
      tabs={<EngineSwitcher />}
      copyPage={<NativeCopyPageButton markdown={markdown} />}
      tree={tree}
      url={page.url}
      toc={toc}
    >
      {children}
    </DocsArticle>
  );
}

export { NativeComponentPage };
