import { Editor, type Content, type Extensions } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { createPmStepsBackend } from './backend/pm-steps-backend.js';
import { makeBuiltInCommands } from './command/built-in-commands.js';
import { CommandRegistry } from './command/command-registry.js';
import { compileFeatures } from './feature-compiler/compile-features.js';
import {
  registerFacade,
  unregisterFacade,
} from './engine/facade-registry.js';
import type { EngineHandle } from './engine/engine-handle.js';
import { resolveFeatures } from './registry/feature-registry.js';
import type { Delta, Snapshot } from './types/delta.js';
import type {
  DocumentBackendFactory,
  IDocumentBackend,
} from './types/document-backend.js';
import type { EditorSelection, IEditor, TriggerQuery } from './types/editor.js';
import type { EditorFeature } from './types/feature.js';
import type { DocJSON } from './types/json.js';

/**
 * The one place the engine is instantiated and wired to the façade (task 2.2).
 * The Tiptap `Editor` never crosses a module boundary as a typed value, so this
 * file's only exported signature — `createDocumentEditor(config): IEditor` — is
 * engine-free. Everything a consumer touches is the `IEditor` contract.
 */
export interface DocumentEditorConfig {
  features?: EditorFeature[];
  content?: DocJSON;
  /** Swap the default step backend for another (e.g. a future CRDT backend). */
  backendFactory?: DocumentBackendFactory;
  /** DOM element to mount into; omit for a headless instance (tests/commands). */
  element?: HTMLElement;
  editable?: boolean;
  snapshotDebounceMs?: number;
  /** The top node's content expression (default `block+`). A compact surface —
   *  the chat composer — passes `paragraph` for a single-textblock schema. */
  topContent?: string;
  onChange?(delta: Delta): void;
  onSnapshot?(snapshot: Snapshot): void;
  /**
   * Internal seam: receive the raw engine instance (typed `unknown` so no engine
   * type leaks) so the React `<Editor/>` surface can drive `@tiptap/react`'s
   * node-view portal host (`EditorContent`). Not for consumer use.
   */
  onEngine?(engine: unknown): void;
}

const EMPTY_DOC: DocJSON = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

/** The slash menu's inline decoration: the gray `/query` highlight over
 *  `from…to`, plus optional faint `ghost` text right after the caret (the Notion
 *  `/<placeholder>` hint / autocomplete completion). Held in a ProseMirror plugin
 *  so it maps through edits. */
type SlashDeco = { from: number; to: number; ghost?: string } | null;
const SLASH_DECORATION_KEY = new PluginKey<SlashDeco>('slashDecoration');

/** A decoration-only plugin driven by the façade's `setSlashDecoration`. Meta-only
 *  updates change no document content, so they never emit a delta (the backend
 *  skips `!docChanged`) — no feedback loop with the chrome that drives it. */
const slashDecorationPlugin = (): Plugin<SlashDeco> =>
  new Plugin<SlashDeco>({
    key: SLASH_DECORATION_KEY,
    state: {
      init: () => null,
      apply(tr, value) {
        const meta = tr.getMeta(SLASH_DECORATION_KEY) as SlashDeco | undefined;
        if (meta !== undefined) return meta;
        if (!value) return null;
        // Keep the decoration over the same text as the doc changes around it.
        const from = tr.mapping.map(value.from);
        const to = tr.mapping.map(value.to);
        return to > from ? { ...value, from, to } : null;
      },
    },
    props: {
      decorations(state) {
        const deco = SLASH_DECORATION_KEY.getState(state);
        if (!deco) return null;
        const decorations = [
          Decoration.inline(deco.from, deco.to, { class: 'slash-active' }),
        ];
        if (deco.ghost) {
          // A non-editable widget after the caret (`side: 1`) — the faint inline
          // placeholder / autocomplete. Keyed on its text so it only re-renders
          // when the hint changes.
          const ghost = deco.ghost;
          decorations.push(
            Decoration.widget(
              deco.to,
              () => {
                const span = document.createElement('span');
                span.className = 'slash-ghost';
                span.textContent = ghost;
                return span;
              },
              { side: 1, key: `slash-ghost:${ghost}` },
            ),
          );
        }
        return DecorationSet.create(state.doc, decorations);
      },
    },
  });

export function createDocumentEditor(config: DocumentEditorConfig): IEditor {
  const features = resolveFeatures(config.features ?? []);
  const featureIds = new Set(features.map((feature) => feature.id));
  const extensions = compileFeatures(features, {
    topContent: config.topContent,
  }) as unknown as Extensions;
  const content = config.content ?? EMPTY_DOC;

  const makeBackend = config.backendFactory ?? createPmStepsBackend;
  const backend: IDocumentBackend = makeBackend({
    doc: content,
    snapshotDebounceMs: config.snapshotDebounceMs,
  });

  let ready = false;
  let destroyed = false;

  const engine = new Editor({
    extensions,
    content: content as unknown as Content,
    editable: config.editable ?? true,
    element: config.element,
    onTransaction: ({ transaction }) => {
      if (!ready || destroyed) return;
      backend.record({
        doc: engine.getJSON() as DocJSON,
        changes: transaction.steps.map((step) => step.toJSON()),
        docChanged: transaction.docChanged,
      });
    },
  });

  // The slash menu's inline decoration (gray `/query` highlight + ghost
  // placeholder/autocomplete) rides a decoration plugin, one per instance.
  engine.registerPlugin(slashDecorationPlugin());

  const handle = engine as unknown as EngineHandle;
  const registry = new CommandRegistry();
  for (const [name, command] of Object.entries(makeBuiltInCommands(handle))) {
    registry.register(name, command);
  }

  const getSelection = (): EditorSelection => {
    const selection = engine.state.selection;
    return {
      from: selection.from,
      to: selection.to,
      empty: selection.empty,
      nodeType: selection.$head?.parent?.type?.name,
      // A ProseMirror NodeSelection carries a `node`; a TextSelection/CellSelection
      // does not — that distinguishes a block/image pick-up from a text range.
      isNode: 'node' in selection,
    };
  };

  // Inline trigger detection (slash `/`, mention `@`). Reads the current
  // textblock's text before a collapsed caret and matches a trigger char that
  // begins the block or follows whitespace, capturing the non-space run after
  // it as the query. Returns the `char…caret` doc range so the chrome can delete
  // the typed `/query` when an item is chosen — the Notion inline flow.
  const triggerQuery = (char: string): TriggerQuery | null => {
    const { selection } = engine.state;
    if (!selection.empty) return null;
    const $from = selection.$from;
    if (!$from.parent.isTextblock) return null;
    const caret = selection.from;
    const parentStart = $from.start();
    // The object-replacement char (U+FFFC) keeps inline atoms one char wide, so
    // a text index lines up with a document offset within the block.
    const textBefore = $from.parent.textBetween(0, caret - parentStart, '\n', '￼');
    const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`(?:^|\\s)${escaped}(\\S*)$`).exec(textBefore);
    if (!match) return null;
    const query = match[1];
    return {
      query,
      from: parentStart + textBefore.length - query.length - char.length,
      to: caret,
    };
  };

  const facade: IEditor = {
    get status() {
      return destroyed ? 'destroyed' : 'ready';
    },
    getJSON: () => engine.getJSON() as DocJSON,
    getText: () => engine.getText(),
    setContent: (doc) => {
      engine.commands.setContent(doc as unknown as Content);
    },
    isEmpty: () => engine.isEmpty,
    can: (command, args) => registry.can(command, args),
    run: (command, args) => registry.dispatch(command, args),
    isActive: (name, attributes) =>
      engine.isActive(name, attributes as Record<string, unknown> | undefined),
    getSelection,
    caretRect: () => {
      // ProseMirror's `coordsAtPos` gives exact viewport coords for any
      // position — including an empty line — where the browser Selection rect of
      // a collapsed caret is unreliable (often reports 0,0). Engine-internal;
      // the returned shape is engine-agnostic.
      try {
        const coords = engine.view.coordsAtPos(engine.state.selection.head);
        return {
          top: coords.top,
          bottom: coords.bottom,
          left: coords.left,
          right: coords.right,
        };
      } catch {
        return null;
      }
    },
    triggerQuery,
    setSlashDecoration: (deco) => {
      // Skip a redundant dispatch so the chrome can call this on every change
      // without churning transactions (a meta-only tr emits no delta anyway).
      const current = SLASH_DECORATION_KEY.getState(engine.state) ?? null;
      const next = deco ?? null;
      const same =
        (!current && !next) ||
        (!!current &&
          !!next &&
          current.from === next.from &&
          current.to === next.to &&
          (current.ghost ?? '') === (next.ghost ?? ''));
      if (same) return;
      engine.view.dispatch(engine.state.tr.setMeta(SLASH_DECORATION_KEY, next));
    },
    focus: (position) => {
      engine.commands.focus(position as Parameters<typeof engine.commands.focus>[0]);
    },
    blur: () => {
      engine.commands.blur();
    },
    isFocused: () => engine.isFocused,
    isEditable: () => engine.isEditable,
    setEditable: (editable) => engine.setEditable(editable),
    onChange: (handler) => backend.subscribe({ onDelta: handler }),
    onSelectionUpdate: (handler) => {
      // Engine selection/focus events fire with `engine.state` already updated,
      // so a handler that reads `getSelection()` never sees a stale value (the
      // raw DOM `selectionchange` can run before the engine syncs).
      engine.on('selectionUpdate', handler);
      engine.on('focus', handler);
      engine.on('blur', handler);
      return () => {
        engine.off('selectionUpdate', handler);
        engine.off('focus', handler);
        engine.off('blur', handler);
      };
    },
    onSnapshot: (handler) => backend.subscribe({ onSnapshot: handler }),
    hasFeature: (id) => featureIds.has(id),
    get backend() {
      return backend;
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      unregisterFacade(handle);
      backend.destroy();
      engine.destroy();
    },
  };

  // Feature commands are bound to the façade, so their bodies compose built-in
  // primitives (engine-free) rather than touching the engine.
  for (const feature of features) {
    for (const [name, descriptor] of Object.entries(feature.commands ?? {})) {
      registry.register(name, {
        args: descriptor.args,
        run: (args) => descriptor.run(facade, args),
        can: descriptor.can
          ? (args) => descriptor.can!(facade, args)
          : undefined,
      });
    }
  }

  registerFacade(handle, facade);
  if (config.onChange) backend.subscribe({ onDelta: config.onChange });
  if (config.onSnapshot) backend.subscribe({ onSnapshot: config.onSnapshot });
  ready = true;

  // Hand the raw engine to the React surface (if any) so `EditorContent` can
  // host the React node-view portals. Nothing else may read this.
  config.onEngine?.(engine);

  return facade;
}
