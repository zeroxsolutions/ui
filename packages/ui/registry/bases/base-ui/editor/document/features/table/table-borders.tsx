'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import type { LayoutWords } from '../../layout/layout-words';
import { COLUMN_WIDTH_MIN, COLUMN_WIDTH_STEP, inFourPlaces } from './table-widths';

/** Where border `index` may move between: a twentieth after the border before it, a twentieth before the next. */
function rangeOf(shares: readonly number[], index: number): { at: number; least: number; most: number } {
  const before = shares.slice(0, index).reduce((sum, share) => sum + share, 0);
  const at = before + shares[index];
  return { at, least: before + COLUMN_WIDTH_MIN, most: at + shares[index + 1] - COLUMN_WIDTH_MIN };
}

/** `shares` with border `index` moved to `at`, the columns either side of it resized and the rest kept. */
function movedTo(shares: readonly number[], index: number, at: number): number[] {
  const { least, most } = rangeOf(shares, index);
  const before = least - COLUMN_WIDTH_MIN;
  const after = most + COLUMN_WIDTH_MIN;
  const border = Math.min(most, Math.max(least, at));
  return shares.map((share, column) =>
    inFourPlaces(column === index ? border - before : column === index + 1 ? after - border : share),
  );
}

const snapped = (share: number): number => Math.round(share / COLUMN_WIDTH_STEP) * COLUMN_WIDTH_STEP;
const same = (a: readonly number[], b: readonly number[]): boolean =>
  a.map(inFourPlaces).join() === b.map(inFourPlaces).join();

interface Drag {
  readonly index: number;
  readonly pointerId: number;
  readonly handle: HTMLElement;
  readonly start: readonly number[];
  /** The table's start edge and width, in pixels, as the drag began. */
  readonly edge: number;
  readonly width: number;
  /** 1 where the table reads left to right, -1 where it reads right to left. */
  readonly direction: number;
  current: number[];
}

export interface TableBordersProps {
  /** The drawn table, whose width a whole share is. */
  table: HTMLTableElement | null;
  /** The share of the table each column is drawn at, summing to 1. */
  shares: readonly number[];
  words: LayoutWords;
  /** Each set of widths a drag passes through; null when a drag ends and the view draws `shares` again. */
  onPreview(shares: number[] | null): void;
  /** The widths a drag or a key ends on, once, where they differ from `shares`. */
  onCommit(shares: number[]): void;
}

/**
 * A handle on the border after each column but the last, each a `role="slider"` reading where the border sits in
 * percent of the table. Any pointer drags one, the border snapping to a twentieth of the table and keeping each
 * column at least a twentieth wide; each move previews, the release commits once and Escape cancels. On a focused
 * handle the arrow keys move the border by a twentieth, Home and End as far as it goes. Drawn inside the table's
 * positioned box.
 */
export function TableBorders({ table, shares, words, onPreview, onCommit }: TableBordersProps): ReactNode {
  const drag = useRef<Drag | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const latest = useRef({ onPreview, onCommit });
  latest.current = { onPreview, onCommit };

  const end = (commit: boolean): void => {
    const ended = drag.current;
    if (!ended) return;
    drag.current = null;
    setDragging(null);
    if (ended.handle.hasPointerCapture(ended.pointerId)) ended.handle.releasePointerCapture(ended.pointerId);
    if (commit && !same(ended.current, ended.start)) latest.current.onCommit(ended.current);
    latest.current.onPreview(null);
  };

  useEffect(() => {
    if (dragging === null) return;
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // The editor and the block's toolbar would take Escape too.
      event.preventDefault();
      event.stopPropagation();
      end(false);
    };
    window.addEventListener('keydown', escape, true);
    return () => window.removeEventListener('keydown', escape, true);
  });

  const rtl = () => table !== null && getComputedStyle(table).direction === 'rtl';

  const pointerDown = (index: number, event: PointerEvent<HTMLElement>): void => {
    if (!table || (event.pointerType === 'mouse' && event.button !== 0)) return;
    // The engine would take the press as the start of a cell selection or of the block's own drag.
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;
    handle.focus({ preventScroll: true });
    handle.setPointerCapture(event.pointerId);
    const rect = table.getBoundingClientRect();
    const direction = rtl() ? -1 : 1;
    drag.current = {
      index,
      pointerId: event.pointerId,
      handle,
      start: shares,
      edge: direction === 1 ? rect.left : rect.right,
      width: rect.width,
      direction,
      current: [...shares],
    };
    setDragging(index);
  };

  const pointerMove = (event: PointerEvent<HTMLElement>): void => {
    const moving = drag.current;
    if (!moving || event.pointerId !== moving.pointerId || moving.width <= 0) return;
    const at = snapped(((event.clientX - moving.edge) * moving.direction) / moving.width);
    const next = movedTo(moving.start, moving.index, at);
    if (same(next, moving.current)) return;
    moving.current = next;
    latest.current.onPreview(next);
  };

  const pointerUp = (event: PointerEvent<HTMLElement>): void => {
    if (drag.current?.pointerId === event.pointerId) end(event.type === 'pointerup');
  };

  const keyDown = (index: number, event: KeyboardEvent<HTMLElement>): void => {
    if (drag.current || event.altKey || event.ctrlKey || event.metaKey) return;
    const { at, least, most } = rangeOf(shares, index);
    const forward = (rtl() ? ['ArrowLeft', 'ArrowUp'] : ['ArrowRight', 'ArrowUp']).includes(event.key);
    const back = (rtl() ? ['ArrowRight', 'ArrowDown'] : ['ArrowLeft', 'ArrowDown']).includes(event.key);
    const to = forward
      ? snapped(at + COLUMN_WIDTH_STEP)
      : back
        ? snapped(at - COLUMN_WIDTH_STEP)
        : event.key === 'Home'
          ? least
          : event.key === 'End'
            ? most
            : undefined;
    if (to === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    const next = movedTo(shares, index, to);
    if (!same(next, shares)) latest.current.onCommit(next);
  };

  const percents = shares.map((share) => Math.round(share * 100));
  return shares.slice(0, -1).map((_share, index) => {
    const { at, least, most } = rangeOf(shares, index);
    return (
      <div
        key={index}
        role="slider"
        tabIndex={0}
        contentEditable={false}
        aria-label={words.tableColumnBorder(index + 1)}
        aria-orientation="horizontal"
        aria-valuemin={Math.round(least * 100)}
        aria-valuemax={Math.round(most * 100)}
        aria-valuenow={Math.round(at * 100)}
        aria-valuetext={words.columnShares(percents)}
        data-slot="table-border"
        data-dragging={dragging === index || undefined}
        style={{ insetInlineStart: `${at * 100}%` }}
        className="cn-editor-handle absolute top-1/2 z-10 -translate-y-1/2 cursor-col-resize touch-none opacity-0 outline-none select-none group-hover/table:opacity-100 group-data-[active]/table:opacity-100 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:opacity-100 data-dragging:opacity-100 ltr:-translate-x-1/2 rtl:translate-x-1/2"
        onPointerDown={(event) => pointerDown(index, event)}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => keyDown(index, event)}
      />
    );
  });
}
