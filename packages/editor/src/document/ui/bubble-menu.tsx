'use client';

import { useEffect, useState } from 'react';
import { Toggle } from '@zeroxsolutions/ui/components/ui/toggle';
import {
  Popover,
  PopoverContent,
} from '@zeroxsolutions/ui/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@zeroxsolutions/ui/components/ui/tooltip';
import type { BubbleItem, IEditor } from '../core/index.js';
import { rectAnchor, selectionRect, selectionWithin, type Point } from './selection-rect.js';

/**
 * The selection bubble menu (task 8.2): a floating formatting bar that appears
 * over a non-empty text selection. It reads the browser selection geometry (not
 * the engine) to position itself, and dispatches its buttons' commands through the
 * `IEditor` façade. The bar is a caret-anchored `Popover` (the shipped primitive,
 * non-modal by default and with `initialFocus={false}` so it never steals the
 * selection), and its buttons are the design-system `Toggle` (native pressed
 * state) wrapped in a `Tooltip`. The floating "+" affordance for an empty line
 * reuses the slash menu's `/` trigger, so it is not duplicated here.
 */
export interface BubbleMenuProps {
  editor: IEditor;
  items: BubbleItem[];
  /** The editor's DOM root, to scope the selection to this editor. */
  container?: HTMLElement | null;
}

export function BubbleMenu({ editor, items, container }: BubbleMenuProps) {
  const [rect, setRect] = useState<Point | null>(null);

  useEffect(() => {
    const update = () => {
      const selection = editor.getSelection();
      const active =
        editor.isEditable() &&
        // Hide when focus leaves the editor: a blurred selection stays visually
        // "selected" in the DOM, so without this the bar would linger after an
        // outside click. Formatting buttons `preventDefault` on mousedown, so
        // clicking one keeps focus and the bar stays open.
        editor.isFocused() &&
        !selection.empty &&
        // Only a text range gets the formatting bar — never a whole-node
        // selection (a block picked up by the drag handle, a selected image),
        // which would otherwise pop the bar open mid-drag.
        !selection.isNode &&
        selectionWithin(container ?? null);
      setRect(active ? selectionRect() : null);
    };
    update();
    // Drive off the engine's selection/focus events (fired with `getSelection()`
    // already current), not the raw DOM `selectionchange` — that runs a tick
    // before the engine syncs, so a dblclick / keyboard selection read stale and
    // the bar never appeared. `onChange` covers edits that reshape the selection.
    const offSelection = editor.onSelectionUpdate(update);
    const offChange = editor.onChange(update);
    return () => {
      offSelection();
      offChange();
    };
  }, [editor, container]);

  return (
    <Popover open={Boolean(rect)}>
      <PopoverContent
        anchor={rectAnchor(rect)}
        side="top"
        align="center"
        // The editor owns the caret; the popover must not steal focus on open.
        initialFocus={false}
        role="toolbar"
        data-slot="bubble-menu"
        className="flex-row items-center gap-0.5 rounded-lg p-1"
      >
        <TooltipProvider>
          {items.map((item) => {
            const active = item.activeWhen ? editor.isActive(item.activeWhen) : false;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger
                  render={
                    <Toggle
                      size="sm"
                      pressed={active}
                      aria-label={item.title}
                      // Keep focus (and the selection) on mousedown so the command applies.
                      onMouseDown={(event) => event.preventDefault()}
                      onPressedChange={() => editor.run(item.command, item.args)}
                    >
                      {item.icon ?? item.title}
                    </Toggle>
                  }
                />
                <TooltipContent>{item.title}</TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  );
}
