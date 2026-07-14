import { createDocumentEditor } from '../create-document-editor.js';
import type { Delta, Snapshot } from '../types/delta.js';
import type { DocumentBackendFactory } from '../types/document-backend.js';
import type { IEditor } from '../types/editor.js';
import type { EditorFeature } from '../types/feature.js';
import type { DocJSON } from '../types/json.js';

/** Options for turning a configured builder into a live editor. */
export interface EditorMountOptions {
  /** DOM element to mount into; omit for a headless instance. */
  element?: HTMLElement;
  /** Override the configured editable flag for this instance. */
  editable?: boolean;
}

/**
 * The fluent builder (see the `document-editor-core` Builder spec). Registration
 * is explicit and ordered; each `build()` produces an **independent** editor
 * instance (its own engine + backend), so the same configuration can create
 * many editors that share no mutable state.
 */
export interface EditorBuilder {
  use(...features: EditorFeature[]): EditorBuilder;
  backend(factory: DocumentBackendFactory): EditorBuilder;
  content(doc: DocJSON): EditorBuilder;
  editable(editable: boolean): EditorBuilder;
  /** Constrain the top node's content expression (default `block+`). A compact
   *  surface — the chat composer — passes `paragraph` for a single-textblock
   *  schema so a second block is structurally impossible. */
  topContent(expr: string): EditorBuilder;
  snapshotDebounce(ms: number): EditorBuilder;
  onChange(handler: (delta: Delta) => void): EditorBuilder;
  onSnapshot(handler: (snapshot: Snapshot) => void): EditorBuilder;
  build(options?: EditorMountOptions): IEditor;
}

export function createEditor(): EditorBuilder {
  const features: EditorFeature[] = [];
  const changeHandlers: Array<(delta: Delta) => void> = [];
  const snapshotHandlers: Array<(snapshot: Snapshot) => void> = [];
  let backendFactory: DocumentBackendFactory | undefined;
  let content: DocJSON | undefined;
  let editable = true;
  let snapshotDebounceMs: number | undefined;
  let topContent: string | undefined;

  const builder: EditorBuilder = {
    use(...next) {
      features.push(...next);
      return builder;
    },
    backend(factory) {
      backendFactory = factory;
      return builder;
    },
    content(doc) {
      content = doc;
      return builder;
    },
    editable(next) {
      editable = next;
      return builder;
    },
    topContent(expr) {
      topContent = expr;
      return builder;
    },
    snapshotDebounce(ms) {
      snapshotDebounceMs = ms;
      return builder;
    },
    onChange(handler) {
      changeHandlers.push(handler);
      return builder;
    },
    onSnapshot(handler) {
      snapshotHandlers.push(handler);
      return builder;
    },
    build(options) {
      return createDocumentEditor({
        features: [...features],
        content,
        backendFactory,
        snapshotDebounceMs,
        editable: options?.editable ?? editable,
        topContent,
        element: options?.element,
        onChange: changeHandlers.length
          ? (delta) => changeHandlers.forEach((handler) => handler(delta))
          : undefined,
        onSnapshot: snapshotHandlers.length
          ? (snapshot) => snapshotHandlers.forEach((handler) => handler(snapshot))
          : undefined,
      });
    },
  };

  return builder;
}
