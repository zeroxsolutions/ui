import type { Root } from 'fumadocs-core/page-tree';
import type { TableOfContents } from 'fumadocs-core/toc';
import type { ReactNode } from 'react';

import { DocsArticle } from '@zeroxsolutions/ui/site/components/layout/docs-article';

import { BaseSwitcher } from '../components/navigation/base-switcher';
import { componentRoute, componentsRoute } from '../routes';

interface DocsPageProps {
  /** The docs page the route loaded: its URL in `tree`, and its frontmatter title and description. */
  page: { url: string; data: { title: string; description?: string } };
  /** The page as Markdown, which Copy page copies; what the page's `.md` URL serves. */
  markdown: string;
  /** The web docs' page tree, which the previous and next links and the pager step through. */
  tree: Root;
  /** The page's headings, listed beside it. */
  toc: TableOfContents;
  /** The page's compiled body, rendered with the docs' MDX components. */
  children: ReactNode;
}

/** One web docs page; a component's page and the components index carry the base tabs under the description. */
function DocsPage({ page, markdown, tree, toc, children }: DocsPageProps): ReactNode {
  const onComponents = Boolean(componentRoute.matcher(page.url) || componentsRoute.matcher(page.url));

  return (
    <DocsArticle
      title={page.data.title}
      description={page.data.description}
      tabs={onComponents ? <BaseSwitcher /> : undefined}
      markdown={markdown}
      tree={tree}
      url={page.url}
      toc={toc}
    >
      {children}
    </DocsArticle>
  );
}

export { DocsPage };
