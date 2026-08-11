import { Brain, ChevronDown } from 'lucide-react';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/registry/bases/base-ui/ui/collapsible';
import { MarkdownView } from '@/registry/bases/base-ui/components/markdown-view';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * Reasoning — a thinking / reasoning disclosure built on the SDK `Collapsible`
 * with a muted-trigger language. Auto-opens while the agent is streaming its
 * reasoning, then auto-collapses ~1s after the stream ends; the trigger reads
 * "Thinking…" (pulsing) → "Thought for N seconds".
 *
 * Open state is plain local state (the host never drives it from outside); the
 * live cue is `animate-pulse`. Presentational — `streaming` in, content as a
 * markdown string. Compose the parts:
 *
 *   <Reasoning streaming={isLive}>
 *     <ReasoningTrigger />
 *     <ReasoningContent>{text}</ReasoningContent>
 *   </Reasoning>
 */
const AUTO_CLOSE_DELAY = 1000;
const MS_IN_S = 1000;

interface ReasoningContextValue {
  streaming: boolean;
  isOpen: boolean;
  duration: number | undefined;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

/**
 * Read the live reasoning state (`streaming`, `isOpen`, `duration`) from inside a
 * `<Reasoning>`. Lets a consumer compute their own trigger label. Throws when
 * used outside `<Reasoning>`.
 */
export function useReasoning(): ReasoningContextValue {
  const ctx = useContext(ReasoningContext);
  if (!ctx) throw new Error('Reasoning parts must be used within <Reasoning>');
  return ctx;
}

export interface ReasoningProps {
  streaming?: boolean;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}

export function Reasoning({
  streaming = false,
  defaultOpen,
  className,
  children,
}: ReasoningProps) {
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
    if (
      everStreamedRef.current &&
      !streaming &&
      isOpen &&
      !autoClosedRef.current
    ) {
      const t = setTimeout(() => {
        setIsOpen(false);
        autoClosedRef.current = true;
      }, AUTO_CLOSE_DELAY);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [streaming, isOpen]);

  return (
    <ReasoningContext.Provider value={{ streaming, isOpen, duration }}>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className={cn('my-2', className)}
      >
        {children}
      </Collapsible>
    </ReasoningContext.Provider>
  );
}

function thinkingLabel(
  streaming: boolean,
  duration: number | undefined,
): string {
  if (streaming || duration === 0) return 'Thinking…';
  if (duration === undefined) return 'Thought for a few seconds';
  return `Thought for ${duration} second${duration === 1 ? '' : 's'}`;
}

export function ReasoningTrigger({
  children,
  className,
}: {
  /** Overrides the computed "Thinking…" / "Thought for N seconds" label. */
  children?: ReactNode;
  className?: string;
}) {
  const { streaming, isOpen, duration } = useReasoning();
  const live = streaming || duration === 0;
  return (
    <CollapsibleTrigger
      className={cn(
        'flex w-full items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
    >
      <Brain className="size-4 shrink-0" />
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-left',
          live && 'animate-pulse',
        )}
      >
        {children ?? thinkingLabel(streaming, duration)}
      </span>
      <ChevronDown
        className={cn(
          'size-4 shrink-0 transition-transform',
          isOpen && 'rotate-180',
        )}
      />
    </CollapsibleTrigger>
  );
}

export function ReasoningContent({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <CollapsibleContent
      className={cn('mt-2 text-sm text-muted-foreground', className)}
    >
      <MarkdownView codeBlocks>{children}</MarkdownView>
    </CollapsibleContent>
  );
}
