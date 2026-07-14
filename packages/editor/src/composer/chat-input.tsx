'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import { ArrowUp } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from '@zeroxsolutions/ui/components/ui/input-group';
import { createDocumentEditor } from '../document/core/index.js';
import type { IEditor } from '../document/core/index.js';
import { mention } from '../document/features/mention/index.js';
import { COMPOSER_TOP_CONTENT, composerKit } from './composer-kit.js';
import { slashCommand } from './command-node.js';
import type { ChatCommand, ChatMessagePayload, ChatPerson } from './composer-types.js';
import { CommandMenu } from './command-menu.js';
import { docToPayload } from './message-payload.js';
import { MentionMenu } from './mention-menu.js';

/**
 * The chat composer input — a contentEditable single text line that highlights
 * inline `@` mentions (resolved `{ id, label }` pills) and a leading `/command`
 * token (an inline `/name` pill, Discord-style), and emits a structured payload
 * on submit. It builds the editor over `composerKit()` on the single-block
 * `paragraph` substrate with the `mention()` and `slashCommand()` inline atoms,
 * mounts the `@` and `/` menus, and assembles the whole surface from the design
 * system's `InputGroup` shell — no `@ui → @editor` edge, the ProseMirror DOM
 * riding the design tokens (the sanctioned foreign-engine exception). The command
 * lives **in the document** (not surface state), so the one shared codec renders
 * it identically here and in `ChatMessageView`. `Enter` submits and clears;
 * `Shift+Enter` inserts a newline.
 */
export interface ChatInputProps {
  /** People offered in the `@` menu, filtered by label. */
  people?: ChatPerson[];
  /** An async (or sync) people source queried as the user types; supersedes
   *  `people` and the caller owns the filtering. */
  onQueryPeople?(query: string): ChatPerson[] | Promise<ChatPerson[]>;
  /** Commands offered in the `/` menu (start-only). */
  commands?: ChatCommand[];
  /** Placeholder shown when the input is empty. */
  placeholder?: string;
  /** Emitted on submit; the input clears afterwards. */
  onSubmit(payload: ChatMessagePayload): void;
  /** Called once with the engine-free façade when the editor is ready. */
  onReady?(editor: IEditor): void;
  className?: string;
}

const EMPTY_DOC = { type: 'doc' as const, content: [{ type: 'paragraph' }] };

export function ChatInput({
  people,
  onQueryPeople,
  commands = [],
  placeholder = 'Message…',
  onSubmit,
  onReady,
  className,
}: ChatInputProps) {
  // The raw engine instance — handed to `@tiptap/react`'s `EditorContent` so the
  // mention/command node-view portals mount (typed `unknown`: no engine leaks).
  const [engine, setEngine] = useState<unknown>(null);
  const [editor, setEditor] = useState<IEditor | null>(null);

  const editorRef = useRef<IEditor | null>(null);
  const callbacks = useRef({ onSubmit, onReady });
  callbacks.current = { onSubmit, onReady };

  // Build once on mount; a structural change (features/substrate) would need a
  // remount, which this surface never does.
  useEffect(() => {
    const built = createDocumentEditor({
      features: [composerKit({ placeholder }), mention(), slashCommand()],
      topContent: COMPOSER_TOP_CONTENT,
      editable: true,
      element: document.createElement('div'),
      onEngine: (raw) => setEngine(raw),
    });
    editorRef.current = built;
    setEditor(built);
    callbacks.current.onReady?.(built);
    return () => {
      built.destroy();
      editorRef.current = null;
      setEditor(null);
      setEngine(null);
    };
    // Intentionally build once.
  }, []);

  const submit = useCallback(() => {
    const current = editorRef.current;
    if (!current) return;
    // The command is an inline node in the document now, so the payload derives
    // entirely from the document — no surface state to thread in.
    const payload = docToPayload(current.getJSON());
    // Don't submit an empty message (no command, no text, no mentions).
    if (!payload.command && payload.segments.length === 0) return;
    callbacks.current.onSubmit(payload);
    current.setContent(EMPTY_DOC);
    current.focus();
  }, []);

  // `Enter` (no shift) submits — intercepted in capture on the composer wrapper
  // (an ancestor of the contenteditable) so it runs before ProseMirror's own
  // keydown. When a menu is open, its `document`-capture handler has already
  // stopped the Enter upstream, so this never fires and the menu owns the key;
  // `Shift+Enter` falls through to the engine (a hard-break newline).
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        submit();
      }
    };
    el.addEventListener('keydown', onKeyDown, true);
    return () => el.removeEventListener('keydown', onKeyDown, true);
  }, [submit]);

  return (
    <>
      <InputGroup
        className={[
          'h-auto min-h-9 items-center gap-1.5 px-2 py-1.5',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div
          ref={wrapperRef}
          data-slot="input-group-control"
          className="chat-composer min-w-0 flex-1 [&_.ProseMirror]:min-h-6 [&_.ProseMirror]:py-1 [&_.ProseMirror]:text-sm [&_.ProseMirror]:text-foreground"
        >
          <EditorContent editor={engine as never} />
        </div>
        <InputGroupAddon align="inline-end" className="py-0 pr-0">
          <InputGroupButton
            size="icon-sm"
            aria-label="Send"
            onClick={submit}
            className="ml-auto"
          >
            <ArrowUp />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {editor && (
        <>
          <MentionMenu
            editor={editor}
            people={people}
            onQueryPeople={onQueryPeople}
          />
          <CommandMenu editor={editor} commands={commands} />
        </>
      )}
    </>
  );
}
