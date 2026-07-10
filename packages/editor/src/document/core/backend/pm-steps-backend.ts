import { EditorError } from '../errors.js';
import type { Delta, Snapshot } from '../types/delta.js';
import type { DocJSON } from '../types/json.js';
import type {
  BackendTransaction,
  DocumentBackendInit,
  DocumentChangeHandlers,
  IDocumentBackend,
} from '../types/document-backend.js';

const DEFAULT_SNAPSHOT_DEBOUNCE_MS = 1000;

/**
 * The default document backend (see the `document-editor-core` spec). It is
 * deliberately **engine-free**: the editor core serializes each transaction's
 * steps to plain JSON and hands them in via `record`, so this module only does
 * delta emission, version bookkeeping, and debounced snapshots — no engine
 * dependency, trivially unit-testable, and swappable for a CRDT backend.
 *
 * - Every document-changing `record` emits a **step-sized** `Delta` (the step
 *   JSON forwarded verbatim as `changes`) — never a full-document payload.
 * - A settling burst of edits produces at most **one** debounced `Snapshot`;
 *   `getSnapshot`/`requestSnapshot` also produce one on demand.
 */
export function createPmStepsBackend(
  init: DocumentBackendInit,
): IDocumentBackend {
  let version = 0;
  let latestDoc: DocJSON = init.doc;
  const debounceMs = init.snapshotDebounceMs ?? DEFAULT_SNAPSHOT_DEBOUNCE_MS;
  const handlers = new Set<DocumentChangeHandlers>();
  let snapshotTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = (): void => {
    if (snapshotTimer !== null) {
      clearTimeout(snapshotTimer);
      snapshotTimer = null;
    }
  };

  const emitSnapshot = (): void => {
    const snapshot: Snapshot = { version, doc: latestDoc };
    for (const handler of handlers) handler.onSnapshot?.(snapshot);
  };

  const scheduleSnapshot = (): void => {
    clearTimer();
    snapshotTimer = setTimeout(() => {
      snapshotTimer = null;
      emitSnapshot();
    }, debounceMs);
  };

  return {
    get version() {
      return version;
    },

    getSnapshot(): Snapshot {
      return { version, doc: latestDoc };
    },

    requestSnapshot(): void {
      clearTimer();
      emitSnapshot();
    },

    record(transaction: BackendTransaction): void {
      latestDoc = transaction.doc;
      if (!transaction.docChanged) return;
      version += 1;
      const delta: Delta = { version, changes: transaction.changes };
      for (const handler of handlers) handler.onDelta?.(delta);
      scheduleSnapshot();
    },

    applyRemoteDelta(delta: Delta): void {
      // Boundary validation of an externally-produced delta.
      if (typeof delta?.version !== 'number') {
        throw new EditorError(
          'editor.backend.invalid_remote_delta',
          'Remote delta is missing a numeric version.',
        );
      }
      // The default backend is single-user: it has no CRDT peer to merge
      // against, so it cannot safely apply a remote change to the document.
      // A collaboration backend (Phase 2) implements the real merge.
      throw new EditorError(
        'editor.backend.remote_not_supported',
        'The default step backend cannot apply remote deltas; use a collaboration backend.',
      );
    },

    subscribe(newHandlers: DocumentChangeHandlers): () => void {
      handlers.add(newHandlers);
      return () => {
        handlers.delete(newHandlers);
      };
    },

    destroy(): void {
      clearTimer();
      handlers.clear();
    },
  };
}
