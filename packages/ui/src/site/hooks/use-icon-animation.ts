import { useRef, type RefObject } from 'react';

/** What one of the registry's animated icons exposes through its ref. */
interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface IconAnimation<Handle extends AnimatedIconHandle> {
  /** Goes on the icon. */
  ref: RefObject<Handle | null>;
  /** Go on the control around the icon: its hover and focus play the icon, leaving either stops it. */
  handlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: () => void;
  };
}

/** Plays an animated icon while the control holding it is hovered or focused, never on its own. */
export function useIconAnimation<Handle extends AnimatedIconHandle>(): IconAnimation<Handle> {
  const ref = useRef<Handle>(null);
  const start = (): void => ref.current?.startAnimation();
  const stop = (): void => ref.current?.stopAnimation();
  return { ref, handlers: { onMouseEnter: start, onMouseLeave: stop, onFocus: start, onBlur: stop } };
}
