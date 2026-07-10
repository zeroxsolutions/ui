import type { DocJSON } from './json.js';
import type { Delta, Snapshot } from './delta.js';
import type { IDocumentBackend } from './document-backend.js';

/**
 * The stable façade over the hidden rich-text engine (see the
 * `document-editor-core` spec). A consumer reads content, runs commands,
 * subscribes to changes, and manages focus/selection **entirely through this
 * interface** — importing no engine package. This is the type-level decoupling
 * that lets the engine be swapped without rippling into consumer code.
 */

/** Lifecycle status. The instance exists only after the builder produces it. */
export type EditorStatus = 'ready' | 'destroyed';

/** Where to place the cursor when focusing. */
export type FocusPosition = 'start' | 'end' | 'all' | number | boolean;

/** An engine-agnostic view of the current selection. */
export interface EditorSelection {
  /** Document position where the selection starts. */
  from: number;
  /** Document position where the selection ends. */
  to: number;
  /** Whether the selection is collapsed (a caret). */
  empty: boolean;
  /** The node type at the selection head, when the selection is inside one. */
  nodeType?: string;
}

export interface IEditor {
  readonly status: EditorStatus;

  // ── Content ────────────────────────────────────────────────────────────────
  /** The current document as canonical JSON (a full snapshot). */
  getJSON(): DocJSON;
  /** The document's plain text. */
  getText(): string;
  /** Replace the whole document; validated at this boundary. */
  setContent(doc: DocJSON): void;
  /** Whether the document is effectively empty. */
  isEmpty(): boolean;

  // ── Commands ─────────────────────────────────────────────────────────────
  /** Whether a named command can run in the current state (no mutation). */
  can(command: string, args?: unknown): boolean;
  /** Dispatch a named command. Arguments are validated against the command's
   *  schema first; invalid arguments reject without mutating the document.
   *  Returns whether the command applied. */
  run(command: string, args?: unknown): boolean;
  /** Whether a named mark/node predicate is active at the selection. */
  isActive(name: string, attrs?: Record<string, unknown>): boolean;

  // ── Selection & focus ────────────────────────────────────────────────────
  getSelection(): EditorSelection;
  focus(position?: FocusPosition): void;
  blur(): void;
  isFocused(): boolean;
  isEditable(): boolean;
  setEditable(editable: boolean): void;

  // ── Change streams ───────────────────────────────────────────────────────
  /** Subscribe to step-sized deltas; returns an unsubscribe fn. */
  onChange(handler: (delta: Delta) => void): () => void;
  /** Subscribe to debounced/on-demand snapshots; returns an unsubscribe fn. */
  onSnapshot(handler: (snapshot: Snapshot) => void): () => void;

  // ── Introspection ────────────────────────────────────────────────────────
  /** Whether a feature is registered on this editor. */
  hasFeature(id: string): boolean;
  /** The change-model backend driving this editor (engine-agnostic). */
  readonly backend: IDocumentBackend;

  // ── Lifecycle ────────────────────────────────────────────────────────────
  destroy(): void;
}
