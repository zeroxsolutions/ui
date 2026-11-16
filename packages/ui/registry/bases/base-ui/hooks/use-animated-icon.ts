import { useEffect, useRef, useState } from 'react';
import type { FocusEvent, PointerEvent, RefObject } from 'react';

/** What every animated icon exposes through its ref. */
export interface AnimatedIconHandle {
  startAnimation(): void;
  stopAnimation(): void;
}

export interface AnimatedIconHandlers {
  onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
}

/**
 * Whether a control holds the pointer or the focus, and the handlers that track it. Pointer and focus
 * are one state, so a menu item that takes focus as the pointer enters it reports one change.
 */
export function useAnimatedActive(): { active: boolean; handlers: AnimatedIconHandlers } {
  const [over, setOver] = useState(false);
  const [focused, setFocused] = useState(false);
  return {
    active: over || focused,
    handlers: {
      onPointerEnter: () => setOver(true),
      onPointerLeave: () => setOver(false),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    },
  };
}

/**
 * Starts the icon when `active` turns true after the first render and stops it when it turns false. A
 * first render is a state the reader did not cause, so one that is already active starts nothing, and
 * the icon waits for the flip. A control the reader has just acted on, such as a menu row highlighted
 * as the menu opens, passes `playOnFirstDraw` so that an active first render starts it.
 */
export function usePlayWhile(
  icon: RefObject<AnimatedIconHandle | null>,
  active: boolean,
  { playOnFirstDraw = false }: { playOnFirstDraw?: boolean } = {},
): void {
  const was = useRef(playOnFirstDraw ? false : active);
  useEffect(() => {
    if (active === was.current) return;
    was.current = active;
    if (active) icon.current?.startAnimation();
    else icon.current?.stopAnimation();
  }, [icon, active]);
}

/** The ref a control gives its icon, and the pointer and focus handlers it spreads on itself. */
export function useAnimatedIcon(): { ref: RefObject<AnimatedIconHandle | null>; handlers: AnimatedIconHandlers } {
  const ref = useRef<AnimatedIconHandle>(null);
  const { active, handlers } = useAnimatedActive();
  usePlayWhile(ref, active);
  return { ref, handlers };
}
