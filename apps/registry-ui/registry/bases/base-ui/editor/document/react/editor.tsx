'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent } from '@tiptap/react';
import { GripVertical, Plus } from 'lucide-react';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { createDocumentEditor } from '@zeroxsolutions/editor-core/document/core/create-document-editor';
import type { Delta } from '@zeroxsolutions/editor-core/document/core/types/delta';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/types/editor';
import type { EditorFeature } from '@zeroxsolutions/editor-core/document/core/types/feature';
import type { DocJSON } from '@zeroxsolutions/editor-core/document/core/types/json';
import { createNodeViewRenderer } from '../node-view-adapter';

/**
 * The editable `<Editor/>` surface. It mounts the engine-backed editor into a
 * DOM element on mount and tears it down on unmount, exposing only the `IEditor`
 * façade to callers (`onReady`) — no engine type crosses the props boundary. The
 * engine lives in this component's module graph (as expected for the editable
 * surface); the static `<Viewer/>` deliberately does not import it.
 */
export interface EditorProps {
  features?: EditorFeature[];
  content?: DocJSON;
  editable?: boolean;
  className?: string;
  /** Called once with the façade when the editor is ready. */
  onReady?(editor: IEditor): void;
  /** Called with each step-sized delta as the document changes. */
  onChange?(delta: Delta): void;
}

export function Editor({
  features,
  content,
  editable = true,
  className,
  onReady,
  onChange,
}: EditorProps) {
  // The raw engine instance — needed only to hand to `@tiptap/react`'s
  // `EditorContent`, which hosts the React node-view portals (without it, custom
  // node views never mount and render as bare `<div>`s). Typed `unknown`: no
  // engine type crosses this component's props/exports.
  const [engine, setEngine] = useState<unknown>(null);
  const editorRef = useRef<IEditor | null>(null);
  const callbacks = useRef({ onReady, onChange });
  callbacks.current = { onReady, onChange };

  // Build once on mount; changing `features`/`content` structurally requires a
  // remount (pass a React `key`). Editable is updated imperatively below.
  useEffect(() => {
    const editor = createDocumentEditor({
      features,
      content,
      editable,
      nodeViewRenderer: createNodeViewRenderer(),
      // Mount into a detached holder; `EditorContent` below adopts the view DOM
      // and calls `createNodeViews()` once its portal host exists.
      element: document.createElement('div'),
      onEngine: (raw) => setEngine(raw),
      onChange: (delta) => callbacks.current.onChange?.(delta),
    });
    editorRef.current = editor;
    callbacks.current.onReady?.(editor);
    return () => {
      editor.destroy();
      editorRef.current = null;
      setEngine(null);
    };
    // Intentionally build once — see the note above.
  }, []);

  useEffect(() => {
    editorRef.current?.setEditable(editable);
  }, [editable]);

  // The editor root (`[data-editor="document"]`) — the anchor for the drag
  // handle, the "+" affordance, and the grayout-while-dragging class below.
  const [rootEl, setRootEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const dom = (engine as { view?: { dom?: HTMLElement } } | null)?.view?.dom;
    setRootEl(dom?.closest<HTMLElement>('[data-editor="document"]') ?? null);
  }, [engine]);

  // The drag handle the extension injects is a bare `<div>` (not a React node),
  // so its grip can't be a component prop. Locate it and render the house
  // `GripVertical` icon into it via a portal — instead of faking a grip with a
  // CSS pseudo-element glyph, which isn't the design-system icon.
  const [handleEl, setHandleEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!rootEl) return;
    const found = () => {
      const el = rootEl.querySelector<HTMLElement>('.drag-handle');
      if (el) setHandleEl(el);
      return !!el;
    };
    if (found()) return;
    // The extension may inject the handle after mount — observe until it appears.
    const observer = new MutationObserver(() => {
      if (found()) observer.disconnect();
    });
    observer.observe(rootEl, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      setHandleEl(null);
    };
  }, [rootEl]);

  // Host the grip icon inside the handle through a wrapper node WE create — never
  // by portaling straight into `.drag-handle`. That handle is owned by the drag
  // extension, which tears its node down on `editor.destroy()`; portaling React
  // directly into it means React's own portal teardown races that removal and
  // throws `removeChild: not a child of this node` on unmount (a flaky crash on
  // every story/editor swap). Because React only ever removes the grip from OUR
  // span — which still parents it even after the extension detaches the handle —
  // the race is gone. `display: contents` keeps the span out of the handle's
  // layout, so the grip sits exactly where it did before.
  const [gripHost, setGripHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!handleEl) {
      setGripHost(null);
      return;
    }
    const host = document.createElement('span');
    host.style.display = 'contents';
    handleEl.appendChild(host);
    setGripHost(host);
    return () => {
      setGripHost(null);
      host.remove();
    };
  }, [handleEl]);

  // The "+" affordance sits just left of the drag handle and shadows its
  // position: the extension moves the handle (inline `style.left/top`) and
  // toggles its `.hide` class as the pointer crosses blocks, so mirror those
  // mutations onto the button. Clicking it inserts a new block below the hovered
  // one and opens the slash menu there (`insertBlockAt` types the `/`), the
  // Notion "+" behavior.
  const [plus, setPlus] = useState<{
    top: number;
    left: number;
    hidden: boolean;
  } | null>(null);
  useEffect(() => {
    if (!handleEl) {
      setPlus(null);
      return;
    }
    const sync = () => {
      const rect = handleEl.getBoundingClientRect();
      const hidden =
        handleEl.classList.contains('hide') ||
        getComputedStyle(handleEl).display === 'none';
      setPlus({ top: rect.top, left: rect.left, hidden });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(handleEl, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
    return () => observer.disconnect();
  }, [handleEl]);

  // Grayout-while-dragging: the block drag handle is a *sibling* of the editor
  // DOM (the extension appends it next to `.ProseMirror`), so a handle-initiated
  // drag's native `dragstart` never bubbles through `.ProseMirror` and the
  // extension's own `.dragging` class is never set. Track the drag on the editor
  // root instead — the handle's `dragstart`/`dragend`/`drop` all bubble up to it —
  // and toggle the class the stylesheet keys the grayout off.
  useEffect(() => {
    if (!rootEl) return;
    // Only a drag off the block handle toggles the grayout. A native
    // text/selection drag (e.g. highlighting the code-block header) or a node
    // view's own internal drag must NOT flip the editor into the dragging state:
    // such a drag has no matching handle `dragend`, so the grayout would stick
    // after the pointer is released. Scope the start to THIS editor's own
    // `.drag-handle`; listen for the end on `document` so it's caught even if the
    // handle is repositioned mid-drag — that keeps the class from ever sticking.
    const start = (event: DragEvent) => {
      const handle = (event.target as HTMLElement | null)?.closest?.(
        '.drag-handle',
      );
      if (handle && rootEl.contains(handle))
        rootEl.classList.add('is-dragging');
    };
    const end = () => rootEl.classList.remove('is-dragging');
    document.addEventListener('dragstart', start);
    document.addEventListener('dragend', end);
    document.addEventListener('drop', end);
    return () => {
      document.removeEventListener('dragstart', start);
      document.removeEventListener('dragend', end);
      document.removeEventListener('drop', end);
      rootEl.classList.remove('is-dragging');
    };
  }, [rootEl]);

  return (
    <>
      <EditorContent
        editor={engine as never}
        data-editor="document"
        className={cn(
          'document-editor prose max-w-none text-base leading-relaxed focus:outline-none',
          className,
        )}
      />
      {gripHost &&
        createPortal(<GripVertical size={16} aria-hidden />, gripHost)}
      {rootEl &&
        plus &&
        !plus.hidden &&
        createPortal(
          <button
            type="button"
            aria-label="Insert block below"
            draggable={false}
            data-editor-add
            // Keep the editor focused (so `insertBlockAt` has a live selection to
            // work from) and don't let the press bubble into a handle drag.
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => {
              const rect = handleEl?.getBoundingClientRect();
              if (rect) {
                editorRef.current?.run('insertBlockAt', {
                  y: rect.top + rect.height / 2,
                });
              }
            }}
            className="fixed z-40 flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-55 transition hover:bg-accent hover:opacity-100"
            style={{ top: plus.top, left: plus.left - 22 }}
          >
            <Plus size={16} aria-hidden />
          </button>,
          rootEl,
        )}
    </>
  );
}
