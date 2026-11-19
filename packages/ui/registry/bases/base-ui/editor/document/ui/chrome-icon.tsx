'use client';

import { isValidElement, useRef } from 'react';
import type { ComponentType, ReactNode, Ref } from 'react';
import {
  useAnimatedActive,
  usePlayWhile,
  type AnimatedIconHandle,
  type AnimatedIconHandlers,
} from '@/registry/bases/base-ui/hooks/use-animated-icon';

export type { AnimatedIconHandle };

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

/**
 * The size a menu or toolbar icon had as an element with `size-4`. The wrapper span
 * carries `size-4`, and the svg inside it is held to the same by `!`, because a
 * control's own rule (a Toggle's `svg:not([class*='size-'])`) would otherwise size it.
 */
export const CHROME_ICON_CLASS = 'size-4 [&_svg]:size-4!';

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
  usePlayWhile(handle, active, { playOnFirstDraw: true });

  if (icon == null || typeof icon === 'boolean') return null;
  if (isComponent(icon)) {
    const Icon = icon;
    return <Icon ref={handle} aria-hidden className={className} />;
  }
  return icon as ReactNode;
}

export type ChromeActiveHandlers = AnimatedIconHandlers;

/** The pointer-over and focus of one control, as the `active` of the icon inside it. */
export const useChromeActive = useAnimatedActive;

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
