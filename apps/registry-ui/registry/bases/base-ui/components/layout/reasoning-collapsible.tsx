import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';

import { BrainIcon, type BrainIconHandle } from '@/registry/bases/base-ui/ui/brain';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { ChevronDownIcon, type ChevronDownIconHandle } from '@/registry/bases/base-ui/ui/chevron-down';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import { ReasoningCollapsibleContext } from '@/registry/bases/base-ui/hooks/use-reasoning-collapsible';
import { cn } from '@/registry/bases/base-ui/lib/utils';

const AUTO_CLOSE_DELAY = 1000;
const MS_IN_S = 1000;

interface ReasoningCollapsibleProps extends Omit<ComponentProps<typeof Collapsible>, 'open' | 'defaultOpen'> {
  streaming?: boolean;
  /** The initial open state; defaults to `streaming`. `false` also keeps a stream from opening it. */
  defaultOpen?: boolean;
}

/**
 * ReasoningCollapsible - a thinking / reasoning disclosure. It opens while
 * `streaming` is true, closes itself once about a second after the stream
 * ends, and carries `data-streaming` on the root meanwhile. The label and the
 * body are the consumer's; `useReasoningCollapsible` (`hooks/use-reasoning-collapsible`) hands the label its
 * timing:
 *
 *   function ReasoningLabel() {
 *     const { streaming, duration } = useReasoningCollapsible();
 *     return streaming ? 'Thinking...' : `Thought for ${duration ?? 'a few'} seconds`;
 *   }
 *
 *   <ReasoningCollapsible streaming={isLive}>
 *     <ReasoningCollapsibleTrigger><ReasoningLabel /></ReasoningCollapsibleTrigger>
 *     <ReasoningCollapsibleContent><MarkdownView>{text}</MarkdownView></ReasoningCollapsibleContent>
 *   </ReasoningCollapsible>
 */
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

/**
 * The toggle row, a full-width ghost button; its children are the label, which
 * pulses while the root is streaming. Its brain and chevron play while the row
 * is hovered or focused, and the chevron turns over while the body is open.
 */
function ReasoningCollapsibleTrigger({
  className,
  children,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: ComponentProps<typeof CollapsibleTrigger>): ReactNode {
  const brainRef = useRef<BrainIconHandle>(null);
  const chevronRef = useRef<ChevronDownIconHandle>(null);
  const play = (): void => {
    brainRef.current?.startAnimation();
    chevronRef.current?.startAnimation();
  };
  const stop = (): void => {
    brainRef.current?.stopAnimation();
    chevronRef.current?.stopAnimation();
  };
  return (
    <CollapsibleTrigger
      data-slot="reasoning-collapsible-trigger"
      render={<Button variant="ghost" size="sm" />}
      className={cn('group/reasoning-collapsible-trigger w-full justify-start', className)}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        play();
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        stop();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        play();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        stop();
      }}
      {...props}
    >
      <BrainIcon ref={brainRef} aria-hidden />
      <span className="min-w-0 flex-1 truncate text-left group-data-streaming/reasoning-collapsible:motion-safe:animate-pulse">
        {children}
      </span>
      <ChevronDownIcon
        ref={chevronRef}
        aria-hidden
        className="group-aria-expanded/reasoning-collapsible-trigger:rotate-180 motion-safe:transition-transform"
      />
    </CollapsibleTrigger>
  );
}

/** The reasoning body, in muted text under the trigger; unmounted while closed. */
function ReasoningCollapsibleContent({
  className,
  children,
  ...props
}: ComponentProps<typeof CollapsibleContent>): ReactNode {
  return (
    <CollapsibleContent data-slot="reasoning-collapsible-content" className={cn('mt-2', className)} {...props}>
      <div className="text-muted-foreground text-sm">{children}</div>
    </CollapsibleContent>
  );
}

export { ReasoningCollapsible, ReasoningCollapsibleTrigger, ReasoningCollapsibleContent };
export type { ReasoningCollapsibleProps };
