'use client';

import { isValidElement, useEffect, useRef, useState } from 'react';
import type { ComponentType, FocusEvent, PointerEvent, ReactNode, Ref } from 'react';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/** What every animated icon exposes, so the chrome around it can play it. */
export interface AnimatedIconHandle {
  startAnimation(): void;
  stopAnimation(): void;
}

/** An animated icon component: a ref to its handle, and nothing else the chrome needs from it. */
export type AnimatedIconComponent = ComponentType<{
  className?: string;
  'aria-hidden'?: boolean;
  ref?: Ref<AnimatedIconHandle>;
}>;

// A function component or a forwardRef / memo object; an element or text is neither.
function isComponent(icon: unknown): icon is AnimatedIconComponent {
  return (
    typeof icon === 'function' ||
    (typeof icon === 'object' && icon !== null && !isValidElement(icon) && '$$typeof' in icon)
  );
}

export interface ChromeIconProps {
  /** An animated icon component, or any node, which renders as given. */
  icon: unknown;
  className?: string;
  /** True while the item holds the pointer, the focus or the menu's highlight. */
  active: boolean;
}

/**
 * The icon of a menu row or a toolbar button. A component renders with a ref and
 * plays while `active` is true; a node is the feature's own markup and renders
 * as given.
 */
export function ChromeIcon({ icon, className, active }: ChromeIconProps): ReactNode {
  const handle = useRef<AnimatedIconHandle>(null);
  const was = useRef(false);
  useEffect(() => {
    if (active === was.current) return;
    was.current = active;
    if (active) handle.current?.startAnimation();
    else handle.current?.stopAnimation();
  }, [active]);

  if (icon == null || typeof icon === 'boolean') return null;
  if (isComponent(icon)) {
    const Icon = icon;
    return <Icon ref={handle} aria-hidden className={cn(className)} />;
  }
  return icon as ReactNode;
}

export interface ChromeActiveHandlers {
  onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
}

/** The pointer-over and focus of one control, as the `active` of the icon inside it. */
export function useChromeActive(): { active: boolean; handlers: ChromeActiveHandlers } {
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

export interface ChromeControlProps {
  icon: unknown;
  /** Rendered in place of the icon when the item has none. */
  fallback?: ReactNode;
  iconClassName?: string;
  /** Renders the control with the handlers that start its icon, and the icon as children. */
  render: (props: ChromeActiveHandlers & { children: ReactNode }) => ReactNode;
}

/** A control whose icon starts on pointer enter and focus and stops on leave and blur. */
export function ChromeControl({ icon, fallback, iconClassName, render }: ChromeControlProps): ReactNode {
  const { active, handlers } = useChromeActive();
  const node = icon == null ? fallback : <ChromeIcon icon={icon} className={iconClassName} active={active} />;
  return render({ ...handlers, children: node });
}
