import { memo, type ComponentProps, type ReactNode } from 'react';
import Markdown, { type Components, type ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCode,
  CodeBlockContent,
  CodeBlockCopy,
  CodeBlockLanguage,
} from '@/registry/bases/base-ui/components/data-display/code-block';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';
import { isPlainLanguage } from '@/registry/bases/base-ui/lib/code-language';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/bases/base-ui/ui/table';

/** Fenced code, told from inline code by a language class or a line break, since react-markdown marks neither. */
function isBlockCode(className: string | undefined, text: string): boolean {
  return /language-\w+/.test(className ?? '') || text.includes('\n');
}

/** Inline code: a muted chip in the text's own size. */
function MarkdownViewInlineCode({ className, ...props }: ComponentProps<'code'>): ReactNode {
  return (
    <code
      data-slot="markdown-view-inline-code"
      className={cn('bg-muted rounded px-1.5 py-0.5 font-mono', className)}
      {...props}
    />
  );
}

/** A GFM table as the upstream `Table`, whose own container scrolls it sideways when it is wider than the view. */
function MarkdownViewTable({ node: _node, ...props }: ComponentProps<'table'> & ExtraProps): ReactNode {
  return (
    <div data-slot="markdown-view-table" className="my-3">
      <Table {...props} />
    </div>
  );
}

/**
 * The renderers: tables as upstream's `Table` parts, and fenced code as a `CodeBlock`, headed with its
 * language when the fence names one; inline code stays a chip. `pre` is unwrapped, because the `code`
 * renderer draws the whole block, and a `CodeBlock` root is a `<div>`, which must not nest in a `<pre>`.
 */
const markdownViewComponents: Components = {
  pre: ({ children }) => <>{children}</>,
  table: MarkdownViewTable,
  thead: ({ node: _node, ...props }) => <TableHeader {...props} />,
  tbody: ({ node: _node, ...props }) => <TableBody {...props} />,
  tr: ({ node: _node, ...props }) => <TableRow {...props} />,
  th: ({ node: _node, ...props }) => <TableHead {...props} />,
  td: ({ node: _node, ...props }) => <TableCell {...props} />,
  code: ({ node: _node, className, children, ...props }) => {
    const text = String(children ?? '');
    if (!isBlockCode(className, text)) {
      return (
        <MarkdownViewInlineCode className={className} {...props}>
          {children}
        </MarkdownViewInlineCode>
      );
    }
    const language = /language-(\w+)/.exec(className ?? '')?.[1];
    return (
      <CodeBlock code={text.replace(/\n$/, '')} language={language ?? 'text'} className="my-3">
        {isPlainLanguage(language) ? (
          <CodeBlockActions>
            <CodeBlockCopy variant="secondary" />
          </CodeBlockActions>
        ) : (
          <CollapsibleCardHeader>
            <CollapsibleCardTitle>
              <CodeBlockLanguage />
            </CollapsibleCardTitle>
            <CollapsibleCardActions>
              <CodeBlockCopy />
              <CollapsibleCardTrigger />
            </CollapsibleCardActions>
          </CollapsibleCardHeader>
        )}
        <CodeBlockContent>
          <CodeBlockCode />
        </CodeBlockContent>
      </CodeBlock>
    );
  },
};

interface MarkdownViewProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Markdown source to render (GitHub-Flavored Markdown). */
  children: string;
}

/**
 * Renders a Markdown string (GFM: tables, task lists, strikethrough, autolinks)
 * styled to the design tokens, with tables as the upstream `Table` and fenced code
 * as a `CodeBlock` (highlighting, copy, collapse). Raw embedded HTML is not
 * rendered, so untrusted content is safe. A wide table or a long code line
 * scrolls sideways inside its own block.
 */
function MarkdownView({ children, className, ...props }: MarkdownViewProps): ReactNode {
  return (
    <div
      data-slot="markdown-view"
      className={cn(
        'text-foreground text-sm leading-relaxed',
        '[&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1:not(:first-child)]:mt-6',
        '[&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2:not(:first-child)]:mt-6',
        '[&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3:not(:first-child)]:mt-5',
        '[&_h4]:mb-1 [&_h4]:font-semibold [&_h4:not(:first-child)]:mt-4',
        '[&_p]:my-3',
        '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4',
        '[&_strong]:font-semibold',
        '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6',
        '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6',
        '[&_li]:my-1',
        '[&_blockquote]:border-border [&_blockquote]:text-muted-foreground [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic',
        '[&_hr]:border-border [&_hr]:my-6',
        '[&_img]:max-w-full [&_img]:rounded-md',
        className,
      )}
      {...props}
    >
      <Markdown remarkPlugins={[remarkGfm]} components={markdownViewComponents}>
        {children}
      </Markdown>
    </div>
  );
}

// A streaming chat list re-renders every message on each chunk; memo keeps a
// settled message from re-parsing. Its props are a string and plain
// div attributes, so the shallow comparison holds.
const MemoizedMarkdownView = memo(MarkdownView);

export { MemoizedMarkdownView as MarkdownView };
export type { MarkdownViewProps };
