import type { DocJSON } from './json.js';

/**
 * The delta-first change model (see the `document-editor-core` spec). Every edit
 * emits an incremental `Delta` describing only what changed — never a full
 * document serialization — so a localized edit in a large document stays cheap
 * to persist or transport. Full-document `Snapshot`s are a separate, debounced
 * stream used for recovery checkpoints.
 */

/**
 * An incremental change. `changes` is an opaque, JSON-serializable payload whose
 * concrete shape is defined by the active `IDocumentBackend` — serialized engine
 * steps for the default backend, a CRDT update for a Yjs backend. Typing it as
 * `unknown` is what keeps the change model engine-agnostic and swappable.
 */
export interface Delta {
  /** The monotonic document version this delta advances the document *to*. */
  version: number;
  /** Backend-defined, JSON-serializable, step-sized change payload. */
  changes: unknown;
  /** Optional coarse hint of the document range the change touched. */
  range?: { from: number; to: number };
}

/** A full-document checkpoint that reconstructs the document exactly. */
export interface Snapshot {
  version: number;
  doc: DocJSON;
}
