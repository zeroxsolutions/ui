'use client';

import { isValidElement, useRef } from 'react';
import type { ComponentType, ReactNode, Ref } from 'react';
import {
  useAnimatedActive,
  usePlayWhile,
  type AnimatedIconHandle,
  type AnimatedIconHandlers,
} from '@/registry/bases/base-ui/hooks/use-animated-icon';
import { cn } from '@/registry/bases/base-ui/lib/utils';

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

export interface ChromeIconProps {
  /** An animated icon component, or any node, which renders as given. */
  icon: unknown;
  className?: string;
  /** True while the item holds the pointer, the focus or the menu's highlight. */
  active: boolean;
  /**
   * Drawn at the style's icon size for a menu row, `menu`, or for a toolbar's toggle, `toolbar`, whatever its
   * control's own rule draws: a small toggle or button would draw it smaller than the style's toggles do. Unset,
   * the control sizes the svg as it sizes a lucide element.
   */
  sized?: ChromeIconSize;
}

/** Where a chrome icon sits, which decides the style's size for it. */
export type ChromeIconSize = 'menu' | 'toolbar';

const SIZE_SLOTS: Record<ChromeIconSize, string> = {
  menu: 'cn-editor-icon',
  toolbar: 'cn-editor-toolbar-icon',
};

/**
 * The icon of a menu row or a toolbar button. A component renders with a ref and
 * plays while `active` is true; a node is the feature's own markup and renders
 * as given.
 */
export function ChromeIcon({ icon, className, active, sized }: ChromeIconProps): ReactNode {
  const handle = useRef<AnimatedIconHandle>(null);
  usePlayWhile(handle, active, { playOnFirstDraw: true });

  if (icon == null || typeof icon === 'boolean') return null;
  if (isComponent(icon)) {
    const Icon = icon;
    return <Icon ref={handle} aria-hidden className={sized ? cn(SIZE_SLOTS[sized], className) : className} />;
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
  /** Draws the icon at the style's size for where it sits, as {@link ChromeIconProps.sized} does. */
  iconSized?: ChromeIconSize;
  /** Renders the control with the handlers that start its icon, and the icon as children. */
  render: (props: ChromeActiveHandlers & { children: ReactNode }) => ReactNode;
}

/** A control whose icon starts on pointer enter and focus and stops on leave and blur. */
export function ChromeControl({ icon, fallback, iconSized, render }: ChromeControlProps): ReactNode {
  const { active, handlers } = useChromeActive();
  const node = icon == null ? fallback : <ChromeIcon icon={icon} sized={iconSized} active={active} />;
  return render({ ...handlers, children: node });
}
