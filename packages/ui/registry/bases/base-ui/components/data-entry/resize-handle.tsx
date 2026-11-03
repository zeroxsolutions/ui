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
  /** Width delta in px since the last move or arrow press; apply it to the panel size. */
  onDrag: (dx: number) => void;
  /** Double-click and Enter action (e.g. collapse/expand the panel). */
  onToggle: () => void;
  /** The panel's current width in px, reported as the separator's value. */
  value: number;
  /** The narrowest width the caller allows, reported as the separator's minimum. */
  min?: number;
  /** The widest width the caller allows, reported as the separator's maximum. */
  max?: number;
  /** Pixels one Left or Right arrow press resizes by; 10 when omitted. */
  step?: number;
}

/**
 * A vertical resize grip for a panel that sits outside any
 * `ResizablePanelGroup` - a floating or overlaid panel whose width the caller
 * owns. Panes that share a row compose upstream instead:
 * `ResizablePanelGroup` > `ResizablePanel` + `ResizableHandle withHandle` +
 * `ResizablePanel` (a `collapsible` panel for the collapse toggle).
 *
 * The recipe is a deliberate fork of upstream's `ResizableHandle` and its
 * handle, because that handle renders a `react-resizable-panels` separator,
 * which throws outside a group. It answers the keyboard as upstream's handle
 * does: a focusable `separator` carrying its orientation and `value`, Left
 * and Right resize by `step`, Enter fires `onToggle`, under upstream's focus
 * ring. Upstream's recipe fixes do not reach it.
 *
 * Stable by design: a resize only begins once the pointer crosses a small
 * movement threshold, so a click, jitter, or double-click never nudges the
 * width. Uses pointer capture so the drag survives the pointer leaving the
 * 1px line, and `preventDefault` + `touch-action: none` so it never steals
 * focus or selects text. Double-click fires `onToggle` (e.g. collapse/expand
 * the panel). A caller's own `onPointerDown`, `onPointerMove` or
 * `onDoubleClick` runs first, and calling `event.preventDefault()` in it skips
 * the matching own action (arming, reporting the drag delta, or toggling). The
 * `onPointerUp` / `onPointerCancel` / `onLostPointerCapture` cleanup always
 * ends the drag after the caller's handler runs, whatever it does - skipping it
 * there would strand the drag armed once the pointer is gone. A caller's own
 * `onKeyDown` runs first too, and `preventDefault()` there skips the key's
 * action.
 */
function ResizeHandle({
  onDrag,
  onToggle,
  value,
  min,
  max,
  step = 10,
  className,
  onPointerDown: onPointerDownProp,
  onPointerMove: onPointerMoveProp,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  onDoubleClick,
  onKeyDown,
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
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      className={cn(
        'bg-border ring-offset-background focus-visible:ring-ring relative flex w-px shrink-0 cursor-col-resize touch-none items-center justify-center select-none after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:outline-hidden',
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
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          onDrag(event.key === 'ArrowRight' ? step : -step);
        } else if (event.key === 'Enter') {
          event.preventDefault();
          onToggle();
        }
      }}
      {...props}
    >
      <div className="bg-border z-10 flex h-6 w-1 shrink-0 rounded-lg" />
    </div>
  );
}

export { ResizeHandle };
export type { ResizeHandleProps };
