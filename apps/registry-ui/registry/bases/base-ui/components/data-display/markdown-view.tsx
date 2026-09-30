import { memo, type ComponentProps, type ReactNode } from 'react';
import Markdown, { type Components, type ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import {
  CodeBlock,
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
import { ScrollArea, ScrollBar } from '@/registry/bases/base-ui/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/bases/base-ui/ui/table';

/** Fenced code, told from inline code by a language class or a line break, since react-markdown marks neither. */
function isBlockCode(className: string | undefined, text: string): boolean {
  return /language-\w+/.test(className ?? '') || text.includes('\n');
}

/** Inline code: a muted chip in the text's own size. */
function MarkdownViewInlineCode({ className, ...props }: ComponentProps<'code'>): ReactNode {
  return <code className={cn('bg-muted rounded px-1.5 py-0.5 font-mono', className)} {...props} />;
}

/** A GFM table as the upstream `Table`, scrolling sideways in a `ScrollArea` when it is wider than the view. */
function MarkdownViewTable({ node: _node, ...props }: ComponentProps<'table'> & ExtraProps): ReactNode {
  return (
    // The Table primitive wraps itself in an overflow-x-auto box; letting it overflow hands the scroll to the ScrollArea.
    <ScrollArea className="my-3 **:data-[slot=table-container]:overflow-visible">
      <Table {...props} />
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

/**
 * Table parts shared by both modes. `pre` is unwrapped in both, because each
 * `code` renderer draws its own block, and a `CodeBlock` root is a `<div>`,
 * which must not nest in a `<pre>`.
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
    return (
      <div data-slot="markdown-view-code" className="bg-muted my-3 rounded-lg">
        <ScrollArea>
          <pre className="p-3 text-xs leading-relaxed">
            <code className={cn('font-mono', className)}>{text.replace(/\n$/, '')}</code>
          </pre>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    );
  },
};

/**
 * The `codeBlocks` renderers: fenced code becomes a `CodeBlock`, headed with its
 * language when the fence names one; inline code stays a chip.
 */
const markdownViewCodeBlockComponents: Components = {
  ...markdownViewComponents,
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
        {isPlainLanguage(language) ? undefined : (
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
      </CodeBlock>
    );
  },
};

interface MarkdownViewProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Markdown source to render (GitHub-Flavored Markdown). */
  children: string;
  /**
   * Render fenced code as `CodeBlock` (highlighting, copy, collapse) instead of
   * a plain muted `<pre>`. Off by default; chat surfaces turn it on.
   */
  codeBlocks?: boolean;
}

/**
 * Renders a Markdown string (GFM: tables, task lists, strikethrough, autolinks)
 * styled to the design tokens, with tables as the upstream `Table`. Raw embedded
 * HTML is not rendered, so untrusted content is safe. A wide table or a long
 * code line scrolls sideways in its own `ScrollArea`.
 */
function MarkdownView({ children, className, codeBlocks = false, ...props }: MarkdownViewProps): ReactNode {
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
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={codeBlocks ? markdownViewCodeBlockComponents : markdownViewComponents}
      >
        {children}
      </Markdown>
    </div>
  );
}

// A streaming chat list re-renders every message on each chunk; memo keeps a
// settled message from re-parsing. Its props are a string, a boolean and plain
// div attributes, so the shallow comparison holds.
const MemoizedMarkdownView = memo(MarkdownView);

export { MemoizedMarkdownView as MarkdownView };
export type { MarkdownViewProps };
