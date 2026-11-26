'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Popover } from '@/registry/bases/base-ui/ui/popover';
import { TooltipProvider } from '@/registry/bases/base-ui/ui/tooltip';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { RectPopover } from '../ui/rect-popover';
import type { RectLike } from '../ui/selection-rect';

export interface BlockToolbarProps {
  editor: IEditor;
  /** Where the block starts in the document, as its view's `getPos()` reads it; undefined draws nothing. */
  pos: number | undefined;
  /** The block's drawn element, which the toolbar sits above and whose text holds the caret. */
  anchor: HTMLElement | null;
  /** The toolbar's accessible name, from words, such as `LayoutWords.toolbar`. */
  label: string;
  /** The controls, each a design-system control such as `AlignControl` or `WidthToggle`. */
  children: ReactNode;
}

/** The toolbar's controls that take the focus, in order. */
function controlsOf(toolbar: HTMLElement | null): HTMLElement[] {
  return [...(toolbar?.querySelectorAll<HTMLElement>('button, [role=slider]') ?? [])].filter(
    (control) => !control.matches(':disabled'),
  );
}

const STEPS: Readonly<Record<string, (index: number, count: number) => number>> = {
  ArrowRight: (index, count) => Math.min(index + 1, count - 1),
  ArrowLeft: (index) => Math.max(index - 1, 0),
  Home: () => 0,
  End: (_index, count) => count - 1,
};

/** One block's toolbar as the others in its editor see it, so only one of those around the caret shows. */
interface Shown {
  readonly anchor: HTMLElement;
  /** The block is selected whole or holds the caret. */
  around(): boolean;
  /** `around()`, in an editable editor holding the focus or with the focus in this toolbar. */
  wants(): boolean;
  /** Reads again whether this toolbar shows. */
  update(): void;
  /** Moves the focus to this toolbar's first control once it is drawn. */
  enter(): void;
}

/** The toolbars of one editor, and the one Alt+F10 stepped out to, which shows in place of the innermost. */
interface ShownToolbars {
  readonly all: Set<Shown>;
  raised: Shown | null;
}

const shownToolbars = new WeakMap<IEditor, ShownToolbars>();

function toolbarsOf(editor: IEditor): ShownToolbars {
  let toolbars = shownToolbars.get(editor);
  if (!toolbars) shownToolbars.set(editor, (toolbars = { all: new Set(), raised: null }));
  return toolbars;
}

/** The toolbars around the caret or the selected block, the innermost block's first. */
function aroundOf(toolbars: ShownToolbars): Shown[] {
  return [...toolbars.all]
    .filter((shown) => shown.around())
    .sort((a, b) => (a.anchor.contains(b.anchor) ? 1 : b.anchor.contains(a.anchor) ? -1 : 0));
}

/**
 * Whether `shown` draws: the one Alt+F10 stepped out to while there is one, else the innermost toolbar that wants
 * to, so a section's and its columns' toolbars never open over each other.
 */
function showsIn(toolbars: ShownToolbars, shown: Shown): boolean {
  if (toolbars.raised) return toolbars.raised === shown;
  return (
    shown.wants() &&
    ![...toolbars.all].some((other) => other !== shown && other.wants() && shown.anchor.contains(other.anchor))
  );
}

/** The frames a toolbar stepped out to waits for its controls to be drawn before it gives up taking the focus. */
const ENTER_FRAMES = 30;

/** A viewport rect read from `element` each time it is asked, so the toolbar follows the block as it scrolls. */
function liveRect(element: HTMLElement): RectLike {
  return {
    get top() {
      return element.getBoundingClientRect().top;
    },
    get bottom() {
      return element.getBoundingClientRect().bottom;
    },
    get left() {
      return element.getBoundingClientRect().left;
    },
    get right() {
      return element.getBoundingClientRect().right;
    },
  };
}

/**
 * Whether a drag is in flight on the page, as a block dragged by its grip is. Picking a block by its grip selects
 * it whole, which would open its toolbar, and one opened below the block takes the drop meant for the line under it.
 */
function useDragInFlight(): boolean {
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    const start = () => setDragging(true);
    const end = () => setDragging(false);
    document.addEventListener('dragstart', start);
    document.addEventListener('dragend', end);
    document.addEventListener('drop', end);
    return () => {
      document.removeEventListener('dragstart', start);
      document.removeEventListener('dragend', end);
      document.removeEventListener('drop', end);
    };
  }, []);
  return dragging;
}

/**
 * A block's floating toolbar: a popover above the block, shown while the block is selected whole or holds the
 * caret in an editable editor, and while the focus is in the toolbar itself, never while a block is dragged.
 * Opening it never moves the focus.
 * Of the toolbars of blocks nested around the caret, as a section's around its columns', only the innermost shows.
 * Tab from the selected block, or Alt+F10 from its text, moves the focus into the innermost; Alt+F10 again steps
 * out to the next enclosing block's toolbar, which shows in its place, and from the outermost back to the innermost.
 * The arrow keys, Home and End move between its controls past what a group's own arrow keys reach, and Escape gives
 * the focus back to the text.
 */
export function BlockToolbar({ editor, pos, anchor, label, children }: BlockToolbarProps): ReactNode {
  const toolbar = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const entering = useRef(false);
  const shown = useRef<Shown | null>(null);
  const rect = useMemo(() => (anchor ? liveRect(anchor) : null), [anchor]);
  const dragging = useDragInFlight();

  useEffect(() => {
    if (!anchor || pos === undefined) {
      setOpen(false);
      return;
    }
    const picked = () => {
      const selection = editor.getSelection();
      return selection.isNode === true && selection.from === pos;
    };
    const holdsCaret = () => {
      const focus = window.getSelection()?.focusNode;
      return !editor.getSelection().isNode && focus != null && anchor.contains(focus);
    };
    const inToolbar = () => toolbar.current?.contains(document.activeElement) === true;
    const toolbars = toolbarsOf(editor);
    const own: Shown = {
      anchor,
      around: () => picked() || holdsCaret(),
      wants: () => editor.isEditable() && own.around() && (editor.isFocused() || inToolbar()),
      update: () => setOpen(showsIn(toolbars, own)),
      enter: () => {
        const first = controlsOf(toolbar.current)[0];
        // A toolbar not drawn yet takes the focus once its controls are, which `useEffect` below waits for.
        entering.current = !first;
        first?.focus();
      },
    };
    shown.current = own;
    toolbars.all.add(own);
    const updateAll = () => {
      for (const each of toolbars.all) each.update();
    };
    // A focus outside every toolbar, back in the text or elsewhere, ends a step out.
    const focusIn = (event: FocusEvent) => {
      if (toolbars.raised === own && !toolbar.current?.contains(event.target as Node)) {
        toolbars.raised = null;
        updateAll();
        return;
      }
      own.update();
    };
    updateAll();
    const offSelection = editor.onSelectionUpdate(own.update);
    const offChange = editor.onChange(own.update);
    // The focus moving between the text and the toolbar is no selection change.
    document.addEventListener('focusin', focusIn);
    document.addEventListener('focusout', own.update);

    const text = anchor.closest<HTMLElement>('[contenteditable=true]');
    const enter = (event: globalThis.KeyboardEvent) => {
      const tab = event.key === 'Tab' && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey;
      const shortcut = event.key === 'F10' && event.altKey;
      if (!(tab && picked()) && !(shortcut && own.around())) return;
      // Only the innermost block's toolbar is entered from the text.
      if (aroundOf(toolbars)[0] !== own) return;
      if (!controlsOf(toolbar.current)[0]) return;
      event.preventDefault();
      own.enter();
    };
    text?.addEventListener('keydown', enter);
    return () => {
      toolbars.all.delete(own);
      if (toolbars.raised === own) toolbars.raised = null;
      updateAll();
      offSelection();
      offChange();
      document.removeEventListener('focusin', focusIn);
      document.removeEventListener('focusout', own.update);
      text?.removeEventListener('keydown', enter);
    };
  }, [editor, pos, anchor]);

  // A toolbar Alt+F10 stepped out to takes the focus once it is drawn: its popup mounts its controls a frame or so
  // after it opens.
  useEffect(() => {
    if (!open) return;
    let frame = 0;
    let tries = ENTER_FRAMES;
    const tryEnter = () => {
      if (!entering.current) return;
      shown.current?.enter();
      tries -= 1;
      if (entering.current && tries > 0) frame = requestAnimationFrame(tryEnter);
    };
    tryEnter();
    return () => {
      cancelAnimationFrame(frame);
      entering.current = false;
    };
  }, [open]);

  // Before a control's tooltip, which takes Escape to close itself.
  const escape = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'F10' && event.altKey) {
      event.preventDefault();
      stepOut();
      return;
    }
    if (event.key !== 'Escape') return;
    event.preventDefault();
    editor.focus();
  };
  // Alt+F10 in a toolbar: the next enclosing block's toolbar, or the innermost again from the outermost.
  const stepOut = () => {
    const toolbars = toolbarsOf(editor);
    const around = aroundOf(toolbars);
    const next = around[(around.indexOf(shown.current as Shown) + 1) % around.length];
    if (!next || next === shown.current) return;
    toolbars.raised = next;
    // Asked to enter before it is drawn, so it takes the focus as it opens.
    next.enter();
    for (const each of toolbars.all) each.update();
  };
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // A group's own arrow keys move within it; what it leaves to the toolbar moves past it.
    if (event.defaultPrevented || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
    const step = STEPS[event.key];
    const controls = controlsOf(toolbar.current);
    const index = controls.indexOf(event.target as HTMLElement);
    if (!step || index < 0) return;
    event.preventDefault();
    controls[step(index, controls.length)]?.focus();
  };

  // Unmounted rather than closed, so no closing popup is left over the drop target.
  if (dragging) return null;
  return (
    <Popover open={open && rect !== null}>
      <RectPopover
        ref={toolbar}
        rect={rect}
        side="top"
        align="center"
        sideOffset={8}
        // The editor owns the caret: opening and closing the toolbar leave the focus where it is.
        initialFocus={false}
        finalFocus={false}
        role="toolbar"
        aria-label={label}
        data-slot="block-toolbar"
        className="cn-editor-toolbar w-auto flex-row items-center"
        onKeyDownCapture={escape}
        onKeyDown={keyDown}
        // Pressing a control keeps the text's selection, as the bubble's do.
        onMouseDown={(event) => {
          if (!(event.target instanceof HTMLElement) || !event.target.closest('input')) event.preventDefault();
        }}
      >
        <TooltipProvider>{children}</TooltipProvider>
      </RectPopover>
    </Popover>
  );
}
