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
import type { ChatCommand } from './composer-types.js';

/**
 * The `/` command menu — the Discord-style adaptation of the document
 * `slash-menu.tsx`. Selecting a command (Tab / Enter / click) — or typing its
 * full slug and pressing space — deletes the typed `/query` and inserts an inline
 * **command node** that still reads `/name` (the `slashCommand()` atom), so the
 * command stays visible in the line as one deletable unit rather than a separate
 * surface chip. It differs from the `@` mention menu in three ways: it opens
 * **only at the input start** (a mid-line `/` stays literal text), at most **one**
 * command can lead the line (a second is impossible once the node sits at the
 * front), and **Backspace** on the committed pill re-opens it as editable `/name`
 * text. The popup shell, rows, and inline highlight are otherwise identical to the
 * mention menu.
 */
export interface CommandMenuProps {
  editor: IEditor;
  /** The caller-supplied commands, filtered here by slug + label. */
  commands: ChatCommand[];
  /** Empty-state text when nothing matches. */
  emptyText?: string;
}

/** The command's invocation slug — the token typed after `/` and shown in the
 *  pill; falls back to the id when a command declares no explicit `name`. */
function commandSlug(command: ChatCommand): string {
  return command.name || command.id;
}

/** Case-insensitive match of the typed query against the slug and the label. */
function filterCommands(commands: ChatCommand[], query: string): ChatCommand[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return commands;
  return commands.filter(
    (command) =>
      commandSlug(command).toLowerCase().includes(needle) ||
      command.label.toLowerCase().includes(needle),
  );
}

/** Whether the `/` begins the single-block input (no command node, text/atom, or
 *  whitespace before it) — reads the canonical JSON, so it stays engine-free. A
 *  leading `command` node makes this false, which is what keeps the line to one
 *  command and the menu start-only. */
function slashAtInputStart(editor: IEditor): boolean {
  const first = editor.getJSON().content?.[0]?.content?.[0];
  return first?.type === 'text' && (first.text ?? '').startsWith('/');
}

/** The document range [1, 2) the leading inline atom occupies, when that atom is
 *  a committed command node; `null` otherwise. Position 1 is the start of the one
 *  paragraph's content (guaranteed by the `topContent: 'paragraph'` schema). */
function leadingCommandNode(
  editor: IEditor,
): { name: string; from: number; to: number } | null {
  const first = editor.getJSON().content?.[0]?.content?.[0];
  if (first?.type !== 'command') return null;
  const attrs = first.attrs as { name?: string; id?: string } | undefined;
  return { name: attrs?.name || attrs?.id || '', from: 1, to: 2 };
}

export function CommandMenu({
  editor,
  commands,
  emptyText = 'No commands found',
}: CommandMenuProps) {
  const [trigger, setTrigger] = useState<TriggerQuery | null>(null);
  const [point, setPoint] = useState<CaretRect | null>(null);
  const [index, setIndex] = useState(0);
  // Position dismissed via Esc — suppress reopening at the same `/` until the
  // caret moves to a different trigger (or none).
  const dismissedFrom = useRef<number | null>(null);

  const ordered = useMemo(
    () => filterCommands(commands, trigger?.query ?? ''),
    [commands, trigger?.query],
  );
  const orderedRef = useRef(ordered);
  orderedRef.current = ordered;
  const indexRef = useRef(index);
  indexRef.current = index;
  const triggerRef = useRef(trigger);
  triggerRef.current = trigger;

  // Open at the caret only when a `/query` begins the input; close otherwise. No
  // `/` keystroke is intercepted — the `/` is ordinary typed text, kept visible.
  useEffect(() => {
    const sync = () => {
      if (!editor.isEditable() || !editor.isFocused()) {
        setTrigger(null);
        return;
      }
      const query = editor.triggerQuery('/');
      if (!query || !slashAtInputStart(editor)) {
        dismissedFrom.current = null;
        setTrigger(null);
        return;
      }
      if (dismissedFrom.current === query.from) {
        setTrigger(null);
        return;
      }
      setTrigger(query);
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

  // The inline completion ghost: the highlighted command's slug when it extends
  // what's typed (a prefix match), else nothing.
  const ghost = useMemo(() => {
    if (!trigger || trigger.query.length === 0) return '';
    const slug = ordered[index] ? commandSlug(ordered[index]) : '';
    return slug.toLowerCase().startsWith(trigger.query.toLowerCase())
      ? slug.slice(trigger.query.length)
      : '';
  }, [trigger, ordered, index]);

  // Paint the `/query` highlight (+ completion ghost) while open, clearing it
  // only if THIS menu painted it (so the sibling `@` menu is never wiped).
  const painted = useRef(false);
  useEffect(() => {
    if (trigger) {
      editor.setSlashDecoration({ from: trigger.from, to: trigger.to, ghost });
      painted.current = true;
    } else if (painted.current) {
      editor.setSlashDecoration(null);
      painted.current = false;
    }
  }, [editor, trigger, ghost]);
  useEffect(
    () => () => {
      if (painted.current) editor.setSlashDecoration(null);
    },
    [editor],
  );

  useEffect(() => setIndex(0), [trigger?.query]);

  const select = useCallback(
    (command: ChatCommand) => {
      // Re-read the range at select time, delete the typed `/query`, and insert
      // the inline command node in its place (still reading `/name`).
      const match = editor.triggerQuery('/');
      if (match) editor.run('deleteRange', { from: match.from, to: match.to });
      editor.run('insertCommand', {
        id: command.id,
        label: command.label,
        name: commandSlug(command),
      });
      editor.focus();
      setTrigger(null);
    },
    [editor],
  );

  const dismiss = useCallback(() => {
    dismissedFrom.current = triggerRef.current?.from ?? null;
    setTrigger(null);
  }, []);

  // Own the keys while the menu is open (the editor keeps focus): arrows move the
  // highlight; Enter/Tab commit it; Esc dismisses; and Space commits when the
  // typed query is the exact slug/label of a command (Discord-style auto-detect),
  // otherwise Space falls through as a literal (which ends the query and closes).
  useEffect(() => {
    if (!trigger) return;
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
        return;
      }
      if (event.key === ' ') {
        const needle = (triggerRef.current?.query ?? '').trim().toLowerCase();
        const exact = list.find(
          (command) =>
            commandSlug(command).toLowerCase() === needle ||
            command.label.toLowerCase() === needle,
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
  }, [trigger, dismiss, select]);

  // Backspace on the committed pill re-opens it as editable `/name` text — the
  // caret sitting right after the leading command node (or that node selected)
  // deletes the node and re-inserts the slug, which re-triggers this menu. Active
  // whenever a command leads the line, independent of the menu being open.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Backspace') return;
      const node = leadingCommandNode(editor);
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
        content: { type: 'text', text: `/${node.name}` },
      });
      editor.focus();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [editor]);

  return (
    <FloatingShell
      open={Boolean(trigger && point)}
      anchor={point}
      side="bottom"
      contentKey={ordered.length}
      className="w-64"
      data-command-menu=""
    >
      <ScrollArea className="max-h-72">
        <div className="p-1">
          {ordered.length === 0 ? (
            <Empty className="min-h-0 gap-1 border-0 p-6">
              <EmptyDescription>{emptyText}</EmptyDescription>
            </Empty>
          ) : (
            ordered.map((command, position) => {
              const highlighted = position === index;
              return (
                <Item
                  key={command.id}
                  size="sm"
                  data-highlighted={highlighted || undefined}
                  onMouseEnter={() => setIndex(position)}
                  // Keep the editor focused so the range survives the click.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => select(command)}
                  className={[
                    'cursor-pointer',
                    highlighted ? 'bg-accent text-accent-foreground' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {command.icon && (
                    // The shipped light icon column (never the doc slash-menu's
                    // heavy bordered avatar square). `variant="icon"` owns the
                    // glyph size via the house `:not([class*='size-'])` escape
                    // hatch, so we add no size of our own. Rendered only when the
                    // command carries an icon, exactly like the mention menu.
                    <ItemMedia variant="icon" className="text-muted-foreground">
                      {command.icon}
                    </ItemMedia>
                  )}
                  <ItemContent className="gap-0.5">
                    <ItemTitle>{command.label}</ItemTitle>
                    {command.description && (
                      <ItemDescription className="line-clamp-1">
                        {command.description}
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
