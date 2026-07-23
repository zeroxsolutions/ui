'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@zeroxsolutions/ui/components/ui/item';
import { Empty, EmptyDescription } from '@zeroxsolutions/ui/components/ui/empty';
import {
  Popover,
  PopoverContent,
} from '@zeroxsolutions/ui/components/ui/popover';
import { ScrollArea } from '@zeroxsolutions/ui/components/ui/scroll-area';
import { cn } from '@zeroxsolutions/ui/lib/utils';
import type { CaretRect, IEditor, SlashItem, TriggerQuery } from '../core/index.js';
import { filterSlashItems, groupByHeading } from './collect-ui-contributions.js';
import { rectAnchor } from './selection-rect.js';

/**
 * The slash (`/`) insert menu — Notion-style **inline**: typing `/` leaves the
 * `/` (and everything typed after it) as real text in the document, painted with
 * a gray `slash-active` highlight and a faint inline ghost right after the caret
 * (the `/<placeholder>` hint on an empty query, or the highlighted item's
 * autocomplete completion as you type). The popup is a caret-anchored `Popover`
 * (the shipped primitive, non-modal by default and with `initialFocus={false}` so
 * the editor keeps focus and the typed `/query` keeps flowing into the document);
 * its rows, empty-state, and scrolling are the design-system `Item` / `Empty` /
 * `ScrollArea` components. Detection, the delete-on-select range, and the inline
 * decoration come from the engine-free `IEditor` seams (`triggerQuery`,
 * `setSlashDecoration`); picking an item deletes the typed `/query` and dispatches
 * the item's command through the façade. Keyboard nav (↑/↓, Enter/Tab, Esc) is
 * handled here because the editor keeps focus (the query is typed into it), so a
 * cmdk input can't own the keys.
 */
export interface SlashMenuProps {
  editor: IEditor;
  items: SlashItem[];
  /** The inline ghost shown right after `/` on an empty query (Notion's
   *  `/<placeholder>`). Defaults to `Type to search`. */
  placeholder?: string;
}

export function SlashMenu({ editor, items, placeholder = 'Type to search' }: SlashMenuProps) {
  const [active, setActive] = useState<TriggerQuery | null>(null);
  const [point, setPoint] = useState<CaretRect | null>(null);
  const [index, setIndex] = useState(0);
  // Position dismissed via Esc — suppresses reopening at the same `/` while the
  // text lingers, until the caret moves to a different trigger (or none).
  const dismissedFrom = useRef<number | null>(null);

  const filtered = useMemo(
    () => filterSlashItems(items, active?.query ?? ''),
    [items, active?.query],
  );
  const groups = useMemo(() => groupByHeading(filtered), [filtered]);
  // The flattened render order — arrow-key nav walks this, so the highlight
  // tracks what's actually on screen even when items span multiple groups.
  const ordered = useMemo(() => groups.flatMap(([, groupItems]) => groupItems), [groups]);

  const orderedRef = useRef(ordered);
  orderedRef.current = ordered;
  const indexRef = useRef(index);
  indexRef.current = index;
  const activeRef = useRef(active);
  activeRef.current = active;

  // Recompute the trigger state on every doc/selection/focus change (plus scroll
  // and resize, so the popup follows the caret): open at the caret when `/query`
  // is present, close otherwise. No `/` keystroke is intercepted — the `/` is
  // ordinary typed text, which is what keeps it visible.
  useEffect(() => {
    const sync = () => {
      if (!editor.isEditable() || !editor.isFocused()) {
        setActive(null);
        return;
      }
      const query = editor.triggerQuery('/');
      if (!query) {
        dismissedFrom.current = null;
        setActive(null);
        return;
      }
      if (dismissedFrom.current === query.from) {
        setActive(null);
        return;
      }
      setActive(query);
      setPoint(editor.caretRect());
    };
    sync();
    // Engine-synced selection/focus events (not raw DOM `selectionchange`) so
    // `triggerQuery`/`caretRect` read current state; `onChange` covers typing;
    // scroll/resize keep the popup pinned to the caret.
    const offSelection = editor.onSelectionUpdate(sync);
    const offChange = editor.onChange(sync);
    window.addEventListener('scroll', sync, true);
    window.addEventListener('resize', sync);
    return () => {
      offSelection();
      offChange();
      window.removeEventListener('scroll', sync, true);
      window.removeEventListener('resize', sync);
    };
  }, [editor]);

  // The inline ghost after the caret: the placeholder on an empty query, else
  // the highlighted item's completion when its title extends what's typed (a
  // prefix match) — otherwise nothing (a keyword-only match has no completion).
  const ghost = useMemo(() => {
    if (!active) return '';
    if (active.query.length === 0) return placeholder;
    const item = ordered[index];
    const title = item?.title ?? '';
    return title.toLowerCase().startsWith(active.query.toLowerCase())
      ? title.slice(active.query.length)
      : '';
  }, [active, ordered, index, placeholder]);

  // Paint the gray `/query` highlight + inline ghost while the menu is open, and
  // clear it the moment it closes (or the component unmounts).
  useEffect(() => {
    editor.setSlashDecoration(
      active ? { from: active.from, to: active.to, ghost } : null,
    );
  }, [editor, active, ghost]);
  useEffect(() => () => editor.setSlashDecoration(null), [editor]);

  // Reset the highlight whenever the query narrows/widens the list.
  useEffect(() => setIndex(0), [active?.query]);

  const select = useCallback(
    (item: SlashItem) => {
      // Re-read the range at select time so a query typed after the last render
      // is still fully removed before the block command runs.
      const query = editor.triggerQuery('/');
      if (query) editor.run('deleteRange', { from: query.from, to: query.to });
      editor.run(item.command, item.args);
      editor.focus();
      setActive(null);
    },
    [editor],
  );

  const dismiss = useCallback(() => {
    dismissedFrom.current = activeRef.current?.from ?? null;
    setActive(null);
  }, []);

  // Own ↑/↓/Enter/Tab/Esc only while open — the editor still holds focus, so we
  // intercept at capture and stop these keys from moving the caret / inserting.
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const list = orderedRef.current;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        dismiss();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        setIndex((i) => (list.length ? (i + 1) % list.length : 0));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        setIndex((i) => (list.length ? (i - 1 + list.length) % list.length : 0));
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        if (!list.length) return;
        event.preventDefault();
        event.stopPropagation();
        select(list[indexRef.current] ?? list[0]);
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [editor, active, dismiss, select]);

  return (
    <Popover open={Boolean(active && point)}>
      <PopoverContent
        anchor={rectAnchor(point)}
        side="bottom"
        align="start"
        // The editor owns the caret; the popover must not steal focus on open.
        initialFocus={false}
        data-slot="slash-menu"
        className="w-72 gap-0 p-0"
      >
        <ScrollArea className="max-h-80">
          <div className="p-1">
            {ordered.length === 0 ? (
              <Empty className="min-h-0 gap-1 border-0 p-6">
                <EmptyDescription>No matching blocks</EmptyDescription>
              </Empty>
            ) : (
              groups.map(([heading, groupItems]) => (
                <div key={heading} className="pb-1">
                  <div className="px-2 pb-1 pt-1.5 text-xs font-medium text-muted-foreground">
                    {heading}
                  </div>
                  {groupItems.map((item) => {
                    const position = ordered.indexOf(item);
                    const highlighted = position === index;
                    return (
                      <Item
                        key={item.id}
                        size="sm"
                        data-highlighted={highlighted || undefined}
                        onMouseEnter={() => setIndex(position)}
                        // Keep the editor focused so the selection/range survives the click.
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => select(item)}
                        className={cn(
                          'cursor-pointer',
                          highlighted && 'bg-accent text-accent-foreground',
                        )}
                      >
                        <ItemMedia
                          variant="icon"
                          className="size-8 rounded-md border bg-secondary text-base"
                        >
                          {item.icon}
                        </ItemMedia>
                        <ItemContent className="gap-0.5">
                          <ItemTitle>{item.title}</ItemTitle>
                          {item.description && (
                            <ItemDescription className="line-clamp-1">
                              {item.description}
                            </ItemDescription>
                          )}
                        </ItemContent>
                      </Item>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
