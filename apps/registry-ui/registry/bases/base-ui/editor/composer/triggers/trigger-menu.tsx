'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/registry/bases/base-ui/ui/item';
import { Empty, EmptyDescription } from '@/registry/bases/base-ui/ui/empty';
import { Popover, PopoverContent } from '@/registry/bases/base-ui/ui/popover';
import { ScrollArea } from '@/registry/bases/base-ui/ui/scroll-area';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type {
  CaretRect,
  IEditor,
  TriggerQuery,
} from '@zeroxsolutions/editor-core/document/core/index';
import { rectAnchor } from '../../document/ui/selection-rect.js';
import {
  defaultTriggerFilter,
  type TriggerOption,
  type TriggerToken,
} from '@zeroxsolutions/editor-core/composer/triggers/trigger-token';

/**
 * The one generic suggestion menu, driven by a `TriggerToken` descriptor - the
 * merge of the two hand-written `mention-menu` / `command-menu` (they were ~85%
 * identical). Typing the token's char leaves the `char query` as visible text
 * highlighted on the composer accent; the popup is a caret-anchored `Popover`
 * (the shipped primitive, non-modal by default and with `initialFocus={false}`
 * so the editor keeps focus and the typed query keeps flowing in) whose rows /
 * empty-state / scrolling are the design-system `Item` / `Empty` /
 * `ScrollArea`. Selecting an option deletes the typed query and commits the
 * token via `token.insert`.
 *
 * Every divergence between the old menus is read off the descriptor, not
 * branched here: `gate` (anywhere vs input-start), `queryField` (which text the
 * ghost/space-commit target), `commitOnSpace`, and `backspaceRestore`. The
 * inline-highlight write is non-interfering - the menu clears the shared slot
 * only if it previously painted it - so sibling token menus never wipe each
 * other's highlight.
 */
export interface TriggerMenuProps {
  editor: IEditor;
  token: TriggerToken;
}

/** The option text the typed query completes and commit-on-space matches - the
 *  label for a reference, the slug (or id) for an invocation. */
function queryText(token: TriggerToken, option: TriggerOption): string {
  return token.queryField === 'slug'
    ? (option.slug ?? option.id)
    : option.label;
}

/** Whether the char begins the single-block input - reads the canonical JSON so
 *  it stays engine-free. A committed leading token node makes this false, which
 *  is what keeps an invocation start-only and single. */
function charAtInputStart(editor: IEditor, char: string): boolean {
  const first = editor.getJSON().content?.[0]?.content?.[0];
  return first?.type === 'text' && (first.text ?? '').startsWith(char);
}

/** The [1, 2) range of the leading inline atom when it is a committed node of
 *  this token's type, plus the query text to restore (the char's editable form -
 *  the field the token queries against). Null otherwise. Position 1 is the start
 *  of the one paragraph's content (the `topContent: 'paragraph'` schema). Reads
 *  the raw node attrs directly - not `readRef`, whose per-token ref shape may
 *  rename the field (a command's slug becomes `name`). */
function leadingTokenNode(
  editor: IEditor,
  token: TriggerToken,
): { text: string; from: number; to: number } | null {
  const first = editor.getJSON().content?.[0]?.content?.[0];
  if (!first || first.type !== token.nodeName) return null;
  const attrs = (first.attrs ?? {}) as Record<string, unknown>;
  const query =
    token.queryField === 'slug'
      ? (attrs.slug ?? attrs.id ?? '')
      : (attrs.label ?? attrs.id ?? '');
  return { text: String(query), from: 1, to: 2 };
}

export function TriggerMenu({ editor, token }: TriggerMenuProps) {
  const [active, setActive] = useState<TriggerQuery | null>(null);
  const [point, setPoint] = useState<CaretRect | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<TriggerOption[]>([]);
  // Position dismissed via Esc - suppress reopening at the same char until the
  // caret moves to a different trigger (or none).
  const dismissedFrom = useRef<number | null>(null);

  const ordered = useMemo(
    () => (token.filter ?? defaultTriggerFilter)(results, active?.query ?? ''),
    [token, results, active?.query],
  );

  const orderedRef = useRef(ordered);
  orderedRef.current = ordered;
  const indexRef = useRef(index);
  indexRef.current = index;
  const activeRef = useRef(active);
  activeRef.current = active;

  // Recompute the trigger state on every doc/selection/focus change (plus scroll
  // and resize, so the popup follows the caret): open at the caret when the
  // token's `char query` is present and passes the gate; close otherwise. No
  // keystroke is intercepted - the char is ordinary typed text, kept visible.
  useEffect(() => {
    const sync = () => {
      if (!editor.isEditable() || !editor.isFocused()) {
        setActive(null);
        return;
      }
      const query = editor.triggerQuery(token.char);
      const gated =
        token.gate === 'line-start' && !charAtInputStart(editor, token.char);
      if (!query || gated) {
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
  }, [editor, token]);

  // Query the source as the typed query changes. A sync array populates
  // immediately (no microtask defer, so the list is present on first paint); a
  // promise resolves later and ignores a stale in-flight result on cancel.
  useEffect(() => {
    if (!active) return;
    const out = token.source(active.query);
    if (!(out instanceof Promise)) {
      setResults(out);
      return;
    }
    let cancelled = false;
    out.then((options) => {
      if (!cancelled) setResults(options);
    });
    return () => {
      cancelled = true;
    };
  }, [token, active]);

  // The inline completion ghost: the highlighted option's query text when it
  // extends what's typed (a prefix match), else nothing.
  const ghost = useMemo(() => {
    if (!active || active.query.length === 0) return '';
    const text = ordered[index] ? queryText(token, ordered[index]) : '';
    return text.toLowerCase().startsWith(active.query.toLowerCase())
      ? text.slice(active.query.length)
      : '';
  }, [token, active, ordered, index]);

  // Paint the `char query` highlight (+ completion ghost) while open, clearing
  // it only if THIS menu painted it (so a sibling token menu is never wiped).
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

  useEffect(() => setIndex(0), [active?.query]);

  const select = useCallback(
    (option: TriggerOption) => {
      // Re-read the range at select time so a query typed after the last render
      // is still fully removed before the token is committed.
      const match = editor.triggerQuery(token.char);
      if (match) editor.run('deleteRange', { from: match.from, to: match.to });
      token.insert(editor, option);
      editor.focus();
      setActive(null);
    },
    [editor, token],
  );

  const dismiss = useCallback(() => {
    dismissedFrom.current = activeRef.current?.from ?? null;
    setActive(null);
  }, []);

  // Own the keys while the menu is open (the editor keeps focus): arrows move the
  // highlight; Enter/Tab commit; Esc dismisses; and - when the token opts in -
  // Space commits when the typed query is the exact query-text/label of an
  // option (Discord-style auto-detect), otherwise Space falls through literally.
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
        setIndex((i) =>
          list.length ? (i - 1 + list.length) % list.length : 0,
        );
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        if (!list.length) return;
        event.preventDefault();
        event.stopPropagation();
        select(list[indexRef.current] ?? list[0]);
        return;
      }
      if (event.key === ' ' && token.commitOnSpace) {
        const needle = (activeRef.current?.query ?? '').trim().toLowerCase();
        const exact = list.find(
          (option) =>
            queryText(token, option).toLowerCase() === needle ||
            option.label.toLowerCase() === needle,
        );
        if (exact) {
          event.preventDefault();
          event.stopPropagation();
          select(exact);
        }
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [token, active, dismiss, select]);

  // Backspace on a committed leading pill restores it to editable `char slug`
  // text (invocation only). The caret right after the leading node - or that
  // node selected - deletes it and re-inserts the slug, which re-triggers this
  // menu. Active whenever such a node leads the line, independent of open state.
  useEffect(() => {
    if (!token.backspaceRestore) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Backspace') return;
      const node = leadingTokenNode(editor, token);
      if (!node) return;
      const selection = editor.getSelection();
      const afterNode = selection.empty && selection.from === node.to;
      const nodeSelected =
        selection.from === node.from && selection.to === node.to;
      if (!afterNode && !nodeSelected) return;
      event.preventDefault();
      event.stopPropagation();
      editor.run('deleteRange', { from: node.from, to: node.to });
      editor.run('insertContent', {
        content: { type: 'text', text: `${token.char}${node.text}` },
      });
      editor.focus();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [editor, token]);

  return (
    <Popover open={Boolean(active && point)}>
      <PopoverContent
        anchor={rectAnchor(point)}
        side="bottom"
        align="start"
        // The editor owns the caret; the popover must not steal focus on open.
        initialFocus={false}
        data-slot="trigger-menu"
        data-token-kind={token.kind}
        className="w-64 gap-0 p-0"
      >
        <ScrollArea className="max-h-72">
          <div className="p-1">
            {ordered.length === 0 ? (
              <Empty className="min-h-0 gap-1 border-0 p-6">
                <EmptyDescription>
                  {token.emptyText ?? 'No matches'}
                </EmptyDescription>
              </Empty>
            ) : (
              ordered.map((option, position) => {
                const highlighted = position === index;
                return (
                  <Item
                    key={option.id}
                    size="sm"
                    data-highlighted={highlighted || undefined}
                    onMouseEnter={() => setIndex(position)}
                    // Keep the editor focused so the range survives the click.
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => select(option)}
                    className={cn(
                      'cursor-pointer',
                      highlighted && 'bg-accent text-accent-foreground',
                    )}
                  >
                    {(option.icon as ReactNode) && (
                      <ItemMedia
                        variant="icon"
                        className={
                          token.menuMediaClassName ?? 'text-muted-foreground'
                        }
                      >
                        {option.icon as ReactNode}
                      </ItemMedia>
                    )}
                    <ItemContent className="gap-0.5">
                      <ItemTitle>{option.label}</ItemTitle>
                      {option.description && (
                        <ItemDescription className="line-clamp-1">
                          {option.description}
                        </ItemDescription>
                      )}
                    </ItemContent>
                  </Item>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
