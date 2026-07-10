'use client';

import {
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

/** A viewport-space rectangle the shell anchors to (a caret or selection rect). */
export interface FloatingAnchor {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface FloatingShellProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'children'> {
  /** Render nothing when closed. */
  open: boolean;
  /** The rect to anchor against; the shell clamps/flips to stay in the viewport. */
  anchor: FloatingAnchor | null;
  /** Preferred side relative to the anchor; flips when there is no room. */
  side?: 'top' | 'bottom';
  /** Bump when the content size changes (e.g. a filtered list) to re-measure. */
  contentKey?: unknown;
  children: ReactNode;
}

const MARGIN = 8;
const GAP = 4;

/**
 * The one **sanctioned bespoke** floating surface for the editor's caret/selection
 * menus (rule `ui-from-design-system`): a `position: fixed`, non-focus-owning panel.
 * The slash/bubble menus must NOT take focus — the editor owns the caret and the
 * `/query` is typed into the document — and they anchor to a **coordinate rect**,
 * not a DOM trigger, so a design-system `Popover` (which manages focus and anchors
 * to an element) cannot express them. This shell owns the viewport clamp/flip
 * **once** and carries the design-system surface tokens **once**, so no menu
 * re-declares the popover look; everything rendered *inside* it is a design-system
 * component.
 */
export function FloatingShell({
  open,
  anchor,
  side = 'bottom',
  contentKey,
  className,
  children,
  ...rest
}: FloatingShellProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Measured after layout (before paint), so the corrected position never flashes.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!open || !anchor || !el) return;
    const { width, height } = el.getBoundingClientRect();
    let left = anchor.left;
    if (left + width > window.innerWidth - MARGIN) {
      left = window.innerWidth - width - MARGIN;
    }
    if (left < MARGIN) left = MARGIN;

    let top: number;
    if (side === 'top') {
      const above = anchor.top - height - GAP;
      top =
        above >= MARGIN
          ? above
          : Math.max(MARGIN, Math.min(anchor.bottom + GAP, window.innerHeight - height - MARGIN));
    } else {
      top = anchor.bottom + GAP;
      if (top + height > window.innerHeight - MARGIN) {
        const above = anchor.top - height - GAP;
        top = above >= MARGIN ? above : Math.max(MARGIN, window.innerHeight - height - MARGIN);
      }
    }
    setPos((prev) => (prev && prev.top === top && prev.left === left ? prev : { top, left }));
  }, [open, anchor, side, contentKey]);

  if (!open || !anchor) return null;

  const fallbackTop = side === 'top' ? anchor.top : anchor.bottom + GAP;
  return (
    <div
      ref={ref}
      className={[
        'fixed z-50 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md animate-in fade-in slide-in-from-top-1',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ top: pos?.top ?? fallbackTop, left: pos?.left ?? anchor.left }}
      {...rest}
    >
      {children}
    </div>
  );
}
