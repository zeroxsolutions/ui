import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

/**
 * ChatComposerGhostText — a Copilot-style typeahead overlay. Renders the
 * predicted continuation (`suggestion`) as muted text positioned exactly after
 * the user's draft inside a composer textarea.
 *
 * It does NOT wrap the textarea (a flex `InputGroup` needs the textarea as a
 * direct child). Instead it is an absolutely-positioned, click-through sibling
 * mounted at the surface's `relative` root and aligned to the textarea by
 * measuring it — copying the textarea's real computed typography + padding so
 * the ghost lands on the same baseline on every surface without duplicating any
 * class strings. The draft is mirrored as invisible (occupying the same space)
 * so the suggestion begins exactly at the caret. Mount it as a child of the
 * same `position: relative` element that contains the textarea.
 *
 * Presentational: the host computes the suggestion; this only positions it.
 */
export interface ChatComposerGhostTextProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Current draft — mirrored invisibly so the ghost starts at the caret. */
  text: string;
  /** Continuation to show. Empty ⇒ nothing renders. */
  suggestion: string;
}

export function ChatComposerGhostText({
  textareaRef,
  text,
  suggestion,
}: ChatComposerGhostTextProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const sync = useCallback(() => {
    const ta = textareaRef.current;
    const overlay = overlayRef.current;
    if (!ta || !overlay) return;
    const base = (overlay.offsetParent ??
      overlay.parentElement) as HTMLElement | null;
    if (!base) return;
    const baseRect = base.getBoundingClientRect();
    const taRect = ta.getBoundingClientRect();
    overlay.style.left = `${taRect.left - baseRect.left}px`;
    overlay.style.top = `${taRect.top - baseRect.top}px`;
    overlay.style.width = `${taRect.width}px`;
    overlay.style.height = `${taRect.height}px`;

    const cs = getComputedStyle(ta);
    overlay.style.fontFamily = cs.fontFamily;
    overlay.style.fontSize = cs.fontSize;
    overlay.style.fontWeight = cs.fontWeight;
    overlay.style.fontStyle = cs.fontStyle;
    overlay.style.lineHeight = cs.lineHeight;
    overlay.style.letterSpacing = cs.letterSpacing;
    overlay.style.textTransform = cs.textTransform;
    overlay.style.textIndent = cs.textIndent;
    overlay.style.tabSize = cs.tabSize;
    overlay.style.paddingTop = cs.paddingTop;
    overlay.style.paddingRight = cs.paddingRight;
    overlay.style.paddingBottom = cs.paddingBottom;
    overlay.style.paddingLeft = cs.paddingLeft;
    overlay.style.borderTopWidth = cs.borderTopWidth;
    overlay.style.borderRightWidth = cs.borderRightWidth;
    overlay.style.borderBottomWidth = cs.borderBottomWidth;
    overlay.style.borderLeftWidth = cs.borderLeftWidth;
    overlay.style.boxSizing = cs.boxSizing;
    // The textarea scrolls once the draft outgrows its max height; keep the
    // mirror's scroll in lockstep so the ghost stays glued to the caret.
    overlay.scrollTop = ta.scrollTop;
  }, [textareaRef]);

  // Re-align every render (text/suggestion changes drive auto-grow).
  useLayoutEffect(() => {
    sync();
  });

  // Stay aligned through auto-grow, textarea scroll, and window resize.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || !suggestion) return;
    const ro = new ResizeObserver(() => sync());
    ro.observe(ta);
    const onScrollOrResize = () => sync();
    ta.addEventListener('scroll', onScrollOrResize);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      ro.disconnect();
      ta.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [suggestion, sync, textareaRef]);

  if (!suggestion) return null;

  return (
    <div
      ref={overlayRef}
      aria-hidden
      className="pointer-events-none absolute select-none overflow-hidden whitespace-pre-wrap break-words"
    >
      <span className="invisible">{text}</span>
      <span className="text-muted-foreground/45">{suggestion}</span>
    </div>
  );
}
