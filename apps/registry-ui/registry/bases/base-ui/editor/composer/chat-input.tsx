'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import { ArrowUp } from 'lucide-react';
import { InputGroup, InputGroupAddon, InputGroupButton } from '@/registry/bases/base-ui/ui/input-group';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { createDocumentEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { createNodeViewRenderer } from '../document/node-view-adapter';
import { COMPOSER_TOP_CONTENT, composerKit } from './composer-kit';
import { defaultComposerTriggers, type ComposerTrigger } from './composer-triggers';
import type { ChatMessagePayload } from '@zeroxsolutions/editor-core/composer/composer-types';
import { docToPayload } from '@zeroxsolutions/editor-core/composer/message-payload';
import { TriggerLayer } from './triggers/trigger-layer.js';

/**
 * The chat composer input - a contentEditable single line that highlights every
 * registered inline trigger (an `@mention` pill, a leading `/command` pill, and
 * any host-registered trigger) and emits a structured payload on submit. It
 * builds the editor over `composerKit()` on the single-block `paragraph`
 * substrate plus each trigger's node feature, and mounts the generic
 * `TriggerLayer` (one menu per pill trigger) - no `@ui -> @editor` edge, the
 * ProseMirror DOM riding the design tokens (the sanctioned foreign-engine
 * exception). Every pill lives in the document (not surface state), so the one
 * shared codec renders it identically here and in `ChatMessageView`. `Enter`
 * submits and clears; `Shift+Enter` inserts a newline.
 */
export interface ChatInputProps {
  /** The trigger registry - defaults to the shipped `@mention` + `/command`.
   *  Adding a trigger is adding a `ComposerTrigger` to this list. */
  triggers?: ComposerTrigger[];
  /** Placeholder shown when the input is empty. */
  placeholder?: string;
  /** Emitted on submit; the input clears afterwards. */
  onSubmit(payload: ChatMessagePayload): void;
  /** Called once with the engine-free façade when the editor is ready. */
  onReady?(editor: IEditor): void;
  className?: string;
}

const EMPTY_DOC = { type: 'doc' as const, content: [{ type: 'paragraph' }] };

export function ChatInput({ triggers, placeholder = 'Message...', onSubmit, onReady, className }: ChatInputProps) {
  // Default to the shipped triggers once; a caller-supplied array should be
  // stable (memoised) since the editor is built from it on mount.
  const resolvedTriggers = useMemo(() => triggers ?? defaultComposerTriggers(), [triggers]);
  const tokens = useMemo(() => resolvedTriggers.map((trigger) => trigger.token), [resolvedTriggers]);

  // The raw engine instance - handed to `@tiptap/react`'s `EditorContent` so the
  // pill node-view portals mount (typed `unknown`: no engine leaks).
  const [engine, setEngine] = useState<unknown>(null);
  const [editor, setEditor] = useState<IEditor | null>(null);

  const editorRef = useRef<IEditor | null>(null);
  const callbacks = useRef({ onSubmit, onReady });
  callbacks.current = { onSubmit, onReady };
  const tokensRef = useRef(tokens);
  tokensRef.current = tokens;
  // The build inputs, read once on mount (a structural change would need a
  // remount, which this surface never does).
  const buildRef = useRef({ placeholder, triggers: resolvedTriggers });
  buildRef.current = { placeholder, triggers: resolvedTriggers };

  useEffect(() => {
    const built = createDocumentEditor({
      features: [
        composerKit({ placeholder: buildRef.current.placeholder }),
        ...buildRef.current.triggers.map((trigger) => trigger.feature),
      ],
      topContent: COMPOSER_TOP_CONTENT,
      editable: true,
      nodeViewRenderer: createNodeViewRenderer(),
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
    // The payload derives entirely from the document + the registered tokens.
    const payload = docToPayload(current.getJSON(), tokensRef.current);
    // Don't submit an empty message (a pill contributes its literal text).
    if (!payload.text.trim()) return;
    callbacks.current.onSubmit(payload);
    current.setContent(EMPTY_DOC);
    current.focus();
  }, []);

  // `Enter` (no shift) submits - intercepted in capture on the composer wrapper
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
      <InputGroup className={cn('h-auto min-h-9 items-center gap-1.5 px-2 py-1.5', className)}>
        <div
          ref={wrapperRef}
          data-slot="input-group-control"
          className="chat-composer [&_.ProseMirror]:text-foreground min-w-0 flex-1 [&_.ProseMirror]:min-h-6 [&_.ProseMirror]:py-1 [&_.ProseMirror]:text-sm"
        >
          <EditorContent editor={engine as never} />
        </div>
        <InputGroupAddon align="inline-end" className="py-0 pr-0">
          <InputGroupButton size="icon-sm" aria-label="Send" onClick={submit} className="ml-auto">
            <ArrowUp />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {editor && <TriggerLayer editor={editor} triggers={tokens} />}
    </>
  );
}
