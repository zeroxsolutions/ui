import { useRef, type ComponentProps, type ReactNode } from 'react';
import {
  Platform,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type KeyDownEvent,
  type ViewStyle,
} from 'react-native';
import { useFocusVisible } from '../../lib/focus-visible';
import { shouldStartDrag } from '../../lib/resize-drag';
import { cn } from '../../lib/utils';

/** The longest gap, in ms, between two taps that make a double tap. */
const DOUBLE_TAP_MS = 300;

/** How wide, in px, the handle takes a touch on a device, as Resizable's handle does. */
const DEVICE_TARGET = 20;

/** How wide, in px, the handle takes the pointer on the web, as the web item's widened area does. */
const WEB_TARGET = 4;

/** The line's own width, `w-px`. */
const LINE = 1;

type ResizeHandleProps = ComponentProps<typeof View> & {
  /** Width delta in px since the last move or adjustment; apply it to the panel's size. */
  onDrag: (dx: number) => void;
  /** Called on a double tap and on Enter, such as to collapse or open the panel. */
  onToggle: () => void;
  /** The panel's current width in px, announced as the handle's value. */
  value: number;
  /** The narrowest width the caller allows, announced as the handle's minimum. */
  min?: number;
  /** The widest width the caller allows, announced as the handle's maximum. */
  max?: number;
  /** Pixels one arrow press or one screen-reader adjustment resizes by; 10 when omitted. */
  step?: number;
};

/** Where a drag stands: where the finger went down, where it last reported, and whether it has passed the threshold. */
interface Drag {
  down: number;
  last: number;
  dragging: boolean;
}

/**
 * A vertical resize grip for a panel outside any `ResizablePanelGroup`, a floating or overlaid panel whose
 * width the caller owns; panes that share a row compose Resizable instead. A drag reports its width deltas
 * through `onDrag` once the finger has moved 4px, so a tap never resizes, and a scrolling parent cannot take
 * the touch while it lasts. A double tap calls `onToggle`. It is announced as adjustable, valued at `value`, and a
 * screen reader's swipe up or down resizes by `step`. On the web it is a focusable separator: the Left and Right
 * arrows resize by `step` and Enter calls `onToggle`; a caller's `onKeyDown` runs first, and calling
 * `preventDefault` in it skips the key's action.
 */
function ResizeHandle({
  onDrag,
  onToggle,
  value,
  min,
  max,
  step = 10,
  className,
  style,
  onKeyDown,
  onFocus,
  onBlur,
  ...props
}: ResizeHandleProps): ReactNode {
  const drag = useRef<Drag | undefined>(undefined);
  const lastTap = useRef(0);
  const { focusVisible, onFocus: focusVisibleOnFocus, onBlur: focusVisibleOnBlur } = useFocusVisible();
  const web = Platform.OS === 'web';
  const extra = ((web ? WEB_TARGET : DEVICE_TARGET) - LINE) / 2;

  const onResponderGrant = (event: GestureResponderEvent): boolean => {
    const x = event.nativeEvent.pageX;
    drag.current = { down: x, last: x, dragging: false };
    // True keeps a scrolling parent from taking the touch from the handle.
    return true;
  };

  const onResponderMove = (event: GestureResponderEvent): void => {
    const held = drag.current;
    if (held === undefined) return;
    // The page position, not one inside the handle, which moves with the panel under the finger.
    const x = event.nativeEvent.pageX;
    if (!held.dragging) {
      if (!shouldStartDrag(held.down, x)) return;
      held.dragging = true;
      held.last = x;
    }
    const dx = x - held.last;
    held.last = x;
    if (dx !== 0) onDrag(dx);
  };

  const onResponderRelease = (event: GestureResponderEvent): void => {
    const held = drag.current;
    drag.current = undefined;
    if (held === undefined || held.dragging) return;
    const now = event.nativeEvent.timestamp;
    if (now - lastTap.current <= DOUBLE_TAP_MS) {
      lastTap.current = 0;
      onToggle();
    } else {
      lastTap.current = now;
    }
  };

  const handleKeyDown = (event: KeyDownEvent): void => {
    onKeyDown?.(event);
    if (event.isDefaultPrevented()) return;
    const { key } = event.nativeEvent;
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault();
      onDrag(key === 'ArrowRight' ? step : -step);
    } else if (key === 'Enter') {
      event.preventDefault();
      onToggle();
    }
  };

  const role = web
    ? ({ role: 'separator', 'aria-orientation': 'vertical' } as const)
    : ({ accessibilityRole: 'adjustable' } as const);

  return (
    <View
      accessible
      focusable
      {...role}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      // Without a text iOS reads the value as a share of the range, which is not the panel's width.
      aria-valuetext={web ? undefined : String(Math.round(value))}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event: AccessibilityActionEvent) => {
        if (event.nativeEvent.actionName === 'increment') onDrag(step);
        if (event.nativeEvent.actionName === 'decrement') onDrag(-step);
      }}
      hitSlop={web ? undefined : { left: extra, right: extra }}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onResponderGrant}
      onResponderMove={onResponderMove}
      onResponderRelease={onResponderRelease}
      onResponderTerminate={() => {
        drag.current = undefined;
      }}
      onKeyDown={handleKeyDown}
      onFocus={(event) => {
        focusVisibleOnFocus(event);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focusVisibleOnBlur();
        onBlur?.(event);
      }}
      className={cn(
        'relative w-px shrink-0 items-center justify-center bg-border',
        focusVisible && 'ring-1 ring-ring',
        className,
      )}
      // React Native Web reads these values, which React Native's style type does not list: a drag on the handle
      // would otherwise pan the page, and a press draw the focus outline over the ring the handle draws itself.
      style={[
        web
          ? ({ touchAction: 'none', outlineWidth: 0, cursor: 'col-resize' as ViewStyle['cursor'] } as ViewStyle)
          : undefined,
        style,
      ]}
      {...props}
    >
      {web ? <View style={{ position: 'absolute', top: 0, bottom: 0, left: -extra, right: -extra }} /> : null}
      <View className="bg-border z-10 h-6 w-1 shrink-0 rounded-lg" />
    </View>
  );
}

export { ResizeHandle };
export type { ResizeHandleProps };
