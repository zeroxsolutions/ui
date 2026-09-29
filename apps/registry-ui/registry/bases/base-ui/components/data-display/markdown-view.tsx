import { cva } from 'class-variance-authority';
import { memo, type ComponentProps, type ReactNode } from 'react';
import Markdown, { type Components } from 'react-markdown';
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

/**
 * Element styling for rendered Markdown, as descendant utilities on the tokens
 * so every colour follows dark mode. With `codeBlocks` off the recipe also styles
 * `<pre>` and `<code>`; with it on those rules would repaint `CodeBlock`'s own
 * `<pre>`, so they drop and inline code takes the same chip on its element.
 */
const markdownViewVariants = cva(
  [
    'text-sm leading-relaxed text-foreground',
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
    '[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic',
    '[&_hr]:my-6 [&_hr]:border-border',
    '[&_img]:max-w-full [&_img]:rounded-md',
    '[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left',
    '[&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-1.5 [&_th]:font-medium',
    '[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5',
  ],
  {
    variants: {
      codeBlocks: {
        false: [
          '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]',
          '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3',
          '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[0.85em]',
        ],
        true: '',
      },
    },
    defaultVariants: { codeBlocks: false },
  },
);

/**
 * Renderers for `codeBlocks` mode: fenced code becomes a `CodeBlock`, headed with
 * its language when the fence names one; inline code stays a chip. `pre` is
 * unwrapped because the `CodeBlock` root is a `<div>`, which must not nest in a
 * `<pre>`.
 */
const markdownViewCodeComponents: Components = {
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const text = String(children ?? '');
    const lang = /language-(\w+)/.exec(className ?? '')?.[1];
    const isBlock = !!lang || text.includes('\n');
    if (isBlock) {
      return (
        <CodeBlock code={text.replace(/\n$/, '')} language={lang ?? 'text'}>
          {isPlainLanguage(lang) ? undefined : (
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
    }
    return <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>;
  },
};

interface MarkdownViewProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Markdown source to render (GitHub-Flavored Markdown). */
  children: string;
  /**
   * Render fenced code as `CodeBlock` (copy, collapse, a scroll rail) instead of
   * a styled `<pre>`. Off by default; chat surfaces turn it on.
   */
  codeBlocks?: boolean;
}

/**
 * Renders a Markdown string (GFM: tables, task lists, strikethrough, autolinks)
 * styled to the design tokens. Raw embedded HTML is not rendered, so untrusted
 * content is safe.
 */
function MarkdownView({ children, className, codeBlocks = false, ...props }: MarkdownViewProps): ReactNode {
  return (
    <div data-slot="markdown-view" className={cn(markdownViewVariants({ codeBlocks }), className)} {...props}>
      <Markdown remarkPlugins={[remarkGfm]} components={codeBlocks ? markdownViewCodeComponents : undefined}>
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
