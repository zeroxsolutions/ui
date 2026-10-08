import type { DocJSON } from './json.js';
import type { Delta, Snapshot } from './delta.js';

/**
 * The pluggable change model (see the `document-editor-core` spec). The default
 * backend emits engine-step deltas; the interface admits an alternative (e.g. a
 * CRDT/Yjs backend) **without changing the editor façade or feature contracts**.
 * Every method here is engine-agnostic, so swapping the backend is invisible to
 * `IEditor`, features, and codecs.
 */

/** Subscriber callbacks for the two independent change streams. */
export interface DocumentChangeHandlers {
  /** An incremental, step-sized change was produced. */
  onDelta?(delta: Delta): void;
  /** A debounced/on-demand full-document checkpoint was produced. */
  onSnapshot?(snapshot: Snapshot): void;
}

/**
 * An engine-agnostic description of one applied transaction, handed to the
 * backend by the editor core. The default backend turns `changes` into a
 * step-sized delta; a CRDT backend maps it to a compact update. `changes` is
 * opaque (JSON) so this seam never carries an engine type.
 */
export interface BackendTransaction {
  /** The document *after* the change, as canonical JSON. */
  doc: DocJSON;
  /** Backend-defined, JSON-serializable per-change payload. */
  changes: unknown;
  /** Whether this transaction changed the document (vs. selection-only). */
  docChanged: boolean;
}

export interface IDocumentBackend {
  /** The current document version (monotonic). */
  readonly version: number;
  /** Produce a full snapshot on demand (separate from the debounced stream). */
  getSnapshot(): Snapshot;
  /** Force-emit a snapshot to subscribers now. */
  requestSnapshot(): void;
  /** Record one locally-applied transaction; emits a delta and schedules a
   *  debounced snapshot. Called by the editor core. */
  record(transaction: BackendTransaction): void;
  /** Apply a delta produced elsewhere (remote/collaboration). Validated at this
   *  boundary before it enters the document. */
  applyRemoteDelta(delta: Delta): void;
  /** Subscribe to the delta + snapshot streams; returns an unsubscribe fn. */
  subscribe(handlers: DocumentChangeHandlers): () => void;
  /** Release resources. */
  destroy(): void;
}

/** Per-instance construction inputs for a backend. */
export interface DocumentBackendInit {
  /** Initial document JSON. */
  doc: DocJSON;
  /** Debounce window (ms) for snapshot checkpoints; backend picks a default. */
  snapshotDebounceMs?: number;
}

/**
 * A backend factory the builder accepts. Each built editor gets its own backend
 * instance (no shared mutable state across editors).
 */
export type DocumentBackendFactory = (init: DocumentBackendInit) => IDocumentBackend;
