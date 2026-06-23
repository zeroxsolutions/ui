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
} from '@/components/ui/collapsible';
import { MarkdownView } from '@/components/markdown-view';
import { cn } from '@/lib/utils';

/**
 * Reasoning — a thinking / reasoning disclosure built on the SDK `Collapsible`
 * with a muted-trigger language. Auto-opens while the agent is streaming its
 * reasoning, then auto-collapses ~1s after the stream ends; the trigger reads
 * "Thinking…" (pulsing) → "Thought for N seconds".
 *
 * Open state is plain local state (the host never drives it from outside); the
 * live cue is `animate-pulse`. Presentational — `isStreaming` in, content as a
 * markdown string. Compose the parts:
 *
 *   <Reasoning isStreaming={isLive}>
 *     <ReasoningTrigger />
 *     <ReasoningContent>{text}</ReasoningContent>
 *   </Reasoning>
 */
const AUTO_CLOSE_DELAY = 1000;
const MS_IN_S = 1000;

interface ReasoningContextValue {
  isStreaming: boolean;
  isOpen: boolean;
  duration: number | undefined;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

function useReasoning(): ReasoningContextValue {
  const ctx = useContext(ReasoningContext);
  if (!ctx) throw new Error('Reasoning parts must be used within <Reasoning>');
  return ctx;
}

export interface ReasoningProps {
  isStreaming?: boolean;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}

export function Reasoning({
  isStreaming = false,
  defaultOpen,
  className,
  children,
}: ReasoningProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? isStreaming);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const startRef = useRef<number | null>(null);
  const everStreamedRef = useRef(isStreaming);
  const autoClosedRef = useRef(false);

  // Track stream start → compute elapsed seconds when it ends.
  useEffect(() => {
    if (isStreaming) {
      everStreamedRef.current = true;
      if (startRef.current === null) startRef.current = Date.now();
    } else if (startRef.current !== null) {
      setDuration(Math.ceil((Date.now() - startRef.current) / MS_IN_S));
      startRef.current = null;
    }
  }, [isStreaming]);

  // Auto-open while streaming (unless the caller pinned it closed).
  useEffect(() => {
    if (isStreaming && !isOpen && defaultOpen !== false) setIsOpen(true);
  }, [isStreaming, isOpen, defaultOpen]);

  // Auto-close once, shortly after streaming ends, so old thoughts tuck away.
  useEffect(() => {
    if (everStreamedRef.current && !isStreaming && isOpen && !autoClosedRef.current) {
      const t = setTimeout(() => {
        setIsOpen(false);
        autoClosedRef.current = true;
      }, AUTO_CLOSE_DELAY);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isStreaming, isOpen]);

  return (
    <ReasoningContext.Provider value={{ isStreaming, isOpen, duration }}>
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

function thinkingLabel(isStreaming: boolean, duration: number | undefined): string {
  if (isStreaming || duration === 0) return 'Thinking…';
  if (duration === undefined) return 'Thought for a few seconds';
  return `Thought for ${duration} second${duration === 1 ? '' : 's'}`;
}

export function ReasoningTrigger({ className }: { className?: string }) {
  const { isStreaming, isOpen, duration } = useReasoning();
  const live = isStreaming || duration === 0;
  return (
    <CollapsibleTrigger
      className={cn(
        'flex w-full items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
    >
      <Brain className="size-4 shrink-0" />
      <span className={cn('min-w-0 flex-1 truncate text-left', live && 'animate-pulse')}>
        {thinkingLabel(isStreaming, duration)}
      </span>
      <ChevronDown
        className={cn('size-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
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
    <CollapsibleContent className={cn('mt-2 text-sm text-muted-foreground', className)}>
      <MarkdownView codeBlocks>{children}</MarkdownView>
    </CollapsibleContent>
  );
}
