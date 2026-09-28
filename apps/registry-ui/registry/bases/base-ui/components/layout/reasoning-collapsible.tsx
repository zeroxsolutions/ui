import { Brain, ChevronDown } from 'lucide-react';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import { MarkdownView } from '@/registry/bases/base-ui/components/data-display/markdown-view';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * ReasoningCollapsible — a thinking / reasoning disclosure built on the SDK `Collapsible`
 * with a muted-trigger language. Auto-opens while the agent is streaming its
 * reasoning, then auto-collapses ~1s after the stream ends; the trigger reads
 * "Thinking…" (pulsing) → "Thought for N seconds".
 *
 * Open state is plain local state (the host never drives it from outside); the
 * live cue is `animate-pulse`. Presentational — `streaming` in, content as a
 * markdown string. Compose the parts:
 *
 *   <ReasoningCollapsible streaming={isLive}>
 *     <ReasoningCollapsibleTrigger />
 *     <ReasoningCollapsibleContent>{text}</ReasoningCollapsibleContent>
 *   </ReasoningCollapsible>
 */
const AUTO_CLOSE_DELAY = 1000;
const MS_IN_S = 1000;

interface ReasoningCollapsibleContextValue {
  streaming: boolean;
  isOpen: boolean;
  duration: number | undefined;
}

const ReasoningCollapsibleContext = createContext<ReasoningCollapsibleContextValue | null>(null);

/**
 * Read the live reasoning state (`streaming`, `isOpen`, `duration`) from inside a
 * `<ReasoningCollapsible>`. Lets a consumer compute their own trigger label. Throws when
 * used outside `<ReasoningCollapsible>`.
 */
function useReasoningCollapsible(): ReasoningCollapsibleContextValue {
  const ctx = useContext(ReasoningCollapsibleContext);
  if (!ctx) throw new Error('ReasoningCollapsible parts must be used within <ReasoningCollapsible>');
  return ctx;
}

interface ReasoningCollapsibleProps {
  streaming?: boolean;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}

function ReasoningCollapsible({ streaming = false, defaultOpen, className, children }: ReasoningCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? streaming);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const startRef = useRef<number | null>(null);
  const everStreamedRef = useRef(streaming);
  const autoClosedRef = useRef(false);

  // Track stream start → compute elapsed seconds when it ends.
  useEffect(() => {
    if (streaming) {
      everStreamedRef.current = true;
      if (startRef.current === null) startRef.current = Date.now();
    } else if (startRef.current !== null) {
      setDuration(Math.ceil((Date.now() - startRef.current) / MS_IN_S));
      startRef.current = null;
    }
  }, [streaming]);

  // Auto-open while streaming (unless the caller pinned it closed).
  useEffect(() => {
    if (streaming && !isOpen && defaultOpen !== false) setIsOpen(true);
  }, [streaming, isOpen, defaultOpen]);

  // Auto-close once, shortly after streaming ends, so old thoughts tuck away.
  useEffect(() => {
    if (everStreamedRef.current && !streaming && isOpen && !autoClosedRef.current) {
      const t = setTimeout(() => {
        setIsOpen(false);
        autoClosedRef.current = true;
      }, AUTO_CLOSE_DELAY);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [streaming, isOpen]);

  return (
    <ReasoningCollapsibleContext.Provider value={{ streaming, isOpen, duration }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn('my-2', className)}>
        {children}
      </Collapsible>
    </ReasoningCollapsibleContext.Provider>
  );
}

function thinkingLabel(streaming: boolean, duration: number | undefined): string {
  if (streaming || duration === 0) return 'Thinking…';
  if (duration === undefined) return 'Thought for a few seconds';
  return `Thought for ${duration} second${duration === 1 ? '' : 's'}`;
}

function ReasoningCollapsibleTrigger({
  children,
  className,
}: {
  /** Overrides the computed "Thinking…" / "Thought for N seconds" label. */
  children?: ReactNode;
  className?: string;
}) {
  const { streaming, isOpen, duration } = useReasoningCollapsible();
  const live = streaming || duration === 0;
  return (
    <CollapsibleTrigger
      className={cn(
        'text-muted-foreground hover:text-foreground flex w-full items-center gap-2 text-sm transition-colors',
        className,
      )}
    >
      <Brain className="size-4 shrink-0" />
      <span className={cn('min-w-0 flex-1 truncate text-left', live && 'animate-pulse')}>
        {children ?? thinkingLabel(streaming, duration)}
      </span>
      <ChevronDown className={cn('size-4 shrink-0 transition-transform', isOpen && 'rotate-180')} />
    </CollapsibleTrigger>
  );
}

function ReasoningCollapsibleContent({ children, className }: { children: string; className?: string }) {
  return (
    <CollapsibleContent className={cn('text-muted-foreground mt-2 text-sm', className)}>
      <MarkdownView codeBlocks>{children}</MarkdownView>
    </CollapsibleContent>
  );
}

export { useReasoningCollapsible, ReasoningCollapsible, ReasoningCollapsibleTrigger, ReasoningCollapsibleContent };
export type { ReasoningCollapsibleProps };
