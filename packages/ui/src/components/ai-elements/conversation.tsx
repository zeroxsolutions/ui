/**
 * Conversation — a chat scroll surface: a Base UI `ScrollArea` with the styled
 * overlay scrollbar + auto-pin-to-bottom-while-streaming + a floating "jump to
 * bottom" button. The Base-UI-chromed counterpart of AI Elements' `Conversation`
 * (the AI Elements version scrolls a native `overflow` element with the browser's
 * default thumb; this rides the design system's thin overlay `ScrollArea` and
 * fills any bounded parent via `h-full`, so it drops into a plain-block parent —
 * e.g. a docked panel — without a `flex-1` collapse pushing the composer out).
 *
 * `ScrollArea` renders a Root + nested Viewport; the Viewport is the actual
 * scrollable element. `useStickToBottom` resolves it via `viewportFinder` so the
 * scroll listeners attach to the right node.
 *
 *   <Conversation enabled={isStreaming}>
 *     <ConversationContent>{messages}</ConversationContent>
 *     <ConversationScrollButton />
 *   </Conversation>
 *
 * `ConversationContent` adds the inner padding + flex column;
 * `ConversationScrollButton` renders the floating arrow only when the user has
 * scrolled away from the bottom — clicking snaps back.
 */
import {
  createContext,
  useCallback,
  useContext,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { ArrowDown } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useStickToBottom,
  type ViewportFinder,
} from '@/hooks/use-stick-to-bottom';

interface ConversationContextValue {
  isAtBottom: boolean;
  scrollToBottom: () => void;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

const findScrollAreaViewport: ViewportFinder = (root) =>
  root.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');

// Inherit from ScrollArea's prop shape rather than the broader
// `HTMLAttributes<HTMLDivElement>` so the spread below stays
// assignment-compatible with Base UI's narrower ScrollAreaProps.
export type ConversationProps = ComponentProps<typeof ScrollArea> & {
  /** When true, new content auto-scrolls to bottom (pin while streaming). */
  enabled?: boolean;
  children: ReactNode;
};

export function Conversation({
  enabled,
  className,
  children,
  ...props
}: ConversationProps) {
  const sticky = useStickToBottom({
    enabled,
    viewportFinder: findScrollAreaViewport,
  });

  // ScrollArea forwards ref to the Root element; useStickToBottom's
  // viewportFinder navigates from there to the inner Viewport.
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      sticky.ref.current = el;
    },
    [sticky.ref],
  );

  return (
    <ConversationContext.Provider
      value={{
        isAtBottom: sticky.isAtBottom,
        scrollToBottom: sticky.scrollToBottom,
      }}
    >
      {/* No content-child width/display override here. The earlier
       *  `[&>[data-slot=scroll-area-viewport]>div]:block!` hack existed for
       *  Radix's `display:table` viewport content-wrapper; Base UI's ScrollArea
       *  renders children straight into the Viewport (no wrapper), so that
       *  selector would land on `ConversationContent` itself and force its
       *  flex column to `block` — silently killing the message `gap`. The
       *  content child is block-level and already fills the viewport width;
       *  wide content is clamped by the message parts themselves. */}
      <ScrollArea
        ref={setRef}
        role="log"
        className={cn('relative h-full w-full', className)}
        {...props}
      >
        {children}
      </ScrollArea>
    </ConversationContext.Provider>
  );
}

export function ConversationContent({
  className,
  ...props
}: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-3 p-3', className)} {...props} />;
}

export function ConversationScrollButton({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  const ctx = useContext(ConversationContext);
  if (!ctx || ctx.isAtBottom) return null;
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={ctx.scrollToBottom}
      aria-label="Scroll to bottom"
      className={cn(
        'absolute bottom-3 left-1/2 size-8 -translate-x-1/2 rounded-full bg-background/80 shadow-sm backdrop-blur',
        className,
      )}
      {...props}
    >
      <ArrowDown />
    </Button>
  );
}
