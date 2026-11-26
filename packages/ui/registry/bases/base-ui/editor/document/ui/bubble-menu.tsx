'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { TextAlignCenterIcon } from '@/registry/bases/base-ui/icons/lucide/text-align-center-icon';
import { TextAlignEndIcon } from '@/registry/bases/base-ui/icons/lucide/text-align-end-icon';
import { TextAlignJustifyIcon } from '@/registry/bases/base-ui/icons/lucide/text-align-justify-icon';
import { TextAlignStartIcon } from '@/registry/bases/base-ui/icons/lucide/text-align-start-icon';
import { Toggle } from '@/registry/bases/base-ui/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';
import { Popover } from '@/registry/bases/base-ui/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import type { BubbleItem, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { TEXT_ALIGNS, type TextAlign } from '@zeroxsolutions/editor-core/template/layout/index';
import { DEFAULT_LAYOUT_WORDS, type LayoutWords } from '../layout/layout-words';
import { selectionRect, selectionWithin, type Point } from './selection-rect';
import { RectPopover } from './rect-popover';
import { ChromeControl } from './chrome-icon';
import { ColorMenu } from './color-menu';

/**
 * The args of a bubble item drawn as a control of its own rather than a toggle: an item whose command is
 * `setTextAlign` draws the text alignment group, one whose command is `setTextColor` the colour menu, each in
 * `words`. Neither is drawn where the editor cannot run its command, as without `blockLayout`.
 */
export interface BubbleMenuControlArgs {
  readonly words: LayoutWords;
}

function wordsOf(item: BubbleItem): LayoutWords {
  const args = item.args as Partial<BubbleMenuControlArgs> | undefined;
  return args?.words ?? DEFAULT_LAYOUT_WORDS;
}

const TEXT_ALIGN_ICONS = {
  start: TextAlignStartIcon,
  center: TextAlignCenterIcon,
  end: TextAlignEndIcon,
  justify: TextAlignJustifyIcon,
} as const satisfies Record<TextAlign, unknown>;

/** The alignment of the first line the selection touches; a line that sets none reads as `start`. */
function textAlignIn(editor: IEditor): TextAlign {
  return (
    TEXT_ALIGNS.find(
      (align) => editor.isActive('paragraph', { textAlign: align }) || editor.isActive('heading', { textAlign: align }),
    ) ?? 'start'
  );
}

/**
 * The alignment of the lines the selection touches: a toggle per alignment the editor allows there, so the email
 * editor, which refuses `justify`, offers three. Nothing where it allows none, as in a code block.
 */
function BubbleMenuTextAlign({ editor, words }: { editor: IEditor; words: LayoutWords }): ReactNode {
  const offered = TEXT_ALIGNS.filter((align) => editor.can('setTextAlign', { align }));
  if (offered.length === 0) return null;
  return (
    <ToggleGroup
      aria-label={words.textAlign}
      size="sm"
      value={[textAlignIn(editor)]}
      onValueChange={(values) => {
        const [picked] = values as TextAlign[];
        if (picked !== undefined) editor.run('setTextAlign', { align: picked });
      }}
    >
      {offered.map((align) => (
        <ChromeControl
          key={align}
          icon={TEXT_ALIGN_ICONS[align]}
          iconSized="toolbar"
          render={(control) => (
            <Tooltip>
              <TooltipTrigger
                render={
                  <ToggleGroupItem
                    value={align}
                    aria-label={words.textAligns[align]}
                    // Keep focus (and the selection) on mousedown so the command applies.
                    onMouseDown={(event) => event.preventDefault()}
                    {...control}
                  />
                }
              />
              <TooltipContent>{words.textAligns[align]}</TooltipContent>
            </Tooltip>
          )}
        />
      ))}
    </ToggleGroup>
  );
}

/**
 * The selection bubble menu (task 8.2): a floating formatting bar that appears
 * over a non-empty text selection. It reads the browser selection geometry (not
 * the engine) to position itself, and dispatches its buttons' commands through the
 * `IEditor` façade. The bar is a `Popover` anchored to the selection by `RectPopover`
 * (non-modal by default and with `initialFocus={false}` so it never steals the
 * selection), and its buttons are the design-system `Toggle` (native pressed
 * state) wrapped in a `Tooltip`; the items `BubbleMenuControlArgs` names draw the
 * text alignment group and the colour menu instead. The floating "+" affordance for an empty line
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
  // While the colour menu is open the focus is in it, which would hide the bar it opened from.
  const held = useRef(false);
  const refresh = useRef<() => void>(() => {});

  useEffect(() => {
    const update = () => {
      if (held.current) {
        // A colour picked re-renders the bar where it is.
        setRect((current) => (current ? { ...current } : current));
        return;
      }
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
    refresh.current = update;
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
      <RectPopover
        rect={rect}
        side="top"
        align="center"
        // The editor owns the caret; the popover must not steal focus on open.
        initialFocus={false}
        role="toolbar"
        data-slot="bubble-menu"
        // A screen narrower than the row wraps it, so every control stays in reach.
        className="cn-editor-toolbar flex w-max max-w-(--available-width) flex-row flex-wrap items-center"
      >
        <TooltipProvider>
          {items.map((item) => {
            if (item.command === 'setTextAlign') {
              return <BubbleMenuTextAlign key={item.id} editor={editor} words={wordsOf(item)} />;
            }
            if (item.command === 'setTextColor') {
              if (!editor.can('setTextColor', { token: null })) return null;
              return (
                <ColorMenu
                  key={item.id}
                  editor={editor}
                  words={wordsOf(item)}
                  onOpenChange={(open) => {
                    held.current = open;
                    if (!open) refresh.current();
                  }}
                />
              );
            }
            const active = item.activeWhen ? editor.isActive(item.activeWhen) : false;
            return (
              <ChromeControl
                key={item.id}
                icon={item.icon}
                fallback={item.title}
                iconSized="toolbar"
                render={(control) => (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Toggle
                          size="sm"
                          pressed={active}
                          aria-label={item.title}
                          // Keep focus (and the selection) on mousedown so the command applies.
                          onMouseDown={(event) => event.preventDefault()}
                          onPressedChange={() => editor.run(item.command, item.args)}
                          {...control}
                        />
                      }
                    />
                    <TooltipContent>{item.title}</TooltipContent>
                  </Tooltip>
                )}
              />
            );
          })}
        </TooltipProvider>
      </RectPopover>
    </Popover>
  );
}
