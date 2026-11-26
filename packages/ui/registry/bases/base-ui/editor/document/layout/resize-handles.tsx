'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { WIDTH_MIN, WIDTH_STEP, type LayoutAlign } from '@zeroxsolutions/editor-core/template/layout/index';
import type { LayoutWords } from './layout-words';

/** A side of a block a width handle sits on, in the reading direction. */
export type ResizeSide = 'start' | 'end';

export interface ResizeOptions {
  /** The block's stored width as a fraction of its container, `1` for a block that sets none; never the preview. */
  value: number;
  /** Each width a drag passes through, snapped; the view draws it, and the document is left as it was. */
  onPreview(width: number): void;
  /** The width a drag or a key ends on, once: the one change the document takes. */
  onCommit(width: number): void;
  /** A drag ended where it began, or by Escape: the view draws `value` again. */
  onCancel(): void;
  /** The narrowest width; `WIDTH_MIN` when absent. */
  min?: number;
  /** The step a width snaps to and an arrow key moves by; `WIDTH_STEP` when absent. */
  step?: number;
  /** How the block sits in its container: a centred block grows on both sides as one edge is dragged. */
  align?: LayoutAlign;
}

interface Drag {
  readonly side: ResizeSide;
  readonly pointerId: number;
  readonly handle: HTMLElement;
  readonly startX: number;
  /** The width the drag began at. */
  readonly start: number;
  /** The pixels one whole width is drawn at. */
  readonly base: number;
  /** Which way a pointer moving right grows the block, by side, direction and alignment. */
  readonly grows: number;
  current: number;
}

/** `fraction` rounded to `step` and held within `[min, 1]`, free of the float error a sum of steps carries. */
function snapped(fraction: number, min: number, step: number): number {
  const stepped = Number((Math.round(fraction / step) * step).toFixed(4));
  return Math.min(1, Math.max(min, stepped));
}

/**
 * The pixels a whole width is drawn at for the box a handle sits in: its container's width, or less where the
 * sheet caps it through `--layout-container`, as the email editor does at the card's content width.
 */
function baseOf(box: HTMLElement): number {
  const container = box.parentElement?.getBoundingClientRect().width ?? box.getBoundingClientRect().width;
  const capped = Number.parseFloat(getComputedStyle(box).getPropertyValue('--layout-container'));
  return Number.isFinite(capped) && capped > 0 ? Math.min(capped, container) : container;
}

const KEY_STEPS: Readonly<Record<string, (value: number, step: number, min: number) => number>> = {
  ArrowRight: (value, step) => value + step,
  ArrowUp: (value, step) => value + step,
  ArrowLeft: (value, step) => value - step,
  ArrowDown: (value, step) => value - step,
  Home: (_value, _step, min) => min,
  End: () => 1,
};

/**
 * The drag and the keys of a block's width handles. A pointer of any kind (a mouse, a pen, a finger) drags a
 * handle; each move previews, the release commits once, and Escape mid-drag cancels. On a focused handle the arrow
 * keys step the width by `step`, Home and End take it to the least and the whole, each committing at once.
 */
export function useResize({
  value,
  onPreview,
  onCommit,
  onCancel,
  min = WIDTH_MIN,
  step = WIDTH_STEP,
  align = 'start',
}: ResizeOptions): {
  /** The width a drag is at, or `value` while none is. */
  current: number;
  dragging: boolean;
  pointerDown(side: ResizeSide, event: PointerEvent<HTMLElement>): void;
  pointerMove(event: PointerEvent<HTMLElement>): void;
  pointerUp(event: PointerEvent<HTMLElement>): void;
  keyDown(event: KeyboardEvent<HTMLElement>): void;
} {
  const drag = useRef<Drag | null>(null);
  const [current, setCurrent] = useState<number | null>(null);
  // The latest callbacks, so a drag in flight calls the view's current ones.
  const latest = useRef({ onPreview, onCommit, onCancel });
  latest.current = { onPreview, onCommit, onCancel };

  const end = (commit: boolean): void => {
    const ended = drag.current;
    if (!ended) return;
    drag.current = null;
    setCurrent(null);
    if (ended.handle.hasPointerCapture(ended.pointerId)) ended.handle.releasePointerCapture(ended.pointerId);
    if (commit && ended.current !== ended.start) latest.current.onCommit(ended.current);
    else latest.current.onCancel();
  };

  const dragging = current !== null;
  useEffect(() => {
    if (!dragging) return;
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // The editor and any popover open around the block would take Escape too.
      event.preventDefault();
      event.stopPropagation();
      end(false);
    };
    window.addEventListener('keydown', escape, true);
    return () => window.removeEventListener('keydown', escape, true);
  });

  return {
    current: current ?? value,
    dragging,
    pointerDown(side, event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const handle = event.currentTarget;
      const box = handle.parentElement;
      if (!box) return;
      // The engine would take the press as the start of a selection or of the block's own drag.
      event.preventDefault();
      event.stopPropagation();
      handle.focus({ preventScroll: true });
      handle.setPointerCapture(event.pointerId);
      const rtl = getComputedStyle(box).direction === 'rtl' ? -1 : 1;
      drag.current = {
        side,
        pointerId: event.pointerId,
        handle,
        startX: event.clientX,
        start: value,
        base: baseOf(box),
        grows: (side === 'end' ? 1 : -1) * rtl * (align === 'center' ? 2 : 1),
        current: value,
      };
      setCurrent(value);
    },
    pointerMove(event) {
      const moving = drag.current;
      if (!moving || event.pointerId !== moving.pointerId || moving.base <= 0) return;
      const width = snapped(moving.start + ((event.clientX - moving.startX) * moving.grows) / moving.base, min, step);
      if (width === moving.current) return;
      moving.current = width;
      setCurrent(width);
      latest.current.onPreview(width);
    },
    pointerUp(event) {
      if (drag.current?.pointerId === event.pointerId) end(event.type === 'pointerup');
    },
    keyDown(event) {
      const next = KEY_STEPS[event.key];
      if (!next || drag.current) return;
      event.preventDefault();
      event.stopPropagation();
      const width = snapped(next(value, step, min), min, step);
      if (width !== value) latest.current.onCommit(width);
    },
  };
}

export interface ResizeHandlesProps extends ResizeOptions {
  words: LayoutWords;
}

/**
 * A width handle on each side of a block, drawn inside the block's box, which is positioned and holds them as its
 * own children: each a `role="slider"` reading the width in percent, dragged by any pointer or stepped by the keys
 * `useResize` names. The preview is the view's to draw from `onPreview`, as a `--layout-width`; the document changes
 * once, on `onCommit`.
 */
export function ResizeHandles({ words, ...options }: ResizeHandlesProps): ReactNode {
  const resize = useResize(options);
  const percent = Math.round(resize.current * 100);
  return (['start', 'end'] as const).map((side) => (
    <div
      key={side}
      role="slider"
      tabIndex={0}
      contentEditable={false}
      aria-label={words.resizeEdges[side]}
      aria-orientation="horizontal"
      aria-valuemin={Math.round((options.min ?? WIDTH_MIN) * 100)}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={words.resize(percent)}
      data-slot="resize-handle"
      data-side={side}
      data-dragging={resize.dragging || undefined}
      className="cn-editor-handle absolute top-1/2 z-10 -translate-y-1/2 cursor-ew-resize touch-none outline-none select-none after:absolute after:-inset-x-3 after:-inset-y-2 data-[side=end]:end-1 data-[side=start]:start-1"
      onPointerDown={(event) => resize.pointerDown(side, event)}
      onPointerMove={resize.pointerMove}
      onPointerUp={resize.pointerUp}
      onPointerCancel={resize.pointerUp}
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={resize.keyDown}
    />
  ));
}
