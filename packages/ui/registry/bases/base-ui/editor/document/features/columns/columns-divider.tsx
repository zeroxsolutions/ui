'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { RATIO_SNAPS, ratioFractions, snapRatio } from '@zeroxsolutions/editor-core/template/layout/index';
import { passHistoryKey } from '../../layout/history-keys';
import type { LayoutWords } from '../../layout/layout-words';

/** The twelfths a columns block's weights are snapped to. */
const TWELFTHS = 12;
/** The divider positions the keys step between, in twelfths of the row: quarters, thirds and the half. */
const SNAP_TWELFTHS = RATIO_SNAPS.map((snap) => Math.round(snap * TWELFTHS));

/** The lanes of a columns block, the grid items of its content element, in the editor and the Viewer alike. */
const LANES = ':scope > [data-node-view-content] > [data-node-view-content-react] > *';

const lanesOf = (root: HTMLElement): HTMLElement[] => [...root.querySelectorAll<HTMLElement>(LANES)];

/** How many lanes a columns block's element draws, kept as lanes are added and removed. */
export function useColumnsLaneCount(root: HTMLElement | null): number {
  const [count, setCount] = useState(0);
  useLayoutEffect(() => {
    const grid = root?.querySelector(':scope > [data-node-view-content] > [data-node-view-content-react]');
    if (!root || !grid) return;
    const count = () => setCount(lanesOf(root).length);
    const lanes = new MutationObserver(count);
    lanes.observe(grid, { childList: true });
    count();
    return () => lanes.disconnect();
  }, [root]);
  return count;
}

/**
 * Where each divider sits, in pixels from the block's left edge: midway across the gap between two lanes side by
 * side. Empty while the lanes stack, as they do on a narrow screen, where there is no divider to drag.
 */
function useDividerPlaces(root: HTMLElement | null): number[] {
  const [places, setPlaces] = useState<number[]>([]);
  useLayoutEffect(() => {
    if (!root) return;
    const measure = () => {
      const box = root.getBoundingClientRect();
      const lanes = lanesOf(root).map((lane) => lane.getBoundingClientRect());
      const next: number[] = [];
      for (let index = 1; index < lanes.length; index += 1) {
        const [before, after] = [lanes[index - 1], lanes[index]];
        if (after.top >= before.bottom - 1) return setPlaces((current) => (current.length === 0 ? current : []));
        // In a right-to-left block the lane after sits to the left.
        const gap = after.left >= before.right ? [before.right, after.left] : [after.right, before.left];
        next.push((gap[0] + gap[1]) / 2 - box.left);
      }
      setPlaces((current) => (current.join() === next.join() ? current : next));
    };
    const sizes = new ResizeObserver(measure);
    const observe = () => {
      sizes.disconnect();
      sizes.observe(root);
      for (const lane of lanesOf(root)) sizes.observe(lane);
      measure();
    };
    const grid = root.querySelector(':scope > [data-node-view-content] > [data-node-view-content-react]');
    const lanes = new MutationObserver(observe);
    if (grid) lanes.observe(grid, { childList: true });
    observe();
    return () => {
      sizes.disconnect();
      lanes.disconnect();
    };
  }, [root]);
  return places;
}

/** `weights` as whole twelfths, so a divider lands on a twelfth of the row. */
const inTwelfths = (weights: readonly number[]): number[] => snapRatio(ratioFractions(weights));

/** The weights with divider `index` moved to `at` twelfths of the row, the lanes either side of it resized. */
function movedTo(twelfths: readonly number[], index: number, at: number): number[] {
  const before = twelfths.slice(0, index).reduce((sum, weight) => sum + weight, 0);
  const pair = twelfths[index] + twelfths[index + 1];
  const left = Math.min(pair - 1, Math.max(1, at - before));
  return twelfths.map((weight, lane) => (lane === index ? left : lane === index + 1 ? pair - left : weight));
}

/** Where divider `index` sits, in twelfths of the row, and the least and most it may move to. */
function rangeOf(twelfths: readonly number[], index: number): { at: number; least: number; most: number } {
  const at = twelfths.slice(0, index + 1).reduce((sum, weight) => sum + weight, 0);
  return { at, least: at - twelfths[index] + 1, most: at + twelfths[index + 1] - 1 };
}

const sameShares = (a: readonly number[], b: readonly number[]): boolean =>
  ratioFractions(a).join() === ratioFractions(b).join();

interface Drag {
  readonly index: number;
  readonly pointerId: number;
  readonly handle: HTMLElement;
  /** The weights the drag began at. */
  readonly start: readonly number[];
  /** The pair's start edge, the gap between the pair and the pair's width, in pixels, as the drag began. */
  readonly pairStart: number;
  readonly gap: number;
  readonly pairWidth: number;
  /** 1 where the row reads left to right, -1 where it reads right to left. */
  readonly direction: number;
  current: number[];
}

export interface ColumnsDividersProps {
  /** The columns block's own element: positioned, its content element the grid of lanes. */
  root: HTMLElement | null;
  /** The weights the lanes are drawn at, one per lane. */
  weights: readonly number[];
  words: LayoutWords;
  /** Each ratio a drag passes through, snapped to twelfths; null when a drag ends and the view draws `weights`. */
  onPreview(weights: number[] | null): void;
  /** The ratio a drag or a key ends on, once, where it differs from `weights`: the one change the document takes. */
  onCommit(weights: number[]): void;
}

/**
 * A divider between each two lanes side by side, each a `role="slider"` reading the row's division in percent.
 * Any pointer (a mouse, a pen, a finger) drags one; each move previews the lanes at the nearest twelfth, so the
 * quarters, the thirds and the half are each a place it lands on, the release commits once and Escape cancels. On a
 * focused divider the arrow keys move it to the next quarter, third or half, or by a twelfth where none is left
 * before its neighbour; Home and End take it as far as it goes. No divider is drawn while the lanes stack.
 */
export function ColumnsDividers({ root, weights, words, onPreview, onCommit }: ColumnsDividersProps): ReactNode {
  const places = useDividerPlaces(root);
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
    if (commit && !sameShares(ended.current, ended.start)) latest.current.onCommit(ended.current);
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

  const pointerDown = (index: number, event: PointerEvent<HTMLElement>): void => {
    if (!root || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const lanes = lanesOf(root).map((lane) => lane.getBoundingClientRect());
    const [first, second] = [lanes[index], lanes[index + 1]];
    if (!first || !second) return;
    // The engine would take the press as the start of a selection or of the block's own drag.
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;
    handle.focus({ preventScroll: true });
    handle.setPointerCapture(event.pointerId);
    const direction = getComputedStyle(root).direction === 'rtl' ? -1 : 1;
    drag.current = {
      index,
      pointerId: event.pointerId,
      handle,
      start: weights,
      pairStart: direction === 1 ? first.left : first.right,
      gap: direction === 1 ? second.left - first.right : first.left - second.right,
      pairWidth: direction === 1 ? second.right - first.left : first.right - second.left,
      direction,
      current: [...weights],
    };
    setDragging(index);
  };

  const pointerMove = (event: PointerEvent<HTMLElement>): void => {
    const moving = drag.current;
    if (!moving || event.pointerId !== moving.pointerId) return;
    const lanesWidth = moving.pairWidth - moving.gap;
    if (lanesWidth <= 0) return;
    const across = (event.clientX - moving.pairStart) * moving.direction - moving.gap / 2;
    const share = Math.min(1, Math.max(0, across / lanesWidth));
    const fractions = ratioFractions(moving.start);
    const pair = fractions[moving.index] + fractions[moving.index + 1];
    fractions[moving.index] = share * pair;
    fractions[moving.index + 1] = (1 - share) * pair;
    // A lane dragged to nothing keeps one twelfth, as `snapRatio` keeps every lane.
    const next = snapRatio(fractions.map((fraction) => Math.max(fraction, Number.EPSILON)));
    if (next.join() === moving.current.join()) return;
    moving.current = next;
    latest.current.onPreview(next);
  };

  const pointerUp = (event: PointerEvent<HTMLElement>): void => {
    if (drag.current?.pointerId === event.pointerId) end(event.type === 'pointerup');
  };

  const keyDown = (index: number, event: KeyboardEvent<HTMLElement>): void => {
    if (passHistoryKey(event) || drag.current || event.altKey || event.ctrlKey || event.metaKey) return;
    const twelfths = inTwelfths(weights);
    const { at, least, most } = rangeOf(twelfths, index);
    const rtl = root !== null && getComputedStyle(root).direction === 'rtl';
    const forward = (rtl ? ['ArrowLeft', 'ArrowUp'] : ['ArrowRight', 'ArrowUp']).includes(event.key);
    const back = (rtl ? ['ArrowRight', 'ArrowDown'] : ['ArrowLeft', 'ArrowDown']).includes(event.key);
    let to: number | undefined;
    if (forward) to = SNAP_TWELFTHS.find((snap) => snap > at && snap <= most) ?? Math.min(at + 1, most);
    else if (back) to = SNAP_TWELFTHS.findLast((snap) => snap < at && snap >= least) ?? Math.max(at - 1, least);
    else if (event.key === 'Home') to = least;
    else if (event.key === 'End') to = most;
    if (to === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    const next = movedTo(twelfths, index, to);
    if (!sameShares(next, weights)) latest.current.onCommit(next);
  };

  const fractions = ratioFractions(weights);
  const percents = fractions.map((fraction) => Math.round(fraction * 100));
  return places.map((left, index) => {
    const twelfths = inTwelfths(weights);
    const { least, most } = rangeOf(twelfths, index);
    const at = fractions.slice(0, index + 1).reduce((sum, fraction) => sum + fraction, 0);
    return (
      <div
        key={index}
        role="slider"
        tabIndex={0}
        contentEditable={false}
        aria-label={words.columnDivider(index + 1)}
        aria-orientation="horizontal"
        aria-valuemin={Math.round((least / TWELFTHS) * 100)}
        aria-valuemax={Math.round((most / TWELFTHS) * 100)}
        aria-valuenow={Math.round(at * 100)}
        aria-valuetext={words.columnShares(percents)}
        data-slot="columns-divider"
        data-dragging={dragging === index || undefined}
        style={{ left: left }}
        className="cn-editor-handle absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 cursor-col-resize touch-none opacity-0 outline-none select-none group-hover/columns:opacity-100 group-data-[active]/columns:opacity-100 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:opacity-100 data-dragging:opacity-100"
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
