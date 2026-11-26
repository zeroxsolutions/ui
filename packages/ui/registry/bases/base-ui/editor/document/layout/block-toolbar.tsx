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
 * A block's floating toolbar: a popover above the block, shown while the block is selected whole or holds the
 * caret in an editable editor, and while the focus is in the toolbar itself. Opening it never moves the focus.
 * Tab from the selected block, or Alt+F10 from its text, moves the focus into it; the arrow keys, Home and End move
 * between its controls past what a group's own arrow keys reach, and Escape gives the focus back to the text.
 */
export function BlockToolbar({ editor, pos, anchor, label, children }: BlockToolbarProps): ReactNode {
  const toolbar = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const rect = useMemo(() => (anchor ? liveRect(anchor) : null), [anchor]);

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
    const update = () =>
      setOpen(editor.isEditable() && (picked() || holdsCaret()) && (editor.isFocused() || inToolbar()));
    update();
    const offSelection = editor.onSelectionUpdate(update);
    const offChange = editor.onChange(update);
    // The focus moving between the text and the toolbar is no selection change.
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);

    const text = anchor.closest<HTMLElement>('[contenteditable=true]');
    const enter = (event: globalThis.KeyboardEvent) => {
      const tab = event.key === 'Tab' && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey;
      const shortcut = event.key === 'F10' && event.altKey;
      if (!(tab && picked()) && !(shortcut && (picked() || holdsCaret()))) return;
      const first = controlsOf(toolbar.current)[0];
      if (!first) return;
      event.preventDefault();
      first.focus();
    };
    text?.addEventListener('keydown', enter);
    return () => {
      offSelection();
      offChange();
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
      text?.removeEventListener('keydown', enter);
    };
  }, [editor, pos, anchor]);

  // Before a control's tooltip, which takes Escape to close itself.
  const escape = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    editor.focus();
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
