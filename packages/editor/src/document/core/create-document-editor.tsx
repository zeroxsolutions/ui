import { Editor, type Content, type Extensions } from '@tiptap/core';
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
import type { EditorSelection, IEditor } from './types/editor.js';
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

export function createDocumentEditor(config: DocumentEditorConfig): IEditor {
  const features = resolveFeatures(config.features ?? []);
  const featureIds = new Set(features.map((feature) => feature.id));
  const extensions = compileFeatures(features) as unknown as Extensions;
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
