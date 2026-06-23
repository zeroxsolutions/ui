import { Check, Copy } from 'lucide-react';
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/**
 * CodeBlock — a plain mono `<pre>` with a hover copy button, composed from the
 * SDK `Button`. No syntax highlighter (deliberately: chat code is mostly JSON
 * tool payloads and reads fine in mono; keeps the consumer free of a `shiki`
 * dependency). Used for tool Parameters/Result panels, an auto-collapsed JSON
 * disclosure, and fenced code inside markdown (`MarkdownView codeBlocks`).
 *
 * `code` is the source string; `language` is stamped as `data-language` for
 * styling hooks only (not used for highlighting). Presentational — copy uses the
 * Clipboard API best-effort and resets after ~2s.
 */
export interface CodeBlockProps {
  code: string;
  /** Stamped as `data-language` for styling hooks; not used for highlighting. */
  language?: string;
  className?: string;
}

const COPY_RESET_MS = 2000;

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(() => {
    if (!navigator?.clipboard?.writeText) return;
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        timer.current = window.setTimeout(() => setCopied(false), COPY_RESET_MS);
      })
      .catch(() => {
        /* best-effort */
      });
  }, [code]);

  const Icon = copied ? Check : Copy;

  // A long line (an id, a URL, a base64 blob) overflows sideways. A native
  // `overflow-x-auto` pre leaves that to the OS scrollbar, which on macOS is an
  // overlay that only flashes mid-scroll — the row reads as un-scrollable. Scroll
  // through a Base UI ScrollArea instead, so the horizontal rail is the same
  // styled thin scrollbar the rest of the system uses. The Scrollbar mounts only
  // when the viewport actually overflows (no `keepMounted`), so the rail is
  // present exactly when the line is too long — the affordance is discoverable,
  // not hidden until you happen to hover. The viewport is `w-full` (not
  // `size-full`) so height stays auto and the block still grows vertically; only
  // the long line scrolls sideways.
  return (
    <ScrollAreaPrimitive.Root
      data-language={language}
      className={cn(
        // Borderless on purpose — the surface is delineated by `bg-muted`, not
        // a border, so a code block nested inside a tool/JSON card doesn't stack
        // border-inside-border.
        'group/code relative w-full overflow-hidden rounded-md bg-muted/50',
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className="absolute right-1 top-1 z-10 size-6 bg-muted/70 opacity-0 backdrop-blur transition-opacity group-hover/code:opacity-100 focus-visible:opacity-100"
      >
        <Icon className="size-3.5" />
      </Button>
      <ScrollAreaPrimitive.Viewport className="w-full">
        <pre className="m-0 px-3 py-2 text-xs leading-relaxed">
          <code className="font-mono">{code}</code>
        </pre>
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}
