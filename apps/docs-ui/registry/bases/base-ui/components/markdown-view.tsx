import * as React from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { CodeBlock } from '@/registry/bases/base-ui/components/code-block';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * Token-themed element styling for rendered Markdown. Kept as descendant
 * utilities (no `@tailwindcss/typography` dependency) so every color tracks the
 * design tokens and dark mode for free.
 */
const PROSE = [
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
].join(' ');

/**
 * Inline-code chip styling, shared by the `codeBlocks` renderer's explicit
 * inline `<code>` and mirrored as `[&_code]` descendant rules in `PROSE_CODE`
 * below — one source for the chip's look so the two paths never drift.
 */
const INLINE_CODE = 'rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]';

/**
 * Code styling for the default (plain `<pre>`) renderer. Split out so the
 * `codeBlocks` variant can drop it — there `CodeBlock` owns code rendering and
 * these descendant rules would otherwise repaint its inner `<pre>`/`<code>`.
 * The `[&_code]` rules are the descendant-selector mirror of `INLINE_CODE`
 * (kept as a literal so Tailwind statically detects each class).
 */
const PROSE_CODE = [
  '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]',
  '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[0.85em]',
].join(' ');

/**
 * `components` override used only in `codeBlocks` mode: fenced code renders as
 * the interactive `CodeBlock` (copy button + horizontal scroll rail); inline
 * code stays a muted chip. The fenced wrapper is unwrapped — `code` emits the
 * block-level `<CodeBlock>` directly, since a `<div>` must not nest inside `<pre>`.
 */
const codeBlockComponents: Components = {
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const text = String(children ?? '');
    const lang = /language-(\w+)/.exec(className ?? '')?.[1];
    const isBlock = !!lang || text.includes('\n');
    if (isBlock) {
      return <CodeBlock code={text.replace(/\n$/, '')} language={lang ?? 'text'} />;
    }
    return <code className={INLINE_CODE}>{children}</code>;
  },
};

export interface MarkdownViewProps
  extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Markdown source to render (GitHub-Flavored Markdown). */
  children: string;
  /**
   * Render fenced code blocks with the interactive `CodeBlock` (copy button,
   * horizontal scroll rail) instead of a plain styled `<pre>`. Off by default so
   * existing read-only callers (previews, frontmatter) are unchanged; chat
   * surfaces opt in.
   */
  codeBlocks?: boolean;
}

/**
 * Renders a Markdown string (GFM: tables, task lists, strikethrough, autolinks)
 * styled to the design tokens. Read-only — raw embedded HTML is not rendered, so
 * it's safe for untrusted content. Pair with an editor for the edit half.
 *
 * Memoized: parsing Markdown is not free and chat surfaces render it inside a
 * streaming message list, so a settled message must not re-parse on every parent
 * render. Props are `children` (string) + `codeBlocks` + plain `div` attributes,
 * so the default shallow comparison is correct.
 */
export const MarkdownView = React.memo(function MarkdownView({
  children,
  className,
  codeBlocks = false,
  ...props
}: MarkdownViewProps) {
  return (
    <div
      data-slot="markdown-view"
      className={cn(PROSE, !codeBlocks && PROSE_CODE, className)}
      {...props}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={codeBlocks ? codeBlockComponents : undefined}
      >
        {children}
      </Markdown>
    </div>
  );
});
