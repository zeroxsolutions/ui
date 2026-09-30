import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';

import { HighlightedCode } from '@/registry/bases/base-ui/components/data-display/highlighted-code';
import { CopyButton, type CopyButtonProps } from '@/registry/bases/base-ui/components/feedback/copy-button';
import { CollapsibleCard, CollapsibleCardContent } from '@/registry/bases/base-ui/components/layout/collapsible-card';
import { useHighlightedLines } from '@/registry/bases/base-ui/hooks/use-highlighted-lines';
import { isPlainLanguage, languageLabel } from '@/registry/bases/base-ui/lib/code-language';
import { codeLanguageIcon } from '@/registry/bases/base-ui/lib/language-options';
import type { HighlightLine } from '@/registry/bases/base-ui/lib/shiki';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { ScrollBar } from '@/registry/bases/base-ui/ui/scroll-area';

interface CodeBlockContextValue {
  code: string;
  language: string | undefined;
  lines: HighlightLine[] | null;
}

const CodeBlockContext = createContext<CodeBlockContextValue | null>(null);

function useCodeBlock(): CodeBlockContextValue {
  const context = useContext(CodeBlockContext);
  if (!context) throw new Error('CodeBlock parts must be placed inside a CodeBlock.');
  return context;
}

interface CodeBlockProps extends ComponentProps<typeof CollapsibleCard> {
  /** The source shown, and what a copy writes to the clipboard. */
  code: string;
  /** Shiki language id (`ts`, `json`, `bash`); absent or plain text renders unhighlighted. */
  language?: string;
  /**
   * `code` already tokenized, as `highlightToLines` returns it, for a block highlighted ahead of
   * render (on the server, at build); given, the block highlights nothing itself, and `null` shows
   * `code` plain.
   */
  lines?: HighlightLine[] | null;
}

/**
 * Read-only source over a collapsible card, highlighted through the shared Shiki highlighter and
 * falling back to plain mono while the grammar loads. The root holds the code; its parts show it.
 * Compose a header from `CollapsibleCard` parts, then the body:
 *
 * ```tsx
 * <CodeBlock code={source} language="ts">
 *   <CollapsibleCardHeader>
 *     <CollapsibleCardTitle>
 *       <CodeBlockLanguage />
 *     </CollapsibleCardTitle>
 *     <CollapsibleCardActions>
 *       <CodeBlockCopy />
 *       <CollapsibleCardTrigger />
 *     </CollapsibleCardActions>
 *   </CollapsibleCardHeader>
 *   <CodeBlockContent>
 *     <CodeBlockLineNumbers />
 *     <CodeBlockCode />
 *   </CodeBlockContent>
 * </CodeBlock>
 * ```
 *
 * A block with no header floats its copy over the code instead:
 * `<CodeBlockActions><CodeBlockCopy variant="secondary" /></CodeBlockActions>` before the content.
 *
 * The root keeps `data-slot="code-block"`; the editor stylesheet targets it.
 */
function CodeBlock({
  code,
  language,
  lines: givenLines,
  variant = 'muted',
  className,
  ...props
}: CodeBlockProps): ReactNode {
  // Given lines, the hook is handed no language, so it neither loads a grammar nor highlights.
  const highlightedLines = useHighlightedLines(code, givenLines === undefined ? language : undefined);
  const lines = givenLines === undefined ? highlightedLines : givenLines;

  return (
    <CodeBlockContext.Provider value={{ code, language, lines }}>
      <CollapsibleCard
        data-slot="code-block"
        data-language={language}
        variant={variant}
        className={cn('group/code-block relative', className)}
        {...props}
      />
    </CodeBlockContext.Provider>
  );
}

/**
 * The actions of a block with no header, floated over the code's top-right corner and shown while
 * the block is hovered or one of them holds keyboard focus.
 */
function CodeBlockActions({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="code-block-actions"
      className={cn(
        'absolute top-1 right-1 z-10 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/code-block:opacity-100 has-focus-visible:opacity-100',
        className,
      )}
      {...props}
    />
  );
}

/**
 * The body the card's trigger folds: a scroller holding the `pre` its children fill, usually
 * `CodeBlockLineNumbers` and `CodeBlockCode`. Its viewport is `data-slot="code-block-viewport"`,
 * where a container caps the block's height; the code then scrolls both ways inside it.
 */
function CodeBlockContent({ children, ...props }: ComponentProps<typeof CollapsibleCardContent>): ReactNode {
  return (
    <CollapsibleCardContent data-slot="code-block-content" {...props}>
      {/* A ScrollArea rather than overflow-x-auto, so long lines scroll on the styled rail instead of the OS overlay bar. */}
      {/* The pre's bottom padding clears that rail, which Base UI positions over the viewport's bottom edge. */}
      <ScrollAreaPrimitive.Root className="w-full overflow-hidden">
        <ScrollAreaPrimitive.Viewport data-slot="code-block-viewport" className="w-full">
          <pre className="m-0 px-3 pt-2 pb-3 text-xs leading-relaxed has-data-[slot=code-block-line-numbers]:flex has-data-[slot=code-block-line-numbers]:gap-4">
            {children}
          </pre>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar />
        <ScrollBar orientation="horizontal" />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </CollapsibleCardContent>
  );
}

/** A gutter numbering each line of the block's code, hidden from assistive technology and left out of a copy. */
function CodeBlockLineNumbers({ className, ...props }: ComponentProps<'span'>): ReactNode {
  const { code } = useCodeBlock();
  return (
    <span
      aria-hidden
      data-slot="code-block-line-numbers"
      className={cn('text-muted-foreground text-right select-none', className)}
      {...props}
    >
      {code
        .split('\n')
        .map((_, index) => index + 1)
        .join('\n')}
    </span>
  );
}

/** The block's code, painted with its highlighted lines once they arrive and plain until then. */
function CodeBlockCode(props: Omit<ComponentProps<typeof HighlightedCode>, 'lines' | 'children'>): ReactNode {
  const { code, lines } = useCodeBlock();
  return (
    <HighlightedCode data-slot="code-block-code" lines={lines} {...props}>
      {code}
    </HighlightedCode>
  );
}

/** The block's language as its icon and display name, `Plain text` when it has none; `children` replace the name. */
function CodeBlockLanguage({ className, children, ...props }: ComponentProps<'span'>): ReactNode {
  const { language } = useCodeBlock();
  const plain = isPlainLanguage(language);
  const LanguageIcon = codeLanguageIcon(plain ? 'text' : (language as string));

  return (
    <span
      data-slot="code-block-language"
      className={cn('flex min-w-0 items-center gap-1.5 text-xs', className)}
      {...props}
    >
      <LanguageIcon aria-hidden className="shrink-0" />
      {children ?? (plain ? 'Plain text' : languageLabel(language as string))}
    </span>
  );
}

type CodeBlockCopyProps = Omit<CopyButtonProps, 'value'>;

/** Copies the block's code; takes every `CopyButton` prop but `value`. */
function CodeBlockCopy({ label = 'Copy code', size = 'icon', ...props }: CodeBlockCopyProps): ReactNode {
  const { code } = useCodeBlock();
  return <CopyButton data-slot="code-block-copy" value={code} label={label} size={size} {...props} />;
}

export {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockLineNumbers,
  CodeBlockCode,
  CodeBlockLanguage,
  CodeBlockCopy,
};
export type { CodeBlockProps, CodeBlockCopyProps };
