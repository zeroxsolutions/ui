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
import { ScrollArea } from '@zeroxsolutions/ui/components/ui/scroll-area';
import type { CaretRect, IEditor, TriggerQuery } from '../document/core/index.js';
import { FloatingShell } from '../document/ui/floating-shell.js';
import type { ChatPerson } from './composer-types.js';

/**
 * The `@` mention suggestion menu — a near-sibling of the document
 * `slash-menu.tsx`. Typing `@` leaves the `@query` as real text in the composer,
 * painted with the inline highlight; the popup is a caret-anchored `FloatingShell`
 * (the one sanctioned bespoke surface — the editor owns focus and the caret has
 * no DOM trigger), and its rows / empty-state / scrolling are the design-system
 * `Item` / `Empty` / `ScrollArea`. Selecting a person deletes the typed `@query`
 * and inserts a resolved `{ id, label }` mention pill (the existing `mention()`
 * atom) that shows the label and deletes as one unit. The people list is
 * caller-supplied — a sync `people` array (filtered here by label) or an async
 * `onQueryPeople` source (the caller filters) — so the surface ships no directory.
 *
 * The inline decoration write is **non-interfering**: this menu clears the shared
 * highlight slot only if it previously painted it, so mounting it beside the
 * `/` command menu (only one can match a given caret) never wipes the other's
 * highlight.
 */
export interface MentionMenuProps {
  editor: IEditor;
  /** The people offered, filtered here by a case-insensitive label match. */
  people?: ChatPerson[];
  /** An async (or sync) source queried as the user types; when set it supersedes
   *  `people` and the caller owns the filtering. */
  onQueryPeople?(query: string): ChatPerson[] | Promise<ChatPerson[]>;
  /** Empty-state text when nothing matches. */
  emptyText?: string;
}

/** Case-insensitive label match against the typed query. */
function filterPeople(people: ChatPerson[], query: string): ChatPerson[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return people;
  return people.filter((person) => person.label.toLowerCase().includes(needle));
}

export function MentionMenu({
  editor,
  people = [],
  onQueryPeople,
  emptyText = 'No people found',
}: MentionMenuProps) {
  const [active, setActive] = useState<TriggerQuery | null>(null);
  const [point, setPoint] = useState<CaretRect | null>(null);
  const [index, setIndex] = useState(0);
  // An async source's latest results; a sync `people` list is filtered inline.
  const [asyncResults, setAsyncResults] = useState<ChatPerson[]>([]);
  // Position dismissed via Esc — suppress reopening at the same `@` until the
  // caret moves to a different trigger (or none).
  const dismissedFrom = useRef<number | null>(null);

  const ordered = useMemo(
    () =>
      onQueryPeople ? asyncResults : filterPeople(people, active?.query ?? ''),
    [onQueryPeople, asyncResults, people, active?.query],
  );

  const orderedRef = useRef(ordered);
  orderedRef.current = ordered;
  const indexRef = useRef(index);
  indexRef.current = index;
  const activeRef = useRef(active);
  activeRef.current = active;

  // Recompute the trigger state on every doc/selection/focus change (plus scroll
  // and resize, so the popup follows the caret): open at the caret when `@query`
  // is present, close otherwise. No `@` keystroke is intercepted — the `@` is
  // ordinary typed text, which keeps it visible.
  useEffect(() => {
    const sync = () => {
      if (!editor.isEditable() || !editor.isFocused()) {
        setActive(null);
        return;
      }
      const query = editor.triggerQuery('@');
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

  // Query the async source as the typed `@query` changes.
  useEffect(() => {
    if (!onQueryPeople || !active) return;
    let cancelled = false;
    Promise.resolve(onQueryPeople(active.query)).then((results) => {
      if (!cancelled) setAsyncResults(results);
    });
    return () => {
      cancelled = true;
    };
  }, [onQueryPeople, active]);

  // The inline completion ghost: the highlighted person's label when it extends
  // what's typed (a prefix match), else nothing.
  const ghost = useMemo(() => {
    if (!active || active.query.length === 0) return '';
    const label = ordered[index]?.label ?? '';
    return label.toLowerCase().startsWith(active.query.toLowerCase())
      ? label.slice(active.query.length)
      : '';
  }, [active, ordered, index]);

  // Paint the `@query` highlight (+ completion ghost) while open, and clear it
  // when this menu closes — but only if THIS menu painted it, so a sibling menu's
  // highlight is never wiped.
  const painted = useRef(false);
  useEffect(() => {
    if (active) {
      editor.setSlashDecoration({ from: active.from, to: active.to, ghost });
      painted.current = true;
    } else if (painted.current) {
      editor.setSlashDecoration(null);
      painted.current = false;
    }
  }, [editor, active, ghost]);
  useEffect(
    () => () => {
      if (painted.current) editor.setSlashDecoration(null);
    },
    [editor],
  );

  // Reset the highlight whenever the query narrows/widens the list.
  useEffect(() => setIndex(0), [active?.query]);

  const select = useCallback(
    (person: ChatPerson) => {
      // Re-read the range at select time so a query typed after the last render
      // is still fully removed before the pill is inserted.
      const match = editor.triggerQuery('@');
      if (match) editor.run('deleteRange', { from: match.from, to: match.to });
      editor.run('insertMention', { id: person.id, label: person.label });
      editor.focus();
      setActive(null);
    },
    [editor],
  );

  const dismiss = useCallback(() => {
    dismissedFrom.current = activeRef.current?.from ?? null;
    setActive(null);
  }, []);

  // Own ↑/↓/Enter/Tab/Esc only while open — the editor keeps focus, so intercept
  // at capture and stop these keys from moving the caret / inserting a newline.
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
  }, [active, dismiss, select]);

  return (
    <FloatingShell
      open={Boolean(active && point)}
      anchor={point}
      side="bottom"
      contentKey={ordered.length}
      className="w-64"
      data-mention-menu=""
    >
      <ScrollArea className="max-h-72">
        <div className="p-1">
          {ordered.length === 0 ? (
            <Empty className="min-h-0 gap-1 border-0 p-6">
              <EmptyDescription>{emptyText}</EmptyDescription>
            </Empty>
          ) : (
            ordered.map((person, position) => {
              const highlighted = position === index;
              return (
                <Item
                  key={person.id}
                  size="sm"
                  data-highlighted={highlighted || undefined}
                  onMouseEnter={() => setIndex(position)}
                  // Keep the editor focused so the range survives the click.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => select(person)}
                  className={[
                    'cursor-pointer',
                    highlighted ? 'bg-accent text-accent-foreground' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {person.icon && (
                    <ItemMedia
                      variant="icon"
                      className="size-8 rounded-md border bg-secondary text-base"
                    >
                      {person.icon}
                    </ItemMedia>
                  )}
                  <ItemContent className="gap-0.5">
                    <ItemTitle>{person.label}</ItemTitle>
                    {person.description && (
                      <ItemDescription className="line-clamp-1">
                        {person.description}
                      </ItemDescription>
                    )}
                  </ItemContent>
                </Item>
              );
            })
          )}
        </div>
      </ScrollArea>
    </FloatingShell>
  );
}
