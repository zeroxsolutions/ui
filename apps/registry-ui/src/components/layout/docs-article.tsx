import type { TableOfContents } from 'fumadocs-core/toc';
import type { Root } from 'fumadocs-core/page-tree';
import { ViewTransition } from 'react';
import type { ReactNode } from 'react';

import { DocsNeighbourLink } from '@/components/navigation/docs-neighbour-link';
import { DocsPager } from '@/components/navigation/docs-pager';
import { DocsToc } from '@/components/navigation/docs-toc';
import { pageNeighbours } from '@/lib/page-tree';
import { CopyButton } from '@/registry/bases/base-ui/components/feedback/copy-button';
import { ScrollArea } from '@/registry/bases/base-ui/ui/scroll-area';

interface DocsArticleProps {
  /** The page's frontmatter title, its heading. */
  title: string;
  /** The page's frontmatter description, under the heading. */
  description?: string;
  /** The page as Markdown, which Copy page copies; give it what the page's `.md` URL serves, so the two match. */
  markdown: string;
  /** The tree the page sits in, which the previous and next links and the pager step through. */
  tree: Root;
  /** The page's own URL in `tree`. */
  url: string;
  /** The page's headings, listed in the column beside it. */
  toc: TableOfContents;
  /** The page's compiled body. */
  children: ReactNode;
}

/**
 * One docs page: its heading with Copy page and the previous and next links, its body, the pager, and
 * the headings column beside them. Web and native docs pages both render through it.
 */
function DocsArticle({ title, description, markdown, tree, url, toc, children }: DocsArticleProps): ReactNode {
  const neighbours = pageNeighbours(tree, url);

  return (
    <div data-slot="docs" className="flex scroll-mt-24 items-stretch xl:w-full">
      {/* `enter`/`exit` are "none" because this name has no partner on a page without a docs column
          (such as home or blocks): unpaired, the browser would otherwise fade the column in or out
          over the page it is leaving or arriving on. Paired with another docs page's, `share` (left
          at its default) still crossfades the two, per the view-transition rules in global.css. */}
      <ViewTransition name="docs-content" enter="none" exit="none">
        <div className="mx-auto flex w-full max-w-160 min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-0 lg:py-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-4">
              <h1 className="scroll-m-24 text-3xl font-semibold tracking-tight">{title}</h1>
              <div className="flex items-center gap-2">
                <CopyButton value={markdown} label="Copy page" variant="secondary" size="icon-sm" />
                {neighbours.previous && <DocsNeighbourLink direction="previous" href={neighbours.previous.url} />}
                {neighbours.next && <DocsNeighbourLink direction="next" href={neighbours.next.url} />}
              </div>
            </div>
            {description && <p className="text-muted-foreground text-balance">{description}</p>}
          </div>
          <div className="w-full flex-1 leading-7 wrap-break-word">{children}</div>
          <DocsPager tree={tree} url={url} />
        </div>
      </ViewTransition>
      {/* A landmark only when it lists something: a page without headings leaves the column empty. */}
      <div
        role={toc.length ? 'navigation' : undefined}
        aria-label={toc.length ? 'On this page' : undefined}
        className="sticky top-(--header-height) z-30 hidden h-[calc(100svh-var(--header-height))] w-(--sidebar-width) shrink-0 flex-col overflow-hidden py-6 lg:py-8 xl:flex"
      >
        {toc.length ? (
          <ScrollArea className="min-h-0 **:data-[slot=scroll-area-viewport]:overscroll-none">
            <DocsToc toc={toc} />
          </ScrollArea>
        ) : null}
      </div>
    </div>
  );
}

export { DocsArticle };
