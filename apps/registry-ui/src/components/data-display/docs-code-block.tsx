import type { ComponentProps, ReactNode } from 'react';

import { CodeLanguageIcon } from '@/components/data-display/code-language-icon';
import { CopyButton } from '@/components/data-display/copy-button';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { ScrollArea, ScrollBar } from '@/registry/bases/base-ui/ui/scroll-area';

interface DocsCodeBlockProps extends Omit<ComponentProps<'figure'>, 'title'> {
  /** The source a copy writes to the clipboard: the block's text as the reader sees it. */
  code: string;
  /** `code` as `highlightCode` renders it. */
  highlightedCode: string;
  /** The language `code` is highlighted as, which the header names. */
  language: string;
  /** A file name the header shows beside the language. */
  title?: string;
}

/**
 * A highlighted block outside MDX, upstream's `ComponentCode`: the tree an MDX fence compiles to, a
 * `figure` headed by its language and title with a copy button over the header, so both look alike.
 * The code scrolls in a `ScrollArea` where upstream's `pre` scrolls itself, and the copy button sits
 * outside it, so it never scrolls over the code.
 */
function DocsCodeBlock({ code, highlightedCode, language, title, className, ...props }: DocsCodeBlockProps): ReactNode {
  return (
    <figure data-code-figure="" className={className} {...props}>
      <DocsCodeBlockTitle language={language}>{title}</DocsCodeBlockTitle>
      <CopyButton value={code} />
      <DocsCodeBlockScrollArea>
        <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </DocsCodeBlockScrollArea>
    </figure>
  );
}

interface DocsCodeBlockTitleProps extends ComponentProps<'figcaption'> {
  /** The block's language, whose icon and name open the header. */
  language: string;
}

/** A code block's header: its language's icon and name, then its title when it has one. */
function DocsCodeBlockTitle({ language, className, children, ...props }: DocsCodeBlockTitleProps): ReactNode {
  return (
    <figcaption
      data-code-title=""
      data-language={language}
      className={cn(
        'text-code-foreground [&_svg]:text-code-foreground flex items-center gap-2 [&_svg]:size-4 [&_svg]:opacity-70',
        className,
      )}
      {...props}
    >
      <CodeLanguageIcon language={language} />
      <span className="opacity-70">{language}</span>
      {children ? <span className="min-w-0 truncate">{children}</span> : null}
    </figcaption>
  );
}

/**
 * The scroller a code block's `pre` sits in, both ways: sideways for a long line, and down where a
 * container caps its viewport's height. A sideways swipe at its end does not carry on into the page.
 */
function DocsCodeBlockScrollArea({ className, children, ...props }: ComponentProps<typeof ScrollArea>): ReactNode {
  return (
    <ScrollArea
      data-not-typeset
      className={cn('min-w-0 **:data-[slot=scroll-area-viewport]:overscroll-x-contain', className)}
      {...props}
    >
      {children}
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export { DocsCodeBlock, DocsCodeBlockScrollArea, DocsCodeBlockTitle };
