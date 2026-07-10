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
  /** Whether this is a whole-node selection — a block picked up by the drag
   *  handle or a selected atomic node (image) — rather than a text range. Text
   *  chrome (the bubble menu) shows only when this is false. */
  isNode?: boolean;
}

/** Viewport-relative coordinates of a caret/selection edge (CSS pixels). */
export interface CaretRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** An inline trigger match (`/` slash command, `@` mention, …): the query typed
 *  after the trigger char, plus the document range spanning the trigger char
 *  through the caret — so the chrome can delete `char…query` when an item is
 *  chosen, keeping the Notion-style inline flow where the `/` stays visible in
 *  the text while the menu filters. */
export interface TriggerQuery {
  /** The run of non-space characters typed after the trigger char. */
  query: string;
  /** Document position of the trigger char (start of the range to delete). */
  from: number;
  /** Document position of the caret (end of the range to delete). */
  to: number;
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
  /** Viewport coordinates of the selection head (caret), for positioning chrome
   *  (slash menu, etc.). Reliable for a collapsed caret, unlike the browser
   *  Selection rect. Null when unavailable. */
  caretRect(): CaretRect | null;
  /** For an inline trigger menu (slash `/`, mention `@`): when the collapsed
   *  caret sits in a textblock right after `char` followed by a run of non-space
   *  query chars — and `char` began the block or followed whitespace — returns
   *  that query and the `char…caret` document range. Null otherwise. Drives the
   *  Notion-style inline slash menu (the `/` stays typed in the document). */
  triggerQuery(char: string): TriggerQuery | null;
  /** Paint (or clear) the slash menu's inline decoration — all engine-side, so
   *  it mutates no document content. `from…to` gets the gray `/query` highlight;
   *  `ghost` (when set) renders faint inline text right after the caret — the
   *  Notion `/<placeholder>` hint on an empty query, or the autocomplete
   *  completion of the highlighted item as you type. Pass `null` to clear. */
  setSlashDecoration(
    deco: { from: number; to: number; ghost?: string } | null,
  ): void;
  focus(position?: FocusPosition): void;
  blur(): void;
  isFocused(): boolean;
  isEditable(): boolean;
  setEditable(editable: boolean): void;

  // ── Change streams ───────────────────────────────────────────────────────
  /** Subscribe to step-sized deltas; returns an unsubscribe fn. */
  onChange(handler: (delta: Delta) => void): () => void;
  /** Subscribe to selection changes — caret moves, range selects, focus/blur —
   *  fired AFTER the engine has updated its selection. Chrome that reads
   *  `getSelection()` must use this, not the raw DOM `selectionchange`, which can
   *  run a tick before the engine syncs (so a just-made selection reads stale).
   *  Returns an unsubscribe fn. */
  onSelectionUpdate(handler: () => void): () => void;
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
