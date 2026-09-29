import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';

import { CopyButton } from '@/registry/bases/base-ui/components/feedback/copy-button';
import {
  CollapsibleCard,
  CollapsibleCardActions,
  CollapsibleCardContent,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';
import { HighlightedCode } from '@/registry/bases/base-ui/components/data-display/highlighted-code';
import { ScrollBar } from '@/registry/bases/base-ui/ui/scroll-area';
import { useHighlightedLines } from '@/registry/bases/base-ui/hooks/use-highlighted-lines';
import { isPlainLanguage, languageLabel } from '@/registry/bases/base-ui/lib/code-language';
import { codeLanguageIcon } from '@/registry/bases/base-ui/lib/language-options';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * CodeBlock — a mono `<pre>` with Shiki syntax highlighting and a copy control,
 * composed from the SDK `Button`. When a `language` is given, the block tokenizes
 * through the shared Shiki highlighter (the same one the code editor uses) and
 * paints each token with a `var(--shiki-token-*)` color mapped to the design
 * tokens, so it tracks light/dark for free; a labelled language header (file-type
 * icon + name) sits above the body. Highlighting is async and degrades to plain
 * mono while the grammar loads and for unknown languages, so the code is always
 * legible. With no language (or `text`/`plaintext`) it stays a borderless plain
 * block with a hover copy button — used for fenced code inside markdown
 * (`MarkdownView codeBlocks`), `ToolCallCard` Parameters/Result panels, and JSON
 * disclosures.
 *
 * A read-only view: it renders the highlighted source, never an editing surface
 * — the editable code surface lives in the composite editor package's code-block
 * feature, which composes this same `CollapsibleCard` chrome so the two read
 * identically.
 *
 * `code` is the source string. Presentational — copy uses the Clipboard API
 * best-effort and resets after ~2s.
 */
interface CodeBlockProps {
  code: string;
  /** Shiki language id (e.g. `ts`, `json`, `bash`); drives highlighting + header. */
  language?: string;
  className?: string;
}

function CodeBlock({ code, language, className }: CodeBlockProps) {
  const lines = useHighlightedLines(code, language);
  const isPlain = isPlainLanguage(language);
  // A block carries the header only when the language is real; an unlabelled
  // block stays a borderless muted surface with a hover copy.
  const hasHeader = !isPlain;
  // The full-color Material icon for the language (shared with the language
  // switcher); it self-scales at 1em, so it carries no size class.
  const LanguageIcon = !isPlain ? codeLanguageIcon(language as string) : null;

  // The code body — a read-only Shiki `<pre>` whose long lines scroll through a
  // Base UI ScrollArea (its styled thin rail), not the OS overlay scrollbar a
  // native `overflow-x-auto` would leave.
  const body = (
    <ScrollAreaPrimitive.Root className="w-full overflow-hidden">
      <ScrollAreaPrimitive.Viewport className="w-full">
        <pre className="m-0 px-3 py-2 text-xs leading-relaxed">
          <code className="font-mono">{lines ? <HighlightedCode lines={lines} /> : code}</code>
        </pre>
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );

  // An unlabelled block stays a minimal muted surface with a hover copy — no
  // header, so no CollapsibleCard chrome; used for fenced code inside markdown and JSON
  // panels, where a header/collapse would be noise. Borderless on purpose: the
  // surface is delineated by `bg-muted`, so a block nested inside a card doesn't
  // stack border-inside-border.
  if (!hasHeader) {
    return (
      <div
        data-slot="code-block"
        data-language={language}
        className={cn('group/code bg-muted/50 relative w-full overflow-hidden rounded-md', className)}
      >
        <CopyButton
          value={code}
          label="Copy code"
          className="bg-muted/70 absolute top-1 right-1 z-10 opacity-0 backdrop-blur transition-opacity group-hover/code:opacity-100 focus-visible:opacity-100"
        />
        {body}
      </div>
    );
  }

  // A labelled block composes the shared CollapsibleCard: the language (icon + label)
  // fills the title; copy + the collapse toggle fill the actions; the code body
  // is the collapsible content. `data-slot` stays "code-block" — the editor
  // stylesheet targets it — so the CollapsibleCard root carries it instead of its
  // default "collapsible-card".
  return (
    <CollapsibleCard
      variant="muted"
      data-slot="code-block"
      data-language={language}
      className={cn('group/code', className)}
    >
      <CollapsibleCardHeader>
        <CollapsibleCardTitle>
          {LanguageIcon ? <LanguageIcon className="shrink-0" /> : null}
          <span className="text-xs">{languageLabel(language as string)}</span>
        </CollapsibleCardTitle>
        <CollapsibleCardActions>
          <CopyButton value={code} label="Copy code" size="icon" />
          <CollapsibleCardTrigger />
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
      <CollapsibleCardContent>{body}</CollapsibleCardContent>
    </CollapsibleCard>
  );
}

export { CodeBlock };
export type { CodeBlockProps };
