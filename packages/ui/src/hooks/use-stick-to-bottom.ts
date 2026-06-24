/**
 * Auto-scroll-to-bottom hook for chat-style scroll containers.
 *
 * The ref returned attaches to a wrapper element. A `viewportFinder`
 * callback resolves the actual scrollable child — useful when the
 * scrollable surface is nested (e.g. a `ScrollArea` renders an inner
 * Viewport with its own scroll). Default finder is identity.
 *
 * Behaviour:
 *   - `isAtBottom` is true while the user hasn't scrolled up.
 *   - When `enabled` flips true (e.g. streaming starts) the viewport
 *     stays pinned to the bottom even as new content arrives, until
 *     the user scrolls up.
 *   - `scrollToBottom()` re-pins manually (used by the floating
 *     jump-to-bottom button).
 *
 * Presentational + SSR-safe: it owns no app state and runs entirely off
 * the DOM node the consumer hands it.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const BOTTOM_THRESHOLD_PX = 32;

export type ViewportFinder = (root: HTMLElement) => HTMLElement | null;

export interface UseStickToBottomOptions {
  enabled?: boolean;
  /** Resolve the scrollable element inside the ref. Defaults to identity. */
  viewportFinder?: ViewportFinder;
}

export function useStickToBottom(opts?: UseStickToBottomOptions) {
  const enabled = opts?.enabled ?? true;
  const viewportFinder = opts?.viewportFinder ?? defaultViewportFinder;
  const ref = useRef<HTMLElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const pinnedRef = useRef(true);

  const getViewport = useCallback((): HTMLElement | null => {
    const root = ref.current;
    if (!root) return null;
    return viewportFinder(root);
  }, [viewportFinder]);

  // Track whether the user is "near the bottom" — when they are, we
  // keep auto-scrolling on new content; when they scroll up we stop.
  useEffect(() => {
    const vp = getViewport();
    if (!vp) return;
    const onScroll = () => {
      const distance = vp.scrollHeight - vp.scrollTop - vp.clientHeight;
      const atBottom = distance <= BOTTOM_THRESHOLD_PX;
      pinnedRef.current = atBottom;
      setIsAtBottom(atBottom);
    };
    onScroll();
    vp.addEventListener('scroll', onScroll, { passive: true });
    return () => vp.removeEventListener('scroll', onScroll);
  }, [getViewport]);

  // Pin to the bottom whenever the viewport's contents grow while
  // streaming (and the user hasn't scrolled up). ResizeObserver fires
  // on every height change inside the scroll container.
  useEffect(() => {
    if (!enabled) return;
    const vp = getViewport();
    if (!vp) return;
    const observer = new ResizeObserver(() => {
      if (pinnedRef.current) {
        vp.scrollTop = vp.scrollHeight;
      }
    });
    observer.observe(vp);
    for (const child of Array.from(vp.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [enabled, getViewport]);

  const scrollToBottom = useCallback(() => {
    const vp = getViewport();
    if (!vp) return;
    vp.scrollTop = vp.scrollHeight;
    pinnedRef.current = true;
    setIsAtBottom(true);
  }, [getViewport]);

  return { ref, isAtBottom, scrollToBottom } as const;
}

const defaultViewportFinder: ViewportFinder = (root) => root;
