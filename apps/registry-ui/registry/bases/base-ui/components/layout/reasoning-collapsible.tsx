import { Brain, ChevronDown } from 'lucide-react';
import { createContext, useContext, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * ReasoningCollapsible - a thinking / reasoning disclosure. It opens while
 * `streaming` is true, closes itself once about a second after the stream
 * ends, and carries `data-streaming` on the root meanwhile. The label and the
 * body are the consumer's; `useReasoningCollapsible` hands the label its
 * timing:
 *
 *   function ReasoningLabel() {
 *     const { streaming, duration } = useReasoningCollapsible();
 *     return streaming ? 'Thinking...' : `Thought for ${duration ?? 'a few'} seconds`;
 *   }
 *
 *   <ReasoningCollapsible streaming={isLive}>
 *     <ReasoningCollapsibleTrigger><ReasoningLabel /></ReasoningCollapsibleTrigger>
 *     <ReasoningCollapsibleContent><MarkdownView codeBlocks>{text}</MarkdownView></ReasoningCollapsibleContent>
 *   </ReasoningCollapsible>
 */
const AUTO_CLOSE_DELAY = 1000;
const MS_IN_S = 1000;

interface ReasoningCollapsibleContextValue {
  streaming: boolean;
  isOpen: boolean;
  /** Whole seconds the last stream lasted, rounded up; undefined until a stream has ended. */
  duration: number | undefined;
}

const ReasoningCollapsibleContext = createContext<ReasoningCollapsibleContextValue | null>(null);

/**
 * Read the live reasoning state (`streaming`, `isOpen`, `duration`) from inside a
 * `<ReasoningCollapsible>`, for example to word the trigger's label. Throws when
 * used outside `<ReasoningCollapsible>`.
 */
function useReasoningCollapsible(): ReasoningCollapsibleContextValue {
  const ctx = useContext(ReasoningCollapsibleContext);
  if (!ctx) throw new Error('ReasoningCollapsible parts must be used within <ReasoningCollapsible>');
  return ctx;
}

interface ReasoningCollapsibleProps extends Omit<ComponentProps<typeof Collapsible>, 'open' | 'defaultOpen'> {
  streaming?: boolean;
  /** The initial open state; defaults to `streaming`. `false` also keeps a stream from opening it. */
  defaultOpen?: boolean;
}

function ReasoningCollapsible({
  streaming = false,
  defaultOpen,
  onOpenChange,
  className,
  ...props
}: ReasoningCollapsibleProps): ReactNode {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? streaming);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const startRef = useRef<number | null>(null);
  const everStreamedRef = useRef(streaming);
  const autoClosedRef = useRef(false);

  useEffect(() => {
    if (streaming) {
      everStreamedRef.current = true;
      if (startRef.current === null) startRef.current = Date.now();
    } else if (startRef.current !== null) {
      setDuration(Math.ceil((Date.now() - startRef.current) / MS_IN_S));
      startRef.current = null;
    }
  }, [streaming]);

  useEffect(() => {
    if (streaming && !isOpen && defaultOpen !== false) setIsOpen(true);
  }, [streaming, isOpen, defaultOpen]);

  // Closes once only, so a reader who reopens old reasoning keeps it open.
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
      <Collapsible
        data-slot="reasoning-collapsible"
        data-streaming={streaming ? '' : undefined}
        open={isOpen}
        onOpenChange={(open, eventDetails) => {
          setIsOpen(open);
          onOpenChange?.(open, eventDetails);
        }}
        className={cn('group/reasoning-collapsible', className)}
        {...props}
      />
    </ReasoningCollapsibleContext.Provider>
  );
}

/** The toggle row; its children are the label, which pulses while the root is streaming. */
function ReasoningCollapsibleTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof CollapsibleTrigger>): ReactNode {
  return (
    <CollapsibleTrigger
      data-slot="reasoning-collapsible-trigger"
      className={cn(
        'group/reasoning-collapsible-trigger text-muted-foreground hover:text-foreground flex w-full items-center gap-2 text-sm transition-colors',
        className,
      )}
      {...props}
    >
      <Brain aria-hidden className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left group-data-streaming/reasoning-collapsible:animate-pulse">
        {children}
      </span>
      <ChevronDown
        aria-hidden
        className="size-4 shrink-0 transition-transform group-aria-expanded/reasoning-collapsible-trigger:rotate-180"
      />
    </CollapsibleTrigger>
  );
}

function ReasoningCollapsibleContent({ className, ...props }: ComponentProps<typeof CollapsibleContent>): ReactNode {
  return (
    <CollapsibleContent
      data-slot="reasoning-collapsible-content"
      className={cn('text-muted-foreground mt-2 text-sm', className)}
      {...props}
    />
  );
}

export { useReasoningCollapsible, ReasoningCollapsible, ReasoningCollapsibleTrigger, ReasoningCollapsibleContent };
export type { ReasoningCollapsibleProps };
