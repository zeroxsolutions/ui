import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';

import { HighlightedCode } from '@/registry/bases/base-ui/components/data-display/highlighted-code';
import { CopyButton, type CopyButtonProps } from '@/registry/bases/base-ui/components/feedback/copy-button';
import { CollapsibleCard, CollapsibleCardContent } from '@/registry/bases/base-ui/components/layout/collapsible-card';
import { useHighlightedLines } from '@/registry/bases/base-ui/hooks/use-highlighted-lines';
import { isPlainLanguage, languageLabel } from '@/registry/bases/base-ui/lib/code-language';
import { codeLanguageIcon } from '@/registry/bases/base-ui/lib/language-options';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { ScrollBar } from '@/registry/bases/base-ui/ui/scroll-area';

interface CodeBlockContextValue {
  code: string;
  language: string | undefined;
}

const CodeBlockContext = createContext<CodeBlockContextValue | null>(null);

function useCodeBlock(): CodeBlockContextValue {
  const context = useContext(CodeBlockContext);
  if (!context) throw new Error('CodeBlockLanguage and CodeBlockCopy must be placed inside a CodeBlock.');
  return context;
}

interface CodeBlockProps extends ComponentProps<typeof CollapsibleCard> {
  /** The source shown, and what a copy writes to the clipboard. */
  code: string;
  /** Shiki language id (`ts`, `json`, `bash`); absent or plain text renders unhighlighted. */
  language?: string;
  /** The header, composed from `CollapsibleCard` parts; absent, a copy button floats over the code on hover. */
  children?: ReactNode;
}

/**
 * Read-only source over a collapsible card, highlighted through the shared Shiki
 * highlighter and falling back to plain mono while the grammar loads. Compose a
 * header as children:
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
 * </CodeBlock>
 * ```
 *
 * The root keeps `data-slot="code-block"`; the editor stylesheet targets it.
 */
function CodeBlock({ code, language, variant = 'muted', className, children, ...props }: CodeBlockProps): ReactNode {
  const lines = useHighlightedLines(code, language);

  return (
    <CodeBlockContext.Provider value={{ code, language }}>
      <CollapsibleCard
        data-slot="code-block"
        data-language={language}
        variant={variant}
        className={cn('group/code-block relative', className)}
        {...props}
      >
        {children ?? (
          <CopyButton
            value={code}
            label="Copy code"
            className="bg-muted/70 absolute top-1 right-1 z-10 opacity-0 backdrop-blur transition-opacity group-hover/code-block:opacity-100 focus-visible:opacity-100"
          />
        )}
        <CollapsibleCardContent>
          {/* A ScrollArea rather than overflow-x-auto, so long lines scroll on the styled rail instead of the OS overlay bar. */}
          <ScrollAreaPrimitive.Root className="w-full overflow-hidden">
            <ScrollAreaPrimitive.Viewport className="w-full">
              <pre className="m-0 px-3 py-2 text-xs leading-relaxed">
                <HighlightedCode lines={lines}>{code}</HighlightedCode>
              </pre>
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar orientation="horizontal" />
            <ScrollAreaPrimitive.Corner />
          </ScrollAreaPrimitive.Root>
        </CollapsibleCardContent>
      </CollapsibleCard>
    </CodeBlockContext.Provider>
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

export { CodeBlock, CodeBlockLanguage, CodeBlockCopy };
export type { CodeBlockProps, CodeBlockCopyProps };
