import {
  useCallback,
  useRef,
  type ComponentProps,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { shouldStartDrag } from '@/registry/bases/base-ui/lib/resize-drag';

// `onDrag` below is a resize-width delta, not the native HTML5 drag event - omit
// the native handler so its signature does not clash with ours.
interface ResizeHandleProps extends Omit<ComponentProps<'div'>, 'onDrag'> {
  /** Width delta in px since the last move; apply it to the panel size. */
  onDrag: (dx: number) => void;
  /** Double-click action (e.g. collapse/expand the panel). */
  onToggle: () => void;
}

/**
 * A vertical resize grip for a side or floating panel, drawn as upstream's
 * `ResizableHandle` with its handle, for a panel that sits outside a
 * `ResizablePanelGroup`. Stable by design: a
 * resize only begins once the pointer crosses a small movement threshold, so a
 * click, jitter, or double-click never nudges the width. Uses pointer capture so
 * the drag survives the pointer leaving the 1px line, and `preventDefault` +
 * `touch-action: none` so it never steals focus or selects text. Double-click
 * fires `onToggle` (e.g. collapse/expand the panel). A caller's own
 * `onPointerDown`, `onPointerMove` or `onDoubleClick` runs first, and calling
 * `event.preventDefault()` in it skips the matching own action (arming,
 * reporting the drag delta, or toggling). The `onPointerUp` / `onPointerCancel`
 * / `onLostPointerCapture` cleanup always ends the drag after the caller's
 * handler runs, whatever it does - skipping it there would strand the drag
 * armed once the pointer is gone.
 */
function ResizeHandle({
  onDrag,
  onToggle,
  className,
  onPointerDown: onPointerDownProp,
  onPointerMove: onPointerMoveProp,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  onDoubleClick,
  ...props
}: ResizeHandleProps): ReactNode {
  const downX = useRef(0);
  const lastX = useRef(0);
  const armed = useRef(false);
  const dragging = useRef(false);

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    armed.current = true;
    dragging.current = false;
    downX.current = e.clientX;
    lastX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!armed.current) return;
      if (!dragging.current) {
        // Don't resize until the pointer has moved past the threshold - a click,
        // jitter, or double-click leaves the width untouched.
        if (!shouldStartDrag(downX.current, e.clientX)) return;
        dragging.current = true;
        lastX.current = e.clientX;
      }
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      if (dx !== 0) onDrag(dx);
    },
    [onDrag],
  );

  const end = useCallback(() => {
    armed.current = false;
    dragging.current = false;
  }, []);

  return (
    <div
      data-slot="resize-handle"
      className={cn(
        'bg-border relative flex w-px shrink-0 cursor-col-resize touch-none items-center justify-center select-none after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2',
        className,
      )}
      onPointerDown={(event) => {
        onPointerDownProp?.(event);
        if (!event.defaultPrevented) onPointerDown(event);
      }}
      onPointerMove={(event) => {
        onPointerMoveProp?.(event);
        if (!event.defaultPrevented) onPointerMove(event);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        end();
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        end();
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        end();
      }}
      onDoubleClick={(event) => {
        onDoubleClick?.(event);
        if (!event.defaultPrevented) onToggle();
      }}
      {...props}
    >
      <div className="bg-border z-10 flex h-6 w-1 shrink-0 rounded-lg" />
    </div>
  );
}

export { ResizeHandle };
export type { ResizeHandleProps };
