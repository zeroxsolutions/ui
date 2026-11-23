'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent } from '@tiptap/react';
import {
  GripVerticalIcon,
  type GripVerticalIconHandle,
} from '@/registry/bases/base-ui/icons/lucide/grip-vertical-icon';
import { PlusIcon, type PlusIconHandle } from '@/registry/bases/base-ui/icons/lucide/plus-icon';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { createDocumentEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { Delta, IEditor, EditorFeature, DocJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import { createNodeViewRenderer } from '../node-view-adapter';
import { EditorBlockMenu } from './editor-block-menu';

/**
 * The editable `<Editor/>` surface. It mounts the engine-backed editor into a
 * DOM element on mount and tears it down on unmount, exposing only the `IEditor`
 * facade to callers (`onReady`) - no engine type crosses the props boundary. The
 * engine lives in this component's module graph (as expected for the editable
 * surface); the static `<Viewer/>` deliberately does not import it.
 */
export interface EditorProps {
  features?: EditorFeature[];
  content?: DocJSON;
  editable?: boolean;
  className?: string;
  /** Called once with the facade when the editor is ready. */
  onReady?(editor: IEditor): void;
  /** Called with each step-sized delta as the document changes. */
  onChange?(delta: Delta): void;
  /** The block menu's accessible name, in the host's words. Default: `Block actions`. */
  blockMenuLabel?: string;
}

/** A press on the grip that moves less than this is a click that opens the block menu; more is a drag. */
const GRIP_CLICK_SLOP_PX = 4;

export function Editor({
  features,
  content,
  editable = true,
  className,
  onReady,
  onChange,
  blockMenuLabel,
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
  const gripRef = useRef<GripVerticalIconHandle>(null);
  const plusRef = useRef<PlusIconHandle>(null);
  // The handle is the extension's own node and takes no focus, so only the pointer reaches the grip, through listeners.
  useEffect(() => {
    if (!handleEl) return;
    const start = () => gripRef.current?.startAnimation();
    const stop = () => gripRef.current?.stopAnimation();
    handleEl.addEventListener('pointerenter', start);
    handleEl.addEventListener('pointerleave', stop);
    return () => {
      handleEl.removeEventListener('pointerenter', start);
      handleEl.removeEventListener('pointerleave', stop);
    };
  }, [handleEl]);
  const [menu, setMenu] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  // The features are read once on mount (see the note on the build effect), so the items are too.
  const [blockMenuItems] = useState(() => collectUiContributions(features ?? []).blockMenu);
  const press = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!handleEl || blockMenuItems.length === 0) return;
    const onPress = (event: PointerEvent) => {
      press.current = { x: event.clientX, y: event.clientY };
    };
    const onClick = (event: MouseEvent) => {
      const down = press.current;
      press.current = null;
      const moved = down ? Math.hypot(event.clientX - down.x, event.clientY - down.y) : 0;
      const editor = editorRef.current;
      if (moved >= GRIP_CLICK_SLOP_PX || !editor?.isEditable()) return;
      const rect = handleEl.getBoundingClientRect();
      if (!editor.run('selectBlockAt', { y: event.clientY, x: event.clientX, grip: true })) return;
      setMenu({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    handleEl.addEventListener('pointerdown', onPress);
    handleEl.addEventListener('click', onClick);
    return () => {
      handleEl.removeEventListener('pointerdown', onPress);
      handleEl.removeEventListener('click', onClick);
    };
  }, [handleEl, blockMenuItems]);

  // The extension's `dragstart` listener was added when the editor was built, so `dragBlockAt` runs after it
  // and replaces what it dragged with the block the grip's menu acts on.
  useEffect(() => {
    if (!handleEl) return;
    const onDragStart = (event: DragEvent) => {
      if (!event.dataTransfer) return;
      editorRef.current?.run('dragBlockAt', { y: event.clientY, x: event.clientX, data: event.dataTransfer });
    };
    const onDragEnd = () => editorRef.current?.run('endBlockDrag');
    handleEl.addEventListener('dragstart', onDragStart);
    handleEl.addEventListener('dragend', onDragEnd);
    return () => {
      handleEl.removeEventListener('dragstart', onDragStart);
      handleEl.removeEventListener('dragend', onDragEnd);
    };
  }, [handleEl]);

  // The keyboard way to the same menu: Mod-/ picks what the grip beside the caret would, such as the list item
  // holding it, and opens the menu at that block.
  useEffect(() => {
    if (!rootEl || blockMenuItems.length === 0) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key !== '/') return;
      const editor = editorRef.current;
      const view = (engine as { view?: { dom: Element; nodeDOM(pos: number): Node | null } } | null)?.view;
      const target = event.target instanceof Element ? event.target : null;
      // A code view keeps its own keys (Mod-/ comments a line in a code block). A field inside a block's view
      // takes the focus without moving the editor's selection, so the menu opens only once its view has
      // selected its own block; otherwise it would open on whatever block the caret last sat in.
      if (event.defaultPrevented || !editor || !view || !target || target.closest('.cm-editor')) return;
      if (target !== view.dom) {
        const selection = editor.getSelection();
        if (!selection.isNode || !view.nodeDOM(selection.from)?.contains(target)) return;
      }
      const caret = editor.caretRect();
      if (!caret || !editor.isEditable()) return;
      event.preventDefault();
      if (!editor.run('selectBlockAt', { y: (caret.top + caret.bottom) / 2, x: caret.left, caret: true })) return;
      const block = view.nodeDOM(editor.getSelection().from);
      if (!(block instanceof HTMLElement)) return;
      const rect = block.getBoundingClientRect();
      setMenu({ top: rect.top, left: rect.left, width: 24, height: Math.min(rect.height, 24) });
    };
    rootEl.addEventListener('keydown', onKeyDown);
    return () => rootEl.removeEventListener('keydown', onKeyDown);
  }, [rootEl, engine, blockMenuItems]);

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
      const hidden = handleEl.classList.contains('hide') || getComputedStyle(handleEl).display === 'none';
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

  // The "+" is portaled into a wrapper we create, for the reason the grip's is: React removes it from
  // our node, never from the editor root, whose children the editor's own teardown removes first.
  const [plusHost, setPlusHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!rootEl) return;
    const host = document.createElement('span');
    host.style.display = 'contents';
    rootEl.appendChild(host);
    setPlusHost(host);
    return () => {
      setPlusHost(null);
      host.remove();
    };
  }, [rootEl]);

  // The extension hides its handle, and so the "+", whenever the pointer leaves the editor for anything
  // that is not the handle node itself. That includes the "+" a pointer is crossing to and the grip we
  // render inside the handle, so a pointer landing on the grip would hide the handle under it and show it
  // again on the next move. Keep that mouseout from reaching the extension, in the capture phase, while
  // it lands on either.
  useEffect(() => {
    if (!rootEl) return;
    const keepHandle = (event: MouseEvent) => {
      const to = event.relatedTarget;
      if (to instanceof Element && to.closest('[data-editor-add], .drag-handle')) event.stopPropagation();
    };
    rootEl.addEventListener('mouseout', keepHandle, true);
    return () => rootEl.removeEventListener('mouseout', keepHandle, true);
  }, [rootEl]);

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
      const handle = (event.target as HTMLElement | null)?.closest?.('.drag-handle');
      if (handle && rootEl.contains(handle)) rootEl.classList.add('is-dragging');
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
        // Its width comes from where it is placed, never from its content: a code line, a formula or a
        // diagram that does not wrap would otherwise widen the whole document instead of scrolling in its block.
        className={cn(
          'cn-editor-content document-editor prose max-w-none [contain:inline-size] text-base leading-relaxed focus:outline-none',
          className,
        )}
      />
      {gripHost &&
        createPortal(
          <span className="cn-button cn-button-variant-ghost cn-button-size-icon-sm flex size-full items-center justify-center">
            <GripVerticalIcon ref={gripRef} size={16} aria-hidden />
          </span>,
          gripHost,
        )}
      {plusHost && editorRef.current && blockMenuItems.length > 0 && (
        <EditorBlockMenu
          editor={editorRef.current}
          items={blockMenuItems}
          open={menu !== null}
          anchor={menu}
          label={blockMenuLabel}
          // The text itself, so ProseMirror puts its selection back as the focus arrives.
          returnFocus={() => (engine as { view?: { dom?: HTMLElement } } | null)?.view?.dom ?? null}
          onOpenChange={(open) => {
            if (!open) setMenu(null);
          }}
        />
      )}
      {plusHost &&
        plus &&
        !plus.hidden &&
        createPortal(
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Insert block below"
            draggable={false}
            data-editor-add
            onPointerEnter={() => plusRef.current?.startAnimation()}
            onPointerLeave={() => plusRef.current?.stopAnimation()}
            onFocus={() => plusRef.current?.startAnimation()}
            onBlur={() => plusRef.current?.stopAnimation()}
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
            // The gutter beside the grip is laid out for this size, whatever size the style draws. It sits on
            // the text surface, whose cursor is the I-beam, so it names its own cursor as the grip names grab.
            className="text-muted-foreground fixed z-40 size-6 cursor-pointer opacity-55 hover:opacity-100"
            style={{ top: plus.top, left: plus.left - 22 }}
          >
            <PlusIcon ref={plusRef} size={16} aria-hidden />
          </Button>,
          plusHost,
        )}
    </>
  );
}
