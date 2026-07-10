import type { DocJSON } from './json.js';

/**
 * The reported, gated result of an import (see the `editor-serialization` spec).
 * Import validates produced nodes against their attribute schemas and returns
 * the document **plus** everything that could not be mapped cleanly — it never
 * silently corrupts the document. This is what makes migration observable.
 */

/** A non-fatal issue encountered during import. */
export interface ImportWarning {
  message: string;
  /** The source construct that triggered it (tag/token type), when known. */
  source?: string;
  detail?: unknown;
}

/** A source construct that produced no node and was dropped. */
export interface DroppedNode {
  /** What was dropped (source construct or intended node type). */
  source: string;
  /** Why it was dropped (no codec, failed validation, …). */
  reason: string;
}

export interface ImportResult {
  /** The imported document — contains only validated nodes. */
  doc: DocJSON;
  /** Recoverable issues (e.g. coerced attributes). */
  warnings: ImportWarning[];
  /** Content that could not be represented and was omitted. */
  dropped: DroppedNode[];
}
