import type { MouseEvent, ReactNode } from 'react';
import { ListIcon } from '@/registry/bases/base-ui/icons/lucide/list-icon';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { contentsOf, tableOfContents as tableOfContentsBlock } from '@zeroxsolutions/editor-core/blocks/library/index';
import type { EditorFeature } from '@zeroxsolutions/editor-core/document/core/index';
import { blockFeature, type BlockViewPropsOf } from '../../blocks/block-feature';

export interface TableOfContentsOptions {
  /** The host's words: the list's accessible name, and the line an editor shows while there is no heading. */
  words?: { readonly label?: string; readonly empty?: string };
}

type TableOfContentsViewProps = BlockViewPropsOf<typeof tableOfContentsBlock>;

/**
 * Scrolls to the heading the entry at `index` lists: the document's headings of level 1 to 3 are drawn as
 * `h1` to `h3` in the order `contentsOf` reads them, in the editor and the Viewer alike.
 */
function scrollToHeading(event: MouseEvent<HTMLAnchorElement>, index: number): void {
  event.preventDefault();
  const root = event.currentTarget.closest('[data-editor="document"]');
  const heading = root?.querySelectorAll('h1, h2, h3')[index];
  if (!heading) return;
  // A closed details element in the Viewer hides its heading, which then has no place to scroll to.
  for (let folded = heading.parentElement?.closest('details:not([open])'); folded;) {
    (folded as HTMLDetailsElement).open = true;
    folded = folded.parentElement?.closest('details:not([open])') ?? null;
  }
  heading.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

/** Lowercase words of `text` joined by dashes: the fragment an entry's link names. */
function fragmentOf(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');
}

/** The table of contents block: the document's headings of level 1 to 3, each a link that scrolls to it. */
export function tableOfContents(options: TableOfContentsOptions = {}): EditorFeature {
  const label = options.words?.label ?? 'Table of contents';
  const empty = options.words?.empty ?? 'Add a heading and it is listed here.';

  function TableOfContentsView({ doc, editable }: TableOfContentsViewProps): ReactNode {
    const entries = doc === null ? [] : contentsOf(doc);
    if (entries.length === 0) {
      return editable ? (
        <p data-slot="table-of-contents" contentEditable={false} className="text-muted-foreground my-2 text-sm">
          {empty}
        </p>
      ) : null;
    }
    return (
      <nav aria-label={label} data-slot="table-of-contents" contentEditable={false} className="not-prose my-4">
        <ol className="flex flex-col gap-0.5">
          {entries.map((entry) => (
            <li
              key={entry.index}
              data-level={entry.level}
              className={cn(entry.level === 2 && 'pl-4', entry.level === 3 && 'pl-8')}
            >
              <a
                href={`#${fragmentOf(entry.text)}`}
                onClick={(event) => scrollToHeading(event, entry.index)}
                className="text-muted-foreground hover:text-foreground block truncate py-0.5 text-sm underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current"
              >
                {entry.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  return blockFeature(tableOfContentsBlock, { view: TableOfContentsView, icon: ListIcon, readsDocument: true });
}
